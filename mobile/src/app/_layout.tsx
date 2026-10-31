import { ClerkLoaded, ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { Lexend_100Thin } from "@expo-google-fonts/lexend/100Thin";
import { Lexend_200ExtraLight } from "@expo-google-fonts/lexend/200ExtraLight";
import { Lexend_300Light } from "@expo-google-fonts/lexend/300Light";
import { Lexend_400Regular } from "@expo-google-fonts/lexend/400Regular";
import { Lexend_500Medium } from "@expo-google-fonts/lexend/500Medium";
import { Lexend_600SemiBold } from "@expo-google-fonts/lexend/600SemiBold";
import { Lexend_700Bold } from "@expo-google-fonts/lexend/700Bold";
import { Lexend_800ExtraBold } from "@expo-google-fonts/lexend/800ExtraBold";
import { Lexend_900Black } from "@expo-google-fonts/lexend/900Black";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";

import AuthProvider from "@/providers/auth-provider";
import SplashProvider from "@/providers/splash-provider";
import { ThemePreferenceProvider } from "@/providers/theme-preference-provider";
import { createTheme, ThemeProvider } from "@rneui/themed";
import { Stack } from "expo-router";
import React from "react";
import { useColorScheme } from "react-native";
import { Colors } from "@/constants/theme";
import { SafeAreaProvider } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function TabLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

  if (!publishableKey) {
    throw new Error(
      "CLERK :: Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in .env",
    );
  }

  return (
    <SafeAreaProvider>
      <ThemePreferenceProvider>
        <AppLayout publishableKey={publishableKey} />
      </ThemePreferenceProvider>
    </SafeAreaProvider>
  );
}

function AppLayout({ publishableKey }: { publishableKey: string }) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const palette = Colors[colorScheme];
  const theme = createTheme({
    mode: colorScheme,
    lightColors: {
      primary: Colors.light.background,
      background: Colors.light.background,
      secondary: Colors.light.backgroundElement,
      success: Colors.light.accent,
      warning: Colors.light.warning,
      error: Colors.light.error,
      black: Colors.light.text,
      grey0: Colors.light.text,
      grey1: "#34433D",
      grey2: Colors.light.textSecondary,
      grey3: "#728078",
      grey4: "#A2AEA8",
      grey5: Colors.light.backgroundSelected,
      greyOutline: Colors.light.border,
      divider: Colors.light.border,
      disabled: "#AAB5B0",
    },
    darkColors: {
      primary: Colors.dark.background,
      background: Colors.dark.background,
      secondary: Colors.dark.backgroundElement,
      success: Colors.dark.accent,
      warning: Colors.dark.warning,
      error: Colors.dark.error,
      black: Colors.dark.text,
      grey0: Colors.dark.text,
      grey1: "#D9E2DD",
      grey2: Colors.dark.textSecondary,
      grey3: "#87958E",
      grey4: "#5B6861",
      grey5: Colors.dark.backgroundSelected,
      greyOutline: Colors.dark.border,
      divider: Colors.dark.border,
      disabled: "#64716A",
    },
    components: {
      Text: (_props, currentTheme) => ({
        style: {
          color:
            currentTheme.mode === "dark"
              ? Colors.dark.text
              : Colors.light.text,
        },
      }),
      Button: (props, currentTheme) => {
        const buttonColor = props.color ?? "success";
        const resolvedButtonColor =
          buttonColor === "primary" ? "success" : buttonColor;
        const isSolid = props.type !== "clear" && props.type !== "outline";
        const buttonTint =
          resolvedButtonColor === "error"
            ? currentTheme.colors.error
            : resolvedButtonColor === "warning"
              ? currentTheme.colors.warning
              : resolvedButtonColor === "secondary"
                ? currentTheme.colors.secondary
                : currentTheme.colors.success;
        return {
          color: resolvedButtonColor,
          buttonStyle: {
            borderRadius: 14,
            minHeight: 48,
            paddingHorizontal: 18,
            ...(props.type === "outline"
              ? { borderColor: buttonTint }
              : undefined),
          },
          titleStyle: {
            fontFamily: "Lexend_600SemiBold",
            fontSize: 15,
            color:
              isSolid
                ? currentTheme.mode === "dark"
                  ? "#10201A"
                  : "#FFFFFF"
                : buttonTint,
          },
        };
      },
    },
  });

  const [isFontsLoaded] = useFonts({
    Lexend_100Thin,
    Lexend_200ExtraLight,
    Lexend_300Light,
    Lexend_400Regular,
    Lexend_500Medium,
    Lexend_600SemiBold,
    Lexend_700Bold,
    Lexend_800ExtraBold,
    Lexend_900Black,
  });

  return (
    <ThemeProvider theme={theme}>
      <ExpoStatusBar
        style={colorScheme === "dark" ? "light" : "dark"}
        animated
        hidden={false}
      />
      <QueryClientProvider client={queryClient}>
        <ClerkProvider
          publishableKey={publishableKey}
          tokenCache={tokenCache}
        >
          <SplashProvider isFontsLoaded={isFontsLoaded}>
            <ClerkLoaded>
              <AuthProvider>
                <Stack>
                  <Stack.Screen
                    name="(tabs)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="auth"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="house-login"
                    options={{
                      title: "AutoPi Hub Configuration",
                      headerShown: true,
                      headerTitleStyle: {
                        color: palette.text,
                      },
                      headerStyle: {
                        backgroundColor: palette.background,
                      },
                    }}
                  />
                </Stack>
              </AuthProvider>
            </ClerkLoaded>
          </SplashProvider>
        </ClerkProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
