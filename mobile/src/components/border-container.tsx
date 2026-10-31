import { useTheme } from "@rneui/themed";
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

  if (whiteBorder) {
    const ringWidth = Math.max(2, whiteBorderWidth ?? 1.5);
    const innerStyle: ViewStyle = {
      width: style.width,
      height: style.height,
      borderRadius: style.borderRadius,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
    };

    return (
      <View
        style={[
          style,
          {
            width:
              typeof style.width === "number"
                ? style.width + ringWidth * 2
                : style.width,
            height:
              typeof style.height === "number"
                ? style.height + ringWidth * 2
                : style.height,
            borderRadius:
              typeof style.borderRadius === "number"
                ? style.borderRadius + ringWidth
                : style.borderRadius,
            borderWidth: ringWidth,
            borderColor: theme.colors.success,
            backgroundColor: theme.colors.secondary,
            alignItems: "center",
            justifyContent: "center",
          },
        ]}
      >
        <View style={innerStyle}>{children}</View>
      </View>
    );
  }

  return (
    <View
      style={[
        style,
        {
          borderWidth: borderWidth ? Math.max(1, borderWidth / 2) : 1,
          borderColor: theme.colors.grey5,
          backgroundColor: theme.colors.secondary,
          overflow: "hidden",
        },
      ]}
    >
      {children}
    </View>
  );
};

export default BorderContainer;
