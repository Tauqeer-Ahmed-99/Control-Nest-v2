import Feather from "@expo/vector-icons/Feather";
import { CONTROLLER_DEVICE_CONFIG } from "@/constants/storage";
import { useGetMobileStorageData } from "@/hooks/use-mobile-storage-data";
import { ControllerConfig } from "@/models/controller-config";
import { router } from "expo-router";
import useUsername from "@/hooks/use-username";
import { useUser } from "@clerk/expo";
import { Text, useTheme } from "@rneui/themed";
import { Image, TouchableOpacity, View } from "react-native";
import LoadingSkeleton from "./loading-skeleton";

const UserProfile = () => {
  const { user, isLoaded } = useUser();
  const { theme } = useTheme();
  const username = useUsername();
  const { data: config } = useGetMobileStorageData<ControllerConfig>(
    CONTROLLER_DEVICE_CONFIG,
  );

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
            width: 75,
            height: 75,
            borderRadius: 27,
            borderWidth: 2,
            borderColor: theme.colors.success,
            backgroundColor: theme.colors.secondary,
          }}
          resizeMode="cover"
        />
      ) : (
        <LoadingSkeleton
          height={75}
          width={75}
          borderRadius={27}
          style={{ borderWidth: 2, borderColor: theme.colors.success }}
        />
      )}
      <View style={{ flex: 1 }}>
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
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Switch house. Current house: ${config?.house.name ?? "None"}`}
          onPress={() => router.push("/house-login")}
          style={{
            minHeight: 44,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Text
            style={{
              flexShrink: 1,
              color: theme.colors.success,
              fontSize: 15,
              fontFamily: "Lexend_500Medium",
            }}
          >
            {config?.house.name ?? "Choose a house"}
          </Text>
          <Feather name="chevron-down" size={18} color={theme.colors.success} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default UserProfile;
