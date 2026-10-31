import { useTheme } from "@rneui/themed";
import { Stack } from "expo-router";

const DeviceLayout = () => {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
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
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          headerTitle: "Device Details",
        }}
      />
      <Stack.Screen
        name="control-logs"
        options={{
          headerShown: true,
          headerTitle: "Control Logs",
        }}
      />
    </Stack>
  );
};

export default DeviceLayout;
