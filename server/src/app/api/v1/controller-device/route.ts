import { APIResponse } from "@/models/api";
import { authenticateControllerDevice } from "@/services/auth";
import { getControllerDeviceData } from "@/services/controller-device";
import { NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    await authenticateControllerDevice(req);

    const controllerDeviceId =
      req.nextUrl.searchParams.get("controllerDeviceId")!;

    const data = await getControllerDeviceData(controllerDeviceId);

    return APIResponse.fromData({
      data,
      message: "Controller Device data fetched",
    });
  } catch (error) {
    return APIResponse.fromError(error);
  }
};
