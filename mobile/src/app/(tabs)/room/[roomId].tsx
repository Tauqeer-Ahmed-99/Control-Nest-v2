import SheetHeader from "@/components/sheet-header";
import AvailableRooms from "@/components/available-rooms";
import DeviceCard from "@/components/device-card";
import Grid from "@/components/grid";
import CardGridSkeleton from "@/components/card-grid-skeleton";
import MessageContainer from "@/components/message-container";
import useHouse, { useRoomData } from "@/hooks/use-house";
import useRemoveRoom from "@/hooks/use-remove-room";
import useUpdateHeaderTitle from "@/hooks/use-update-header-title";
import { ApiRoutes } from "@/routes/routes";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { BottomSheet, Button, Text, useTheme } from "@rneui/themed";
import { useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ToastAndroid, TouchableOpacity, View } from "react-native";
import { ScrollView } from "react-native-virtualized-view";

const Room = () => {
  const {
    theme: {
      colors: { primary, secondary },
    },
  } = useTheme();
  const { roomId } = useLocalSearchParams();
  const houseQuery = useHouse();
  const room = useRoomData(roomId as string);
  const [isDeleteRoomConfirmationOpen, setIsDeleteRoomConfirmationOpen] =
    useState(false);
  const { mutate: removeRoom, isPending: isDeletingRoom } = useRemoveRoom();

  const queryClient = useQueryClient();

  const deleteRoom = () => {
    removeRoom(
      {
        houseId: room?.houseId!,
        roomId: room?.id!,
      },
      {
        onSuccess: (res) => {
          if (res.success) {
            router.back();
            queryClient.invalidateQueries({ queryKey: [ApiRoutes.UserHouse] });
          } else {
            ToastAndroid.show(res.message, ToastAndroid.LONG);
          }
        },
        onError: (res) => {
          ToastAndroid.show(res.message, ToastAndroid.LONG);
        },
      },
    );
  };

  const DeleteRoomButton = (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Delete ${room?.name ?? "room"}`}
      hitSlop={10}
      onPress={() => setIsDeleteRoomConfirmationOpen(true)}
      style={{
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <MaterialIcons name="delete-outline" size={24} color="white" />
    </TouchableOpacity>
  );

  useUpdateHeaderTitle(room?.name ?? "Room", DeleteRoomButton);

  if (houseQuery.isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: primary,
          paddingHorizontal: 18,
        }}
      >
        <AvailableRooms />
        <CardGridSkeleton count={4} />
      </View>
    );
  }

  if (!room) {
    return (
      <View style={{ flex: 1, backgroundColor: primary, padding: 18 }}>
        <MessageContainer
          message={
            houseQuery.error?.message ?? `Room with id '${roomId}' not found.`
          }
        />
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: primary,
        paddingHorizontal: 18,
      }}
    >
      <AvailableRooms />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 132 }}
      >
        {room.devices.length > 0 ? (
          <Grid
            items={room.devices}
            renderItem={(device) => <DeviceCard device={device} />}
            rowGap={30}
          />
        ) : (
          <MessageContainer message="No Device available create a new device." />
        )}
      </ScrollView>
      <BottomSheet
        isVisible={isDeleteRoomConfirmationOpen}
        onBackdropPress={
          isDeletingRoom
            ? undefined
            : () => setIsDeleteRoomConfirmationOpen(false)
        }
      >
        <View
          style={{
            padding: 16,
            borderTopRightRadius: 12,
            borderTopLeftRadius: 12,
            backgroundColor: secondary,
            gap: 16,
          }}
        >
          <SheetHeader
            title={`Delete ${room.name}`}
            onClose={() => setIsDeleteRoomConfirmationOpen(false)}
            closeLabel="Close delete room confirmation"
            disabled={isDeletingRoom}
          />
          <Text>Are you sure you want to delete {room.name}?</Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              gap: 16,
            }}
          >
            <Button
              type="clear"
              disabled={isDeletingRoom}
              onPress={() => setIsDeleteRoomConfirmationOpen(false)}
            >
              Cancel
            </Button>
            <Button color="error" loading={isDeletingRoom} onPress={deleteRoom}>
              Yes
            </Button>
          </View>
        </View>
      </BottomSheet>
    </View>
  );
};

export default Room;
