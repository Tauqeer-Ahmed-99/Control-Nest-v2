import { Stack } from "expo-router";

const DeviceLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerTintColor: "#ffffff",
        headerTitleAlign: "center",
        headerShadowVisible: false,
        headerTitleStyle: {
          color: "#fff",
          fontFamily: "Lexend_500Medium",
        },
        headerStyle: {
          backgroundColor: "#232228",
        },
        statusBarTranslucent: true,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="control-logs"
        options={{
          // headerShown: false,
          headerTitle: "Control Logs",
        }}
      />
    </Stack>
  );
};

export default DeviceLayout;
