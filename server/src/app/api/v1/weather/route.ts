import { APIResponse } from "@/models/api";
import { authenticate } from "@/services/auth";
import { getCurrentWeather } from "@/services/weather";
import { NextRequest } from "next/server";
import { withRequestObservability } from "@/services/request-observability";

export const GET = withRequestObservability(async (req: NextRequest) => {
  try {
    await authenticate(req);

    const location =
      req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-real-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      "auto:ip";

    const data = await getCurrentWeather({ location });

    return APIResponse.fromData({ data, message: "Weather data fetched" });
  } catch (error) {
    return APIResponse.fromError(error);
  }
});
