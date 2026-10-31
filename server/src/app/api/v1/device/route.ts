import { APIResponse } from "@/models/api";
import {
  CreateDeviceSchema,
  RemoveDeviceSchema,
  UpdateDeviceSchema,
} from "@/models/device";
import { authenticate } from "@/services/auth";
import { createDevice, removeDevice, updateDevice } from "@/services/device";
import { validate } from "@/services/validation";
import { NextRequest } from "next/server";
import { withRequestObservability } from "@/services/request-observability";

export const POST = withRequestObservability(async (req: NextRequest) => {
  try {
    const { user, token: accessToken } = await authenticate(req);

    const body = await req.json();

    const params = validate({ schema: CreateDeviceSchema, object: body });

    const data = await createDevice(params, user.id, accessToken);

    return APIResponse.fromData({
      data,
      message: "Device created.",
      statusCode: 201,
    });
  } catch (error) {
    return APIResponse.fromError(error);
  }
});

export const PATCH = withRequestObservability(async (req: NextRequest) => {
  try {
    const { user, token: accessToken } = await authenticate(req);

    const body = await req.json();

    const params = validate({ schema: UpdateDeviceSchema, object: body });

    const data = await updateDevice(params, user.id, accessToken);

    return APIResponse.fromData({
      data,
      message: "Device updated.",
      statusCode: 200,
    });
  } catch (error) {
    return APIResponse.fromError(error);
  }
});

export const DELETE = withRequestObservability(async (req: NextRequest) => {
  try {
    const { user, token: accessToken } = await authenticate(req);

    const body = await req.json();

    const params = validate({ schema: RemoveDeviceSchema, object: body });

    const data = await removeDevice(params, user.id, accessToken);

    return APIResponse.fromData({
      data,
      message: "Device updated.",
      statusCode: 200,
    });
  } catch (error) {
    return APIResponse.fromError(error);
  }
});
