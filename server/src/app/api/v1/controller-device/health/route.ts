import { APIResponse } from "@/models/api";
import { GetControllerDeviceHeathScgema } from "@/models/contoller-device";
import { authenticate } from "@/services/auth";
import { checkControllerDeviceHealth } from "@/services/controller-device";
import { validate } from "@/services/validation";
import { NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    const { user, token } = await authenticate(req);

    const controllerDeviceIdParam =
      req.nextUrl.searchParams.get("controllerDeviceId")!;

    const { controllerDeviceId } = validate({
      schema: GetControllerDeviceHeathScgema,
      object: { controllerDeviceId: controllerDeviceIdParam },
    });

    const healthy = await checkControllerDeviceHealth({
      controllerDeviceId,
      userId: user.id,
      accessToken: token,
    });

    return APIResponse.fromData({
      data: { health: "ok", healthy },
      message: "Controller device health check completed",
    });
  } catch (error) {
    return APIResponse.fromError(error);
  }
};
