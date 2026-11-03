import { useCallback, useState } from "react";
import { ScrollView } from "react-native";
import { Stack } from "expo-router";
import { Text, useTheme } from "@rneui/themed";
import FirmwareController from "@/components/firmware-controller";
import useHouseControllers from "@/hooks/use-house-controllers";
import { useHouseId } from "@/hooks/use-house";
export default function FirmwareUpdates() {
  const { theme } = useTheme();
  const query = useHouseControllers(useHouseId() ?? "");
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const onBusy = useCallback(
    (id: string, active: boolean) =>
      setBusy((previous) =>
        previous[id] === active ? previous : { ...previous, [id]: active },
      ),
    [],
  );
  const controllers = query.data?.success ? query.data.data : [];
  return (
    <>
      <Stack.Screen
        options={{
          title: "Firmware updates",
          headerShown: true,
          headerTintColor: theme.colors.black,
          headerTitleAlign: "center",
          headerShadowVisible: false,
          headerTitleStyle: {
            color: theme.colors.black,
            fontFamily: "Lexend_600SemiBold",
            fontSize: 17,
          },
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          statusBarTranslucent: true,
        }}
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.colors.primary }}
        contentContainerStyle={{ padding: 20, paddingBottom: 140, gap: 20 }}
      >
        <Text>
          Updates install the controller application and Python dependencies. A
          house admin starts one controller at a time.
        </Text>
        {query.isLoading && <Text>Loading controllers…</Text>}
        {query.isError && (
          <Text accessibilityRole="alert" style={{ color: theme.colors.error }}>
            {query.error.message}
          </Text>
        )}
        {!query.isLoading && !query.isError && !controllers.length && (
          <Text>
            Select a house with a controller in Settings to view firmware
            updates.
          </Text>
        )}
        {controllers.map((item) =>
          item.paired ? (
            <FirmwareController
              key={item.id}
              id={item.id}
              name={item.name}
              onBusy={onBusy}
              blocked={Object.entries(busy).some(
                ([id, active]) => id !== item.id && active,
              )}
            />
          ) : (
            <Text key={item.id}>
              {item.name}: Pair this controller before checking firmware.
            </Text>
          ),
        )}
      </ScrollView>
    </>
  );
}
