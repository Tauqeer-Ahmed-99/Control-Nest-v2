import { ControllerConfig } from "@/models/controller-config";
import useApiMutation from "./use-api-mutation";

const useConfigController = (baseUrl: string) => {
  return useApiMutation<{}, ControllerConfig>("/controller/configure", {
    baseUrl: baseUrl,
    queryConfig: { enabled: !!baseUrl },
  });
};

export default useConfigController;
