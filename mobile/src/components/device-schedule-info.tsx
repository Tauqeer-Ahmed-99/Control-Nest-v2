import Feather from "@expo/vector-icons/Feather";
import Switch from "@/components/switch";
import Tile from "@/components/tile";
import { Device } from "@/models/device";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { Button, Text, useTheme } from "@rneui/themed";
import React, { useCallback, useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

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
  const { fontScale } = useWindowDimensions();
  const { primary, error, grey5, success } = theme.colors;

  const [activeTime, setActiveTime] = useState<"start" | "off" | null>(null);
  const [pickerDate, setPickerDate] = useState(() => new Date());
  const scheduledDays = useMemo(
    () => getScheduledDays(device?.daysScheduled ?? ""),
    [device?.daysScheduled],
  );
  const areAllDaysSelected = scheduledDays.every(Boolean);
  const selectedDayTextColor = theme.mode === "dark" ? "#10201A" : "#FFFFFF";

  const showtimePicker = useCallback(
    (timeFor: "start" | "off") => {
      const initial = new Date();
      const saved = timeFor === "start" ? device?.startTime : device?.offTime;
      if (saved) {
        const [hours, minutes] = saved.split(":").map(Number);
        if (Number.isFinite(hours) && Number.isFinite(minutes))
          initial.setHours(hours, minutes, 0, 0);
      }
      if (Platform.OS === "ios") {
        setPickerDate(initial);
        setActiveTime(timeFor);
        return;
      }
      DateTimePickerAndroid.open({
        value: initial,
        onChange: (e, d) => {
          if (e.type === "set" && d) {
            const date = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
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
    },
    [device?.startTime, device?.offTime, setDevice],
  );

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
    [scheduledDays, setDevice],
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
        <Text style={{ fontSize: 16 }}>Schedule</Text>
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
            accessibilityLabel="Schedule this device"
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
          <View style={{ gap: 8 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <Text style={{ fontSize: 16 }}>Repeat on</Text>
              <TouchableOpacity
                accessibilityRole="checkbox"
                accessibilityLabel="Every day"
                accessibilityState={{ checked: areAllDaysSelected }}
                onPress={() => handleDaysSelection(-1, "All")}
                style={{
                  minHeight: 44,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Feather
                  name={areAllDaysSelected ? "check-square" : "square"}
                  size={18}
                  color={success}
                />
                <Text style={{ color: theme.colors.grey2, fontSize: 13 }}>
                  Every day
                </Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator
              style={{ flexGrow: 0 }}
              contentContainerStyle={{ flexGrow: 1, gap: 2, paddingBottom: 6 }}
            >
              {DAYS.map((day, index) => {
                const isSelected = scheduledDays[index];
                return (
                  <TouchableOpacity
                    key={day}
                    accessibilityRole="checkbox"
                    accessibilityLabel={day}
                    accessibilityState={{ checked: isSelected }}
                    onPress={() => handleDaysSelection(index, day)}
                    style={{
                      flexGrow: 1,
                      minWidth: Math.max(44, 36 * fontScale),
                      minHeight: 44,
                      paddingVertical: 10,
                      paddingHorizontal: 4,
                      borderRadius: 12,
                      borderWidth: 1,
                      alignItems: "center",
                      justifyContent: "center",
                      borderColor:
                        isError && !scheduledDays.some(Boolean)
                          ? error
                          : theme.colors.greyOutline,
                      backgroundColor: isSelected
                        ? success
                        : theme.colors.secondary,
                    }}
                  >
                    <Text
                      style={{
                        color: isSelected
                          ? selectedDayTextColor
                          : theme.colors.black,
                        fontSize: 12,
                        fontFamily: "Lexend_500Medium",
                      }}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
            <Text style={{ fontSize: 16 }}>Turn on</Text>
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
            <Text style={{ fontSize: 16 }}>Turn off</Text>
            <Button type="clear" onPress={() => showtimePicker("off")}>
              <Text>{device?.offTime ? device?.offTime : "Set Time"}</Text>
            </Button>
          </View>
          {Platform.OS === "ios" && activeTime && (
            <View style={{ gap: 8 }}>
              <DateTimePicker
                value={pickerDate}
                mode="time"
                display="spinner"
                themeVariant={theme.mode === "dark" ? "dark" : "light"}
                onChange={(_event, date) => {
                  if (!date) return;
                  setPickerDate(date);
                  const time = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
                  setDevice((current) =>
                    current
                      ? {
                          ...current,
                          [activeTime === "start" ? "startTime" : "offTime"]:
                            time,
                        }
                      : current,
                  );
                }}
              />
              <Button
                type="clear"
                onPress={() => {
                  const time = `${pickerDate.getHours().toString().padStart(2, "0")}:${pickerDate.getMinutes().toString().padStart(2, "0")}`;
                  setDevice((current) =>
                    current
                      ? {
                          ...current,
                          [activeTime === "start" ? "startTime" : "offTime"]:
                            time,
                        }
                      : current,
                  );
                  setActiveTime(null);
                }}
              >
                Done
              </Button>
            </View>
          )}
        </>
      )}
    </Tile>
  );
};

export default DeviceScheduleInfo;
