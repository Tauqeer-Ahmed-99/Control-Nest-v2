import { ScrollView } from "react-native";
import { Stack } from "expo-router";
import { useTheme } from "@rneui/themed";
import AppUpdatePanel from "@/components/app-update-panel";
export default function AppUpdates() {
  const { theme } = useTheme();
  return (
    <>
      <Stack.Screen
        options={{
          title: "App updates",
          headerShown: true,
          headerTintColor: theme.colors.black,
          headerTitleAlign: "center",
          headerShadowVisible: false,
          headerTitleStyle: {
            color: theme.colors.black,
            fontFamily: "Lexend_600SemiBold",
            fontSize: 17,
          },
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          statusBarTranslucent: true,
        }}
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.colors.primary }}
        contentContainerStyle={{ padding: 24, paddingBottom: 70 }}
      >
        <AppUpdatePanel />
      </ScrollView>
    </>
  );
}
