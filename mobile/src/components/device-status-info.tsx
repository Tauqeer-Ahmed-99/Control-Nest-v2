import Switch from "@/components/switch";
import Tile from "@/components/tile";
import useSwitchDevice from "@/hooks/use-switch-device";
import { Device } from "@/models/device";
import { Text, useTheme } from "@rneui/themed";
import React, { useCallback } from "react";
import { View } from "react-native";

const DeviceStatusInfo = ({
  device,
  setDevice,
}: {
  device?: Device | null;
  setDevice: React.Dispatch<React.SetStateAction<Device | null>>;
}) => {
  const {
    theme: {
      colors: { primary },
    },
  } = useTheme();
  const { mutate: switchDevice } = useSwitchDevice();

  const handleOnChange = useCallback(
    (value: boolean) => {
      // Update local page-level state immediately.
      setDevice((prev) => ({
        ...(prev as Device),
        status: value,
      }));

      // Fire the optimistic mutation (cache + server).
      switchDevice({
        deviceId: device?.id!,
        statusFrom: device?.status!,
        statusTo: value,
      });
    },
    [device?.id, device?.status, setDevice, switchDevice],
  );

  return (
    <Tile>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ fontSize: 16 }}>Status</Text>
        <View
          style={{
            height: 45,
            width: 80,
            backgroundColor: primary,
            justifyContent: "center",
            alignItems: "center",
            borderRadius: 20,
          }}
        >
          <Switch
            value={device?.status ?? false}
            onChange={handleOnChange}
          />
        </View>
      </View>
    </Tile>
  );
};

export default DeviceStatusInfo;
