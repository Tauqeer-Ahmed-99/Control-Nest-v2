import { NextRequest } from "next/server";
import { APIResponse } from "@/models/api";
import { authenticate } from "@/services/auth";
import { getFirmware } from "@/services/firmware";
import { FirmwareQuerySchema } from "@/models/firmware";
import { validate } from "@/services/validation";

export async function GET(req: NextRequest) {
  try {
    const { user, token } = await authenticate(req);
    const { controllerDeviceId } = validate({
      schema: FirmwareQuerySchema,
      object: Object.fromEntries(req.nextUrl.searchParams),
    });
    return APIResponse.fromData({
      data: await getFirmware(controllerDeviceId, user.id, token),
      message: "Controller firmware",
    });
  } catch (error) {
    return APIResponse.fromError(error);
  }
}
