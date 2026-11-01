import Feather from "@expo/vector-icons/Feather";
import { Text, useTheme } from "@rneui/themed";
import { ComponentProps } from "react";
import { TouchableOpacity, View } from "react-native";

export default function ChoiceRow({
  title,
  detail,
  icon,
  onPress,
  disabled = false,
  selected = false,
}: {
  title: string;
  detail?: string;
  icon: ComponentProps<typeof Feather>["name"];
  onPress?: () => void;
  disabled?: boolean;
  selected?: boolean;
}) {
  const { theme } = useTheme();
  const content = (
    <>
      <Feather name={icon} size={23} color={theme.colors.success} />
      <View style={{ flex: 1, gap: 5 }}>
        <Text style={{ fontSize: 17, fontFamily: "Lexend_500Medium" }}>
          {title}
        </Text>
        {!!detail && (
          <Text
            style={{ fontSize: 14, lineHeight: 21, color: theme.colors.grey2 }}
          >
            {detail}
          </Text>
        )}
      </View>
      {onPress && (
        <Feather
          name={selected ? "check-circle" : "chevron-right"}
          size={21}
          color={selected ? theme.colors.success : theme.colors.grey2}
        />
      )}
    </>
  );
  const style = {
    padding: 18,
    minHeight: 80,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: selected ? theme.colors.success : theme.colors.greyOutline,
    backgroundColor: theme.colors.secondary,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 14,
  };
  return onPress ? (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      activeOpacity={0.7}
      style={style}
    >
      {content}
    </TouchableOpacity>
  ) : (
    <View style={style}>{content}</View>
  );
}
