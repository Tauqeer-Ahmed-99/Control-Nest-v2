import Accordion from "@/components/accordion";
import ChoiceRow from "@/components/choice-row";
import LoadingSkeleton from "@/components/loading-skeleton";
import {
  CONTROLLER_DEVICE_CONFIG,
  CONTROLLER_DEVICE_URL,
} from "@/constants/storage";
import useControllerHealth from "@/hooks/use-controller-health";
import useHouseControllers from "@/hooks/use-house-controllers";
import {
  useGetMobileStorageData,
  useSetMobileStorageData,
} from "@/hooks/use-mobile-storage-data";
import { ControllerConfig } from "@/models/controller-config";
import {
  ThemeMode,
  useThemePreference,
} from "@/providers/theme-preference-provider";
import { useClerk, useUser } from "@clerk/expo";
import { Button, Text, useTheme } from "@rneui/themed";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

function ConnectionDetails() {
  const { data: config } = useGetMobileStorageData<ControllerConfig>(
    CONTROLLER_DEVICE_CONFIG,
  );
  const health = useControllerHealth();
  const hasController = Boolean(
    config?.controllerDevice.id && config?.tunnel.hostname,
  );
  const online = health.data?.success && health.data.data.health === "ok";
  return (
    <View style={{ gap: 12 }}>
      <ChoiceRow
        icon="activity"
        title={
          hasController
            ? config!.controllerDevice.name
            : "No controller connected"
        }
        detail={
          !hasController
            ? "Connect a controller to check its connection."
            : health.isFetching
              ? "Checking connection..."
              : online
                ? "Online"
                : "Not responding. Check the Pi and its network."
        }
      />
      {hasController && (
        <Button
          type="outline"
          loading={health.isFetching}
          onPress={() => void health.refetch()}
        >
          Check connection
        </Button>
      )}
      <Button type="clear" onPress={() => router.push("/(tabs)/observability")}>
        Request history
      </Button>
    </View>
  );
}

export default function Settings() {
  const { theme } = useTheme();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { themeMode, setThemeMode } = useThemePreference();
  const { data: config, isLoading } = useGetMobileStorageData<ControllerConfig>(
    CONTROLLER_DEVICE_CONFIG,
  );
  const controllersQuery = useHouseControllers(config?.house.id ?? "");
  const controllers = controllersQuery.data?.success
    ? controllersQuery.data.data
    : [];
  const { mutateAsync: clearConfig } = useSetMobileStorageData<null>(
    CONTROLLER_DEVICE_CONFIG,
  );
  const { mutateAsync: clearUrl } = useSetMobileStorageData<null>(
    CONTROLLER_DEVICE_URL,
  );
  const queryClient = useQueryClient();
  const [showConnection, setShowConnection] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const insets = useSafeAreaInsets();
  const sectionTitle = { fontSize: 18, fontFamily: "Lexend_600SemiBold" };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.primary }}
      contentContainerStyle={{
        padding: 20,
        paddingBottom: 120 + insets.bottom,
        gap: 28,
      }}
    >
      <View style={{ gap: 12 }}>
        <Text accessibilityRole="header" style={sectionTitle}>
          Your house
        </Text>
        {isLoading ? (
          <LoadingSkeleton height={84} width="100%" />
        ) : (
          <ChoiceRow
            title={config?.house.name ?? "Choose a house"}
            icon="home"
            detail="Switch houses"
            onPress={() => router.push("/house-login")}
          />
        )}
        <ChoiceRow
          title="Controllers"
          icon="cpu"
          detail={
            controllersQuery.isLoading
              ? "Loading controllers..."
              : controllersQuery.isError
                ? "View and manage controllers"
                : `${controllers.filter((item) => item.paired).length} connected - ${controllers.length} total`
          }
          onPress={() =>
            router.push({
              pathname: "/house-login",
              params: { houseId: config?.house.id ?? "" },
            })
          }
        />
        <ChoiceRow
          title="House members"
          icon="users"
          onPress={() => router.push("/(tabs)/house-members")}
        />
        <ChoiceRow
          title="Firmware updates"
          icon="download-cloud"
          detail="Controller versions, progress, and recovery"
          onPress={() => router.push("/(tabs)/firmware-updates")}
        />
        <ChoiceRow
          title="App updates"
          icon="smartphone"
          detail="Check and apply mobile updates"
          onPress={() => router.push("/app-updates")}
        />
      </View>
      <View style={{ gap: 12 }}>
        <Text accessibilityRole="header" style={sectionTitle}>
          Account
        </Text>
        <ChoiceRow
          icon="user"
          title={user?.fullName ?? "Your account"}
          detail={user?.primaryEmailAddress?.emailAddress}
        />
        {error !== "" && (
          <Text accessibilityRole="alert" style={{ color: theme.colors.error }}>
            {error}
          </Text>
        )}
        <Button
          type="clear"
          color="error"
          loading={busy}
          disabled={busy}
          onPress={async () => {
            setBusy(true);
            setError("");
            try {
              await signOut();
              await Promise.all([clearConfig(null), clearUrl(null)]);
              queryClient.clear();
            } catch {
              setError("Couldn't sign out. Try again.");
            } finally {
              setBusy(false);
            }
          }}
        >
          Sign Out
        </Button>
      </View>
      <View style={{ gap: 12 }}>
        <Text accessibilityRole="header" style={sectionTitle}>
          Appearance
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {THEME_OPTIONS.map(({ value, label }) => (
            <TouchableOpacity
              key={value}
              onPress={() => setThemeMode(value)}
              accessibilityRole="button"
              accessibilityLabel={`${label} theme`}
              accessibilityState={{ selected: themeMode === value }}
              style={{
                flexGrow: 1,
                flexBasis: 80,
                minHeight: 48,
                padding: 12,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 14,
                borderWidth: 1,
                borderColor:
                  themeMode === value
                    ? theme.colors.success
                    : theme.colors.greyOutline,
                backgroundColor:
                  themeMode === value
                    ? theme.colors.grey5
                    : theme.colors.secondary,
              }}
            >
              <Text
                style={{
                  color:
                    themeMode === value
                      ? theme.colors.success
                      : theme.colors.black,
                  fontFamily: "Lexend_500Medium",
                  fontSize: 15,
                }}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <Accordion
        title="Connection details"
        summary="Controller status and request history"
        icon="activity"
        expanded={showConnection}
        onToggle={() => setShowConnection((value) => !value)}
      >
        <ConnectionDetails />
      </Accordion>
    </ScrollView>
  );
}
