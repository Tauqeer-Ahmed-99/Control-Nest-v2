import { NextRequest } from "next/server";
import { APIResponse } from "@/models/api";
import { PairControllerSchema } from "@/models/onboarding";
import { authenticate, authenticateControllerDevice } from "@/services/auth";
import { authorizeHouse } from "@/services/auth-house";
import { initControllerDevice } from "@/services/controller-device";
import { validate } from "@/services/validation";
import { withRequestObservability } from "@/services/request-observability";

export const POST = withRequestObservability(async (req: NextRequest) => {
  try {
    const controller = await authenticateControllerDevice(req, {
      allowUnpaired: true,
    });
    const body = validate({
      schema: PairControllerSchema,
      object: await req.json(),
    });
    if (body.accessToken) {
      const { user } = await authenticate(body.accessToken);
      await authorizeHouse({
        houseId: controller.houseId,
        userId: user.id,
        checkAdmin: true,
      });
    }
    const data = await initControllerDevice(controller, body.installationId);
    const response = APIResponse.fromData({
      data,
      message: "Controller paired",
      statusCode: 201,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return APIResponse.fromError(error);
  }
});
