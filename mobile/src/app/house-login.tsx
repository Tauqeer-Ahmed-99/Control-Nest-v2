import Header from "@/components/header";
import InputField from "@/components/input-field";
import Select from "@/components/select";
import LoadingSkeleton from "@/components/loading-skeleton";
import { CONTROLLER_DEVICE_CONFIG } from "@/constants/storage";
import { SERVER_URL } from "@/constants/urls";
import { useAutoPiDiscovery } from "@/hooks/use-autopi-discovery";
import useApiQuery from "@/hooks/use-api-query";
import useConfigController from "@/hooks/use-config-controller";
import useHouseControllers from "@/hooks/use-house-controllers";
import { useSetMobileStorageData } from "@/hooks/use-mobile-storage-data";
import { APIResponse } from "@/models/api";
import { ControllerConfig } from "@/models/controller-config";
import { UserHouse } from "@/models/onboarding";
import { ApiRoutes } from "@/routes/routes";
import Feather from "@expo/vector-icons/Feather";
import { Button, Text, useTheme } from "@rneui/themed";
import { useQueryClient } from "@tanstack/react-query";
import { Link, router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";

export default function HouseLogin() {
  const { theme } = useTheme();
  const colors = theme.colors;
  const queryClient = useQueryClient();
  const housesQuery = useApiQuery<APIResponse<UserHouse[]>>(ApiRoutes.Houses, {
    queryConfig: { staleTime: 0 },
  });
  const houses = housesQuery.data?.data ?? [];
  const [houseId, setHouseId] = useState("");
  const house = houses.find((item) => item.id === houseId) ?? houses[0];
  const controllersQuery = useHouseControllers(house?.id ?? "");
  const controllers = controllersQuery.data?.data ?? [];
  const { devices, isScanning, permissionDenied } = useAutoPiDiscovery();
  const [device, setDevice] = useState<(typeof devices)[number] | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const { mutateAsync: saveConfig } = useSetMobileStorageData<ControllerConfig>(
    CONTROLLER_DEVICE_CONFIG,
  );
  const address = device?.addresses[0];
  const pairing = useConfigController(
    address
      ? `http://${address.includes(":") ? `[${address}]` : address}:${device?.port}`
      : SERVER_URL,
  );
  const card = {
    backgroundColor: colors.secondary,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.greyOutline,
    padding: 20,
    gap: 16,
  } as const;
  const heading = { fontSize: 20, fontFamily: "Lexend_600SemiBold" } as const;

  async function openHouse() {
    if (!house) return;
    setSaving(true);
    setError("");
    try {
      const controller = controllers.find((item) => item.paired && item.tunnel);
      await saveConfig({
        house,
        controllerDevice: controller ?? {
          id: "",
          houseId: house.id,
          name: "No controller paired",
        },
        tunnel: { hostname: controller?.tunnel?.hostname ?? "" },
      });
      await queryClient.invalidateQueries({
        queryKey: ["mobile-storage", CONTROLLER_DEVICE_CONFIG],
      });
      await queryClient.invalidateQueries({ queryKey: [ApiRoutes.UserHouse] });
      router.replace("/(tabs)/home");
    } catch {
      setError("Unable to save your house selection. Please try again.");
    } finally {
      setSaving(false);
    }
  }
  async function pairController() {
    if (!device || !address) {
      setError("Select a controller on your Wi-Fi first.");
      return;
    }
    if (!/^cn_[0-9a-f-]{36}\.[A-Za-z0-9_-]{43}$/.test(apiKey.trim())) {
      setError("Paste the complete API key from My houses on the website.");
      return;
    }
    setError("");
    setNotice("");
    try {
      const result = await pairing.mutateAsync({ apiKey: apiKey.trim() });
      if (!result.success) throw new Error(result.message);
      setApiKey("");
      setDevice(null);
      setHouseId(result.data.house.id);
      setNotice(
        `${result.data.controllerDevice.name} is connected to ${result.data.house.name}. You can now add devices to it.`,
      );
      await housesQuery.refetch();
      await queryClient.invalidateQueries({
        queryKey: [ApiRoutes.HouseControllers],
      });
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to pair this controller. Try again.",
      );
    } finally {
      pairing.reset();
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.primary }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 48, gap: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        <Header heading="Houses & controllers" />
        <Text style={{ color: colors.grey2 }}>
          Sign in with the same email you used on the website. Choose your
          house, or connect another Raspberry Pi.
        </Text>
        {(error || housesQuery.error || controllersQuery.error) && (
          <Text accessibilityRole="alert" style={{ color: colors.error }}>
            {error ||
              housesQuery.error?.message ||
              controllersQuery.error?.message}
          </Text>
        )}
        {notice !== "" && (
          <Text
            accessibilityLiveRegion="polite"
            style={{ color: colors.success }}
          >
            {notice}
          </Text>
        )}
        <View style={card}>
          <Text style={heading}>Your house</Text>
          {housesQuery.isLoading ? (
            <LoadingSkeleton height={52} width="100%" />
          ) : house ? (
            <>
              <Select
                label="House"
                field="name"
                items={houses}
                selectedValue={house}
                onValueChange={(value: UserHouse) => {
                  setHouseId(value.id);
                  setError("");
                }}
              />
              <Text style={{ color: colors.grey2 }}>
                {controllers.length} controller
                {controllers.length === 1 ? "" : "s"} in this house. Devices in
                all rooms are available together.
              </Text>
              {controllers.map((controller) => (
                <View
                  key={controller.id}
                  style={{
                    flexDirection: "row",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <Feather name="cpu" size={20} color={colors.success} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: "Lexend_500Medium" }}>
                      {controller.name}
                    </Text>
                    <Text style={{ color: colors.grey2, fontSize: 12 }}>
                      {!controller.apiKeyLastFour
                        ? "Needs an API key"
                        : controller.paired
                          ? "Paired"
                          : "Ready to pair"}
                    </Text>
                  </View>
                </View>
              ))}
              <Button
                loading={saving}
                disabled={pairing.isPending || controllersQuery.isLoading}
                onPress={() => void openHouse()}
              >
                Open house
              </Button>
            </>
          ) : (
            <Text style={{ color: colors.grey2 }}>
              Create a house on the website, then add a named controller to
              generate its API key.
            </Text>
          )}
          <Link href={`${SERVER_URL}/dashboard` as `https://${string}`} asChild>
            <Button type="outline">Manage houses on website</Button>
          </Link>
          <Button
            type="clear"
            onPress={() => {
              void housesQuery.refetch();
              void controllersQuery.refetch();
            }}
          >
            Refresh houses & controllers
          </Button>
        </View>
        <View style={card}>
          <Text style={heading}>Connect a Raspberry Pi</Text>
          <Text style={{ color: colors.grey2 }}>
            1. On the website, add a controller to your house and copy its API
            key.
          </Text>
          <Text style={{ color: colors.grey2 }}>
            2. Keep your phone and Pi on the same trusted Wi-Fi. Select the Pi
            below.
          </Text>
          {permissionDenied && (
            <Text style={{ color: colors.warning }}>
              Allow local network access in your phone settings to find
              controllers.
            </Text>
          )}
          {!devices.length && (
            <Text style={{ color: colors.grey2 }}>
              {isScanning
                ? "Looking for controllers..."
                : "No controllers found. Check the Pi is powered on and AutoPiHub is running."}
            </Text>
          )}
          {devices.map((item) => (
            <TouchableOpacity
              key={item.name}
              accessibilityRole="button"
              accessibilityState={{ selected: device?.name === item.name }}
              onPress={() => setDevice(item)}
              style={{
                minHeight: 52,
                padding: 14,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                borderRadius: 14,
                borderWidth: 1,
                borderColor:
                  device?.name === item.name
                    ? colors.success
                    : colors.greyOutline,
              }}
            >
              <Feather
                name={device?.name === item.name ? "check-circle" : "cpu"}
                size={22}
                color={colors.success}
              />
              <View style={{ flex: 1 }}>
                <Text>{item.name}</Text>
                <Text style={{ fontSize: 12, color: colors.grey2 }}>
                  {item.service.txt.configured === "true"
                    ? "Paired - paste a replacement key to reconnect"
                    : "Ready for setup"}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
          <Text style={{ color: colors.grey2 }}>
            3. Paste the API key for this Pi. It will be saved securely on the
            controller.
          </Text>
          <InputField
            label="Controller API key"
            placeholder="cn_..."
            value={apiKey}
            onChangeText={setApiKey}
            secureTextEntry
            autoCapitalize="none"
            disabled={pairing.isPending}
          />
          <Button
            loading={pairing.isPending}
            disabled={!device || !apiKey.trim() || saving}
            onPress={() => void pairController()}
          >
            Connect controller
          </Button>
          <Text style={{ color: colors.grey2, fontSize: 12 }}>
            Each Pi needs its own controller entry and key. You can also enter
            the key with the setup script directly on the Pi.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
