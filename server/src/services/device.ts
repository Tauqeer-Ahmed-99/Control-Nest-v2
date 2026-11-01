import database from "@/database";
import {
  controllerDevices,
  devices,
  houseMembers,
  rooms,
  tunnels,
} from "@/database/schema";
import { APIError } from "@/models/api";
import { and, eq } from "drizzle-orm";
import { authorizeHouse } from "./auth-house";
import {
  createPhysicalDevice,
  removePhysicalDevice,
  switchPhysicalDevice,
  updatePhysicalDevice,
} from "./controller-device";
import { measureRequestTiming } from "./observability-context";
import { getScheduledStatus } from "./schedule";

export const createDevice = async (
  {
    roomId,
    controllerDeviceId,
    pinNumber,
    gpioPinNumber,
    deviceName,
    wattage,
  }: {
    roomId: string;
    controllerDeviceId: string;
    pinNumber: number;
    gpioPinNumber: number;
    deviceName: string;
    wattage: number;
  },
  userId: string,
  accessToken: string,
) => {
  const [existingDevice, room] = await Promise.all([
    database.query.devices.findFirst({
      where: { controllerDeviceId, pinNumber },
    }),
    database.query.rooms.findFirst({ where: { id: roomId } }),
  ]);

  if (existingDevice) {
    throw new APIError({
      message: "Header pin already in use.",
      statusCode: 400,
    });
  }

  if (!room) {
    throw new APIError({
      message: "Room not found.",
      statusCode: 404,
    });
  }

  await authorizeHouse({ houseId: room.houseId, userId });

  const controller = await database.query.controllerDevices.findFirst({
    where: {
      id: controllerDeviceId,
      houseId: room.houseId,
      resourceStatus: "active",
    },
  });
  if (!controller?.installationId || !controller.apiKeyHash)
    throw new APIError({
      message:
        "Select a paired controller in this house with an active API key.",
      statusCode: 400,
    });

  const device = await database.transaction(async (txn) => {
    const results = await txn
      .insert(devices)
      .values({
        name: deviceName,
        roomId,
        controllerDeviceId,
        pinNumber,
        gpioPinNumber,
        wattage,
        createdBy: userId,
      })
      .returning();

    const device = results.at(0);

    if (!device) {
      throw new APIError({ message: "Error while creating a device" });
    }

    await createPhysicalDevice(txn, device, accessToken);

    return device;
  });

  return device;
};

export const updateDevice = async (
  {
    roomId,
    deviceId,
    deviceName,
    pinNumber,
    gpioPinNumber,
    status,
    isDefault,
    isScheduled,
    daysScheduled,
    startTime,
    offTime,
    wattage,
  }: {
    roomId: string;
    deviceId: string;
    deviceName?: string;
    pinNumber?: number;
    gpioPinNumber?: number;
    status?: boolean;
    isDefault?: boolean;
    isScheduled?: boolean;
    daysScheduled?: string;
    startTime?: string;
    offTime?: string;
    wattage?: number;
  },
  userId: string,
  accessToken: string,
) => {
  const room = await database.query.rooms.findFirst({ where: { id: roomId } });

  if (!room) {
    throw new APIError({
      message: "Room not found.",
      statusCode: 404,
    });
  }

  await authorizeHouse({ houseId: room.houseId, userId });

  if (pinNumber != null) {
    const currentDevice = await database.query.devices.findFirst({
      where: { id: deviceId, roomId },
    });
    if (!currentDevice)
      throw new APIError({ message: "Device not found.", statusCode: 404 });
    const existingDevice = await database.query.devices.findFirst({
      where: {
        controllerDeviceId: currentDevice.controllerDeviceId,
        pinNumber,
      },
    });

    if (existingDevice && existingDevice.id !== deviceId) {
      throw new APIError({
        message: "Header pin already in use.",
        statusCode: 400,
      });
    }
  }

  const updatedDevice = await database.transaction(async (txn) => {
    let isON = status;

    if (isScheduled && daysScheduled && startTime && offTime) {
      isON = getScheduledStatus({
        isScheduled,
        daysScheduled,
        startTime,
        offTime,
      });
    }

    const results = await txn
      .update(devices)
      .set({
        name: deviceName,
        pinNumber,
        gpioPinNumber,
        status: isON,
        isDefault,
        isScheduled,
        daysScheduled,
        startTime,
        offTime,
        scheduledBy: isScheduled ? userId : null,
        wattage,
        modifiedBy: userId,
      })
      .where(and(eq(devices.roomId, roomId), eq(devices.id, deviceId)))
      .returning();

    const updatedDevice = results.at(0);

    if (!updatedDevice) {
      throw new APIError({ message: "Error while updating the device." });
    }

    await updatePhysicalDevice(txn, updatedDevice, accessToken);

    return updatedDevice;
  });

  return updatedDevice;
};

