import useAccessibilityPreferences from "@/hooks/use-accessibility-preferences";
import Feather from "@expo/vector-icons/Feather";
import { Button, Text, useTheme } from "@rneui/themed";
import { useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LoadingSkeleton from "./loading-skeleton";

/** A compact field with a full-size choice list, including on iOS. */
export default function Select<T>({
  label,
  field,
  selectedValue,
  onValueChange,
  items,
  isLoading,
  disabled = false,
}: {
  label: string;
  field: string;
  selectedValue: T;
  onValueChange: (itemValue: any, itemIndex: number) => void;
  items: T[];
  isLoading?: boolean;
  disabled?: boolean;
}) {
  const { theme } = useTheme();
  const { reduceMotion } = useAccessibilityPreferences();
  const [open, setOpen] = useState(false);
  const display = (item: T) =>
    String((item as Record<string, unknown>)?.[field] ?? "");
  const identity = (item: T) =>
    (item as Record<string, unknown>)?.id ?? display(item);
  const selected = items.find(
    (item) => identity(item) === identity(selectedValue),
  );
  return (
    <View style={{ width: "100%", gap: 7 }}>
      {!!label && (
        <Text
          style={{
            color: theme.colors.grey2,
            fontSize: 14,
            fontFamily: "Lexend_500Medium",
            marginLeft: 4,
          }}
        >
          {label}
        </Text>
      )}
      <Pressable
        disabled={disabled || isLoading || !items.length}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected ? display(selected) : "No options available"}`}
        accessibilityState={{
          disabled: disabled || isLoading || !items.length,
          expanded: open,
        }}
        style={({ pressed }) => ({
          minHeight: 52,
          padding: 14,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: pressed
            ? theme.colors.success
            : theme.colors.greyOutline,
          backgroundColor: theme.colors.secondary,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        })}
      >
        {isLoading ? (
          <LoadingSkeleton height={22} width="58%" />
        ) : (
          <>
            <Text
              style={{
                flex: 1,
                color: selected ? theme.colors.black : theme.colors.grey2,
                fontSize: 16,
              }}
            >
              {selected
                ? display(selected)
                : items.length
                  ? "Choose an option"
                  : "No options available"}
            </Text>
            <Feather name="chevron-down" size={20} color={theme.colors.grey2} />
          </>
        )}
      </Pressable>
      <Modal
        visible={open}
        animationType={reduceMotion ? "none" : "fade"}
        onRequestClose={() => setOpen(false)}
      >
        <SafeAreaView
          style={{ flex: 1, backgroundColor: theme.colors.primary }}
        >
          <View
            accessibilityViewIsModal
            style={{
              flex: 1,
              padding: 20,
              width: "100%",
              maxWidth: 640,
              alignSelf: "center",
              gap: 16,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <Text
                accessibilityRole="header"
                style={{
                  flex: 1,
                  fontSize: 22,
                  fontFamily: "Lexend_600SemiBold",
                }}
              >
                {label || "Choose an option"}
              </Text>
              <Button type="clear" onPress={() => setOpen(false)}>
                Cancel
              </Button>
            </View>
            <ScrollView contentContainerStyle={{ gap: 8, paddingBottom: 24 }}>
              {items.map((item, index) => (
                <Pressable
                  key={String(identity(item))}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected === item }}
                  onPress={() => {
                    onValueChange(item, index);
                    setOpen(false);
                  }}
                  style={({ pressed }) => ({
                    minHeight: 56,
                    padding: 16,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor:
                      selected === item
                        ? theme.colors.success
                        : theme.colors.greyOutline,
                    backgroundColor: pressed
                      ? theme.colors.grey5
                      : theme.colors.secondary,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  })}
                >
                  <Text style={{ flex: 1, fontSize: 17 }}>{display(item)}</Text>
                  {selected === item && (
                    <Feather
                      name="check"
                      size={22}
                      color={theme.colors.success}
                    />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
