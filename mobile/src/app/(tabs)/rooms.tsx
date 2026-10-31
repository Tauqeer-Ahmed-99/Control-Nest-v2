import MessageContainer from "@/components/message-container";
import { RoomListSkeleton } from "@/components/loading-placeholders";
import useHouse from "@/hooks/use-house";
import { getTypedRoute, Routes } from "@/routes/routes";
import AntDesign from "@expo/vector-icons/AntDesign";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Text, useTheme } from "@rneui/themed";
import { router } from "expo-router";
import { TouchableOpacity, View } from "react-native";
import { ScrollView } from "react-native-virtualized-view";

const Rooms = () => {
  const { theme } = useTheme();
  const { data, isLoading, error } = useHouse();
  const rooms = data?.details == null ? data?.data?.rooms ?? [] : [];

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.primary,
          padding: 16,
        }}
      >
        <RoomListSkeleton />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.primary }}>
        <Text style={{ textAlign: "center", color: theme.colors.grey2 }}>
          {error.message || "Unable to load rooms."}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{ flex: 1, paddingHorizontal: 16, backgroundColor: theme.colors.primary }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 132, paddingTop: 8 }}
      >
        <View style={{ gap: 16 }}>
          {rooms.length > 0 ? (
            rooms.map((room) => (
              <TouchableOpacity
                key={room.id}
                activeOpacity={0.82}
                accessibilityRole="button"
                accessibilityLabel={`Open ${room.name}`}
                onPress={() =>
                  router.push(
                    getTypedRoute(Routes.Room.replace("[roomId]", room.id)),
                  )
                }
              >
                <View
                  style={{
                    padding: 16,
                    borderRadius: 18,
                    backgroundColor: theme.colors.secondary,
                    borderWidth: 1,
                    borderColor: theme.colors.grey5,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    minHeight: 78,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 14,
                    }}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor:
                          theme.mode === "dark"
                            ? "rgba(104, 212, 181, 0.14)"
                            : "rgba(18, 107, 91, 0.10)",
                      }}
                    >
                      <MaterialCommunityIcons
                        name="home-floor-1"
                        size={23}
                        color={theme.colors.success}
                      />
                    </View>
                    <View style={{ gap: 4 }}>
                      <Text
                        style={{
                          fontFamily: "Lexend_600SemiBold",
                          fontSize: 15,
                        }}
                      >
                        {room.name}
                      </Text>
                      <Text style={{ color: theme.colors.grey2, fontSize: 12 }}>
                        {room.devices.length} devices
                      </Text>
                    </View>
                  </View>
                  <AntDesign
                    name="right"
                    size={18}
                    color={theme.colors.grey3}
                  />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <MessageContainer message="Rooms not available create a new room." />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default Rooms;
