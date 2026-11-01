import { Text, useTheme } from "@rneui/themed";
import { useWindowDimensions, View } from "react-native";
import Switch from "./switch";

function Card<T>({
  item,
  render,
  value,
  onChange,
  powerEnabled = true,
}: {
  item: T;
  render: (item: T) => React.ReactNode;
  value: boolean;
  onChange: (value: boolean) => void;
  powerEnabled?: boolean;
}) {
  const { theme } = useTheme();
  const { width, fontScale } = useWindowDimensions();

  const singleColumn = width < 360 || fontScale > 1.2;
  const cardWidth = singleColumn ? width - 36 : (width - 52) / 2;

  return (
    <View
      style={{
        minHeight: 188,
        height: 188 * Math.max(1, fontScale),
        width: cardWidth,
        backgroundColor: theme.colors.secondary,
        borderColor: theme.colors.grey5,
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingTop: 14,
        paddingBottom: 9,
      }}
    >
      <View style={{ flex: 1, paddingBottom: 12 }}>{render(item)}</View>
      <View
        style={{
          height: 48,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderTopWidth: 1,
          borderTopColor: theme.colors.grey5,
        }}
      >
        <Text
          style={{
            color: powerEnabled ? theme.colors.grey2 : theme.colors.warning,
            fontSize: 13,
            fontFamily: "Lexend_500Medium",
          }}
        >
          {powerEnabled ? "Power" : "No device"}
        </Text>
        <Switch
          value={value}
          onChange={onChange}
          disabled={!powerEnabled}
          accessibilityLabel={
            powerEnabled ? "Power" : "Power unavailable, no device added"
          }
        />
      </View>
    </View>
  );
}

export default Card;
