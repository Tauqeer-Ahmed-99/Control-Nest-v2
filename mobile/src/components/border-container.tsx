import { useTheme } from "@rneui/themed";
import { LinearGradient } from "expo-linear-gradient";
import { View, ViewStyle } from "react-native";

const BorderContainer = ({
  style,
  children,
  whiteBorder,
  borderWidth,
  whiteBorderWidth,
}: {
  style: ViewStyle;
  children?: React.ReactNode;
  whiteBorder?: boolean;
  borderWidth?: number;
  whiteBorderWidth?: number;
}) => {
  const { theme } = useTheme();

  const borderWidthFactor = (borderWidth ?? 5) * 2;
  const whiteBorderWidthFactor = (whiteBorderWidth ?? 1.5) * 2;

  if (whiteBorder) {
    return (
      <LinearGradient
        dither
        colors={[
          theme.colors.success,
          theme.colors.warning,
          theme.colors.error,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          style,
          {
            justifyContent: "center",
            alignItems: "center",
            height: style.height
              ? (style.height as number) + borderWidthFactor
              : undefined,
            width: style.width
              ? (style.width as number) + borderWidthFactor
              : undefined,
            borderRadius: style.borderRadius
              ? (style.borderRadius as number) + borderWidthFactor / 2
              : undefined,
          },
        ]}
      >
        <View
          style={[
            {
              ...style,
              position: undefined,
              top: undefined,
              bottom: undefined,
              left: undefined,
              right: undefined,
            },
            {
              justifyContent: "center",
              alignItems: "center",
              height: style.height
                ? (style.height as number) + whiteBorderWidthFactor
                : undefined,
              width: style.width
                ? (style.width as number) + whiteBorderWidthFactor
                : undefined,
              backgroundColor: theme.colors.white,
              borderRadius: style.borderRadius
                ? (style.borderRadius as number) + whiteBorderWidthFactor / 2
                : undefined,
            },
          ]}
        >
          <View
            style={{
              ...style,
              backgroundColor: theme.colors.secondary,
              borderRadius: style.borderRadius,
              position: undefined,
              top: undefined,
              bottom: undefined,
              left: undefined,
              right: undefined,
            }}
          >
            {children}
          </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      dither
      colors={[theme.colors.success, theme.colors.warning, theme.colors.error]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        style,
        {
          justifyContent: "center",
          alignItems: "center",
          height: style.height
            ? (style.height as number) + borderWidthFactor
            : undefined,
          width: style.width
            ? (style.width as number) + borderWidthFactor
            : undefined,
          borderRadius: style.borderRadius
            ? (style.borderRadius as number) + borderWidthFactor / 2
            : undefined,
        },
      ]}
    >
      <View
        style={{
          ...style,
          backgroundColor: theme.colors.secondary,
          borderRadius: style.borderRadius,
          position: undefined,
          top: undefined,
          bottom: undefined,
          left: undefined,
          right: undefined,
        }}
      >
        {children}
      </View>
    </LinearGradient>
  );
};

export default BorderContainer;
