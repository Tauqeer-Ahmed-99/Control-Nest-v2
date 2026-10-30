import { CONTROLLER_DEVICE_CONFIG } from "@/constants/storage";
import { APIResponse } from "@/models/api";
import { ControllerConfig } from "@/models/controller-config";
import { ApiRoutes } from "@/routes/routes";
import useApiQuery from "./use-api-query";
import { useGetMobileStorageData } from "./use-mobile-storage-data";
// import useRemoteUrl from "./use-remote-url";

type HealthResponse = APIResponse<{ health: "ok" }>;

const useControllerHealth = () => {
  const { data: config } = useGetMobileStorageData<ControllerConfig>(
    CONTROLLER_DEVICE_CONFIG,
  );
  // const controllerUrl = useRemoteUrl("controller");

  // if (__DEV__) {
  //   console.log("controller url", controllerUrl);
  // }

  return useApiQuery<HealthResponse>(ApiRoutes.ControllerHealth, {
    searchParams: { controllerDeviceId: config?.controllerDevice.id ?? "" },
    queryConfig: { enabled: !!config?.controllerDevice.id },
  });
};

export default useControllerHealth;
