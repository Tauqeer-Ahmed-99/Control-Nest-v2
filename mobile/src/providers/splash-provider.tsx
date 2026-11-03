import AppIcon from "@/assets/icon/icon.png";
import NMTLogo from "@/assets/svgs/nmt-logo.svg";
import useAppEntry from "@/hooks/use-app-entry";
import { Text, useTheme } from "@rneui/themed";
import Constants from "expo-constants";
import { SplashScreen } from "expo-router";
import { PropsWithChildren, useEffect, useState } from "react";
import { Image, StatusBar, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SplashProvider = ({
  isFontsLoaded,
  children,
}: { isFontsLoaded: boolean } & PropsWithChildren) => {
  const { isReady: isEntryReady } = useAppEntry();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { primary } = theme.colors;
  const [dots, setDots] = useState("");
  const [minimumSplashTimeElapsed, setMinimumSplashTimeElapsed] =
    useState(false);
  const version = Constants.expoConfig?.version ?? "1.0.0";
  const isAppReady =
    isFontsLoaded && isEntryReady && minimumSplashTimeElapsed;

  useEffect(() => {
    if (isAppReady) {
      return;
    }

    const interval = setInterval(() => {
      setDots((currDots) => (currDots.length < 3 ? `${currDots}.` : ""));
    }, 1000);

    return () => clearInterval(interval);
  }, [isAppReady]);

  useEffect(() => {
    SplashScreen.hideAsync();
    const timeout = setTimeout(() => setMinimumSplashTimeElapsed(true), 1200);

    return () => clearTimeout(timeout);
  }, []);

  if (!isAppReady) {
    return (
      <View
        style={{
          flex: 1,
          width: "100%",
          backgroundColor: primary,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <StatusBar
          translucent
          barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        />
        <Image
          source={AppIcon}
          resizeMode="contain"
          style={{ width: 144, height: 144 }}
          accessibilityLabel="Control Nest app icon"
        />
        <View
          style={{
            position: "absolute",
            left: 24,
            right: 24,
            bottom: insets.bottom + 20,
            alignItems: "center",
            gap: 6,
          }}
        >
          <Text
            style={{
              color: theme.colors.black,
              fontFamily: "Lexend_600SemiBold",
              fontSize: 22,
              textAlign: "center",
            }}
          >
            Control Nest
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Text
              style={{
                color: theme.colors.grey2,
                fontFamily: "Lexend_400Regular",
                fontSize: 11,
              }}
            >
              A product by
            </Text>
            <NMTLogo height={16} width={16} />
            <Text
              style={{
                color: theme.colors.grey2,
                fontFamily: "Lexend_400Regular",
                fontSize: 11,
              }}
            >
              NMT Solutions
            </Text>
          </View>
          <Text
            style={{
              color: theme.colors.grey2,
              fontFamily: "Lexend_400Regular",
              fontSize: 11,
            }}
          >
            Version {version}
          </Text>
          <Text
            style={{
              color: theme.colors.grey2,
              fontFamily: "Lexend_400Regular",
              fontSize: 11,
            }}
          >
            Initializing {dots}
          </Text>
        </View>
      </View>
    );
  }

  return children;
};

export default SplashProvider;
