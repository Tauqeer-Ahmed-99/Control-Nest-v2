import { useTheme } from "@rneui/themed";
import { useWindowDimensions, View } from "react-native";
import { Text } from "@rneui/themed";
import Switch from "./switch";

function Card<T>({
  item,
  render,
  value,
  onChange,
}: {
  item: T;
  render: (item: T) => React.ReactNode;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();

  const cardWidth = (width - 52) / 2;

  return (
    <View
      style={{
        height: 188,
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
            color: theme.colors.grey2,
            fontSize: 13,
            fontFamily: "Lexend_500Medium",
          }}
        >
          Power
        </Text>
        <Switch value={value} onChange={onChange} />
      </View>
    </View>
  );
}

export default Card;
