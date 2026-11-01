import { canRestoreHouse } from "@/utils/onboarding";
import ChoiceRow from "@/components/choice-row";
import ControllerSetup from "@/components/controller-setup";
import FlowScreen, { FlowHeading } from "@/components/flow-screen";
import LoadingSkeleton from "@/components/loading-skeleton";
import {
  CONTROLLER_DEVICE_CONFIG,
  CONTROLLER_DEVICE_URL,
} from "@/constants/storage";
import { SERVER_URL } from "@/constants/urls";
import useApiQuery from "@/hooks/use-api-query";
import useHouseControllers from "@/hooks/use-house-controllers";
import {
  useGetMobileStorageData,
  useSetMobileStorageData,
} from "@/hooks/use-mobile-storage-data";
import { APIResponse } from "@/models/api";
import { ControllerConfig } from "@/models/controller-config";
import { UserHouse } from "@/models/onboarding";
import { ApiRoutes } from "@/routes/routes";
import { useClerk, useUser } from "@clerk/expo";
import { Button, Text, useTheme } from "@rneui/themed";
import { useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Linking, View } from "react-native";

export default function HouseLogin() {
  const { theme } = useTheme();
  const { user } = useUser();
  const { signOut } = useClerk();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ houseId?: string }>();
  const [houseId, setHouseId] = useState(params.houseId ?? "");
  const [isConnecting, setIsConnecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const housesQuery = useApiQuery<APIResponse<UserHouse[]>>(ApiRoutes.Houses, {
    queryConfig: { staleTime: 0 },
  });
  const houses = housesQuery.data?.success ? housesQuery.data.data : [];
  const house = houses.find((item) => item.id === houseId);
  const controllersQuery = useHouseControllers(house?.id ?? "");
  const controllers = controllersQuery.data?.success
    ? controllersQuery.data.data
    : [];
  const { data: savedConfig } = useGetMobileStorageData<ControllerConfig>(
    CONTROLLER_DEVICE_CONFIG,
  );
  const hasSavedHouse = canRestoreHouse(savedConfig, user?.id);
  const { mutateAsync: saveConfig } = useSetMobileStorageData<ControllerConfig>(
    CONTROLLER_DEVICE_CONFIG,
  );
  const { mutateAsync: clearControllerUrl } = useSetMobileStorageData<null>(
    CONTROLLER_DEVICE_URL,
  );

  async function openHouse() {
    if (!house) return;
    setSaving(true);
    setError("");
    try {
      const controller = controllers.find((item) => item.paired && item.tunnel);
      await saveConfig({
        userId: user?.id,
        house,
        controllerDevice: controller ?? {
          id: "",
          houseId: house.id,
          name: "No controller paired",
        },
        tunnel: { hostname: controller?.tunnel?.hostname ?? "" },
      });
      await clearControllerUrl(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["mobile-storage"] }),
        queryClient.invalidateQueries({ queryKey: [ApiRoutes.UserHouse] }),
      ]);
      router.replace("/(tabs)/home");
    } catch {
      setError("Couldn't open this house. Try again.");
    } finally {
      setSaving(false);
    }
  }

  function back() {
    if (isConnecting) {
      setIsConnecting(false);
      return;
    }
    if (houseId) {
      setHouseId("");
      setError("");
      return;
    }
    router.replace("/(tabs)/home");
  }

  if (house && isConnecting)
    return (
      <ControllerSetup
        house={house}
        onBack={back}
        onConnected={async () => {
          await controllersQuery.refetch();
          setIsConnecting(false);
        }}
      />
    );

  const queryError = house
    ? (controllersQuery.error?.message ??
      (controllersQuery.data?.success === false
        ? controllersQuery.data.message
        : ""))
    : (housesQuery.error?.message ??
      (housesQuery.data?.success === false ? housesQuery.data.message : ""));

  async function openDashboard() {
    try {
      await Linking.openURL(`${SERVER_URL}/dashboard`);
    } catch {
      setError("Couldn't open the website. Try again.");
    }
  }

  return (
    <FlowScreen
      title={house ? house.name : "Your houses"}
      onBack={houseId || hasSavedHouse ? back : undefined}
      busy={saving}
    >
      <FlowHeading
        title={house ? "Controllers" : "Choose your house"}
        description={
          house
            ? "All controllers in this house work together."
            : "Open a house to control its rooms and devices."
        }
      />
      {!!(error || queryError) && (
        <View style={{ gap: 8 }}>
          <Text accessibilityRole="alert" style={{ color: theme.colors.error }}>
            {error || queryError}
          </Text>
          <Button
            type="outline"
            onPress={() => {
              setError("");
              void (house ? controllersQuery.refetch() : housesQuery.refetch());
            }}
          >
            Try again
          </Button>
        </View>
      )}
      <View style={{ gap: 12 }}>
        {housesQuery.isLoading || (house && controllersQuery.isLoading) ? (
          <>
            <LoadingSkeleton height={84} width="100%" />
            <LoadingSkeleton height={84} width="100%" />
          </>
        ) : house ? (
          <>
            {controllers.map((controller) => (
              <ChoiceRow
                key={controller.id}
                title={controller.name}
                icon={controller.paired ? "check-circle" : "cpu"}
                detail={
                  controller.paired
                    ? "Connected"
                    : controller.apiKeyLastFour
                      ? "Ready to connect"
                      : "Create an API key on the website"
                }
              />
            ))}
            {!controllers.length && (
              <ChoiceRow
                title="No controllers yet"
                detail={
                  house.isAdmin
                    ? "Connect your first Raspberry Pi to get started."
                    : "Ask a house admin to connect a controller."
                }
                icon="cpu"
              />
            )}
            {house.isAdmin && (
              <Button
                type={
                  controllers.some((item) => item.paired) ? "outline" : "solid"
                }
                onPress={() => setIsConnecting(true)}
              >
                Connect a controller
              </Button>
            )}
            <Button
              loading={saving}
              disabled={saving || controllersQuery.isLoading || !!queryError}
              onPress={() => void openHouse()}
              type={
                controllers.some((item) => item.paired) ? "solid" : "outline"
              }
            >
              Open house
            </Button>
          </>
        ) : houses.length ? (
          houses.map((item) => (
            <ChoiceRow
              key={item.id}
              title={item.name}
              icon="home"
              detail={
                hasSavedHouse && item.id === savedConfig?.house.id
                  ? "Current house"
                  : item.isAdmin
                    ? "Admin"
                    : "Member"
              }
              onPress={() => {
                setHouseId(item.id);
                setError("");
              }}
            />
          ))
        ) : (
          !queryError && (
            <>
              <ChoiceRow
                title="Add your first house"
                detail="Create a house on the website, or ask its admin to add your email."
                icon="home"
              />
              <Button onPress={() => void openDashboard()}>
                Set up a house
              </Button>
            </>
          )
        )}
      </View>
      <View style={{ gap: 4 }}>
        {(!house || house.isAdmin) && houses.length > 0 && (
          <Button type="clear" onPress={() => void openDashboard()}>
            {house ? "Manage controllers on website" : "Add or manage houses"}
          </Button>
        )}
        <Button
          type="clear"
          loading={housesQuery.isRefetching || controllersQuery.isRefetching}
          onPress={() => {
            void housesQuery.refetch();
            if (house) void controllersQuery.refetch();
          }}
        >
          Refresh {house ? "controllers" : "houses"}
        </Button>
        {!house && (
          <>
            <Text
              style={{
                textAlign: "center",
                color: theme.colors.grey2,
                fontSize: 13,
              }}
            >
              {user?.primaryEmailAddress?.emailAddress}
            </Text>
            <Button type="clear" onPress={() => void signOut()}>
              Use another account
            </Button>
          </>
        )}
      </View>
    </FlowScreen>
  );
}
