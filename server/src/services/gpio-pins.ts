import { HeaderPinType, pinHeaderConfig } from "@/models/pin-header-config";
import { authorizeHouse } from "./auth-house";
import database from "@/database";
import { APIError } from "@/models/api";

export const getGPIOPins = async (
  {
    mode,
    houseId,
    controllerDeviceId,
  }: { mode: "all" | "available"; houseId: string; controllerDeviceId: string },
  userId: string,
) => {
  await authorizeHouse({ houseId, userId });

  const controller = await database.query.controllerDevices.findFirst({
    where: { id: controllerDeviceId, houseId },
  });
  if (!controller)
    throw new APIError({
      message: "Controller not found in this house.",
      statusCode: 404,
    });

  if (mode === "all") {
    return pinHeaderConfig.filter((p) => p.type === HeaderPinType.GPIO);
  }

  const house = await database.query.houses.findFirst({
    where: { id: houseId },
    with: { rooms: { with: { devices: true } } },
  });

  if (!house) {
    throw new APIError({ message: "House not found.", statusCode: 404 });
  }

  const usedPins = house.rooms
    .flatMap((r) => r.devices)
    .filter((d) => d.controllerDeviceId === controllerDeviceId)
    .map((d) => d.pinNumber);

  const availablePins = pinHeaderConfig.filter(
    (p) =>
      p.type === HeaderPinType.GPIO && !usedPins.includes(p.headerPinNumber),
  );

  return availablePins;
};
