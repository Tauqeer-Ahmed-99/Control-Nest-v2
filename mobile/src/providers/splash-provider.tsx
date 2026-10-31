import NMTLogo from "@/assets/svgs/nmt-logo.svg";
import { useAuth } from "@clerk/expo";
import { Text, useTheme } from "@rneui/themed";
import { SplashScreen } from "expo-router";
import { PropsWithChildren, useEffect, useState } from "react";
import { StatusBar, View } from "react-native";

const SplashProvider = ({
  isFontsLoaded,
  children,
}: { isFontsLoaded: boolean } & PropsWithChildren) => {
  const { isLoaded: isAuthLoaded } = useAuth();
  const { theme } = useTheme();
  const { primary } = theme.colors;
  const [dots, setDots] = useState("");

  useEffect(() => {
    setInterval(() => {
      setDots((currDots) => (currDots.length < 3 ? `${currDots}.` : ""));
    }, 1000);
  }, []);

  useEffect(() => {
    if (isFontsLoaded && isAuthLoaded) {
      SplashScreen.hideAsync();
    }
  }, [isFontsLoaded, isAuthLoaded]);

  if (!isFontsLoaded || !isAuthLoaded) {
    return (
      <View
        style={{
          height: "100%",
          width: "100%",
          backgroundColor: primary,
          justifyContent: "center",
          alignItems: "center",
          gap: 16,
        }}
      >
        <StatusBar
          translucent
          barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        />
        <NMTLogo height={120} width={120} />
        <Text>Initializing {dots}</Text>
      </View>
    );
  }

  return children;
};

export default SplashProvider;
