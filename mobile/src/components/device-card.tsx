import useSwitchDevice from "@/hooks/use-switch-device";
import { Device } from "@/models/device";
import { getTypedRoute, Routes } from "@/routes/routes";
import { Text } from "@rneui/themed";
import { router } from "expo-router";
import React, { useCallback } from "react";
import { TouchableOpacity, View } from "react-native";
import Card from "./card";
import Icon from "./icon";

const DeviceCard = ({ device }: { device: Device }) => {
  const { mutate: switchDevice } = useSwitchDevice();

  const handleOnChange = useCallback(
    (value: boolean) => {
      switchDevice({
        deviceId: device.id,
        statusFrom: device.status,
        statusTo: value,
      });
    },
    [device.id, device.status, switchDevice],
  );

  return (
    <TouchableOpacity
      onPress={() =>
        router.push(
          getTypedRoute(
            Routes.Device.replace("[roomId]", device.roomId).replace(
              "[deviceId]",
              device.id,
            ),
          ),
        )
      }
    >
      <Card
        item={device}
        value={device.status}
        onChange={handleOnChange}
        render={(device) => (
          <View
            style={{
              paddingTop: 15,
              height: 150,
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Icon name={device.name as string} />
            <Text>{device.name}</Text>
            <View
              style={{
                width: "100%",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View style={{ flexDirection: "row", gap: 6 }}>
                <Text style={{ color: "grey" }}>Status</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 6 }}>
                <Text>{device.status ? "ON" : "OFF"}</Text>
              </View>
            </View>
          </View>
        )}
      />
    </TouchableOpacity>
  );
};

export default React.memo(DeviceCard);
