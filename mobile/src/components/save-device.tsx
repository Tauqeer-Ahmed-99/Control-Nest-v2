import Tile from "@/components/tile";
import useConfigureDevice from "@/hooks/use-configure-device";
import { Device } from "@/models/device";
import { ApiRoutes } from "@/routes/routes";
import { Button, Text, useTheme } from "@rneui/themed";
import { useQueryClient } from "@tanstack/react-query";
import { Dispatch, MutableRefObject, SetStateAction, useState } from "react";

export default function SaveDevice({
  device,
  deviceNameRef,
  deviceWattageRef,
  setIsError,
}: {
  device?: Device | null;
  deviceNameRef: MutableRefObject<string>;
  deviceWattageRef: MutableRefObject<string>;
  setIsError: Dispatch<SetStateAction<boolean>>;
}) {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const mutation = useConfigureDevice();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  return (
    <Tile>
      <Button
        loading={mutation.isPending}
        disabled={mutation.isPending || !device}
        onPress={() => {
          if (!device) return;
          setError("");
          setSaved(false);
          setIsError(false);
          if (!deviceNameRef.current.trim()) {
            setError("Enter a device name.");
            return;
          }
          const wattage = Number(deviceWattageRef.current);
          if (!Number.isFinite(wattage) || wattage < 0) {
            setError("Enter a power rating of zero or more.");
            return;
          }
          if (
            device.isScheduled &&
            (!device.daysScheduled?.trim() ||
              !device.startTime ||
              !device.offTime)
          ) {
            setIsError(true);
            setError(
              "Choose at least one day and both times for the schedule.",
            );
            return;
          }
          mutation.mutate(
            {
              roomId: device.roomId,
              deviceId: device.id,
              deviceName: deviceNameRef.current.trim(),
              pinNumber: device.pinNumber,
              gpioPinNumber: device.gpioPinNumber,
              status: device.status,
              isDefault: device.isDefault,
              isScheduled: device.isScheduled,
              daysScheduled: device.daysScheduled ?? undefined,
              startTime: device.startTime ?? undefined,
              offTime: device.offTime ?? undefined,
              wattage,
            },
            {
              onSuccess: (result) => {
                if (!result.success) {
                  setError(result.message);
                  return;
                }
                setSaved(true);
                void queryClient.invalidateQueries({
                  queryKey: [ApiRoutes.UserHouse],
                });
                void queryClient.invalidateQueries({
                  queryKey: [ApiRoutes.AvailableGPIOPins],
                });
              },
              onError: (cause) => setError(cause.message),
            },
          );
        }}
      >
        Save changes
      </Button>
      {!!error && (
        <Text
          accessibilityRole="alert"
          style={{ color: theme.colors.error, marginTop: 12 }}
        >
          {error}
        </Text>
      )}
      {saved && (
        <Text
          accessibilityLiveRegion="polite"
          style={{ color: theme.colors.success, marginTop: 12 }}
        >
          Changes saved
        </Text>
      )}
    </Tile>
  );
}
