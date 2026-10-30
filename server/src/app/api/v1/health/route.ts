import { APIResponse } from "@/models/api";

export const GET = () => {
  return APIResponse.fromData({
    message: "System is healthy.",
    data: { health: "ok" },
  });
};
