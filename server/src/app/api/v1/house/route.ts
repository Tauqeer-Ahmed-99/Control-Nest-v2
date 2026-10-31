import { APIResponse } from "@/models/api";
import { authenticate } from "@/services/auth";
import { getHouse } from "@/services/house";
import { NextRequest } from "next/server";
import { withRequestObservability } from "@/services/request-observability";
import { CreateHouseSchema, HouseIdSchema } from "@/models/onboarding";
import { validate } from "@/services/validation";
import { createHouse } from "@/services/onboarding";
import { removeHouse } from "@/services/resource-removal";

export const DELETE = withRequestObservability(async (req: NextRequest) => {
  try {
    const { user } = await authenticate(req);
    const params = validate({
      schema: HouseIdSchema,
      object: await req.json(),
    });
    return APIResponse.fromData({
      data: await removeHouse(params, user.id),
      message: "House removed.",
    });
  } catch (error) {
    return APIResponse.fromError(error);
  }
});

export const POST = withRequestObservability(async (req: NextRequest) => {
  try {
    const { user } = await authenticate(req);
    const params = validate({
      schema: CreateHouseSchema,
      object: await req.json(),
    });
    return APIResponse.fromData({
      data: await createHouse(params, user.id),
      message: "House created",
      statusCode: 201,
    });
  } catch (error) {
    return APIResponse.fromError(error);
  }
});

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
