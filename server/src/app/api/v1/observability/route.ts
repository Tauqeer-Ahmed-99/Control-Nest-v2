import { APIResponse } from "@/models/api";
import { GetObservabilityLogsSchema } from "@/models/observability";
import { authenticate } from "@/services/auth";
import { getObservabilityLogs } from "@/services/observability";
import { validate } from "@/services/validation";
import { withRequestObservability } from "@/services/request-observability";
import { NextRequest } from "next/server";

export const GET = withRequestObservability(async (req: NextRequest) => {
  try {
    const { user } = await authenticate(req);
    const params = validate({
      schema: GetObservabilityLogsSchema,
      object: {
        requestId: req.nextUrl.searchParams.get("requestId") ?? undefined,
        limit: req.nextUrl.searchParams.get("limit") ?? undefined,
      },
    });

    const data = await getObservabilityLogs({ ...params, userId: user.id });

    return APIResponse.fromData({ data, message: "Observability logs fetched." });
  } catch (error) {
    return APIResponse.fromError(error);
  }
}, { record: false });
