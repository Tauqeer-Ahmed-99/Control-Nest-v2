import { NextRequest } from "next/server";
import { APIResponse } from "@/models/api";
import { authenticateControllerDevice } from "@/services/auth";
import { reportFirmwareStatus } from "@/services/firmware";
import { StatusSchema } from "@/models/firmware";
import { validate } from "@/services/validation";

export async function POST(req: NextRequest) {
  try {
    const controller = await authenticateControllerDevice(req);
    const input = validate({ schema: StatusSchema, object: await req.json() });
    return APIResponse.fromData({
      data: await reportFirmwareStatus(
        controller.id,
        controller.installationId!,
        input,
      ),
      message: "Firmware observed",
    });
  } catch (error) {
    return APIResponse.fromError(error);
  }
}
