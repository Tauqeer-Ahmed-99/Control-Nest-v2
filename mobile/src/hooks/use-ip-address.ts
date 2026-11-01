import * as Network from "expo-network";
import { useEffect, useState } from "react";

const useIPAddress = () => {
  const [ipAddress, setIPAddress] = useState("");

  useEffect(() => {
    let active = true;
    void Network.getIpAddressAsync()
      .then((ip) => {
        if (active) setIPAddress(ip);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return ipAddress;
};

export default useIPAddress;
