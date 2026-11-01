import useAccessibilityPreferences from "@/hooks/use-accessibility-preferences";
import { useTheme } from "@rneui/themed";
import { BlurView } from "expo-blur";
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from "expo-glass-effect";
import { Platform, StyleSheet, View, ViewProps } from "react-native";

/** Use only for floating navigation and controls, keeping content surfaces quiet. */
export default function GlassSurface({ children, style, ...props }: ViewProps) {
  const { theme } = useTheme();
  const { reduceTransparency, highContrast } = useAccessibilityPreferences();
  const translucent =
    Platform.OS === "ios" && !reduceTransparency && !highContrast;
  const nativeGlass =
    translucent && isGlassEffectAPIAvailable() && isLiquidGlassAvailable();
  return (
    <View
      {...props}
      style={[
        {
          overflow: "hidden",
          borderWidth: 1,
          borderColor: highContrast
            ? theme.colors.grey2
            : theme.colors.greyOutline,
          backgroundColor: translucent ? "transparent" : theme.colors.secondary,
        },
        style,
      ]}
    >
      {nativeGlass ? (
        <GlassView
          pointerEvents="none"
          glassEffectStyle="regular"
          colorScheme={theme.mode === "dark" ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
      ) : translucent ? (
        <BlurView
          pointerEvents="none"
          intensity={70}
          tint={
            theme.mode === "dark" ? "systemMaterialDark" : "systemMaterialLight"
          }
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {children}
    </View>
  );
}
