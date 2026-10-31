import { NextRequest } from "next/server";
import { APIResponse } from "@/models/api";
import { authenticate } from "@/services/auth";
import { listHouses } from "@/services/onboarding";
import { withRequestObservability } from "@/services/request-observability";
export const GET = withRequestObservability(async (req: NextRequest) => {
  try {
    const { user } = await authenticate(req);
    return APIResponse.fromData({
      data: await listHouses(user.id),
      message: "Your houses",
    });
  } catch (error) {
    return APIResponse.fromError(error);
  }
});
