import InputField from "@/components/input-field";
import Select from "@/components/select";
import Tile from "@/components/tile";
import useAvailableGPIOPins from "@/hooks/use-available-gpio-pins";
import { useHouseId } from "@/hooks/use-house";
import { Device } from "@/models/device";
import { GPIOPinConfig, HeaderPinType } from "@/models/pin-header-config";
import React, { useCallback, useMemo, useState } from "react";

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
  const [deviceName, setDeviceName] = useState(device?.name ?? "");
  const [deviceWattage, setDeviceWattage] = useState(
    device?.wattage?.toString() ?? "",
  );
  const houseId = useHouseId();
  const { data: availableGPIOPins, isLoading: isLoadingAvailableGPIOPins } =
    useAvailableGPIOPins({
      houseId: houseId ?? "",
      controllerDeviceId: device?.controllerDeviceId ?? "",
    });
  const devicePinNumber = device?.pinNumber;
  const deviceGpioPinNumber = device?.gpioPinNumber;

  const selectedPinConfig = useMemo(() => {
    const availablePin = availableGPIOPins?.data?.find(
      (pinConfig) => pinConfig.headerPinNumber === devicePinNumber,
    );

    if (availablePin) {
      return availablePin;
    }

    if (devicePinNumber !== undefined && deviceGpioPinNumber !== undefined) {
      return {
        headerPinNumber: devicePinNumber,
        gpioPinNumber: deviceGpioPinNumber,
        type: HeaderPinType.GPIO,
        voltage: null,
      } as GPIOPinConfig;
    }

    return undefined;
  }, [availableGPIOPins?.data, deviceGpioPinNumber, devicePinNumber]);

  const availablePins = useMemo(() => {
    const available = [...(availableGPIOPins?.data ?? [])].sort(
      (a, b) => a.headerPinNumber - b.headerPinNumber,
    );

    return selectedPinConfig
      ? [
          selectedPinConfig,
          ...available.filter(
            (pinConfig) =>
              pinConfig.headerPinNumber !== selectedPinConfig.headerPinNumber,
          ),
        ]
      : available;
  }, [availableGPIOPins?.data, selectedPinConfig]);

  const handleDeviceNameChange = useCallback(
    (text: string) => {
      deviceNameRef.current = text;
      setDeviceName(text);
    },
    [deviceNameRef],
  );

  const handleDeviceWattageChange = useCallback(
    (text: string) => {
      deviceWattageRef.current = text;
      setDeviceWattage(text);
    },
    [deviceWattageRef],
  );

  const handleGPIOPinChange = useCallback(
    (newValue: GPIOPinConfig) => {
      setDevice((currentDevice) =>
        currentDevice
          ? {
              ...currentDevice,
              pinNumber: newValue.headerPinNumber,
              gpioPinNumber: newValue.gpioPinNumber,
            }
          : currentDevice,
      );
    },
    [setDevice],
  );

  return (
    <Tile>
      <InputField
        label="Device Name"
        value={deviceName}
        onChangeText={handleDeviceNameChange}
      />
      <InputField
        label="Consumption Rating"
        value={deviceWattage}
        onChangeText={handleDeviceWattageChange}
        keyboardType="number-pad"
      />
      <Select
        label="Header Pin Number"
        isLoading={isLoadingAvailableGPIOPins}
        items={availablePins}
        onValueChange={handleGPIOPinChange}
        selectedValue={selectedPinConfig ?? {}}
        field="headerPinNumber"
      />
    </Tile>
  );
};

export default DeviceInputFieldsInfo;
