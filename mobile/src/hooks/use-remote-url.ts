import { CONTROLLER_DEVICE_CONFIG } from "@/constants/storage";
import { SERVER_URL } from "@/constants/urls";
import { ControllerConfig } from "@/models/controller-config";
import { useMemo } from "react";
import { useGetMobileStorageData } from "./use-mobile-storage-data";

const useRemoteUrl = (
  type: "controller" | "server" = "server",
): string | null => {
  const { data: controllerConfig } = useGetMobileStorageData<ControllerConfig>(
    CONTROLLER_DEVICE_CONFIG,
    { enabled: type === "controller" },
  );

  return useMemo(() => {
    if (type === "server") {
      return SERVER_URL;
    }

    if (controllerConfig) {
      return `https://${controllerConfig.tunnel.hostname}`;
    }

    return null;
  }, [controllerConfig, type]);
};

export default useRemoteUrl;
