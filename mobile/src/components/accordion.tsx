import Feather from "@expo/vector-icons/Feather";
import { Text, useTheme } from "@rneui/themed";
import { ComponentProps, PropsWithChildren } from "react";
import { Pressable, View } from "react-native";

/** A persistent section heading makes collapsed features easy to discover. */
export default function Accordion({
  title,
  summary,
  icon,
  expanded,
  onToggle,
  disabled = false,
  children,
}: PropsWithChildren<{
  title: string;
  summary?: string;
  icon: ComponentProps<typeof Feather>["name"];
  expanded: boolean;
  onToggle: () => void;
  disabled?: boolean;
}>) {
  const { theme } = useTheme();
  return (
    <View style={{ gap: 12 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded, disabled }}
        disabled={disabled}
        onPress={onToggle}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          minHeight: 72,
          padding: 18,
          borderWidth: 1,
          borderRadius: 18,
          borderColor: theme.colors.greyOutline,
          backgroundColor: pressed
            ? theme.colors.grey5
            : theme.colors.secondary,
        })}
      >
        <Feather name={icon} size={22} color={theme.colors.success} />
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={{ fontSize: 16, fontFamily: "Lexend_600SemiBold" }}>
            {title}
          </Text>
          {!!summary && (
            <Text
              style={{
                color: theme.colors.grey2,
                fontSize: 13,
                lineHeight: 20,
              }}
            >
              {summary}
            </Text>
          )}
        </View>
        <Feather
          name={expanded ? "chevron-down" : "chevron-right"}
          size={22}
          color={theme.colors.grey2}
        />
      </Pressable>
      {expanded && <View style={{ gap: 14 }}>{children}</View>}
    </View>
  );
}
