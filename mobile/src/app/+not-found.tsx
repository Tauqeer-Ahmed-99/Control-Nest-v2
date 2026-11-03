import Feather from "@expo/vector-icons/Feather";
import { Button, Text, useTheme } from "@rneui/themed";
import { router } from "expo-router";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotFoundScreen() {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.primary }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: 24,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 440,
            alignSelf: "center",
            alignItems: "center",
            gap: 24,
          }}
        >
          <Feather
            name="compass"
            size={44}
            color={theme.colors.grey2}
            accessible={false}
          />
          <View style={{ gap: 12 }}>
            <Text
              accessibilityRole="header"
              style={{
                fontFamily: "Lexend_600SemiBold",
                fontSize: 28,
                lineHeight: 36,
                letterSpacing: -0.6,
                textAlign: "center",
              }}
            >
              Page not found
            </Text>
            <Text
              style={{
                fontFamily: "Lexend_400Regular",
                fontSize: 16,
                lineHeight: 24,
                color: theme.colors.grey2,
                textAlign: "center",
              }}
            >
              This page may have moved or the link may be out of date. Return to
              Control Nest to continue.
            </Text>
          </View>
          <Button
            title="Back to Control Nest"
            onPress={() => router.replace("/")}
            containerStyle={{ width: "100%" }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
