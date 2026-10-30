import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Text } from "@rneui/themed";
import { TouchableOpacity, View } from "react-native";

const Header = ({
  heading,
  onDetails,
}: {
  heading: string;
  onDetails?: () => void;
}) => {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginVertical: 12,
        paddingVertical: 6,
      }}
    >
      <Text style={{ fontSize: 20, fontFamily: "Lexend_700Bold" }}>
        {heading}
      </Text>
      {onDetails && (
        <TouchableOpacity onPress={onDetails}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontFamily: "Lexend_500Medium",
                color: "grey",
              }}
            >
              View All
            </Text>
            <FontAwesome name="arrow-right" size={16} color="grey" />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default Header;
