import useAccessibilityPreferences from "@/hooks/use-accessibility-preferences";
import { useHouseId } from "@/hooks/use-house";
import { getTypedRoute } from "@/routes/routes";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { BlurView } from "expo-blur";
import {
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
  GlassView,
} from "expo-glass-effect";
import { Text, useTheme } from "@rneui/themed";
import { router, usePathname } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import type { RefObject } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AddDeviceForm from "./add-device-form";
import AddRoomForm from "./add-room-form";
import ChoiceRow from "./choice-row";
import KeyboardBottomSheet from "./keyboard-bottom-sheet";

const bottomNavItems = [
  { name: "home", label: "Home", path: "/home" },
  { name: "devices", label: "Devices", path: "/devices" },
  { name: "create", label: "Add", path: "/create" },
  {
    name: "activity",
    label: "Activity",
    path: "/activity",
  },
  { name: "settings", label: "Settings", path: "/settings" },
] as const;

const BottomNavigation = ({
  blurTarget,
}: {
  blurTarget: RefObject<View | null>;
}) => {
  const { theme } = useTheme();
  const houseId = useHouseId();
  const { width: windowWidth, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [activeSheet, setActiveSheet] = useState<
    "menu" | "room" | "device" | null
  >(null);
  const { reduceTransparency, highContrast } = useAccessibilityPreferences();
  const pathname = usePathname();

  const bottomNavIslandWidth = Math.min(windowWidth - 24, 520);
  const bottomOffset = Math.max(insets.bottom, 12);
  const useNativeGlass =
    Platform.OS === "ios" &&
    isGlassEffectAPIAvailable() &&
    isLiquidGlassAvailable() &&
    !reduceTransparency &&
    !highContrast;
  const useBlur =
    !highContrast &&
    ((Platform.OS === "ios" && !reduceTransparency && !useNativeGlass) ||
      Platform.OS === "android");
  const hasTranslucentMaterial = useNativeGlass || useBlur;

  const renderIcon = (
    name: (typeof bottomNavItems)[number]["name"],
    color: string,
  ) => {
    switch (name) {
      case "home":
        return <MaterialIcons name="home-filled" size={22} color={color} />;
      case "devices":
        return (
          <MaterialCommunityIcons name="devices" size={22} color={color} />
        );
      case "create":
        return (
          <MaterialIcons
            name="add"
            size={28}
            color={theme.mode === "dark" ? "#10201A" : "#FFFFFF"}
          />
        );
      case "activity":
        return <MaterialIcons name="notifications" size={22} color={color} />;
      case "settings":
        return <MaterialIcons name="settings" size={22} color={color} />;
    }
  };

  return (
    <>
      <View
        style={[
          styles.bar,
          {
            bottom: bottomOffset,
            minHeight: Math.max(76, 52 + 24 * fontScale),
            width: bottomNavIslandWidth,
            backgroundColor: hasTranslucentMaterial
              ? "transparent"
              : theme.colors.secondary,
            borderColor: highContrast
              ? theme.colors.grey2
              : theme.colors.greyOutline,
          },
        ]}
      >
        {useNativeGlass && (
          <GlassView
            pointerEvents="none"
            glassEffectStyle="regular"
            colorScheme={theme.mode === "dark" ? "dark" : "light"}
            isInteractive
            style={styles.materialLayer}
          />
        )}
        {useBlur && (
          <BlurView
            pointerEvents="none"
            blurTarget={blurTarget}
            blurMethod="dimezisBlurViewSdk31Plus"
            blurReductionFactor={2}
            intensity={76}
            tint={theme.mode === "dark" ? "dark" : "light"}
            style={styles.materialLayer}
          />
        )}
        {bottomNavItems.map((navItem) => {
          const isCurrent = pathname === navItem.path;
          const isCreate = navItem.path === "/create";
          const isSelected =
            isCurrent ||
            (navItem.path === "/devices" && pathname.startsWith("/room"));
          const iconColor = isSelected
            ? theme.colors.success
            : theme.colors.grey2;

          return (
            <TouchableOpacity
              key={navItem.label}
              accessibilityRole={isCreate ? "button" : "tab"}
              accessibilityLabel={navItem.label}
              accessibilityState={
                isCreate ? undefined : { selected: isSelected }
              }
              activeOpacity={0.7}
              onPress={
                isCurrent || isCreate
                  ? isCreate
                    ? () => {
                        setActiveSheet("menu");
                      }
                    : undefined
                  : () => router.replace(getTypedRoute(navItem.path))
              }
              style={[
                styles.item,
                { minHeight: Math.max(68, 44 + 24 * fontScale) },
              ]}
            >
              <View
                style={[
                  styles.iconContainer,
                  isSelected && {
                    borderRadius: 999,
                    backgroundColor:
                      theme.mode === "dark"
                        ? "rgba(104, 212, 181, 0.14)"
                        : "rgba(18, 107, 91, 0.10)",
                  },
                  isCreate && [
                    styles.createButton,
                    { backgroundColor: theme.colors.success },
                  ],
                ]}
              >
                {renderIcon(navItem.name, iconColor)}
              </View>
              <Text
                style={[
                  styles.label,
                  {
                    color: isSelected
                      ? theme.colors.success
                      : theme.colors.grey2,
                  },
                  isSelected && styles.selectedLabel,
                ]}
              >
                {navItem.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <KeyboardBottomSheet
        title={
          activeSheet === "room"
            ? "Add room"
            : activeSheet === "device"
              ? "Add device"
              : "Add to your house"
        }
        isVisible={activeSheet !== null}
        accessibilityLabel="Close add menu or form"
        onClose={() => setActiveSheet(null)}
      >
        {activeSheet === "menu" ? (
          <View
            style={{
              backgroundColor: theme.colors.secondary,
              padding: 20,
              gap: 16,
            }}
          >
            <ChoiceRow
              title="Room"
              detail="Group devices by where they are."
              icon="grid"
              onPress={() => setActiveSheet("room")}
            />
            <ChoiceRow
              title="Device"
              detail="Connect a device to a room and controller."
              icon="power"
              onPress={() => setActiveSheet("device")}
            />
            <ChoiceRow
              title="Controller"
              detail="Connect another Raspberry Pi."
              icon="cpu"
              onPress={() => {
                setActiveSheet(null);
                router.push({
                  pathname: "/house-login",
                  params: { houseId: houseId ?? "" },
                });
              }}
            />
          </View>
        ) : activeSheet === "room" ? (
          <AddRoomForm closeForm={() => setActiveSheet(null)} />
        ) : activeSheet === "device" ? (
          <AddDeviceForm
            closeForm={() => setActiveSheet(null)}
            onAddRoom={() => setActiveSheet("room")}
          />
        ) : null}
      </KeyboardBottomSheet>
    </>
  );
};

const styles = StyleSheet.create({
  bar: {
    alignSelf: "center",
    position: "absolute",
    zIndex: 999,
    minHeight: 76,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderRadius: 999,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  materialLayer: {
    ...StyleSheet.absoluteFill,
    borderRadius: 999,
    overflow: "hidden",
  },
  item: {
    flex: 1,
    minWidth: 0,
    minHeight: 68,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  iconContainer: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  createButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: "Lexend_400Regular",
  },
  selectedLabel: {
    fontFamily: "Lexend_600SemiBold",
  },
});

export default BottomNavigation;
