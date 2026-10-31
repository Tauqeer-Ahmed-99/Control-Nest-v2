import database, { DBTransaction } from "@/database";
import { controllerDevices, tunnels } from "@/database/schema";
import { APIError, APIResponse } from "@/models/api";
import { Device } from "@/models/device";
import {
  createTunnelAndPublishAppService,
  cleanupControllerTunnel,
} from "./cloudflare";
import { eq } from "drizzle-orm";
import { authorizeHouseByControllerDevice } from "./auth-house";
import tryCatch from "@/utils/try-catch";
import { HealthData } from "@/models/contoller-device";
import { getRequestId, measureRequestTiming } from "./observability-context";

const controllerRequestHeaders = (accessToken: string) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    authorization: `Bearer ${accessToken}`,
  };
  const requestId = getRequestId();
  if (requestId) headers["X-Request-ID"] = requestId;
  return headers;
};

// Serialize enrollment so retries reuse the tunnel and a key cannot claim two Pis.
export const initControllerDevice = async (
  controller: typeof controllerDevices.$inferSelect,
  installationId: string,
) => {
  let createdTunnel: { id: string; dnsRecordId: string } | undefined;
  const { data, error } = await tryCatch(
    database.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(controllerDevices)
        .where(eq(controllerDevices.id, controller.id))
        .for("update");
      if (!current || current.apiKeyHash !== controller.apiKeyHash) {
        throw new APIError({
          message: "API key changed. Use the latest key.",
          statusCode: 401,
        });
      }
      if (current.installationId && current.installationId !== installationId) {
        throw new APIError({
          message:
            "This controller is already paired to another Pi. Add a new controller for each Pi.",
          statusCode: 409,
        });
      }
      let tunnel = await tx.query.tunnels.findFirst({
        where: { controllerDeviceId: current.id },
      });
      if (!tunnel) {
        const provisioned = await createTunnelAndPublishAppService({
          tunnelName: `${current.id}-autopihub`,
        });
        createdTunnel = {
          id: provisioned.cloudflareTunnel.id!,
          dnsRecordId: provisioned.dnsRecord.id!,
        };
        [tunnel] = await tx
          .insert(tunnels)
          .values({
            id: provisioned.cloudflareTunnel.id!,
            controllerDeviceId: current.id,
            name: provisioned.tunnelName,
            hostname: provisioned.publishedServiceConfig.hostname,
            token: provisioned.tunnelToken,
            dnsRecordId: provisioned.dnsRecord.id!,
            createdBy: current.createdBy,
          })
          .returning();
      }
      await tx
        .update(controllerDevices)
        .set({ installationId })
        .where(eq(controllerDevices.id, current.id));
      const house = await tx.query.houses.findFirst({
        where: { id: current.houseId },
      });
      if (!house)
        throw new APIError({ message: "House not found.", statusCode: 404 });
      return {
        house,
        controllerDevice: {
          id: current.id,
          houseId: current.houseId,
          name: current.name,
          resourceStatus: current.resourceStatus,
          createdAt: current.createdAt,
          createdBy: current.createdBy,
          modifiedAt: current.modifiedAt,
          modifiedBy: current.modifiedBy,
        },
        tunnel,
      };
    }),
  );
  if (error) {
    if (createdTunnel)
      await cleanupControllerTunnel(
        createdTunnel.id,
        createdTunnel.dnsRecordId,
      );
    throw error instanceof APIError
      ? error
      : new APIError({ message: "Unable to pair controller. Please retry." });
  }
  return data;
};

export const getControllerDeviceData = async (controllerDeviceId: string) => {
  const { data, error } = await tryCatch(
    database.query.controllerDevices.findFirst({
      where: { id: controllerDeviceId },
      columns: {
        id: true,
        houseId: true,
        name: true,
        resourceStatus: true,
        createdAt: true,
        createdBy: true,
        modifiedAt: true,
        modifiedBy: true,
      },
    }),
  );
  if (error || !data)
    throw new APIError({ message: "Controller not found.", statusCode: 404 });
  const result = await tryCatch(
    database.query.devices.findMany({ where: { controllerDeviceId } }),
  );
  if (result.error)
    throw new APIError({ message: "Unable to load controller devices." });
  return { ...data, devices: result.data };
};

