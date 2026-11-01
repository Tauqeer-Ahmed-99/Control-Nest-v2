import SheetHeader from "./sheet-header";
import Tile from "@/components/tile";
import useRemoveDevice from "@/hooks/use-remove-device";
import { ApiRoutes } from "@/routes/routes";
import { BottomSheet, Button, Text, useTheme } from "@rneui/themed";
import { useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, ToastAndroid, View } from "react-native";

const RemoveDevice = () => {
  const {
    theme: {
      colors: { primary, success, error },
    },
  } = useTheme();
  const { roomId, deviceId } = useLocalSearchParams();
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const { mutate: removeDevice, isPending: isRemovingDevice } =
    useRemoveDevice();

  const queryClient = useQueryClient();

  const removeDeviceConfirm = useCallback(() => {
    setIsConfirmationOpen(false);
    removeDevice(
      {
        roomId: roomId as string,
        deviceId: deviceId as string,
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
  }, [deviceId, queryClient, removeDevice, roomId]);

  return (
    <>
      <Tile>
        <Button
          type="outline"
          color="error"
          titleStyle={{ color: error }}
          onPress={() => setIsConfirmationOpen(true)}
        >
          Remove Device
        </Button>
      </Tile>
      <BottomSheet
        isVisible={isConfirmationOpen}
        onBackdropPress={() => setIsConfirmationOpen(false)}
      >
        <View
          style={{
            minHeight: 150,
            padding: 20,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            backgroundColor: primary,
            gap: 12,
          }}
        >
          <SheetHeader
            title="Remove device"
            onClose={() => setIsConfirmationOpen(false)}
            closeLabel="Close remove device confirmation"
          />
          <Text>Do you really want to delete this device?</Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Button onPress={() => setIsConfirmationOpen(false)}>Cancel</Button>
            <Button color="error" onPress={() => removeDeviceConfirm()}>
              Yes
            </Button>
          </View>
        </View>
      </BottomSheet>
      <BottomSheet isVisible={isRemovingDevice}>
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

export default RemoveDevice;
