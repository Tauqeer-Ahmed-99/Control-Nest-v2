import BottomNavigation from "@/components/bottom-navigation";
import { useTheme } from "@rneui/themed";
import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";

const TabsLayout = () => {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Stack>
          <Stack.Screen
            name="[roomId]"
            options={{
              headerShown: true,
              headerTintColor: "#ffffff",
              headerTitle: "Rooms",
              headerTitleAlign: "center",
              headerShadowVisible: false,
              headerTitleStyle: {
                color: "#fff",
                fontFamily: "Lexend_500Medium",
              },
              headerStyle: {
                backgroundColor: "#3f3e45",
              },
              statusBarTranslucent: true,
            }}
          />
          <Stack.Screen
            name="[roomId]/[deviceId]"
            options={{
              headerShown: true,
              headerTintColor: "#ffffff",
              headerTitle: "Device Details",
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
          />
        </Stack>
      </View>
      <BottomNavigation />
    </View>
  );
};

export default TabsLayout;

const useStyles = () => {
  const { theme } = useTheme();

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.primary,
    },
    content: {
      flex: 1,
      backgroundColor: theme.colors.primary,
    },
  });
};
