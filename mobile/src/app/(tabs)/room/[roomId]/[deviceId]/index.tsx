/* eslint-disable react-hooks/set-state-in-effect */
import DefaultDeviceInfo from "@/components/default-device-info";
import DeviceInputFieldsInfo from "@/components/device-input-field-info";
import DeviceScheduleInfo from "@/components/device-schedule-info";
import DeviceStatusInfo from "@/components/device-status-info";
import DeviceUpdateHistory from "@/components/device-update-history";
import RemoveDevice from "@/components/remove-device";
import SaveDevice from "@/components/save-device";
import Tile from "@/components/tile";
import { useDeviceData, useDevicesData } from "@/hooks/use-house";
import { Device } from "@/models/device";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Text, useTheme } from "@rneui/themed";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { ScrollView } from "react-native-virtualized-view";

const DeviceComponent = () => {
  const {
    theme: {
      colors: { primary },
    },
  } = useTheme();
  const { roomId, deviceId } = useLocalSearchParams();
  const deviceData = useDeviceData(roomId as string, deviceId as string);
  useDevicesData();
  const [device, setDevice] = useState<Device | null>(deviceData);
  const deviceNameRef = useRef(device?.name ?? "");
  const deviceWattageRef = useRef(device?.wattage?.toString() ?? "");
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

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: primary,
        padding: 16,
        paddingBottom: 90,
      }}
    >
      <ScrollView>
        <View style={{ gap: 16 }}>
          <DeviceInputFieldsInfo
            device={device}
            setDevice={setDevice}
            deviceNameRef={deviceNameRef}
            deviceWattageRef={deviceWattageRef}
          />
          <DeviceStatusInfo device={device} setDevice={setDevice} />
          <DefaultDeviceInfo device={device} setDevice={setDevice} />
          <DeviceScheduleInfo
            device={device}
            setDevice={setDevice}
            isError={isError}
          />
          <SaveDevice
            device={device}
            deviceNameRef={deviceNameRef}
            deviceWattageRef={deviceWattageRef}
            setIsError={setIsError}
          />
          <DeviceUpdateHistory device={device} />
          <TouchableOpacity
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
                <Text style={{ fontSize: 16 }}>Control Logs</Text>
                <MaterialIcons name="chevron-right" size={24} color="#fff" />
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
