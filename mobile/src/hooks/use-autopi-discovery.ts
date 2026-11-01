import { useLocalNetworkPermission } from "@/hooks/use-local-network-permission";
import { useZeroconf } from "react-native-zeroconf";

export function useAutoPiDiscovery() {
  const permission = useLocalNetworkPermission({ serviceType: "autopihub" });

  const { services, isScanning, error, restart } = useZeroconf({
    type: "autopihub",
    enabled: permission.data !== null && permission.data !== "denied",
  });
  const devices = services.map((service) => ({
    name: service.name,
    host: service.host,
    port: service.port,
    addresses: service.ipv4,
    service,
  }));

  return {
    devices,
    isScanning: permission.isLoading || isScanning,
    permissionDenied: permission.isDenied,
    error: permission.error ?? error,
    restart,
  };
}
