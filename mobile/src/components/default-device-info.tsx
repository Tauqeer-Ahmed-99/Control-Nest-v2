import { Device } from "@/models/device";
import { Text, useTheme } from "@rneui/themed";
import React from "react";
import { View } from "react-native";
import Switch from "./switch";
import Tile from "./tile";

const DefaultDeviceInfo = ({
  device,
  setDevice,
}: {
  device?: Device | null;
  setDevice: React.Dispatch<React.SetStateAction<Device | null>>;
}) => {
  const { theme } = useTheme();

  const handleOnChange = (value: boolean) => {
    setDevice((device) => ({
      ...(device as Device),
      isDefault: value,
    }));
  };
  return (
    <Tile>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ fontSize: 16 }}>Default</Text>
        <View
          style={{
            height: 45,
            width: 80,
            backgroundColor: theme.colors.primary,
            borderWidth: 1,
            borderColor: theme.colors.grey5,
            justifyContent: "center",
            alignItems: "center",
            borderRadius: 20,
          }}
        >
          <Switch
            value={device?.isDefault ?? false}
            onChange={handleOnChange}
          />
        </View>
      </View>
    </Tile>
  );
};

export default DefaultDeviceInfo;
