import useFlowBack from "@/hooks/use-flow-back";
import Feather from "@expo/vector-icons/Feather";
import { Text, useTheme } from "@rneui/themed";
import { PropsWithChildren } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import GlassSurface from "./glass-surface";

/** A focused task with scrolling content beneath a floating navigation bar. */
export default function FlowScreen({
  children,
  title,
  onBack,
  backLabel = "Back",
  busy = false,
}: PropsWithChildren<{
  title: string;
  onBack?: () => void;
  backLabel?: string;
  busy?: boolean;
}>) {
  const { theme } = useTheme();
  useFlowBack(onBack, busy);
  const Toolbar = onBack ? GlassSurface : View;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.primary }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          stickyHeaderIndices={onBack ? [0] : undefined}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          contentContainerStyle={{
            flexGrow: 1,
            padding: 20,
            paddingBottom: 32,
          }}
        >
          <View style={{ width: "100%", maxWidth: 560, alignSelf: "center" }}>
            <Toolbar
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                minHeight: 56,
                borderRadius: 24,
                paddingHorizontal: onBack ? 4 : 0,
              }}
            >
              {onBack && (
                <TouchableOpacity
                  onPress={onBack}
                  disabled={busy}
                  accessibilityRole="button"
                  accessibilityLabel={backLabel}
                  style={{
                    minWidth: 48,
                    minHeight: 48,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather
                    name="arrow-left"
                    size={22}
                    color={theme.colors.black}
                  />
                </TouchableOpacity>
              )}
              <Text
                accessibilityRole="header"
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingRight: 12,
                  fontSize: 17,
                  fontFamily: "Lexend_500Medium",
                }}
              >
                {title}
              </Text>
            </Toolbar>
          </View>
          <View
            style={{
              width: "100%",
              maxWidth: 560,
              alignSelf: "center",
              gap: 24,
              paddingTop: 24,
            }}
          >
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function FlowHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const { theme } = useTheme();
  return (
    <View style={{ gap: 10 }}>
      <Text
        accessibilityRole="header"
        style={{
          fontSize: 28,
          lineHeight: 36,
          letterSpacing: -0.6,
          fontFamily: "Lexend_600SemiBold",
        }}
      >
        {title}
      </Text>
      <Text style={{ color: theme.colors.grey2, fontSize: 16, lineHeight: 24 }}>
        {description}
      </Text>
    </View>
  );
}
