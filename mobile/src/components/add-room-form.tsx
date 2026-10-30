import useAddRoom from "@/hooks/use-add-room";
import { useHouseData } from "@/hooks/use-house";
import { ApiRoutes } from "@/routes/routes";
import { Button, Text, useTheme } from "@rneui/themed";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ToastAndroid, View } from "react-native";
import InputField from "./input-field";

const AddRoomForm = ({ closeForm }: { closeForm: () => void }) => {
  const {
    theme: {
      colors: { secondary },
    },
  } = useTheme();
  const house = useHouseData();
  const [roomName, setRoomName] = useState("");
  const { mutate: addRoom, isPending } = useAddRoom();

  const queryClient = useQueryClient();

  const handleSaveRoom = () => {
    addRoom(
      {
        houseId: house?.id!,
        roomName,
      },
      {
        onSuccess: (res) => {
          if (res.success) {
            queryClient.invalidateQueries({ queryKey: [ApiRoutes.UserHouse] });
          } else {
            ToastAndroid.show(res.message, ToastAndroid.LONG);
          }
          closeForm();
        },
        onError: (res) => {
          ToastAndroid.show(res.message, ToastAndroid.LONG);
        },
      },
    );
  };

  return (
    <View
      style={{
        padding: 16,
        borderTopRightRadius: 12,
        borderTopLeftRadius: 12,
        backgroundColor: secondary,
        gap: 16,
      }}
    >
      <Text style={{ textAlign: "center", fontSize: 18 }}>Add New Room</Text>
      <InputField
        label="Room Name"
        placeholder="Enter room name"
        defaultValue=""
        onChangeText={(text) => setRoomName(text)}
        disabled={isPending}
      />
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          gap: 16,
          paddingHorizontal: 16,
        }}
      >
        <Button onPress={closeForm} disabled={isPending}>
          Cancel
        </Button>
        <Button onPress={handleSaveRoom} loading={isPending}>
          Save
        </Button>
      </View>
    </View>
  );
};

export default AddRoomForm;
