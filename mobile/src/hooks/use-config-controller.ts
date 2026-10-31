import { APIResponse } from "@/models/api";
import { ControllerConfig } from "@/models/controller-config";
import { ApiRoutes } from "@/routes/routes";
import useApiMutation from "./use-api-mutation";
export default function useConfigController(baseUrl: string) {
  return useApiMutation<{ apiKey: string }, APIResponse<ControllerConfig>>(
    ApiRoutes.ControllerConfigure,
    { baseUrl },
    { gcTime: 0 },
  );
}
