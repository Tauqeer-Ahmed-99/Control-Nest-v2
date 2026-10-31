import { Text, View } from "react-native";
import { useTheme } from "@rneui/themed";

const NMTTextLogo = () => {
  const { theme } = useTheme();

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View
        style={{
          backgroundColor: theme.colors.success,
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 4,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            color: theme.mode === "dark" ? "#10201A" : "#FFFFFF",
            fontSize: 24,
            fontFamily: "Lexend_600SemiBold",
          }}
        >
          NMT
        </Text>
      </View>
      <Text
        style={{
          color: theme.colors.black,
          fontSize: 24,
          fontFamily: "Lexend_600SemiBold",
        }}
      >
        Solutions'
      </Text>
    </View>
  );
};

export default NMTTextLogo;
