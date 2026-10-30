import { useTheme } from "@rneui/themed";
import { useWindowDimensions, View } from "react-native";
import Switch from "./switch";

const GAP = 30;
const PADDING_HORIZONTAL = 12 * 2;

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

  const cardWidth = (width - GAP - PADDING_HORIZONTAL) / 2;

  return (
    <View
      style={{
        height: 200,
        width: cardWidth,
        backgroundColor: theme.colors.secondary,
        borderRadius: 12,
        padding: 12,
        position: "relative",
      }}
    >
      {render(item)}
      <View
        style={{
          height: 45,
          width: 80,
          backgroundColor: theme.colors.primary,
          justifyContent: "center",
          alignItems: "center",
          borderRadius: 20,
          position: "absolute",
          left: "50%",
          bottom: -20,
          transform: [{ translateX: -28.5 }],
        }}
      >
        <Switch value={value} onChange={onChange} />
      </View>
    </View>
  );
}

export default Card;
