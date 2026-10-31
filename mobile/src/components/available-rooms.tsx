import useHouse from "@/hooks/use-house";
import { Room } from "@/models/room";
import { getTypedRoute, Routes } from "@/routes/routes";
import { Text, useTheme } from "@rneui/themed";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { StyleProp, TouchableOpacity, View, ViewStyle } from "react-native";
import { ScrollView } from "react-native-virtualized-view";
import LoadingSkeleton from "./loading-skeleton";

const ActiveTile = ({
  isActive,
  children,
}: {
  isActive: boolean;
  children: React.ReactNode;
}) => {
  const { theme } = useTheme();

  const style: StyleProp<ViewStyle> = {
    borderRadius: 999,
    backgroundColor: theme.colors.secondary,
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
  };

  return (
    <View
      style={[
        style,
        {
          backgroundColor: isActive
            ? theme.colors.success
            : theme.colors.secondary,
          borderWidth: 1,
          borderColor: isActive ? theme.colors.success : theme.colors.grey5,
          minHeight: 44,
        },
      ]}
    >
      {children}
    </View>
  );
};

const RoomTile = ({ room, isActive }: { room: Room; isActive: boolean }) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() =>
        router.replace(getTypedRoute(Routes.Room.replace("[roomId]", room.id)))
      }
    >
      <ActiveTile isActive={isActive}>
        <Text
          style={{
            fontFamily: "Lexend_600SemiBold",
            fontSize: 14,
            color: isActive
              ? theme.mode === "dark"
                ? "#10201A"
                : "#FFFFFF"
              : theme.colors.black,
          }}
        >
          {room.name}
        </Text>
      </ActiveTile>
    </TouchableOpacity>
  );
};

const AvailableRooms = () => {
  const { data, isLoading } = useHouse();
  const rooms = data?.details == null ? data?.data?.rooms ?? [] : [];
  const { roomId } = useLocalSearchParams();

  return (
    <View>
      <ScrollView horizontal>
        <View
          style={{
            marginVertical: 18,
            flexDirection: "row",
            gap: 10,
          }}
        >
          {isLoading
            ? Array.from({ length: 3 }, (_, index) => (
                <LoadingSkeleton
                  key={index}
                  height={44}
                  width={index === 1 ? 92 : 76}
                  borderRadius={999}
                />
              ))
            : rooms.map((room) => (
                <RoomTile
                  key={room.id}
                  room={room}
                  isActive={room.id === roomId}
                />
              ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default AvailableRooms;
