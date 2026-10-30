import { APIResponse } from "@/models/api";
import { ControllerConfig } from "@/models/controller-config";
import request, { HTTPMethod } from "./network";

export const configControllerOnLocalNetwork = async ({
  localNetworkUrl,
  userId,
  controllerName,
  token,
}: {
  localNetworkUrl: string;
  userId: string;
  controllerName: string;
  token: string;
}) => {
  const response = await request(localNetworkUrl, "/controller/configure", {
    method: HTTPMethod.POST,
    body: { userId, controllerName } as any,
    headers: { authorization: token },
  });

  const parsed: APIResponse<ControllerConfig> = await response.json();

  if (!response.ok || !parsed.success) {
    throw new Error(parsed.message || "Unable to configure controller.");
  }

  return parsed.data;
};
