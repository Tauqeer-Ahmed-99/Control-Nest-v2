import * as Network from "expo-network";
import { useEffect, useState } from "react";

const useIPAddress = () => {
  const [ipAddress, setIPAddress] = useState("");

  const getIPAddres = async () => {
    const ip = await Network.getIpAddressAsync();
    setIPAddress(ip);
  };

  useEffect(() => {
    getIPAddres();
  }, []);

  return ipAddress;
};

export default useIPAddress;
