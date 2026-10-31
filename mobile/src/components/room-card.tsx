import { useDeviceData } from "@/hooks/use-house";
import useSwitchDevice from "@/hooks/use-switch-device";
import { Room } from "@/models/room";
import { getTypedRoute, Routes } from "@/routes/routes";
import { Text, useTheme } from "@rneui/themed";
import { router } from "expo-router";
import React, { useCallback } from "react";
import { TouchableOpacity, View } from "react-native";
import Card from "./card";
import Icon from "./icon";

const RoomCard = ({ room }: { room: Room }) => {
  const { theme } = useTheme();
  const defaultDevice = useDeviceData(room.id, "default");
  const { mutate: switchDevice } = useSwitchDevice();
  const activeDeviceCount = room.devices.filter((device) => device.status).length;

  const handleOnChange = useCallback(
    (value: boolean) => {
      if (defaultDevice) {
        switchDevice({
          deviceId: defaultDevice.id,
          statusFrom: defaultDevice.status,
          statusTo: value,
        });
      }
    },
    [defaultDevice, switchDevice],
  );

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityLabel={`${room.name}, ${room.devices.length} devices`}
      onPress={() =>
        router.push(getTypedRoute(Routes.Room.replace("[roomId]", room.id)))
      }
    >
      <Card
        item={room}
        value={defaultDevice?.status ?? false}
        onChange={defaultDevice ? handleOnChange : () => {}}
        render={(room) => (
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
              <Icon name={room.name as string} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text
                  numberOfLines={2}
                  style={{ fontSize: 15, fontFamily: "Lexend_600SemiBold" }}
                >
                  {room.name}
                </Text>
                <Text style={{ color: theme.colors.grey2, fontSize: 12 }}>
                  {room.devices.length} devices
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor:
                    activeDeviceCount > 0
                      ? theme.colors.success
                      : theme.colors.grey3,
                }}
              />
              <Text style={{ color: theme.colors.grey2, fontSize: 12 }}>
                {activeDeviceCount} active
              </Text>
            </View>
          </View>
        )}
      />
    </TouchableOpacity>
  );
};

export default React.memo(RoomCard);
