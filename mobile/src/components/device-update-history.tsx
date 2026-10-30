import Tile from "@/components/tile";
import { Device } from "@/models/device";
import { Text } from "@rneui/themed";
import { View } from "react-native";

const DeviceUpdateHistory = ({ device }: { device?: Device | null }) => {
  return (
    <Tile>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 16 }}>Last Updated</Text>
        <Text>
          {device?.modifiedAt
            ? new Date(device.modifiedAt).toLocaleDateString()
            : "--"}{" "}
          @{" "}
          {device?.modifiedAt
            ? new Date(device.modifiedAt).toLocaleTimeString()
            : "--"}
        </Text>
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 16 }}>Device Created</Text>
        <Text>
          {device?.createdAt
            ? new Date(device.createdAt).toLocaleDateString()
            : "--"}{" "}
          @{" "}
          {device?.createdAt
            ? new Date(device.createdAt).toLocaleTimeString()
            : "--"}
        </Text>
      </View>
    </Tile>
  );
};

export default DeviceUpdateHistory;
