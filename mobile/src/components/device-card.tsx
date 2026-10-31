import useSwitchDevice from "@/hooks/use-switch-device";
import { Device } from "@/models/device";
import { getTypedRoute, Routes } from "@/routes/routes";
import { Text, useTheme } from "@rneui/themed";
import { router } from "expo-router";
import React, { useCallback } from "react";
import { TouchableOpacity, View } from "react-native";
import Card from "./card";
import Icon from "./icon";

const DeviceCard = ({ device }: { device: Device }) => {
  const { theme } = useTheme();
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
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityLabel={`${device.name}, ${device.status ? "on" : "off"}`}
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
              flex: 1,
              gap: 12,
              justifyContent: "space-between",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <Icon name={device.name as string} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text
                  numberOfLines={2}
                  style={{ fontSize: 15, fontFamily: "Lexend_600SemiBold" }}
                >
                  {device.name}
                </Text>
                <Text style={{ color: theme.colors.grey2, fontSize: 12 }}>
                  {device.wattage ? `${device.wattage} W` : "Device"}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: device.status
                    ? theme.colors.success
                    : theme.colors.grey3,
                }}
              />
              <Text
                style={{
                  color: device.status ? theme.colors.success : theme.colors.grey2,
                  fontSize: 12,
                  fontFamily: "Lexend_500Medium",
                }}
              >
                {device.status ? "On" : "Off"}
              </Text>
            </View>
          </View>
        )}
      />
    </TouchableOpacity>
  );
};

export default React.memo(DeviceCard);
