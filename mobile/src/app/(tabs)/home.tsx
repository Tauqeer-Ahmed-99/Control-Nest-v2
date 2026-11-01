import Rooms from "@/components/rooms";
import Summary from "@/components/summary";
import UserProfile from "@/components/user-profile";
import { useTheme } from "@rneui/themed";
import { View } from "react-native";
import { ScrollView } from "react-native-virtualized-view";

const Home = () => {
  const { theme } = useTheme();

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
    </View>
  );
};

export default Home;
