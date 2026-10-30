import useHouse from "@/hooks/use-house";
import { getTypedRoute, Routes } from "@/routes/routes";
import { Text, useTheme } from "@rneui/themed";
import { router } from "expo-router";
import { useWindowDimensions, View } from "react-native";
import Grid from "./grid";
import Header from "./header";
import LoadingSkeleton from "./loading-skeleton";
import MessageContainer from "./message-container";
import RoomCard from "./room-card";

const GAP = 30;
const PADDING_HORIZONTAL = 12 * 2;

const Rooms = () => {
  const {
    theme: {
      colors: { grey3 },
    },
  } = useTheme();
  const { data, isPending, error } = useHouse();
  const { width } = useWindowDimensions();

  const cardWidth = (width - GAP - PADDING_HORIZONTAL) / 2;

  if (isPending) {
    return (
      <View style={{ marginVertical: 16 }}>
        <Grid
          items={["Loading 1", "Loading 2", "Loading 3", "Loading 4"]}
          renderItem={() => (
            <LoadingSkeleton height={150} width={cardWidth} borderRadius={12} />
          )}
          rowGap={20}
        />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={{ marginVertical: 16 }}>
        <Text style={{ textAlign: "center", color: grey3 }}>
          {error.message}
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
        rowGap={30}
        noDataMessage="Rooms not available create a new room."
      />
    </View>
  );
};

export default Rooms;
