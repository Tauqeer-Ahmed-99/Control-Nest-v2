import { APIResponse } from "@/models/api";
import { withRequestObservability } from "@/services/request-observability";

export const GET = withRequestObservability(() => {
  return APIResponse.fromData({
    message: "System is healthy.",
    data: { health: "ok" },
  });
});
