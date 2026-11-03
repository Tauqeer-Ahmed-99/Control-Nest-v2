import Accordion from "@/components/accordion";
/* eslint-disable react-hooks/set-state-in-effect */
import DefaultDeviceInfo from "@/components/default-device-info";
import DeviceInputFieldsInfo from "@/components/device-input-field-info";
import DeviceScheduleInfo from "@/components/device-schedule-info";
import DeviceStatusInfo from "@/components/device-status-info";
import DeviceUpdateHistory from "@/components/device-update-history";
import RemoveDevice from "@/components/remove-device";
import SaveDevice from "@/components/save-device";
import { DeviceDetailsSkeleton } from "@/components/loading-placeholders";
import Tile from "@/components/tile";
import useHouse, { useDeviceData, useDevicesData } from "@/hooks/use-house";
import { Device } from "@/models/device";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Button, Text, useTheme } from "@rneui/themed";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";

const DeviceComponent = () => {
  const { theme } = useTheme();
  const primary = theme.colors.primary;
  const { roomId, deviceId } = useLocalSearchParams();
  const houseQuery = useHouse();
  const deviceData = useDeviceData(roomId as string, deviceId as string);
  useDevicesData();
  const [device, setDevice] = useState<Device | null>(deviceData);
  const deviceNameRef = useRef(device?.name ?? "");
  const deviceWattageRef = useRef(device?.wattage?.toString() ?? "");
  const [showOptions, setShowOptions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (deviceData) {
      setDevice(deviceData);
    }
  }, [deviceData]);

  useEffect(() => {
    deviceNameRef.current = deviceData?.name ?? deviceNameRef.current;
    deviceWattageRef.current =
      deviceData?.wattage?.toString() ?? deviceWattageRef.current;
  }, [deviceData?.name, deviceData?.wattage]);

  if (houseQuery.isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: primary,
          padding: 16,
        }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 132 }}
        >
          <DeviceDetailsSkeleton />
        </ScrollView>
      </View>
    );
  }

  if (!device)
    return (
      <View style={{ flex: 1, padding: 20, gap: 20, backgroundColor: primary }}>
        <Text accessibilityRole="alert">
          {houseQuery.error
            ? "Couldn't load this device."
            : "This device is no longer in this room."}
        </Text>
        <Button type="outline" onPress={() => void houseQuery.refetch()}>
          Try again
        </Button>
        <Button type="clear" onPress={() => router.back()}>
          Back to room
        </Button>
      </View>
    );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: primary,
        padding: 16,
      }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 132 }}
      >
        <View style={{ gap: 16 }}>
          <DeviceInputFieldsInfo
            device={device}
            setDevice={setDevice}
            deviceNameRef={deviceNameRef}
            deviceWattageRef={deviceWattageRef}
          />
          <DeviceStatusInfo device={device} setDevice={setDevice} />
          <Accordion
            title="Schedule & room shortcut"
            icon="clock"
            summary={`${device.isScheduled ? "Schedule enabled" : "Schedule off"} - ${device.isDefault ? "Room shortcut enabled" : "Room shortcut off"}`}
            expanded={showOptions || isError}
            onToggle={() => {
              if (isError) {
                setIsError(false);
                setShowOptions(false);
              } else setShowOptions((value) => !value);
            }}
          >
            <DefaultDeviceInfo device={device} setDevice={setDevice} />
            <DeviceScheduleInfo
              device={device}
              setDevice={setDevice}
              isError={isError}
            />
          </Accordion>
          <SaveDevice
            device={device}
            deviceNameRef={deviceNameRef}
            deviceWattageRef={deviceWattageRef}
            setIsError={setIsError}
          />
          <Accordion
            title="Recent changes"
            summary="View device settings history"
            icon="rotate-ccw"
            expanded={showHistory}
            onToggle={() => setShowHistory((value) => !value)}
          >
            <DeviceUpdateHistory device={device} />
          </Accordion>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="View device activity"
            onPress={() =>
              router.push({
                pathname: "/(tabs)/room/[roomId]/[deviceId]/control-logs",
                params: {
                  roomId: roomId as string,
                  deviceId: deviceId as string,
                },
              })
            }
          >
            <Tile>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 16 }}>Device activity</Text>
                <MaterialIcons
                  name="chevron-right"
                  size={24}
                  color={theme.colors.black}
                />
              </View>
            </Tile>
          </TouchableOpacity>
          <RemoveDevice />
        </View>
      </ScrollView>
    </View>
  );
};

export default DeviceComponent;
