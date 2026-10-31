import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import database from "@/database";
import { houses, houseMembers, controllerDevices } from "@/database/schema";
import { APIError } from "@/models/api";
import tryCatch from "@/utils/try-catch";
import { authorizeHouse, authorizeHouseByControllerDevice } from "./auth-house";
import {
  generateControllerKey,
  hashControllerKey,
} from "./controller-credentials";

export const listHouses = async (userId: string) => {
  const { data, error } = await tryCatch(
    database.query.houseMembers.findMany({
      where: { userId, resourceStatus: "active" },
      columns: { isAdmin: true },
      with: { house: { columns: { id: true, name: true } } },
    }),
  );
  if (error) throw new APIError({ message: "Unable to load your houses." });
  return data
    .filter((member) => member.house)
    .map(({ house, isAdmin }) => ({ ...house!, isAdmin }));
};
export const createHouse = async (
  { name }: { name: string },
  userId: string,
) => {
  const { data, error } = await tryCatch(
    database.transaction(async (tx) => {
      const [house] = await tx
        .insert(houses)
        .values({ name, createdBy: userId })
        .returning();
      await tx
        .insert(houseMembers)
        .values({
          houseId: house.id,
          userId,
          isAdmin: true,
          createdBy: userId,
        });
      return house;
    }),
  );
  if (error) throw new APIError({ message: "Unable to create your house." });
  return data;
};
export const listControllers = async (houseId: string, userId: string) => {
  await authorizeHouse({ houseId, userId });
  const { data, error } = await tryCatch(
    database.query.controllerDevices.findMany({
      where: { houseId, resourceStatus: "active" },
      columns: {
        id: true,
        houseId: true,
        name: true,
        apiKeyLastFour: true,
        installationId: true,
      },
      with: {
        tunnel: { columns: { hostname: true } },
        devices: { columns: { id: true } },
      },
    }),
  );
  if (error) throw new APIError({ message: "Unable to load controllers." });
  return data.map(({ installationId, devices, ...controller }) => ({
    ...controller,
    paired: Boolean(installationId),
    deviceCount: devices.length,
  }));
};
export const createController = async (
  { houseId, name }: { houseId: string; name: string },
  userId: string,
) => {
  await authorizeHouse({ houseId, userId, checkAdmin: true });
  const id = randomUUID();
  const apiKey = generateControllerKey(id);
  const { data, error } = await tryCatch(
    database.transaction(async (tx) => {
      const [house] = await tx
        .select({ id: houses.id })
        .from(houses)
        .where(eq(houses.id, houseId))
        .for("key share");
      if (!house)
        throw new APIError({ message: "House not found.", statusCode: 404 });
      return tx
        .insert(controllerDevices)
        .values({
          id,
          houseId,
          name,
          createdBy: userId,
          apiKeyHash: hashControllerKey(apiKey),
          apiKeyLastFour: apiKey.slice(-4),
        })
        .returning({
          id: controllerDevices.id,
          name: controllerDevices.name,
          houseId: controllerDevices.houseId,
        });
    }),
  );
  if (error)
    throw error instanceof APIError
      ? error
      : new APIError({ message: "Unable to add the controller." });
  return { controllerDevice: data[0], apiKey };
};
export const changeControllerKey = async (
  {
    controllerDeviceId,
    action,
  }: { controllerDeviceId: string; action: "rotate" | "revoke" },
  userId: string,
) => {
  await authorizeHouseByControllerDevice({
    controllerDeviceId,
    userId,
    checkAdmin: true,
  });
  const apiKey =
    action === "rotate" ? generateControllerKey(controllerDeviceId) : null;
  const { error } = await tryCatch(
    database
      .update(controllerDevices)
      .set({
        apiKeyHash: apiKey ? hashControllerKey(apiKey) : null,
        apiKeyLastFour: apiKey?.slice(-4) ?? null,
        modifiedBy: userId,
      })
      .where(eq(controllerDevices.id, controllerDeviceId)),
  );
  if (error) throw new APIError({ message: "Unable to update the API key." });
  return { apiKey };
};
