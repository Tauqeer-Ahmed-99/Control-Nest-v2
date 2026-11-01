import useHouse from "@/hooks/use-house";
import { getTypedRoute, Routes } from "@/routes/routes";
import { Text, useTheme } from "@rneui/themed";
import { router } from "expo-router";
import { View } from "react-native";
import Grid from "./grid";
import Header from "./header";
import CardGridSkeleton from "./card-grid-skeleton";
import MessageContainer from "./message-container";
import RoomCard from "./room-card";

const Rooms = () => {
  const {
    theme: {
      colors: { error: errorColor, grey3 },
    },
  } = useTheme();
  const { data, isLoading, error } = useHouse();

  if (isLoading) {
    return (
      <View style={{ marginVertical: 16 }}>
        <Header
          heading="Rooms"
          onDetails={() => router.push(getTypedRoute(Routes.Rooms))}
        />
        <CardGridSkeleton count={4} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={{ marginVertical: 16 }}>
        <Text
          style={{ textAlign: "center", color: error ? errorColor : grey3 }}
        >
          {error?.message ?? "No house is connected yet."}
        </Text>
      </View>
    );
  }

  const { data: roomData } = data;

  if (!roomData) {
    return (
      <View style={{ marginVertical: 16 }}>
        <MessageContainer message="Something went wrong, please try again later." />
      </View>
    );
  }

  const {
    data: { rooms },
  } = data;

  return (
    <View>
      <Header
        heading="Rooms"
        onDetails={() => router.push(getTypedRoute(Routes.Rooms))}
      />
      <Grid
        items={rooms}
        renderItem={(room) => <RoomCard room={room} />}
        rowGap={16}
        noDataMessage="Your rooms will appear here. Tap Add, then Room to create your first one."
      />
    </View>
  );
};

export default Rooms;
