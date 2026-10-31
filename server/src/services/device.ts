import database from "@/database";
import { devices } from "@/database/schema";
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
    pinNumber,
    gpioPinNumber,
    deviceName,
    wattage,
  }: {
    roomId: string;
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
      where: { roomId, pinNumber },
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

  const device = await database.transaction(async (txn) => {
    const results = await txn
      .insert(devices)
      .values({
        name: deviceName,
        roomId,
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
    const existingDevice = await database.query.devices.findFirst({
      where: { roomId, pinNumber },
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
    const results = await txn
      .delete(devices)
      .where(and(eq(devices.roomId, roomId), eq(devices.id, deviceId)))
      .returning();

    const removedDevice = results.at(0);

    if (!removedDevice) {
      throw new APIError({ message: "Error while removing device." });
    }

    await removePhysicalDevice(txn, [removedDevice.id], accessToken);

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
  const device = await measureRequestTiming("db-device-lookup", () =>
    database.query.devices.findFirst({
      where: { id: deviceId },
      with: { room: true },
    }),
  );

  if (!device) {
    throw new APIError({
      message: "Device not found.",
      statusCode: 404,
    });
  }

  const room = device.room;

  if (!room) {
    throw new APIError({
      message: "Device room not found.",
      statusCode: 404,
    });
  }

  await measureRequestTiming("db-house-authorization", () =>
    authorizeHouse({ houseId: room.houseId, userId }),
  );

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
          txn,
          { deviceId: updatedDevice.id, status: statusTo },
          accessToken,
        );

        return updatedDevice;
      }),
  );

  return updatedDevice;
};
