import { useDeviceData } from "@/hooks/use-house";
import useSwitchDevice from "@/hooks/use-switch-device";
import { Room } from "@/models/room";
import { getTypedRoute, Routes } from "@/routes/routes";
import { Text } from "@rneui/themed";
import { router } from "expo-router";
import React, { useCallback } from "react";
import { TouchableOpacity, View } from "react-native";
import Card from "./card";
import Icon from "./icon";

const RoomCard = ({ room }: { room: Room }) => {
  const defaultDevice = useDeviceData(room.id, "default");
  const { mutate: switchDevice } = useSwitchDevice();

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
              paddingTop: 15,
              height: 150,
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Icon name={room.name as string} />
            <Text>{room.name}</Text>
            <View
              style={{
                width: "100%",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View style={{ flexDirection: "row", gap: 6 }}>
                <Text>{room.devices.length}</Text>
                <Text style={{ color: "grey" }}>Devices</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 6 }}>
                <Text>
                  {room.devices.filter((device) => device.status).length}
                </Text>
                <Text>ON</Text>
              </View>
            </View>
          </View>
        )}
      />
    </TouchableOpacity>
  );
};

export default React.memo(RoomCard);
