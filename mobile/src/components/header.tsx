import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Text } from "@rneui/themed";
import { TouchableOpacity, View } from "react-native";
import { useTheme } from "@rneui/themed";

const Header = ({
  heading,
  onDetails,
}: {
  heading: string;
  onDetails?: () => void;
}) => {
  const { theme } = useTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 18,
        marginBottom: 12,
        minHeight: 40,
      }}
    >
      <Text
        style={{
          fontSize: 20,
          lineHeight: 26,
          fontFamily: "Lexend_600SemiBold",
        }}
      >
        {heading}
      </Text>
      {onDetails && (
        <TouchableOpacity
          onPress={onDetails}
          accessibilityRole="button"
          accessibilityLabel={`View all ${heading.toLowerCase()}`}
          hitSlop={8}
          style={{ minHeight: 44, justifyContent: "center" }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 6,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontFamily: "Lexend_500Medium",
                color: theme.colors.success,
              }}
            >
              View All
            </Text>
            <FontAwesome name="arrow-right" size={14} color={theme.colors.success} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default Header;
