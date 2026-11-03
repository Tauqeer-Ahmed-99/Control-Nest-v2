import { inspectControllerKey } from "@/utils/onboarding";
import { ApiError } from "@/utils/api-error";
import { SERVER_URL } from "@/constants/urls";
import { useAutoPiDiscovery } from "@/hooks/use-autopi-discovery";
import useConfigController from "@/hooks/use-config-controller";
import useHouseControllers from "@/hooks/use-house-controllers";
import { ControllerConfig } from "@/models/controller-config";
import { UserHouse } from "@/models/onboarding";
import { Button, Text, useTheme } from "@rneui/themed";
import { useEffect, useState } from "react";
import { Linking, View } from "react-native";
import ChoiceRow from "./choice-row";
import FlowScreen, { FlowHeading } from "./flow-screen";
import InputField from "./input-field";
import LoadingSkeleton from "./loading-skeleton";

// Mounted only after choosing Connect, so network permission is requested in context.
export default function ControllerSetup({
  house,
  onBack,
  onConnected,
}: {
  house: UserHouse;
  onBack: () => void;
  onConnected: () => Promise<void>;
}) {
  const { theme } = useTheme();
  const {
    devices,
    isScanning,
    permissionDenied,
    error: discoveryError,
    restart,
  } = useAutoPiDiscovery();
  const controllersQuery = useHouseControllers(house.id);
  const controllers = controllersQuery.data?.success
    ? controllersQuery.data.data
    : [];
  const [device, setDevice] = useState<(typeof devices)[number] | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const [connected, setConnected] = useState<ControllerConfig | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [scanAttempt, setScanAttempt] = useState(0);
  const [scanTimedOut, setScanTimedOut] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => setScanTimedOut(true), 8000);
    return () => clearTimeout(timeout);
  }, [scanAttempt]);
  const address = device?.addresses[0];
  const pairing = useConfigController(
    address ? `http://${address}:${device?.port}` : SERVER_URL,
  );
  const keyInfo = inspectControllerKey(apiKey, house.id, controllers);
  const keyController = keyInfo.controller;
  const busy = pairing.isPending || finishing;
  const goBack = () => {
    setError("");
    setApiKey("");
    if (connected) {
      void finish();
      return;
    }
    if (device) {
      setDevice(null);
      return;
    }
    onBack();
  };

  async function openWebsite() {
    try {
      await Linking.openURL(`${SERVER_URL}/dashboard`);
    } catch {
      setError("Couldn't open the website. Try again.");
    }
  }

  async function finish() {
    setFinishing(true);
    try {
      await onConnected();
    } catch {
      setError("Connected. Refresh the controller list to continue.");
    } finally {
      setFinishing(false);
    }
  }

  async function pair() {
    if (!device || !address || !keyController) return;
    setError("");
    const currentDevice = devices.find((item) => item.name === device.name);
    if (!currentDevice || currentDevice.addresses[0] !== address) {
      setError("This Pi is no longer available. Go back and find it again.");
      return;
    }
    const registeredId = currentDevice.service.txt.controllerDeviceId;
    if (
      controllers.some((item) => item.id === registeredId && item.paired) &&
      registeredId !== keyController.id
    ) {
      setError(
        "This Pi already belongs to another controller. Use that controller's key to reconnect it.",
      );
      return;
    }
    try {
      const result = await pairing.mutateAsync({ apiKey: apiKey.trim() });
      if (!result.success) {
        setError("Couldn't connect. Check the key and try again.");
        return;
      }
      setApiKey("");
      setConnected(result.data);
    } catch (error) {
      setError(
        error instanceof ApiError
          ? error.message
          : "Couldn't connect. Check the API key, Pi, and Wi-Fi, then try again.",
      );
    } finally {
      pairing.reset();
    }
  }

  return (
    <FlowScreen title={house.name} onBack={goBack} busy={busy}>
      <FlowHeading
        title={
          connected
            ? "Controller connected"
            : device
              ? "Connect to your house"
              : "Find your Raspberry Pi"
        }
        description={
          connected
            ? `${connected.controllerDevice.name} is ready in ${connected.house.name}.`
            : device
              ? "Use the API key for a controller in this house."
              : "Keep your phone and Pi on the same Wi-Fi. Choose your Pi below."
        }
      />
      {error !== "" && (
        <Text accessibilityRole="alert" style={{ color: theme.colors.error }}>
          {error}
        </Text>
      )}
      {connected ? (
        <>
          <ChoiceRow
            icon="check-circle"
            title={connected.controllerDevice.name}
            detail={connected.house.name}
          />
          <Button loading={finishing} onPress={() => void finish()}>
            Done
          </Button>
          <Button
            type="clear"
            disabled={busy}
            onPress={() => {
              setConnected(null);
              setDevice(null);
            }}
          >
            Connect another Pi
          </Button>
        </>
      ) : device ? (
        <>
          <Text style={{ color: theme.colors.grey2, fontSize: 13 }}>
            Step 2 of 2 - API key
          </Text>
          <ChoiceRow
            title={device.name}
            icon="cpu"
            detail="Selected Raspberry Pi"
          />
          <InputField
            label="Controller API key"
            placeholder="Paste cn_..."
            value={apiKey}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            containerStyle={{ paddingHorizontal: 0 }}
            onChangeText={(value) => {
              setApiKey(value);
              setError("");
            }}
            disabled={busy}
          />
          {!!apiKey.trim() && (
            <Text
              accessibilityLiveRegion="polite"
              style={{
                color: keyController ? theme.colors.grey2 : theme.colors.error,
                fontSize: 14,
              }}
            >
              {keyController
                ? `Connect as ${keyController.name} in ${house.name}.`
                : keyInfo.error}
            </Text>
          )}
          <Button
            loading={pairing.isPending}
            disabled={!keyController || !address || busy}
            onPress={() => void pair()}
          >
            Connect controller
          </Button>
          <View style={{ gap: 8, paddingTop: 8 }}>
            <Text
              style={{
                color: theme.colors.grey2,
                fontSize: 14,
                lineHeight: 22,
              }}
            >
              Need a key? Add a named controller in this house on the website,
              then copy its API key.
            </Text>
            <Button
              type="outline"
              disabled={busy}
              onPress={() => void openWebsite()}
            >
              Get a controller key
            </Button>
            <Button
              type="clear"
              disabled={busy}
              loading={controllersQuery.isFetching}
              onPress={() => void controllersQuery.refetch()}
            >
              Refresh controller entries
            </Button>
            {controllersQuery.isError && (
              <Text
                accessibilityRole="alert"
                style={{ color: theme.colors.error }}
              >
                Couldn&apos;t load controller entries. Refresh to try again.
              </Text>
            )}
          </View>
        </>
      ) : (
        <>
          <Text style={{ color: theme.colors.grey2, fontSize: 13 }}>
            Step 1 of 2 - Nearby controllers
          </Text>
          {permissionDenied ? (
            <>
              <ChoiceRow
                icon="wifi-off"
                title="Allow local network access"
                detail="Enable access in your phone settings to find your Pi."
              />
              <Button
                type="outline"
                onPress={() => {
                  void Linking.openSettings().catch(() =>
                    setError(
                      "Open your phone settings and enable local network access for Control Nest.",
                    ),
                  );
                }}
              >
                Open phone settings
              </Button>
            </>
          ) : (
            <>
              <View style={{ gap: 12 }}>
                {devices.map((item) => (
                  <ChoiceRow
                    key={item.name}
                    title={item.name}
                    icon="cpu"
                    disabled={!item.addresses[0]}
                    detail={
                      !item.addresses[0]
                        ? "Waiting for a network address"
                        : item.service.txt.configured === "true"
                          ? "Already configured - reconnect with a key"
                          : "Ready for setup"
                    }
                    onPress={() => {
                      setDevice(item);
                      setError("");
                    }}
                  />
                ))}
                {!devices.length &&
                  (isScanning && !scanTimedOut && !discoveryError ? (
                    <>
                      <LoadingSkeleton height={84} width="100%" />
                      <Text
                        accessibilityLiveRegion="polite"
                        style={{ color: theme.colors.grey2 }}
                      >
                        Looking for nearby controllers...
                      </Text>
                    </>
                  ) : (
                    <ChoiceRow
                      icon="wifi"
                      title="No Pi found yet"
                      detail="Check that your Pi is powered on, AutoPiHub is running, and both devices use the same Wi-Fi."
                    />
                  ))}
              </View>
              <Button
                type="clear"
                onPress={() => {
                  setScanTimedOut(false);
                  setScanAttempt((value) => value + 1);
                  restart();
                }}
              >
                Search again
              </Button>
              {(scanTimedOut || discoveryError) && (
                <Text style={{ color: theme.colors.grey2, lineHeight: 22 }}>
                  Discovery keeps looking while this page is open. Check local
                  network access in phone settings. You can also connect with
                  the setup script on the Pi.
                </Text>
              )}
            </>
          )}
        </>
      )}
    </FlowScreen>
  );
}
