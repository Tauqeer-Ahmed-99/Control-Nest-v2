import { HeaderPinType, pinHeaderConfig } from "@/models/pin-header-config";
import { authorizeHouse } from "./auth-house";
import database from "@/database";
import { APIError } from "@/models/api";

export const getGPIOPins = async (
  { mode, houseId }: { mode: "all" | "available"; houseId: string },
  userId: string,
) => {
  await authorizeHouse({ houseId, userId });

  if (mode === "all") {
    return pinHeaderConfig.filter((p) => p.type === HeaderPinType.GPIO);
  }

  const house = await database.query.houses.findFirst({
    with: { rooms: { with: { devices: true } } },
  });

  if (!house) {
    throw new APIError({ message: "House not found.", statusCode: 404 });
  }

  const usedPins = house.rooms
    .flatMap((r) => r.devices)
    .flatMap((d) => d.pinNumber);

  const availablePins = pinHeaderConfig.filter(
    (p) =>
      p.type === HeaderPinType.GPIO && !usedPins.includes(p.gpioPinNumber!),
  );

  return availablePins;
};
