import Switch from "@/components/switch";
import Tile from "@/components/tile";
import { Device } from "@/models/device";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { Button, Text, useTheme } from "@rneui/themed";
import React, { useCallback, useMemo } from "react";
import { TouchableOpacity, View } from "react-native";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const getScheduledDays = (scheduledDays: string) => {
  const schedDays: boolean[] = new Array(7).fill(false);
  if (!scheduledDays) return schedDays;
  scheduledDays
    .split("-")
    .forEach((day) => (schedDays[DAYS.findIndex((d) => d === day)] = true));
  return schedDays;
};

const DeviceScheduleInfo = ({
  device,
  setDevice,

  isError,
}: {
  device?: Device | null;
  setDevice: React.Dispatch<React.SetStateAction<Device | null>>;
  isError: boolean;
}) => {
  const { theme } = useTheme();
  const { primary, error, grey3, grey5, success } = theme.colors;

  const scheduledDays = useMemo(
    () => getScheduledDays(device?.daysScheduled ?? ""),
    [device],
  );
  const areAllDaysSelected = scheduledDays.every(Boolean);
  const selectedDayTextColor =
    theme.mode === "dark" ? "#10201A" : "#FFFFFF";

  const showtimePicker = useCallback((timeFor: "start" | "off") => {
    DateTimePickerAndroid.open({
      value: new Date(),
      onChange: (e, d) => {
        if (e.type === "set") {
          const date = `${d?.getHours()}:${d?.getMinutes()}`;
          if (timeFor === "start") {
            setDevice((device) => ({
              ...device!,
              startTime: date,
            }));
          } else {
            setDevice((device) => ({
              ...device!,
              offTime: date,
            }));
          }
        }
      },
      mode: "time",
    });
  }, []);

  const handleDaysSelection = useCallback(
    (dayIndex: number, day: string) => {
      if (day === "All") {
        const isAllSelected = scheduledDays.every((day) => day);
        setDevice((device) => ({
          ...device!,
          daysScheduled: scheduledDays
            .map((_isSelected) => !isAllSelected)
            .map((isSelected, idx) => (isSelected ? DAYS[idx] : null))
            .filter((day) => day)
            .join("-"),
        }));
      } else {
        setDevice((device) => ({
          ...device!,
          daysScheduled: scheduledDays
            .map((isSelected, idx) =>
              idx === dayIndex ? !isSelected : isSelected,
            )
            .map((isSelected, idx) => (isSelected ? DAYS[idx] : null))
            .filter((day) => day)
            .join("-"),
        }));
      }
    },
    [device],
  );

  return (
    <Tile>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ fontSize: 16 }}>Scheduled</Text>
        <View
          style={{
            height: 45,
            width: 80,
            backgroundColor: primary,
            borderWidth: 1,
            borderColor: grey5,
            justifyContent: "center",
            alignItems: "center",
            borderRadius: 20,
          }}
        >
          <Switch
            value={device?.isScheduled ?? false}
            onChange={(value) =>
              setDevice((device) => ({
                ...device!,
                isScheduled: value,
              }))
            }
          />
        </View>
      </View>
      {device?.isScheduled && (
        <>
          <View>
            <Text style={{ fontSize: 16 }}>Days Scheduled</Text>
            <View
              style={{
                flexDirection: "row",
                marginVertical: 12,
              }}
            >
              {["All", ...DAYS].map((day, idx) => {
                const isSelected =
                  idx === 0
                    ? areAllDaysSelected
                    : scheduledDays[idx - 1] === true;

                return (
                  <TouchableOpacity
                    key={day}
                    onPress={() => handleDaysSelection(idx - 1, day)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected }}
                    style={{
                      width: "12.5%",
                      alignItems: "center",
                      justifyContent: "center",
                      height: 44,
                      borderTopLeftRadius: idx === 0 ? 12 : undefined,
                      borderBottomLeftRadius: idx === 0 ? 12 : undefined,
                      borderTopRightRadius: idx === 7 ? 12 : undefined,
                      borderBottomRightRadius: idx === 7 ? 12 : undefined,
                      borderRightWidth: 1,
                      borderLeftWidth: idx === 0 ? 1 : undefined,
                      borderBottomWidth: 1,
                      borderTopWidth: 1,
                      borderColor:
                        isError && !scheduledDays.some((day) => day)
                          ? error
                          : grey3,
                      backgroundColor: isSelected ? success : undefined,
                    }}
                  >
                    <Text
                      style={{
                        color: isSelected
                          ? selectedDayTextColor
                          : theme.colors.black,
                        fontSize: 11,
                        fontFamily: "Lexend_500Medium",
                      }}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <View
            style={[
              {
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              },
              isError && !device?.startTime
                ? {
                    borderBottomWidth: 1,
                    borderColor: error,
                  }
                : undefined,
            ]}
          >
            <Text style={{ fontSize: 16 }}>Start Time</Text>
            <Button type="clear" onPress={() => showtimePicker("start")}>
              <Text>{device?.startTime ? device?.startTime : "Set Time"}</Text>
            </Button>
          </View>
          <View
            style={[
              {
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              },
              isError && !device?.offTime
                ? {
                    borderBottomWidth: 1,
                    borderColor: error,
                  }
                : undefined,
            ]}
          >
            <Text style={{ fontSize: 16 }}>Off Time</Text>
            <Button type="clear" onPress={() => showtimePicker("off")}>
              <Text>{device?.offTime ? device?.offTime : "Set Time"}</Text>
            </Button>
          </View>
        </>
      )}
    </Tile>
  );
};

export default DeviceScheduleInfo;
