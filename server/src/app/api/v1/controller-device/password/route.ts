import { NextRequest } from "next/server";
import { APIError, APIResponse } from "@/models/api";
import { authenticate } from "@/services/auth";
import { withRequestObservability } from "@/services/request-observability";

// Give old app builds a useful upgrade message instead of accepting shared passwords.
export const POST = withRequestObservability(async (req: NextRequest) => {
  try {
    await authenticate(req);
    throw new APIError({
      message:
        "Password setup has been retired. Update the app and use Houses & controllers to pair with an API key.",
      statusCode: 410,
    });
  } catch (error) {
    return APIResponse.fromError(error);
  }
});