export const removeDevice = async (
  { roomId, deviceId }: { roomId: string; deviceId: string },
  userId: string,
  accessToken: string,
) => {
  const room = await database.query.rooms.findFirst({ where: { id: roomId } });

  if (!room) {
    throw new APIError({
      message: "Room not found.",
      statusCode: 404,
    });
  }

  await authorizeHouse({ houseId: room.houseId, userId });

  const removedDevice = await database.transaction(async (txn) => {
    await removePhysicalDevice(txn, [deviceId], accessToken);
    const results = await txn
      .delete(devices)
      .where(and(eq(devices.roomId, roomId), eq(devices.id, deviceId)))
      .returning();

    const removedDevice = results.at(0);

    if (!removedDevice) {
      throw new APIError({ message: "Error while removing device." });
    }

    return removedDevice;
  });

  return removedDevice;
};

export const switchDevice = async (
  {
    deviceId,
    statusTo,
  }: { deviceId: string; statusFrom: boolean; statusTo: boolean },
  userId: string,
  accessToken: string,
) => {
  const switchContext = await measureRequestTiming(
    "db-switch-context-lookup",
    async () => {
      const [context] = await database
        .select({
          deviceId: devices.id,
          roomId: rooms.id,
          houseId: rooms.houseId,
          memberUserId: houseMembers.userId,
          tunnelHostname: tunnels.hostname,
          apiKeyHash: controllerDevices.apiKeyHash,
        })
        .from(devices)
        .leftJoin(rooms, eq(devices.roomId, rooms.id))
        .leftJoin(
          houseMembers,
          and(
            eq(houseMembers.houseId, rooms.houseId),
            eq(houseMembers.userId, userId),
          ),
        )
        .leftJoin(
          controllerDevices,
          eq(controllerDevices.id, devices.controllerDeviceId),
        )
        .leftJoin(tunnels, eq(tunnels.controllerDeviceId, controllerDevices.id))
        .where(eq(devices.id, deviceId))
        .limit(1);

      return context;
    },
  );

  if (!switchContext) {
    throw new APIError({
      message: "Device not found.",
      statusCode: 404,
    });
  }

  if (!switchContext.roomId || !switchContext.houseId) {
    throw new APIError({
      message: "Device room not found.",
      statusCode: 404,
    });
  }

  if (!switchContext.memberUserId) {
    throw new APIError({ message: "Unauthorized", statusCode: 403 });
  }

  if (!switchContext.apiKeyHash)
    throw new APIError({
      message: "Controller API key is revoked.",
      statusCode: 403,
    });
  const hostname = switchContext.tunnelHostname?.trim();
  if (!hostname) {
    throw new APIError({ message: "Tunnel hostname not found." });
  }
  const controllerUrl = hostname;

  const updatedDevice = await measureRequestTiming(
    "switch-transaction-total",
    () =>
      database.transaction(async (txn) => {
        const results = await measureRequestTiming("db-device-update", () =>
          txn
            .update(devices)
            .set({ status: statusTo, modifiedBy: userId })
            .where(eq(devices.id, deviceId))
            .returning(),
        );

        const updatedDevice = results.at(0);

        if (!updatedDevice) {
          throw new APIError({
            message: "Error while switching device.",
          });
        }

        await switchPhysicalDevice(
          controllerUrl,
          { deviceId: updatedDevice.id, status: statusTo, userId },
          accessToken,
        );

        return updatedDevice;
      }),
  );

  return updatedDevice;
};
