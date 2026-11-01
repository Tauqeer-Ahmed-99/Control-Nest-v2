import AppIcon from "@/assets/icon/icon.png";
import FlowScreen from "@/components/flow-screen";
import SignIn from "@/components/signin";
import SignUp from "@/components/signup";
import { Text, useTheme } from "@rneui/themed";
import { useState } from "react";
import { Image, View } from "react-native";

export default function Auth() {
  const [isSigningUp, setIsSigningUp] = useState(false);
  const { theme } = useTheme();
  return (
    <FlowScreen title="Control Nest">
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <Image
          source={AppIcon}
          resizeMode="contain"
          style={{ width: 60, height: 60, borderRadius: 16 }}
          accessibilityLabel="Control Nest"
        />
        <Text
          style={{
            flex: 1,
            color: theme.colors.grey2,
            fontSize: 16,
            lineHeight: 24,
          }}
        >
          Your houses. One place.
        </Text>
      </View>
      {isSigningUp ? (
        <SignUp prevStep={() => setIsSigningUp(false)} />
      ) : (
        <SignIn nextStep={() => setIsSigningUp(true)} />
      )}
    </FlowScreen>
  );
}
