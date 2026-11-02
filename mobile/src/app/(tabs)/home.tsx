import Rooms from "@/components/rooms";
import Summary from "@/components/summary";
import UserProfile from "@/components/user-profile";
import FirmwareBanner from "@/components/firmware-banner";
import { useRelease } from "@/providers/release-provider";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ApiRoutes } from "@/routes/routes";
import { useTheme } from "@rneui/themed";
import { RefreshControl, ScrollView, View } from "react-native";

const Home = () => {
  const { theme } = useTheme();
  const { refresh } = useRelease();
  const client = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                try {
                  await Promise.all([
                    refresh(),
                    client.invalidateQueries({
                      queryKey: [ApiRoutes.Firmware],
                    }),
                    client.invalidateQueries({
                      queryKey: [ApiRoutes.HouseControllers],
                    }),
                  ]);
                } finally {
                  setRefreshing(false);
                }
              }}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 132 }}
        >
          <FirmwareBanner />
          <Summary />
          <Rooms />
        </ScrollView>
      </View>
    </View>
  );
};

export default Home;
