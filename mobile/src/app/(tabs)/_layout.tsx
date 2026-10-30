import BottomNavigation from "@/components/bottom-navigation";
import { useTheme } from "@rneui/themed";
import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";

const TabsLayout = () => {
  const { theme } = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Stack>
          <Stack.Screen
            name="home"
            options={{
              headerShown: true,
              headerTintColor: "#ffffff",
              headerTitle: "Home",
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
            name="devices"
            options={{
              headerShown: true,
              headerTintColor: "#ffffff",
              headerTitle: "Devices",
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
          <Stack.Screen
            name="notifications"
            options={{
              headerShown: true,
              headerTintColor: "#ffffff",
              headerTitle: "Notifications",
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
          <Stack.Screen
            name="settings"
            options={{
              headerShown: true,
              headerTintColor: "#ffffff",
              headerTitle: "Settings",
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
          <Stack.Screen
            name="house-members"
            options={{
              headerShown: true,
              headerTintColor: theme.colors.white,
              headerTitle: "House members",
              headerTitleAlign: "center",
              headerShadowVisible: false,
              headerTitleStyle: {
                color: theme.colors.white,
                fontFamily: "Lexend_500Medium",
              },
              headerStyle: {
                backgroundColor: theme.colors.primary,
              },
              statusBarTranslucent: true,
            }}
          />

          <Stack.Screen
            name="room"
            options={{
              headerShown: false,
              headerTintColor: "#ffffff",
              headerTitle: "Room",
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
          <Stack.Screen
            name="rooms"
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
