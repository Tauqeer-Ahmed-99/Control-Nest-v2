import { useAuth } from "@clerk/expo";
import { Button, Text } from "@rneui/themed";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { useAutoPiDiscovery } from "@/hooks/use-autopi-discovery";
import useApiQuery from "@/hooks/use-api-query";
import useApiMutation from "@/hooks/use-api-mutation";
import { APIResponse } from "@/models/api";
import { Signed } from "@/models/firmware";
import { ApiRoutes } from "@/routes/routes";

export default function OfflineRecovery({ id }: { id: string }) {
  const { userId } = useAuth();
  const [grant, setGrant] = useState<Signed | null>(null);
  const [error, setError] = useState("");
  const key = `firmware-recovery.${userId}.${id}`;
  const discovery = useAutoPiDiscovery();
  const device = discovery.devices.find(
    (item) => item.service.txt.controllerDeviceId === id && item.addresses[0],
  );
  const baseUrl = device ? `http://${device.addresses[0]}:${device.port}` : "";
  useEffect(() => {
    void SecureStore.getItemAsync(key)
      .then((value) => setGrant(value ? JSON.parse(value) : null))
      .catch(() => setError("The saved recovery grant is unavailable."));
  }, [key]);
  const status = useApiQuery<
    APIResponse<{ installedRelease: string | null; recoveryRequired: boolean }>
  >(ApiRoutes.ControllerFirmware, {
    baseUrl,
    publicRequest: true,
    headers: grant ? { "X-Recovery-Grant": JSON.stringify(grant) } : {},
    queryConfig: { enabled: Boolean(grant && baseUrl), staleTime: 0 },
  });
  const restore = useApiMutation<{ recoveryGrant: Signed }, APIResponse>(
    ApiRoutes.ControllerRollback,
    { baseUrl, publicRequest: true },
  );
  const prepare = useApiMutation<
    { controllerDeviceId: string },
    APIResponse<{ grant: Signed }>
  >(ApiRoutes.RecoveryGrant);
  return (
    <View style={{ gap: 12 }}>
      <Text>
        LAN recovery uses a device-bound grant valid for up to 24 hours. It can
        only restore the recorded working release. Without a valid grant, use
        authenticated SSH or physical owner recovery.
      </Text>
      <Button
        type="outline"
        loading={prepare.isPending}
        onPress={async () => {
          try {
            setError("");
            const result = await prepare.mutateAsync({
              controllerDeviceId: id,
            });
            if (!result.success) throw new Error(result.message);
            await SecureStore.setItemAsync(
              key,
              JSON.stringify(result.data.grant),
            );
            setGrant(result.data.grant);
          } catch {
            setError(
              "A house admin and a fresh cloud connection are required to prepare recovery access.",
            );
          }
        }}
      >
        Prepare recovery access while online
      </Button>
      <Text>
        {discovery.permissionDenied
          ? "Allow local network access to discover this controller."
          : device
            ? "Controller found on Wi-Fi"
            : "Searching for this controller on Wi-Fi…"}
      </Text>
      {status.data?.success && (
        <Text>
          Running {status.data.data.installedRelease ?? "unavailable"}
          {status.data.data.recoveryRequired ? " · Recovery required" : ""}
        </Text>
      )}
      {(error || status.error || restore.error) && (
        <Text accessibilityRole="alert">
          {error || status.error?.message || restore.error?.message}
        </Text>
      )}
      <Button
        type="outline"
        disabled={!grant || !baseUrl || restore.isPending}
        loading={restore.isPending}
        onPress={() =>
          Alert.alert(
            "Restore the working release?",
            "Device control will pause. This consumes the saved recovery authorization.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Restore",
                onPress: async () => {
                  try {
                    await restore.mutateAsync({ recoveryGrant: grant! });
                    void status.refetch();
                  } catch {
                    setError(
                      "Recovery could not start. Refresh status or use SSH if the grant expired.",
                    );
                  }
                },
              },
            ],
          )
        }
      >
        Restore over Wi-Fi
      </Button>
      <Button
        type="clear"
        onPress={() => {
          discovery.restart();
          if (grant && baseUrl) void status.refetch();
        }}
      >
        Refresh LAN status
      </Button>
    </View>
  );
}
