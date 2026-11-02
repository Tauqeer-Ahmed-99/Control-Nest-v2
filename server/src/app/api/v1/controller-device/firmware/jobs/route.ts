import { NextRequest } from "next/server";
import { APIResponse } from "@/models/api";
import { authenticate } from "@/services/auth";
import { startFirmwareJob } from "@/services/firmware";
import { StartFirmwareSchema } from "@/models/firmware";
import { validate } from "@/services/validation";

export async function POST(req: NextRequest) {
  try {
    const { user, token } = await authenticate(req);
    const input = validate({
      schema: StartFirmwareSchema,
      object: await req.json(),
    });
    return APIResponse.fromData({
      data: await startFirmwareJob(input, user.id, token),
      message: "Update requested",
      statusCode: 202,
    });
  } catch (error) {
    return APIResponse.fromError(error);
  }
}
