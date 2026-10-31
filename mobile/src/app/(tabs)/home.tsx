import Rooms from "@/components/rooms";
import Summary from "@/components/summary";
import UserProfile from "@/components/user-profile";
import {
  CONTROLLER_DEVICE_CONFIG,
  CONTROLLER_DEVICE_PASSWORDS,
} from "@/constants/storage";
import useUpdateHeaderTitle from "@/hooks/use-update-header-title";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Text, useTheme } from "@rneui/themed";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { TouchableOpacity, View } from "react-native";
import { ScrollView } from "react-native-virtualized-view";

const Home = () => {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const router = useRouter();

  const DevelopmentHelpers = (
    <TouchableOpacity
      onPress={async () => {
        await AsyncStorage.multiRemove([
          CONTROLLER_DEVICE_CONFIG,
          CONTROLLER_DEVICE_PASSWORDS,
        ]);
        queryClient.invalidateQueries({
          queryKey: ["mobile-storage", CONTROLLER_DEVICE_CONFIG],
        });
        queryClient.invalidateQueries({
          queryKey: ["mobile-storage", CONTROLLER_DEVICE_PASSWORDS],
        });
        router.replace("/auth");
      }}
    >
      <Text>Clear Mobile Storage</Text>
    </TouchableOpacity>
  );

  useUpdateHeaderTitle(
    "Home",
    process.env.NODE_ENV === "development" ? DevelopmentHelpers : undefined,
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.primary,
      }}
    >
      <UserProfile />
      <View style={{ paddingHorizontal: 18, flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 132 }}
        >
          <Summary />
          <Rooms />
        </ScrollView>
      </View>
      {/* <BottomNavigation /> */}
    </View>
  );
};

export default Home;
