import { APIResponse } from "@/models/api";
import { ControllerConfig } from "@/models/controller-config";
import request, { HTTPMethod } from "./network";
import { ApiRoutes } from "@/routes/routes";

export const configControllerOnLocalNetwork = async ({
  localNetworkUrl,
  apiKey,
  token,
}: {
  localNetworkUrl: string;
  apiKey: string;
  token: string;
}) => {
  const response = await request(localNetworkUrl, ApiRoutes.ControllerConfigure, {
    method: HTTPMethod.POST,
    body: { apiKey } as any,
    headers: { authorization: token },
  });

  const parsed: APIResponse<ControllerConfig> = await response.json();

  if (!response.ok || !parsed.success) {
    throw new Error(parsed.message || "Unable to configure controller.");
  }

  return parsed.data;
};
