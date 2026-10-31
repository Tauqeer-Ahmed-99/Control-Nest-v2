import { APIResponse } from "@/models/api";
import { authenticateControllerDevice } from "@/services/auth";
import { getControllerDeviceData } from "@/services/controller-device";
import { NextRequest } from "next/server";
import { withRequestObservability } from "@/services/request-observability";

export const GET = withRequestObservability(async (req: NextRequest) => {
  try {
    const controller = await authenticateControllerDevice(req);
    const data = await getControllerDeviceData(controller.id);

    return APIResponse.fromData({
      data,
      message: "Controller Device data fetched",
    });
  } catch (error) {
    return APIResponse.fromError(error);
  }
});
