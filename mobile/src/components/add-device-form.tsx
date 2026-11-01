import Accordion from "./accordion";
import { selectAvailablePin } from "@/utils/onboarding";
import useAddDevice from "@/hooks/use-add-device";
import useAvailableGPIOPins from "@/hooks/use-available-gpio-pins";
import useHouse from "@/hooks/use-house";
import useHouseControllers from "@/hooks/use-house-controllers";
import { ApiRoutes } from "@/routes/routes";
import { Button, Text, useTheme } from "@rneui/themed";
import { useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import InputField from "./input-field";
import { FormSkeleton } from "./loading-placeholders";
import Select from "./select";

export default function AddDeviceForm({
  closeForm,
  onAddRoom,
}: {
  closeForm: () => void;
  onAddRoom?: () => void;
}) {
  const { theme } = useTheme();
  const { roomId } = useLocalSearchParams<{ roomId?: string }>();
  const houseQuery = useHouse();
  const house = houseQuery.data?.success ? houseQuery.data.data : null;
  const rooms = house?.rooms ?? [];
  const [selectedRoomId, setRoomId] = useState(roomId ?? "");
  const selectedRoom =
    rooms.find((item) => item.id === selectedRoomId) ?? rooms[0];
  const controllersQuery = useHouseControllers(house?.id ?? "");
  const controllers = (
    controllersQuery.data?.success ? controllersQuery.data.data : []
  ).filter((item) => item.paired && item.apiKeyLastFour);
  const [controllerId, setControllerId] = useState("");
  const controller =
    controllers.find((item) => item.id === controllerId) ?? controllers[0];
  const pinsQuery = useAvailableGPIOPins({
    houseId: house?.id ?? "",
    controllerDeviceId: controller?.id ?? "",
  });
  const pins = (pinsQuery.data?.success ? pinsQuery.data.data : [])
    .slice()
    .sort((a, b) => a.headerPinNumber - b.headerPinNumber);
  const [pinSelection, setPinSelection] = useState<{
    controllerId: string;
    number: number;
  } | null>(null);
  const pin = selectAvailablePin(pins, controller?.id, pinSelection);
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [rating, setRating] = useState("");
  const [showRating, setShowRating] = useState(false);
  const [error, setError] = useState("");
  const mutation = useAddDevice();
  const queryClient = useQueryClient();
  const validRating =
    !rating.trim() || (Number.isFinite(Number(rating)) && Number(rating) >= 0);
  const queryError =
    controllersQuery.error?.message ??
    pinsQuery.error?.message ??
    (controllersQuery.data?.success === false
      ? controllersQuery.data.message
      : pinsQuery.data?.success === false
        ? pinsQuery.data.message
        : "");

  return (
    <View style={{ padding: 20, gap: 20 }}>
      {houseQuery.isLoading ? (
        <FormSkeleton fields={2} showActions />
      ) : houseQuery.error || !house ? (
        <>
          <Text accessibilityRole="alert" style={{ color: theme.colors.error }}>
            Couldn&apos;t load this house.
          </Text>
          <Button type="outline" onPress={() => void houseQuery.refetch()}>
            Try again
          </Button>
        </>
      ) : !rooms.length ? (
        <>
          <Text style={{ color: theme.colors.grey2, lineHeight: 24 }}>
            Add a room for your first device.
          </Text>
          {onAddRoom && <Button onPress={onAddRoom}>Add a room</Button>}
        </>
      ) : (
        <>
          <Text style={{ color: theme.colors.grey2, fontSize: 14 }}>
            Step {step} of 2 -{" "}
            {step === 1 ? "Name and room" : "Controller and pin"}
          </Text>
          {step === 1 ? (
            <>
              <InputField
                label="Device name"
                placeholder="e.g. Ceiling light"
                value={name}
                onChangeText={setName}
                containerStyle={{ paddingHorizontal: 0 }}
              />
              <Select
                label="Room"
                field="name"
                items={rooms}
                selectedValue={selectedRoom}
                onValueChange={(item) => setRoomId(item.id)}
              />
              <Button
                disabled={!name.trim() || !selectedRoom}
                onPress={() => setStep(2)}
              >
                Continue
              </Button>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 16, fontFamily: "Lexend_500Medium" }}>
                {name.trim()} - {selectedRoom.name}
              </Text>
              <Select
                label="Controller"
                field="name"
                items={controllers}
                selectedValue={controller}
                isLoading={controllersQuery.isLoading}
                disabled={mutation.isPending}
                onValueChange={(item) => {
                  setControllerId(item.id);
                  setPinSelection(null);
                  setError("");
                }}
              />
              {!controllersQuery.isLoading &&
              !controllers.length &&
              !queryError ? (
                <>
                  <Text style={{ color: theme.colors.grey2, lineHeight: 22 }}>
                    Connect a controller before adding devices.
                  </Text>
                  <Button
                    type="outline"
                    onPress={() => {
                      closeForm();
                      router.push({
                        pathname: "/house-login",
                        params: { houseId: house.id },
                      });
                    }}
                  >
                    Connect a controller
                  </Button>
                </>
              ) : (
                <>
                  <Select
                    label="Header pin"
                    field="headerPinNumber"
                    items={pins}
                    selectedValue={pin}
                    isLoading={pinsQuery.isLoading}
                    disabled={mutation.isPending}
                    onValueChange={(item) =>
                      setPinSelection({
                        controllerId: controller!.id,
                        number: item.headerPinNumber,
                      })
                    }
                  />
                  {!pinsQuery.isLoading &&
                    controller &&
                    !pins.length &&
                    !queryError && (
                      <Text style={{ color: theme.colors.grey2 }}>
                        No free pins. Choose another controller.
                      </Text>
                    )}
                  <Accordion
                    title="Power rating (optional)"
                    summary={
                      rating ? `${rating} W` : "Used to estimate energy usage"
                    }
                    icon="zap"
                    expanded={showRating}
                    disabled={mutation.isPending}
                    onToggle={() => {
                      if (!mutation.isPending) setShowRating((value) => !value);
                    }}
                  >
                    <InputField
                      label="Power rating (W)"
                      placeholder="e.g. 60"
                      value={rating}
                      onChangeText={setRating}
                      keyboardType="decimal-pad"
                      disabled={mutation.isPending}
                    />
                  </Accordion>
                  {!validRating && (
                    <Text
                      accessibilityRole="alert"
                      style={{ color: theme.colors.error }}
                    >
                      Enter a power rating of zero or more.
                    </Text>
                  )}
                </>
              )}
              {!!queryError && (
                <>
                  <Text
                    accessibilityRole="alert"
                    style={{ color: theme.colors.error }}
                  >
                    {queryError}
                  </Text>
                  <Button
                    type="outline"
                    onPress={() => {
                      void controllersQuery.refetch();
                      if (controller) void pinsQuery.refetch();
                    }}
                  >
                    Try again
                  </Button>
                </>
              )}
              {!!error && (
                <Text
                  accessibilityRole="alert"
                  style={{ color: theme.colors.error }}
                >
                  {error}
                </Text>
              )}
              <Button
                loading={mutation.isPending}
                disabled={
                  mutation.isPending ||
                  !controller ||
                  !pin ||
                  !validRating ||
                  !!queryError
                }
                onPress={() => {
                  if (!controller || !pin || !selectedRoom) return;
                  setError("");
                  mutation.mutate(
                    {
                      roomId: selectedRoom.id,
                      controllerDeviceId: controller.id,
                      pinNumber: pin.headerPinNumber,
                      gpioPinNumber: pin.gpioPinNumber,
                      deviceName: name.trim(),
                      wattage: Number(rating) || 0,
                    },
                    {
                      onSuccess: (result) => {
                        if (!result.success) {
                          setError(result.message);
                          return;
                        }
                        void queryClient.invalidateQueries({
                          queryKey: [ApiRoutes.UserHouse],
                        });
                        void queryClient.invalidateQueries({
                          queryKey: [ApiRoutes.AvailableGPIOPins],
                        });
                        closeForm();
                      },
                      onError: (cause) => setError(cause.message),
                    },
                  );
                }}
              >
                Add device
              </Button>
              <Button
                type="clear"
                disabled={mutation.isPending}
                onPress={() => setStep(1)}
              >
                Back
              </Button>
            </>
          )}
        </>
      )}
    </View>
  );
}
