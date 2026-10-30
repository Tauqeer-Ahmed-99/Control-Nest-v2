import { useZeroconf } from "react-native-zeroconf";

export function useAutoPiDiscovery() {
  const { services } = useZeroconf({
    type: "autopihub",
  });

  const devices = services.map((service) => ({
    name: service.name,
    host: service.host,
    port: service.port,
    addresses: service.ipv4,
    service,
  }));

  return { devices };
}
