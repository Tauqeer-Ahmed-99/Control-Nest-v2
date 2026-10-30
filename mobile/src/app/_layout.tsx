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

import AuthProvider from "@/providers/auth-provider";
import SplashProvider from "@/providers/splash-provider";
import { createTheme, ThemeProvider } from "@rneui/themed";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

const theme = createTheme({
  lightColors: {
    primary: "#232228",
    secondary: "#3f3e45",
    success: "#6BE7FF",
    warning: "#FFF6B0",
    error: "#FE6CE6",
  },
  darkColors: { primary: "#232228", secondary: "#3f3e45" },
  components: {
    Text: {
      style: {
        color: "#ffffff",
        fontFamily: "Lexend_400Regular",
      },
    },
  },
});

const queryClient = new QueryClient();

export default function TabLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

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

  if (!publishableKey) {
    throw new Error(
      "CLERK :: Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in .env",
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider theme={theme}>
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
                          color:
                            theme.mode === "dark"
                              ? theme.darkColors?.white
                              : theme.lightColors?.grey4,
                        },
                        headerStyle: {
                          backgroundColor:
                            theme.mode === "dark"
                              ? theme.darkColors?.primary
                              : theme.lightColors?.primary,
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
    </SafeAreaProvider>
  );
}
