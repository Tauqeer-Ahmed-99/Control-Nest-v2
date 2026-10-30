import InputField from "@/components/input-field";
import Select from "@/components/select";
import Tile from "@/components/tile";
import useAvailableGPIOPins from "@/hooks/use-available-gpio-pins";
import { useHouseId } from "@/hooks/use-house";
import { Device } from "@/models/device";
import { HeaderPinConfig } from "@/models/pin-header-config";
import React, { useCallback, useMemo } from "react";

const DeviceInputFieldsInfo = ({
  device,
  setDevice,
  deviceNameRef,
  deviceWattageRef,
}: {
  device?: Device | null;
  setDevice: React.Dispatch<React.SetStateAction<Device | null>>;
  deviceNameRef: React.MutableRefObject<string>;
  deviceWattageRef: React.MutableRefObject<string>;
}) => {
  const houseId = useHouseId();
  const { data: availableGPIOPins, isLoading: isLoadingAvailableGPIOPins } =
    useAvailableGPIOPins({ houseId: houseId ?? "" });

  const selectedPinConfig = useMemo(
    () =>
      availableGPIOPins?.data?.find(
        (gpioConfig) => gpioConfig.gpioPinNumber === device?.pinNumber,
      ),
    [availableGPIOPins?.data, device],
  );

  const availablePins = useMemo(
    () =>
      availableGPIOPins
        ? [
            {
              gpioPinNumber: device?.pinNumber ?? 0,
              headerPinNumber: Number(),
            } as HeaderPinConfig,
            ...(availableGPIOPins?.data?.sort(
              (a, b) => a.gpioPinNumber! - b.gpioPinNumber!,
            ) ?? []),
          ]
        : [],
    [availableGPIOPins],
  );

  const handleDeviceNameChange = useCallback(
    (text: string) => {
      deviceNameRef.current = text;
    },
    [device],
  );

  const handleDeviceWattageChange = useCallback(
    (text: string) => {
      deviceWattageRef.current = text;
    },
    [device],
  );

  const handleGPIOPinChange = useCallback(
    (newValue: any, index: number) => {
      setDevice(
        (device) =>
          ({ ...device, pinNumber: newValue.gpioPinNumber }) as Device,
      );
    },
    [device, availableGPIOPins, selectedPinConfig],
  );

  return (
    <Tile>
      <InputField
        label="Device Name"
        defaultValue={deviceNameRef.current}
        onChangeText={handleDeviceNameChange}
      />
      <InputField
        label="Consumption Rating"
        defaultValue={deviceWattageRef.current}
        onChangeText={handleDeviceWattageChange}
        keyboardType="number-pad"
      />
      <Select
        label="GPIO Pin"
        isLoading={isLoadingAvailableGPIOPins}
        items={availablePins}
        onValueChange={handleGPIOPinChange}
        selectedValue={selectedPinConfig ?? {}}
        field="gpioPinNumber"
      />
    </Tile>
  );
};

export default DeviceInputFieldsInfo;
