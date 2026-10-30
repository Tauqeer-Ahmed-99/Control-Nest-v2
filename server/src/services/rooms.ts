import database from "@/database";
import { devices, rooms } from "@/database/schema";
import { APIError } from "@/models/api";
import { authorizeHouse } from "./auth-house";
import { eq, inArray } from "drizzle-orm";
import { removePhysicalDevice } from "./controller-device";

export const createRoom = async (
  {
    houseId,
    roomName,
  }: {
    houseId: string;
    roomName: string;
  },
  userId: string,
) => {
  await authorizeHouse({ houseId, userId });

  const results = await database
    .insert(rooms)
    .values({ houseId, name: roomName, createdBy: userId })
    .returning();

  const room = results.at(0);

  if (!room) {
    throw new APIError({ message: "Error while creating room." });
  }

  return room;
};

export const removeRoom = async (
  { roomId }: { roomId: string },
  userId: string,
  accessToken: string,
) => {
  const room = await database.query.rooms.findFirst({
    where: { id: roomId },
    with: { devices: true },
  });

  if (!room) {
    throw new APIError({ message: "Room not found.", statusCode: 404 });
  }

  await authorizeHouse({ houseId: room.houseId, userId });

  const removedRoom = await database.transaction(async (txn) => {
    const removedDevices = await txn
      .delete(devices)
      .where(
        inArray(
          devices.id,
          room.devices.map((d) => d.id),
        ),
      )
      .returning();

    const results = await txn
      .delete(rooms)
      .where(eq(rooms.id, roomId))
      .returning();

    const removedRoom = results.at(0);

    if (!removedRoom) {
      throw new APIError({ message: "Error while removing room." });
    }

    await removePhysicalDevice(
      txn,
      removedDevices.map((d) => d.id),
      accessToken,
    );

    return { ...removedRoom, devices: removedDevices };
  });

  return removedRoom;
};
