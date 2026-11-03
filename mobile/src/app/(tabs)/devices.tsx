import DeviceCard from "@/components/device-card";
import Grid from "@/components/grid";
import Header from "@/components/header";
import CardGridSkeleton from "@/components/card-grid-skeleton";
import LoadingSkeleton from "@/components/loading-skeleton";
import MessageContainer from "@/components/message-container";
import useHouse from "@/hooks/use-house";
import { getTypedRoute, Routes } from "@/routes/routes";
import { useTheme } from "@rneui/themed";
import { router } from "expo-router";
import { ScrollView, View } from "react-native";

const Devices = () => {
  const { theme } = useTheme();
  const { data, isLoading, error } = useHouse();
  const rooms = data?.details == null ? (data?.data?.rooms ?? []) : [];

  if (isLoading) {
    return (
      <View
        style={{ flex: 1, padding: 16, backgroundColor: theme.colors.primary }}
      >
        <View style={{ gap: 12, marginTop: 10 }}>
          <LoadingSkeleton height={18} width="38%" />
          <CardGridSkeleton count={4} />
        </View>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: 16,
        backgroundColor: theme.colors.primary,
      }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 132 }}
      >
        {error ? (
          <MessageContainer
            message={error.message || "Unable to load devices."}
          />
        ) : rooms.length > 0 ? (
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
                  <Grid
                    items={room.devices}
                    renderItem={(device) => <DeviceCard device={device} />}
                    rowGap={16}
                  />
                ) : (
                  <MessageContainer message="No devices yet. Tap Add, then Device to connect one." />
                )}
              </View>
            </View>
          ))
        ) : (
          <View>
            <MessageContainer message="Add a room first: tap Add, then Room." />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default Devices;
