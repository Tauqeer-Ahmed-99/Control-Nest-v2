import { NextRequest } from "next/server";
import { APIResponse } from "@/models/api";
import {
  CreateControllerSchema,
  ControllerKeyActionSchema,
  HouseIdSchema,
  ControllerIdSchema,
} from "@/models/onboarding";
import { authenticate } from "@/services/auth";
import {
  listControllers,
  createController,
  changeControllerKey,
} from "@/services/onboarding";
import { validate } from "@/services/validation";
import { withRequestObservability } from "@/services/request-observability";
import { removeController } from "@/services/resource-removal";

export const DELETE = withRequestObservability(async (req: NextRequest) => {
  try {
    const { user } = await authenticate(req);
    const params = validate({
      schema: ControllerIdSchema,
      object: await req.json(),
    });
    return APIResponse.fromData({
      data: await removeController(params, user.id),
      message: "Controller removed.",
    });
  } catch (error) {
    return APIResponse.fromError(error);
  }
});
export const GET = withRequestObservability(async (req: NextRequest) => {
  try {
    const { user } = await authenticate(req);
    const { houseId } = validate({
      schema: HouseIdSchema,
      object: { houseId: req.nextUrl.searchParams.get("houseId") },
    });
    return APIResponse.fromData({
      data: await listControllers(houseId, user.id),
      message: "House controllers",
    });
  } catch (error) {
    return APIResponse.fromError(error);
  }
});
export const POST = withRequestObservability(async (req: NextRequest) => {
  try {
    const { user } = await authenticate(req);
    const params = validate({
      schema: CreateControllerSchema,
      object: await req.json(),
    });
    const response = APIResponse.fromData({
      data: await createController(params, user.id),
      message: "Controller added. Save the API key now.",
      statusCode: 201,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return APIResponse.fromError(error);
  }
});
export const PATCH = withRequestObservability(async (req: NextRequest) => {
  try {
    const { user } = await authenticate(req);
    const params = validate({
      schema: ControllerKeyActionSchema,
      object: await req.json(),
    });
    const response = APIResponse.fromData({
      data: await changeControllerKey(params, user.id),
      message: "Controller key updated",
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return APIResponse.fromError(error);
  }
});
