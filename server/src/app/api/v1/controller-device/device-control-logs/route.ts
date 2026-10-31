import { APIResponse } from "@/models/api";
import { CreateDeviceControlLogSchema } from "@/models/device-control-logs";
import { authenticateControllerDevice } from "@/services/auth";
import { createLog } from "@/services/device-control-logs";
import { validate } from "@/services/validation";
import { NextRequest } from "next/server";
import { withRequestObservability } from "@/services/request-observability";

export const POST = withRequestObservability(async (req: NextRequest) => {
  try {
    await authenticateControllerDevice(req);

    const body = await req.json();

    const params = validate({
      schema: CreateDeviceControlLogSchema,
      object: body,
    });

    const data = await createLog(params);

    return APIResponse.fromData({
      data,
      message: "Device control log created.",
    });
  } catch (error) {
    return APIResponse.fromError(error);
  }
});
