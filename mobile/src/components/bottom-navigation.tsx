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
import React, { useEffect, useState } from "react";
import {
  AccessibilityInfo,
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
import KeyboardBottomSheet from "./keyboard-bottom-sheet";

const bottomNavItems = [
  { name: "home", label: "Home", path: "/home" },
  { name: "devices", label: "Devices", path: "/devices" },
  { name: "create", label: "Create", path: "/create" },
  {
    name: "notifications",
    label: "Activity",
    path: "/notifications",
  },
  { name: "settings", label: "Settings", path: "/settings" },
] as const;

const BottomNavigation = ({
  blurTarget,
}: {
  blurTarget: RefObject<View | null>;
}) => {
  const { theme } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [isAddRoomFormOpen, setIsAddRoomFormOpen] = useState(false);
  const [isAddDeviceFormOpen, setIsAddDeviceFormOpen] = useState(false);
  const [isReduceTransparencyEnabled, setIsReduceTransparencyEnabled] =
    useState(true);
  const pathname = usePathname();

  useEffect(() => {
    if (Platform.OS !== "ios") return;

    let isActive = true;
    void AccessibilityInfo.isReduceTransparencyEnabled()
      .then((isEnabled) => {
        if (isActive) setIsReduceTransparencyEnabled(isEnabled);
      })
      .catch(() => {
        if (isActive) setIsReduceTransparencyEnabled(true);
      });

    const subscription = AccessibilityInfo.addEventListener(
      "reduceTransparencyChanged",
      setIsReduceTransparencyEnabled,
    );

    return () => {
      isActive = false;
      subscription.remove();
    };
  }, []);

  const bottomNavIslandWidth = Math.min(windowWidth - 24, 520);
  const bottomOffset = Math.max(insets.bottom, 12);
  const useNativeGlass =
    Platform.OS === "ios" &&
    isGlassEffectAPIAvailable() &&
    isLiquidGlassAvailable() &&
    !isReduceTransparencyEnabled;
  const useAndroidBlur = Platform.OS === "android";
  const hasTranslucentMaterial = useNativeGlass || useAndroidBlur;

  const renderIcon = (name: (typeof bottomNavItems)[number]["name"], color: string) => {
    switch (name) {
      case "home":
        return <MaterialIcons name="home-filled" size={22} color={color} />;
      case "devices":
        return <MaterialCommunityIcons name="devices" size={22} color={color} />;
      case "create":
        return (
          <MaterialIcons
            name="add"
            size={28}
            color={theme.mode === "dark" ? "#10201A" : "#FFFFFF"}
          />
        );
      case "notifications":
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
            width: bottomNavIslandWidth,
            backgroundColor: hasTranslucentMaterial
              ? "transparent"
              : theme.colors.secondary,
            borderColor: theme.colors.grey5,
          },
        ]}
      >
        {useNativeGlass && (
          <GlassView
            pointerEvents="none"
            glassEffectStyle="regular"
            isInteractive
            style={styles.materialLayer}
          />
        )}
        {useAndroidBlur && (
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
                        if (pathname === "/home") {
                          setIsAddRoomFormOpen(true);
                        } else if (
                          pathname === "/devices" ||
                          pathname.startsWith("/room") ||
                          pathname === "/notifications"
                        ) {
                          setIsAddDeviceFormOpen(true);
                        }
                      }
                    : undefined
                  : () => router.replace(getTypedRoute(navItem.path))
              }
              style={styles.item}
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
                numberOfLines={1}
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
        isVisible={isAddRoomFormOpen}
        accessibilityLabel="Close add room form"
        onClose={() => setIsAddRoomFormOpen(false)}
      >
        <AddRoomForm closeForm={() => setIsAddRoomFormOpen(false)} />
      </KeyboardBottomSheet>
      <KeyboardBottomSheet
        isVisible={isAddDeviceFormOpen}
        accessibilityLabel="Close add device form"
        onClose={() => setIsAddDeviceFormOpen(false)}
      >
        <AddDeviceForm closeForm={() => setIsAddDeviceFormOpen(false)} />
      </KeyboardBottomSheet>
    </>
  );
};

const styles = StyleSheet.create({
  bar: {
    alignSelf: "center",
    position: "absolute",
    zIndex: 999,
    height: 76,
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
    height: 68,
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
