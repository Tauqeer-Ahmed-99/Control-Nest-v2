import { NextRequest } from "next/server";
import { APIResponse } from "@/models/api";
import { authenticate } from "@/services/auth";
import { getFirmwareJob } from "@/services/firmware";
import { validate } from "@/services/validation";
import z from "zod";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ jobId: string }> },
) {
  try {
    const { user, token } = await authenticate(req);
    const { jobId } = validate({
      schema: z.object({ jobId: z.uuid() }),
      object: await context.params,
    });
    return APIResponse.fromData({
      data: await getFirmwareJob(jobId, user.id, token),
      message: "Update progress",
    });
  } catch (error) {
    return APIResponse.fromError(error);
  }
}
