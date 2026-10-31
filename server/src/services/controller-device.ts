import database, { DBTransaction } from "@/database";
import {
  controllerDevices,
  houseMembers,
  houses,
  tunnels,
} from "@/database/schema";
import { APIError, APIResponse } from "@/models/api";
import { Device } from "@/models/device";
import { createTunnelAndPublishAppService } from "./cloudflare";
import { hashPassword, verifyPassword } from "./password";
import { eq } from "drizzle-orm";
import { authorizeHouse, authorizeHouseByControllerDevice } from "./auth-house";
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

export const initControllerDevice = async ({
  houseName,
  controllerName,
  userId,
}: {
  houseName: string;
  controllerName: string;
  userId: string;
}) => {
  return database.transaction(async (tx) => {
    const houseResults = await tx
      .insert(houses)
      .values({ name: houseName, createdBy: userId })
      .returning();

    const house = houseResults.at(0);

    if (!house) {
      throw new APIError({
        message: "Error while creating a new house.",
      });
    }

    const [results] = await Promise.all([
      tx
        .insert(controllerDevices)
        .values({ name: controllerName, houseId: house.id, createdBy: userId })
        .returning(),

      tx.insert(houseMembers).values({
        houseId: house.id,
        userId: userId,
        isAdmin: true,
        createdBy: userId,
      }),
    ]);

    const controllerDevice = results.at(0);

    if (!controllerDevice) {
      throw new APIError({
        message: "Error while creating controller device.",
      });
    }

    const {
      tunnelName,
      cloudflareTunnel,
      publishedServiceConfig,
      dnsRecord,
      tunnelToken,
    } = await createTunnelAndPublishAppService({
      tunnelName: `${controllerDevice.id}-autopihub`,
    });

    const tunnelResults = await tx
      .insert(tunnels)
      .values({
        id: cloudflareTunnel.id!,
        controllerDeviceId: controllerDevice.id,
        name: tunnelName,
        hostname: publishedServiceConfig.hostname,
        token: tunnelToken,
        dnsRecordId: dnsRecord.id,
        createdBy: userId,
      })
      .returning();

    const tunnel = tunnelResults.at(0);

    if (!tunnel) {
      throw new APIError({
        message: "Error while creating db tunnel record.",
      });
    }

    return { house, controllerDevice, tunnel };
  });
};

export const checkOrSetControllerPassword = async (
  {
    controllerDeviceId,
    controllerDevicePassword,
  }: {
    controllerDeviceId: string;
    controllerDevicePassword: string;
  },
  userId: string,
) => {
  const controllerDevice = await database.query.controllerDevices.findFirst({
    where: { id: controllerDeviceId },
    with: { house: true },
  });

  if (!controllerDevice) {
    throw new APIError({
      message: "Controller device not found.",
      statusCode: 404,
    });
  }

  const house = controllerDevice.house;

  if (!house) {
    throw new APIError({
      message: "Controller device house not found.",
      statusCode: 404,
    });
  }

  if (controllerDevice.passwordHash) {
    await authorizeHouse({ houseId: house.id, userId });

    const success = await verifyPassword(
      controllerDevicePassword,
      controllerDevice.passwordHash,
    );

    if (!success) {
      throw new APIError({
        message: "Invalid controller device or password.",
        statusCode: 400,
      });
    }

    return success;
  }

  await authorizeHouse({ houseId: house.id, userId, checkAdmin: true });

  const passwordHash = await hashPassword(controllerDevicePassword);

  const result = await database
    .update(controllerDevices)
    .set({ passwordHash })
    .where(eq(controllerDevices.id, controllerDeviceId))
    .returning();

  if (!result.at(0)) {
    throw new APIError({ message: "Error while saving password hash." });
  }

  return true;
};

export const getControllerDeviceData = async (controllerDeviceId: string) => {
  const controllerDevice = await database.query.controllerDevices.findFirst({
    where: { id: controllerDeviceId },
    with: { house: { with: { rooms: { with: { devices: true } } } } },
  });

  const devices =
    controllerDevice?.house?.rooms.flatMap((r) => r.devices) ?? [];

  return { ...controllerDevice, house: undefined, devices };
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
    where: {
      id: deviceId,
    },
    with: {
      room: {
        with: {
          house: {
            with: {
              controllerDevice: {
                with: {
                  tunnel: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const hostname =
    device?.room?.house?.controllerDevice?.at(0)?.tunnel?.hostname;

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
  const url = await getControllerDeviceUrlByDeviceId(deviceIds.at(0)!);

  const response = await fetch(`${url}/device`, {
    method: "DELETE",
    body: JSON.stringify({ deviceIds }),
    headers: controllerRequestHeaders(accessToken),
  });

  const { success, message }: APIResponse = await response.json();

  if (!success) {
    throw new APIError({ message });
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
