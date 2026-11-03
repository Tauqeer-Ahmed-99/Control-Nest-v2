import { NextRequest } from "next/server";
import { APIResponse } from "@/models/api";
import { FirmwareQuerySchema } from "@/models/firmware";
import { authenticate } from "@/services/auth";
import { issueRecoveryGrant } from "@/services/firmware";
import { validate } from "@/services/validation";
export async function POST(req: NextRequest) {
  try {
    const { user, token } = await authenticate(req);
    const { controllerDeviceId } = validate({
      schema: FirmwareQuerySchema,
      object: await req.json(),
    });
    return APIResponse.fromData({
      data: await issueRecoveryGrant(controllerDeviceId, user.id, token),
      message: "Recovery grant issued",
    });
  } catch (error) {
    return APIResponse.fromError(error);
  }
}
