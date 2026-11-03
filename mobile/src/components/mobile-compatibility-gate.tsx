import { PropsWithChildren } from "react";
import { ScrollView, View } from "react-native";
import { Button, useTheme } from "@rneui/themed";
import { router, usePathname } from "expo-router";
import AppUpdatePanel, { useMobileCompatibility } from "./app-update-panel";

export default function MobileCompatibilityGate({
  children,
}: PropsWithChildren) {
  const { required } = useMobileCompatibility();
  const pathname = usePathname();
  const { theme } = useTheme();
  const exempt = [
    "/auth",
    "/house-login",
    "/house-members",
    "/firmware-updates",
    "/settings",
    "/app-updates",
  ].some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const blocked = required && !exempt;
  return (
    <View style={{ flex: 1 }}>
      <View
        style={{ flex: 1 }}
        pointerEvents={blocked ? "none" : "auto"}
        importantForAccessibility={blocked ? "no-hide-descendants" : "auto"}
        accessibilityElementsHidden={blocked}
      >
        {children}
      </View>
      {blocked && (
        <ScrollView
          accessibilityViewIsModal
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: theme.colors.primary,
          }}
          contentContainerStyle={{ padding: 24, paddingTop: 70, gap: 20 }}
        >
          <AppUpdatePanel />
          <Button
            type="clear"
            onPress={() => router.push("/(tabs)/firmware-updates")}
          >
            Controller updates and recovery
          </Button>
          <Button type="clear" onPress={() => router.push("/(tabs)/settings")}>
            Settings
          </Button>
        </ScrollView>
      )}
    </View>
  );
}
