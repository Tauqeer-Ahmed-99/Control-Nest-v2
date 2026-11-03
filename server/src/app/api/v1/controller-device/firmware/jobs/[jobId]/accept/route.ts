import { NextRequest } from "next/server";
import { APIResponse } from "@/models/api";
import { authenticateControllerDevice } from "@/services/auth";
import { acceptFirmwareJob } from "@/services/firmware";
import { AcceptSchema } from "@/models/firmware";
import { validate } from "@/services/validation";
import z from "zod";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ jobId: string }> },
) {
  try {
    const controller = await authenticateControllerDevice(req);
    const { jobId } = validate({
      schema: z.object({ jobId: z.uuid() }),
      object: await context.params,
    });
    const input = validate({ schema: AcceptSchema, object: await req.json() });
    return APIResponse.fromData({
      data: await acceptFirmwareJob(
        jobId,
        controller.id,
        controller.installationId!,
        input.nonce,
      ),
      message: "Update authorized",
    });
  } catch (error) {
    return APIResponse.fromError(error);
  }
}
