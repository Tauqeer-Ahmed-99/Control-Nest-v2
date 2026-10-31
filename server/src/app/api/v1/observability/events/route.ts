import { APIResponse } from "@/models/api";
import { ControllerObservabilityEventSchema } from "@/models/observability";
import { authenticateControllerDevice } from "@/services/auth";
import { recordControllerObservabilityEvent } from "@/services/observability";
import { validate } from "@/services/validation";
import { withRequestObservability } from "@/services/request-observability";
import { NextRequest } from "next/server";

export const POST = withRequestObservability(async (req: NextRequest) => {
  try {
    await authenticateControllerDevice(req);
    const event = validate({
      schema: ControllerObservabilityEventSchema,
      object: await req.json(),
    });
    const result = await recordControllerObservabilityEvent(event);

    if (result.error) throw result.error;

    return APIResponse.fromData({
      data: { id: event.id },
      message: "Controller observability event stored.",
    });
  } catch (error) {
    return APIResponse.fromError(error);
  }
});
