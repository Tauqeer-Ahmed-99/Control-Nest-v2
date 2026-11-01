import Feather from "@expo/vector-icons/Feather";
import { Text, useTheme } from "@rneui/themed";
import { Pressable, View } from "react-native";

export default function SheetHeader({
  title,
  onClose,
  closeLabel = "Close sheet",
  disabled = false,
}: {
  title: string;
  onClose: () => void;
  closeLabel?: string;
  disabled?: boolean;
}) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
      }}
    >
      <Text
        accessibilityRole="header"
        style={{ flex: 1, fontSize: 22, fontFamily: "Lexend_600SemiBold" }}
      >
        {title}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={closeLabel}
        accessibilityState={{ disabled }}
        onPress={onClose}
        disabled={disabled}
        style={({ pressed }) => ({
          minWidth: 44,
          minHeight: 44,
          justifyContent: "center",
          alignItems: "center",
          opacity: pressed || disabled ? 0.5 : 1,
        })}
      >
        <Feather name="x" size={24} color={theme.colors.grey2} />
      </Pressable>
    </View>
  );
}
