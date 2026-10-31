import Tile from "@/components/tile";
import useConfigureDevice from "@/hooks/use-configure-device";
import { useRoomData } from "@/hooks/use-house";
import useUsername from "@/hooks/use-username";
import { Device } from "@/models/device";
import { ApiRoutes } from "@/routes/routes";
import { useUser } from "@clerk/expo";
import { BottomSheet, Button, Text, useTheme } from "@rneui/themed";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { ActivityIndicator, ToastAndroid, View } from "react-native";

const SaveDevice = ({
  device,
  deviceNameRef,
  deviceWattageRef,
  setIsError,
}: {
  device?: Device | null;
  deviceNameRef: React.MutableRefObject<string>;
  deviceWattageRef: React.MutableRefObject<string>;
  setIsError: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const {
    theme: {
      colors: { primary, success },
    },
  } = useTheme();
  const { roomId } = useLocalSearchParams();
  const room = useRoomData(roomId as string);
  const queryClient = useQueryClient();
  const { mutate: configureDevice, isPending: isConfigureDeviceLoading } =
    useConfigureDevice();
  const { user } = useUser();
  const username = useUsername();

  const saveDeviceConfig = () => {
    if (device?.isScheduled) {
      const isSomeDaysSelected = Boolean(device.daysScheduled?.trim());
      if (!isSomeDaysSelected || !device.startTime || !device.offTime) {
        setIsError(true);
        ToastAndroid.show(
          "Atlease one day must be selected and Start, Off time is required to schedule a device.",
          ToastAndroid.LONG,
        );
        return;
      }
    }

    configureDevice(
      {
        roomId: device?.roomId!,
        deviceId: device?.id!,
        deviceName: deviceNameRef.current,
        pinNumber: device?.pinNumber,
        gpioPinNumber: device?.gpioPinNumber,
        status: device?.status,
        isDefault: device?.isDefault,
        isScheduled: device?.isScheduled,
        daysScheduled: device?.daysScheduled ?? undefined,
        startTime: device?.startTime ?? undefined,
        offTime: device?.offTime ?? undefined,
        wattage: isNaN(Number(deviceWattageRef.current))
          ? 0.0
          : Number(deviceWattageRef.current),
      },
      {
        onSuccess: (res) => {
          if (res.success) {
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

  return (
    <>
      <Tile>
        <Button disabled={isConfigureDeviceLoading} onPress={saveDeviceConfig}>
          Save
        </Button>
      </Tile>
      <BottomSheet isVisible={isConfigureDeviceLoading}>
        <View
          style={{
            height: 100,
            padding: 20,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            backgroundColor: primary,
            flexDirection: "row",
            alignItems: "center",
            gap: 16,
          }}
        >
          <ActivityIndicator size="large" color={success} />
          <Text>Loading, please wait...</Text>
        </View>
      </BottomSheet>
    </>
  );
};

export default SaveDevice;
