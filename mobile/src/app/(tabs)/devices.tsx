import DeviceCard from "@/components/device-card";
import Header from "@/components/header";
import MessageContainer from "@/components/message-container";
import { useRoomsData } from "@/hooks/use-house";
import { getTypedRoute, Routes } from "@/routes/routes";
import { useTheme } from "@rneui/themed";
import { router } from "expo-router";
import { View } from "react-native";
import { ScrollView } from "react-native-virtualized-view";

const Devices = () => {
  const { theme } = useTheme();
  const rooms = useRoomsData();
  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: 16,
        paddingBottom: 90,
        backgroundColor: theme.colors.primary,
      }}
    >
      <ScrollView>
        {rooms && rooms.length > 0 ? (
          rooms.map((room) => (
            <View key={room.id}>
              <Header
                heading={room.name ?? "Room"}
                onDetails={() =>
                  router.push(
                    getTypedRoute(Routes.Room.replace("[roomId]", room.id)),
                  )
                }
              />
              <View style={{ width: "100%" }}>
                {room.devices.length > 0 ? (
                  <ScrollView horizontal>
                    <View
                      style={{ height: 220, flexDirection: "row", gap: 20 }}
                    >
                      {room.devices.map((device) => (
                        <DeviceCard key={device.id} device={device} />
                      ))}
                    </View>
                  </ScrollView>
                ) : (
                  <MessageContainer message="No device added to this room." />
                )}
              </View>
            </View>
          ))
        ) : (
          <View>
            <MessageContainer message="No rooms available." />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default Devices;
