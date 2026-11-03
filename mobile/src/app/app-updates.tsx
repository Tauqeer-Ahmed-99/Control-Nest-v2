import { ScrollView } from "react-native";
import { Stack } from "expo-router";
import { useTheme } from "@rneui/themed";
import AppUpdatePanel from "@/components/app-update-panel";
export default function AppUpdates() {
  const { theme } = useTheme();
  return (
    <>
      <Stack.Screen options={{ title: "App updates" }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.colors.primary }}
        contentContainerStyle={{ padding: 24, paddingBottom: 70 }}
      >
        <AppUpdatePanel />
      </ScrollView>
    </>
  );
}
