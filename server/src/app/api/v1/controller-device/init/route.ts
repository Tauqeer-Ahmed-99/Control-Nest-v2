import { APIResponse } from "@/models/api";
import { InitControllerDeviceSchema } from "@/models/contoller-device";
import { authenticate, authenticateControllerDevice } from "@/services/auth";
import { initControllerDevice } from "@/services/controller-device";
import { validate } from "@/services/validation";
import { NextRequest } from "next/server";
import { withRequestObservability } from "@/services/request-observability";

export const POST = withRequestObservability(async (req: NextRequest) => {
  try {
    const body = validate({
      schema: InitControllerDeviceSchema,
      object: await req.json(),
    });

    const [, { user }] = await Promise.all([
      authenticateControllerDevice(req),
      authenticate(body.accessToken),
    ]);

    const data = await initControllerDevice({
      userId: user.id,
      houseName: body.controllerName,
      controllerName: body.controllerName,
    });

    return APIResponse.fromData({
      message: "Controller device initialized.",
      data,
      statusCode: 201,
    });
  } catch (error) {
    return APIResponse.fromError(error);
  }
});
