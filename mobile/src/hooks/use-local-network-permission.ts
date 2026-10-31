import { useCallback } from "react";
import { usePermission } from "@/hooks/use-permission";
import Zeroconf from "react-native-zeroconf";

export type LocalNetworkPermissionStatus = Awaited<
  ReturnType<Zeroconf["checkLocalNetworkAccess"]>
>;

export interface UseLocalNetworkPermissionOptions {
  serviceType?: string;
  protocol?: string;
  timeout?: number;
}

export function useLocalNetworkPermission({
  serviceType = "autopihub",
  protocol = "tcp",
  timeout = 5,
}: UseLocalNetworkPermissionOptions = {}) {
  const checkLocalNetworkPermission = useCallback(
    async (request: boolean): Promise<LocalNetworkPermissionStatus> => {
      const zeroconf = new Zeroconf();

      try {
        return await zeroconf.checkLocalNetworkAccess({
          type: serviceType,
          protocol,
          timeout,
          request,
        });
      } finally {
        zeroconf.removeDeviceListeners();
      }
    },
    [protocol, serviceType, timeout],
  );

  const requestPermission = useCallback(
    () => checkLocalNetworkPermission(true),
    [checkLocalNetworkPermission],
  );
  const checkPermission = useCallback(
    () => checkLocalNetworkPermission(false),
    [checkLocalNetworkPermission],
  );

  const permission = usePermission<LocalNetworkPermissionStatus>({
    requestPermission,
    checkPermission,
    isGranted: (status) => status === "granted",
    isDenied: (status) => status === "denied",
    requestOnMount: true,
    checkOnMount: false,
  });

  return {
    ...permission,
    data: permission.data ?? (permission.error ? "unknown" : null),
    refetch: permission.requestPermission,
  };
}
