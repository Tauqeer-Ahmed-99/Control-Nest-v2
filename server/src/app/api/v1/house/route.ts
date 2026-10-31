import { APIResponse } from "@/models/api";
import { authenticate } from "@/services/auth";
import { getHouse } from "@/services/house";
import { NextRequest } from "next/server";
import { withRequestObservability } from "@/services/request-observability";

export const GET = withRequestObservability(async (req: NextRequest) => {
  try {
    const { user } = await authenticate(req);

    const houseId = req.nextUrl.searchParams.get("houseId")!;

    const data = await getHouse({ houseId }, user.id);

    return APIResponse.fromData({ data, message: "House data fetched" });
  } catch (error) {
    return APIResponse.fromError(error);
  }
});
