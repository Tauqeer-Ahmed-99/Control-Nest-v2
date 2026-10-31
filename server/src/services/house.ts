import database from "@/database";
import { houseMembers } from "@/database/schema";
import { authorizeHouse } from "./auth-house";
import { APIError } from "@/models/api";
import { clerk } from "./auth";
import { and, eq } from "drizzle-orm";

export const getHouse = async (
  {
    houseId,
  }: {
    houseId: string;
  },
  userId: string,
) => {
  await authorizeHouse({ houseId, userId });

  const house = await database.query.houses.findFirst({
    where: { id: houseId },
    with: {
      controllerDevice: { columns: { id: true, houseId: true, name: true } },
      houseMembers: { columns: { houseId: true, userId: true, isAdmin: true } },
      rooms: { with: { devices: true } },
    },
  });

  if (!house) {
    throw new APIError({ message: "House data not found.", statusCode: 404 });
  }

  return house;
};

export const searchHouseUsers = async (
  {
    houseId,
    query,
  }: {
    houseId: string;
    query: string;
  },
  userId: string,
) => {
  await authorizeHouse({ houseId, userId, checkAdmin: true });

  const searchQuery = query.trim();

  if (!searchQuery) {
    throw new APIError({
      message: "A search query is required.",
      statusCode: 400,
    });
  }

  const [members, users] = await Promise.all([
    database.query.houseMembers.findMany({
      where: { houseId },
      columns: { userId: true },
    }),
    clerk.users.getUserList({ query: searchQuery, limit: 20 }),
  ]);

  const memberIds = new Set(members.map((member) => member.userId));

  return users.data.map((user) => ({
    id: user.id,
    fullName: user.fullName,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    emailAddress: user.primaryEmailAddress?.emailAddress ?? null,
    isMember: memberIds.has(user.id),
  }));
};

export const getHouseMembers = async (
  { houseId }: { houseId: string },
  userId: string,
) => {
  await authorizeHouse({ houseId, userId });

  const members = await database.query.houseMembers.findMany({
    where: { houseId },
    columns: { userId: true, isAdmin: true },
  });

  const userLists = await Promise.all(
    Array.from({ length: Math.ceil(members.length / 100) }, (_, index) =>
      clerk.users.getUserList({
        userId: members
          .slice(index * 100, index * 100 + 100)
          .map((member) => member.userId),
        limit: 100,
      }),
    ),
  );

  const usersById = new Map(
    userLists
      .flatMap((users) => users.data)
      .map((user) => [user.id, user] as const),
  );

  return members.map(({ userId: memberUserId, isAdmin }) => {
    const user = usersById.get(memberUserId);

    return {
      id: memberUserId,
      fullName: user?.fullName ?? null,
      firstName: user?.firstName ?? null,
      lastName: user?.lastName ?? null,
      username: user?.username ?? null,
      emailAddress: user?.primaryEmailAddress?.emailAddress ?? null,
      isAdmin,
      isMember: true,
    };
  });
};

export const createHouseMember = async (
  { houseId, userId: newUserId }: { houseId: string; userId: string },
  userId: string,
) => {
  await authorizeHouse({ houseId, userId, checkAdmin: true });

  await clerk.users.getUser(newUserId);

  const existingMember = await database.query.houseMembers.findFirst({
    where: { houseId, userId: newUserId },
  });

  if (existingMember) {
    throw new APIError({
      message: "User is already a member of this house.",
      statusCode: 409,
    });
  }

  const results = await database
    .insert(houseMembers)
    .values({ houseId, userId: newUserId, createdBy: userId })
    .returning();

  const houseMember = results.at(0);

  if (!houseMember) {
    throw new APIError({ message: "Error while adding house member." });
  }

  return houseMember;
};

export const removeHouseMember = async (
  { houseId, userId: memberUserId }: { houseId: string; userId: string },
  userId: string,
) => {
  await authorizeHouse({ houseId, userId, checkAdmin: true });

  const houseMember = await database.query.houseMembers.findFirst({
    where: { houseId, userId: memberUserId },
  });

  if (!houseMember) {
    throw new APIError({ message: "House member not found.", statusCode: 404 });
  }

  const results = await database
    .delete(houseMembers)
    .where(
      and(
        eq(houseMembers.houseId, houseId),
        eq(houseMembers.userId, memberUserId),
      ),
    )
    .returning();

  const removedMember = results.at(0);

  if (!removedMember) {
    throw new APIError({ message: "Error while removing house member." });
  }

  return removedMember;
};

export const updateHouseMember = async (
  {
    houseId,
    userId: memberUserId,
    isAdmin,
  }: { houseId: string; userId: string; isAdmin: boolean },
  userId: string,
) => {
  await authorizeHouse({ houseId, userId, checkAdmin: true });

  const houseMember = await database.query.houseMembers.findFirst({
    where: { houseId, userId: memberUserId },
  });

  if (!houseMember) {
    throw new APIError({ message: "House member not found.", statusCode: 404 });
  }

  const results = await database
    .update(houseMembers)
    .set({ isAdmin, modifiedBy: userId })
    .where(
      and(
        eq(houseMembers.houseId, houseId),
        eq(houseMembers.userId, memberUserId),
      ),
    )
    .returning();

  const updatedMember = results.at(0);

  if (!updatedMember) {
    throw new APIError({ message: "Error while updating house member." });
  }

  return updatedMember;
};

export const calculateEnergyConsumption = () => {};
