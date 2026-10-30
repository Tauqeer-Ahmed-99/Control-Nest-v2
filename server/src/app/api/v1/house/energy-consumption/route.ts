import { APIResponse } from "@/models/api";
import { authenticate } from "@/services/auth";
import { getEnergyConsumption } from "@/services/device-control-logs";
import { NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    const { user } = await authenticate(req);

    const houseId = req.nextUrl.searchParams.get("houseId")!;

    const data = await getEnergyConsumption({
      houseId,
      userId: user.id,
      unit: "kWh",
    });

    return APIResponse.fromData({ data, message: "House data fetched" });
  } catch (error) {
    return APIResponse.fromError(error);
  }
};
