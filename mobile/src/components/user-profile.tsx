import useUsername from "@/hooks/use-username";
import { useUser } from "@clerk/expo";
import { Text, useTheme } from "@rneui/themed";
import { Image, View } from "react-native";
import LoadingSkeleton from "./loading-skeleton";

const UserProfile = () => {
  const { user, isLoaded } = useUser();
  const { theme } = useTheme();
  const username = useUsername();

  return (
    <View
      style={{
        minHeight: 94,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 18,
        paddingVertical: 14,
        gap: 14,
        backgroundColor: theme.colors.primary,
      }}
    >
      {isLoaded ? (
        <Image
          source={{ uri: user?.imageUrl }}
          style={{
            width: 54,
            height: 54,
            borderRadius: 27,
            borderWidth: 2,
            borderColor: theme.colors.success,
            backgroundColor: theme.colors.secondary,
          }}
          resizeMode="cover"
        />
      ) : (
        <LoadingSkeleton
          height={54}
          width={54}
          borderRadius={27}
          style={{ borderWidth: 2, borderColor: theme.colors.success }}
        />
      )}
      <View style={{ flex: 1, gap: 4 }}>
        {isLoaded ? (
          <Text
            numberOfLines={1}
            style={{
              fontSize: 19,
              lineHeight: 25,
              fontFamily: "Lexend_600SemiBold",
            }}
          >
            Hello {username} 👋
          </Text>
        ) : (
          <LoadingSkeleton height={22} width={158} borderRadius={6} />
        )}
        <Text style={{ color: theme.colors.grey2, fontSize: 14 }}>
          Welcome to your home.
        </Text>
      </View>
    </View>
  );
};

export default UserProfile;
