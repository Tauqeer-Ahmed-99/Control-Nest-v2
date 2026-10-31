import BottomNavigation from "@/components/bottom-navigation";
import { BlurTargetView } from "expo-blur";
import { useTheme } from "@rneui/themed";
import { Stack } from "expo-router";
import { useRef } from "react";
import { StyleSheet, View } from "react-native";

const TabsLayout = () => {
  const { theme } = useTheme();
  const styles = useStyles();
  const blurTarget = useRef<View | null>(null);

  return (
    <View style={styles.container}>
      <BlurTargetView ref={blurTarget} style={styles.content}>
        <Stack>
          <Stack.Screen
            name="home"
            options={{
              headerShown: true,
              headerTintColor: theme.colors.black,
              headerTitle: "Home",
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
          <Stack.Screen
            name="devices"
            options={{
              headerShown: true,
              headerTintColor: theme.colors.black,
              headerTitle: "Devices",
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
          <Stack.Screen
            name="activity"
            options={{
              headerShown: true,
              headerTintColor: theme.colors.black,
              headerTitle: "Activity Center",
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
          <Stack.Screen
            name="settings"
            options={{
              headerShown: true,
              headerTintColor: theme.colors.black,
              headerTitle: "Settings",
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
          <Stack.Screen
            name="house-members"
            options={{
              headerShown: true,
              headerTintColor: theme.colors.black,
              headerTitle: "House members",
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

          <Stack.Screen
            name="room"
            options={{
              headerShown: false,
              headerTintColor: theme.colors.black,
              headerTitle: "Room",
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
          <Stack.Screen
            name="rooms"
            options={{
              headerShown: true,
              headerTintColor: theme.colors.black,
              headerTitle: "Rooms",
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
        </Stack>
      </BlurTargetView>

      <BottomNavigation blurTarget={blurTarget} />
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
