import { Text, View } from "react-native";

const NMTTextLogo = () => {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View
        style={{
          backgroundColor: "#3e31ab",
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 4,
          alignItems: "center",
          justifyContent: "center",
          elevation: 50,
          shadowColor: "#ffffff",
        }}
      >
        <Text
          style={{
            color: "#ffffff",
            fontSize: 24,
            fontFamily: "Lexend_600SemiBold",
          }}
        >
          NMT
        </Text>
      </View>
      <Text
        style={{
          color: "#ffffff",
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
