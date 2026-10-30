import ControlLogs from "@/components/control-logs";
import { useLocalSearchParams } from "expo-router";

const ControlLogsPage = () => {
  // deviceId comes from the [deviceId] route segment — no query param needed
  const { deviceId } = useLocalSearchParams<{
    roomId: string;
    deviceId: string;
  }>();

  return <ControlLogs logType="device" deviceId={deviceId} />;
};

export default ControlLogsPage;