const getControllerDeviceUrlById = async (controllerDeviceId: string) => {
  const controllerDevice = await database.query.controllerDevices.findFirst({
    where: { id: controllerDeviceId },
    with: { tunnel: true },
  });

  if (!controllerDevice) {
    throw new APIError({
      message: "Controller device not found.",
      statusCode: 404,
    });
  }

  if (!controllerDevice.apiKeyHash)
    throw new APIError({
      message: "Controller API key is revoked.",
      statusCode: 403,
    });
  const tunnel = controllerDevice.tunnel;

  if (!tunnel) {
    throw new APIError({
      message: "Controller device tunnel not found.",
    });
  }

  const hostname = tunnel.hostname.trim();

  if (!hostname) {
    throw new APIError({
      message: "Tunnel hostname not found.",
    });
  }

  return `https://${hostname}`;
};

const getControllerDeviceUrlByDeviceId = async (
  deviceId: string,
  txn?: DBTransaction,
) => {
  const device = await (txn ?? database).query.devices.findFirst({
    where: { id: deviceId },
    with: { controllerDevice: { with: { tunnel: true } } },
  });
  const hostname = device?.controllerDevice?.tunnel?.hostname;

  if (!device?.controllerDevice?.apiKeyHash)
    throw new APIError({
      message: "Controller API key is revoked.",
      statusCode: 403,
    });

  if (!hostname) {
    throw new APIError({ message: "Tunnel hostname not found." });
  }

  return `https://${hostname}`;
};

export const checkControllerDeviceHealth = async ({
  controllerDeviceId,
  accessToken,
  userId,
}: {
  controllerDeviceId: string;
  accessToken: string;
  userId: string;
}) => {
  await authorizeHouseByControllerDevice({ controllerDeviceId, userId });

  const url = await getControllerDeviceUrlById(controllerDeviceId);

  const response = await fetch(url, {
    headers: controllerRequestHeaders(accessToken),
  });

  const { success, message, data }: APIResponse<HealthData> =
    await response.json();

  if (!success) {
    throw new APIError({
      message: `Controller Device Not Healthy: ${message}`,
    });
  }

  const isHealthy = data?.health === "ok";

  if (!isHealthy) {
    throw new APIError({ message: "Controller Device Not Healthy" });
  }

  return isHealthy;
};

export const createPhysicalDevice = async (
  txn: DBTransaction,
  device: Device,
  accessToken: string,
) => {
  const url = await getControllerDeviceUrlByDeviceId(device.id, txn);

  const body = JSON.stringify(device);

  const response = await fetch(`${url}/device`, {
    method: "POST",
    body,
    headers: controllerRequestHeaders(accessToken),
  });

  const { success, message }: APIResponse = await response.json();

  if (!success) {
    throw new APIError({ message });
  }
};

export const updatePhysicalDevice = async (
  txn: DBTransaction,
  device: Device,
  accessToken: string,
) => {
  const url = await getControllerDeviceUrlByDeviceId(device.id, txn);

  const response = await fetch(`${url}/device`, {
    method: "PUT",
    body: JSON.stringify(device),
    headers: controllerRequestHeaders(accessToken),
  });

  const { success, message }: APIResponse = await response.json();

  if (!success) {
    throw new APIError({ message });
  }
};

export const removePhysicalDevice = async (
  txn: DBTransaction,
  deviceIds: string[],
  accessToken: string,
) => {
  const assigned = await txn.query.devices.findMany({
    where: { id: { in: deviceIds } },
  });
  const groups = new Map<string, string[]>();
  for (const device of assigned) {
    groups.set(device.controllerDeviceId, [
      ...(groups.get(device.controllerDeviceId) ?? []),
      device.id,
    ]);
  }
  for (const [controllerId, ids] of groups) {
    const url = await getControllerDeviceUrlById(controllerId);
    const response = await fetch(`${url}/device`, {
      method: "DELETE",
      body: JSON.stringify({ deviceIds: ids }),
      headers: controllerRequestHeaders(accessToken),
    });
    const result: APIResponse = await response.json();
    if (!response.ok || !result.success)
      throw new APIError({
        message: "Unable to remove devices from controller.",
      });
  }
};

export const switchPhysicalDevice = async (
  controllerUrl: string,
  device: { deviceId: string; status: boolean },
  accessToken: string,
) => {
  const { success, message }: APIResponse = await measureRequestTiming(
    "controller-request",
    async () => {
      const response = await fetch(`${controllerUrl}/device/switch`, {
        method: "POST",
        body: JSON.stringify(device),
        headers: controllerRequestHeaders(accessToken),
      });
      return response.json();
    },
  );

  if (!success) {
    throw new APIError({ message });
  }
};
