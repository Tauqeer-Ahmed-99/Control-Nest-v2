import useAddDevice from "@/hooks/use-add-device";
import useAvailableGPIOPins from "@/hooks/use-available-gpio-pins";
import { useRoomsData } from "@/hooks/use-house";
import { HeaderPinConfig } from "@/models/pin-header-config";
import { Room } from "@/models/room";
import { ApiRoutes } from "@/routes/routes";
import { Button, Text, useTheme } from "@rneui/themed";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { ToastAndroid, View } from "react-native";
import InputField from "./input-field";
import MessageContainer from "./message-container";
import Select from "./select";

const AddDeviceForm = ({ closeForm }: { closeForm: () => void }) => {
  const {
    theme: {
      colors: { secondary },
    },
  } = useTheme();

  const { roomId } = useLocalSearchParams();
  const rooms = useRoomsData();
  const room = useMemo(
    () => rooms?.find((room) => room.id === roomId),
    [roomId, rooms],
  );
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(
    room ?? (rooms?.[0] as Room) ?? null,
  );
  const [deviceName, setDeviceName] = useState("");
  const [deviceRating, setDeviceRating] = useState("");
  const { data: availableGPIOPins } = useAvailableGPIOPins({
    houseId: selectedRoom?.houseId ?? "",
  });

  const gpioPin = useMemo(
    () => availableGPIOPins?.data?.[0],
    [availableGPIOPins?.data],
  );

  const [selectedGPIOPin, setSelectedGPIOPin] =
    useState<HeaderPinConfig | null>(gpioPin ?? null);

  const { mutate: addDevice, isPending } = useAddDevice();

  const queryClient = useQueryClient();

  const handleSaveDevice = () => {
    addDevice(
      {
        roomId: selectedRoom?.id ?? "",
        pinNumber: selectedGPIOPin?.gpioPinNumber!,
        deviceName,
        wattage: isNaN(Number(deviceRating)) ? 0.0 : Number(deviceRating),
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

  if (!rooms.length) {
    return (
      <View>
        <MessageContainer message="Please add rooms first on home screen, then add the devices." />
      </View>
    );
  }

  if (availableGPIOPins?.data && !availableGPIOPins?.data?.length) {
    return (
      <View>
        <MessageContainer message="GPIO Pins not available." />
      </View>
    );
  }

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
      <Text style={{ textAlign: "center", fontSize: 18 }}>Add New Device</Text>
      {!roomId && (
        <Select
          label="Room"
          items={rooms}
          field="name"
          onValueChange={(newValue: Room) => setSelectedRoom(newValue)}
          selectedValue={selectedRoom}
        />
      )}
      <Select
        label="GPIO Pin"
        items={
          availableGPIOPins?.data?.sort(
            (a, b) => a.gpioPinNumber! - b.gpioPinNumber!,
          ) ?? []
        }
        field="gpioPinNumber"
        onValueChange={(newValue: HeaderPinConfig) =>
          setSelectedGPIOPin(newValue)
        }
        selectedValue={selectedGPIOPin}
      />
      <InputField
        label="Device Name"
        placeholder="Enter device name"
        defaultValue=""
        onChangeText={(text) => setDeviceName(text)}
        disabled={isPending}
      />
      <InputField
        label="Pwer Consumption Rating"
        placeholder="Enter in watt"
        defaultValue=""
        onChangeText={(text) => setDeviceRating(text)}
        disabled={isPending}
        keyboardType="number-pad"
      />
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          gap: 16,
          paddingHorizontal: 16,
        }}
      >
        <Button disabled={isPending} onPress={closeForm}>
          Cancel
        </Button>
        <Button loading={isPending} onPress={handleSaveDevice}>
          Save
        </Button>
      </View>
    </View>
  );
};

export default AddDeviceForm;
