import { eq } from "drizzle-orm";
import database from "@/database";
import {
  controllerDevices,
  houseMembers,
  houses,
  rooms,
  tunnels,
} from "@/database/schema";
import { APIError } from "@/models/api";
import tryCatch from "@/utils/try-catch";
import { authorizeHouse, authorizeHouseByControllerDevice } from "./auth-house";
import { removeControllerTunnel } from "./cloudflare";

export const removeController = async (
  { controllerDeviceId }: { controllerDeviceId: string },
  userId: string,
) => {
  await authorizeHouseByControllerDevice({
    controllerDeviceId,
    userId,
    checkAdmin: true,
  });
  const { data, error } = await tryCatch(
    database.transaction(async (tx) => {
      // Enrollment locks this same row before provisioning a tunnel. Locking
      // also prevents new device foreign keys while we check for assignments.
      const [controller] = await tx
        .select({ id: controllerDevices.id })
        .from(controllerDevices)
        .where(eq(controllerDevices.id, controllerDeviceId))
        .for("update");
      if (!controller)
        throw new APIError({
          message: "Controller not found.",
          statusCode: 404,
        });

      const device = await tx.query.devices.findFirst({
        where: { controllerDeviceId },
        columns: { id: true },
      });
      if (device)
        throw new APIError({
          message:
            "This controller has assigned devices. Remove them in the app before removing the controller.",
          statusCode: 409,
        });

      const tunnel = await tx.query.tunnels.findFirst({
        where: { controllerDeviceId },
        columns: { id: true, dnsRecordId: true },
      });
      if (tunnel) await removeControllerTunnel(tunnel.id, tunnel.dnsRecordId);
      await tx
        .delete(tunnels)
        .where(eq(tunnels.controllerDeviceId, controllerDeviceId));
      await tx
        .delete(controllerDevices)
        .where(eq(controllerDevices.id, controllerDeviceId));
      return { id: controllerDeviceId };
    }),
  );
  if (error)
    throw error instanceof APIError
      ? error
      : new APIError({
          message: "Unable to remove the controller. Please retry.",
        });
  return data;
};

export const removeHouse = async (
  { houseId }: { houseId: string },
  userId: string,
) => {
  await authorizeHouse({ houseId, userId, checkAdmin: true });
  const { data, error } = await tryCatch(
    database.transaction(async (tx) => {
      // Controller creation takes a key-share lock on the house, so a new
      // controller cannot be orphaned by concurrent house removal.
      const [house] = await tx
        .select({ id: houses.id })
        .from(houses)
        .where(eq(houses.id, houseId))
        .for("update");
      if (!house)
        throw new APIError({ message: "House not found.", statusCode: 404 });

      const controller = await tx.query.controllerDevices.findFirst({
        where: { houseId },
        columns: { id: true },
      });
      if (controller)
        throw new APIError({
          message:
            "Remove this house's controllers first, then remove the house.",
          statusCode: 409,
        });

      const houseRooms = await tx
        .select({ id: rooms.id })
        .from(rooms)
        .where(eq(rooms.houseId, houseId))
        .for("update");
      if (houseRooms.length) {
        const device = await tx.query.devices.findFirst({
          where: { roomId: { in: houseRooms.map((room) => room.id) } },
          columns: { id: true },
        });
        if (device)
          throw new APIError({
            message:
              "This house has configured devices. Remove them in the app before removing the house.",
            statusCode: 409,
          });
      }
      await tx.delete(rooms).where(eq(rooms.houseId, houseId));
      await tx.delete(houseMembers).where(eq(houseMembers.houseId, houseId));
      await tx.delete(houses).where(eq(houses.id, houseId));
      return { id: houseId };
    }),
  );
  if (error)
    throw error instanceof APIError
      ? error
      : new APIError({ message: "Unable to remove the house. Please retry." });
  return data;
};
