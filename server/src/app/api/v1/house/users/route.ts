import { APIResponse } from "@/models/api";
import { authenticate } from "@/services/auth";
import { searchHouseUsers } from "@/services/house";
import { NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    const { user } = await authenticate(req);

    const houseId = req.nextUrl.searchParams.get("houseId")!;
    const query = req.nextUrl.searchParams.get("query") ?? "";

    const data = await searchHouseUsers({ houseId, query }, user.id);

    return APIResponse.fromData({ data, message: "House users fetched." });
  } catch (error) {
    return APIResponse.fromError(error);
  }
};
