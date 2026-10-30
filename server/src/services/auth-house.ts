import database from "@/database";
import { APIError } from "@/models/api";

export const authorizeHouse = async ({
  houseId,
  userId,
  checkAdmin = false,
}: {
  houseId: string;
  userId: string;
  checkAdmin?: boolean;
}) => {
  const houseMember = await database.query.houseMembers.findFirst({
    where: { houseId, userId },
  });

  if (!houseMember) {
    throw new APIError({ message: "Unauthorized", statusCode: 403 });
  }

  if (checkAdmin && !houseMember.isAdmin) {
    throw new APIError({
      message: "Unauthorized: Admin only operation.",
      statusCode: 403,
    });
  }

  return houseMember;
};

export const authorizeHouseByControllerDevice = async ({
  controllerDeviceId,
  userId,
  checkAdmin = false,
}: {
  controllerDeviceId: string;
  userId: string;
  checkAdmin?: boolean;
}) => {
  const controllerDevice = await database.query.controllerDevices.findFirst({
    where: { id: controllerDeviceId },
    with: { house: { with: { houseMembers: { where: { userId } } } } },
  });

  const houseMember = controllerDevice?.house?.houseMembers.at(0);

  if (!houseMember) {
    throw new APIError({ message: "Unauthorized", statusCode: 403 });
  }

  if (checkAdmin && !houseMember.isAdmin) {
    throw new APIError({
      message: "Unauthorized: Admin only operation.",
      statusCode: 403,
    });
  }

  return houseMember;
};
