import useAddDevice from "@/hooks/use-add-device";
import useAvailableGPIOPins from "@/hooks/use-available-gpio-pins";
import useHouse from "@/hooks/use-house";
import { GPIOPinConfig } from "@/models/pin-header-config";
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
import { FormSkeleton } from "./loading-placeholders";
import LoadingSkeleton from "./loading-skeleton";

const AddDeviceForm = ({ closeForm }: { closeForm: () => void }) => {
  const {
    theme: {
      colors: { secondary },
    },
  } = useTheme();

  const { roomId } = useLocalSearchParams();
  const houseQuery = useHouse();
  const rooms = useMemo(
    () =>
      houseQuery.data?.details == null
        ? houseQuery.data?.data?.rooms ?? []
        : [],
    [houseQuery.data],
  );
  const room = useMemo(
    () => rooms?.find((room) => room.id === roomId),
    [roomId, rooms],
  );
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(
    room ?? (rooms?.[0] as Room) ?? null,
  );
  const [deviceName, setDeviceName] = useState("");
  const [deviceRating, setDeviceRating] = useState("");
  const {
    data: availableGPIOPins,
    isLoading: isLoadingAvailableGPIOPins,
  } = useAvailableGPIOPins({ houseId: selectedRoom?.houseId ?? "" });

  const gpioPin = useMemo(
    () => availableGPIOPins?.data?.[0],
    [availableGPIOPins?.data],
  );

  const [selectedGPIOPinState, setSelectedGPIOPin] =
    useState<GPIOPinConfig | null>(gpioPin ?? null);
  const selectedGPIOPin = selectedGPIOPinState ?? gpioPin ?? null;

  const { mutate: addDevice, isPending } = useAddDevice();

  const queryClient = useQueryClient();

  const handleSaveDevice = () => {
    if (!selectedRoom || !selectedGPIOPin) {
      return;
    }

    addDevice(
      {
        roomId: selectedRoom.id,
        pinNumber: selectedGPIOPin.headerPinNumber,
        gpioPinNumber: selectedGPIOPin.gpioPinNumber,
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

  if (houseQuery.isLoading) {
    return (
      <View
        style={{
          padding: 20,
          paddingBottom: 28,
          borderTopRightRadius: 24,
          borderTopLeftRadius: 24,
          backgroundColor: secondary,
          gap: 16,
        }}
        accessible={false}
        accessibilityElementsHidden
      >
        <LoadingSkeleton height={24} width="54%" />
        <FormSkeleton fields={roomId ? 3 : 4} showActions />
      </View>
    );
  }

  if (houseQuery.error) {
    return <MessageContainer message={houseQuery.error.message} />;
  }

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
        <MessageContainer message="Header pins not available." />
      </View>
    );
  }

  return (
    <View
      style={{
        padding: 20,
        paddingBottom: 28,
        borderTopRightRadius: 24,
        borderTopLeftRadius: 24,
        backgroundColor: secondary,
        gap: 16,
      }}
    >
      <Text
        style={{
          textAlign: "center",
          fontSize: 20,
          fontFamily: "Lexend_600SemiBold",
        }}
      >
        Add New Device
      </Text>
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
        label="Header Pin Number"
        items={
          [...(availableGPIOPins?.data ?? [])].sort(
            (a, b) => a.headerPinNumber - b.headerPinNumber,
          )
        }
        field="headerPinNumber"
        onValueChange={(newValue: GPIOPinConfig) =>
          setSelectedGPIOPin(newValue)
        }
        isLoading={isLoadingAvailableGPIOPins}
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
        label="Power consumption"
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
        <Button type="clear" disabled={isPending} onPress={closeForm}>
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
