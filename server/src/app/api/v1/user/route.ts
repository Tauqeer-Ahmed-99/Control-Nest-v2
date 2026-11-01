import { APIResponse } from "@/models/api";
import { GetUserByIdSchema } from "@/models/user";
import { authenticate } from "@/services/auth";
import { withRequestObservability } from "@/services/request-observability";
import { getUserById } from "@/services/user";
import { validate } from "@/services/validation";
import { NextRequest } from "next/server";

export const GET = withRequestObservability(async (req: NextRequest) => {
  try {
    await authenticate(req);

    const params = validate({
      schema: GetUserByIdSchema,
      object: { userId: req.nextUrl.searchParams.get("userId") },
    });
    const data = await getUserById(params);

    return APIResponse.fromData({ data, message: "User fetched." });
  } catch (error) {
    return APIResponse.fromError(error);
  }
});
