import Header from "@/components/header";
import InputField from "@/components/input-field";
import {
  CONTROLLER_DEVICE_CONFIG,
  CONTROLLER_DEVICE_PASSWORDS,
} from "@/constants/storage";
import { useAutoPiDiscovery } from "@/hooks/use-autopi-discovery";
import useControllerHealth from "@/hooks/use-controller-health";
import {
  useGetMobileStorageData,
  useSetMobileStorageData,
} from "@/hooks/use-mobile-storage-data";
import usePassword from "@/hooks/use-password";
import { ControllerConfig } from "@/models/controller-config";
import { configControllerOnLocalNetwork } from "@/utils/local-network";
import { useAuth } from "@clerk/expo";
import Feather from "@expo/vector-icons/Feather";
import { Button, Text, useTheme } from "@rneui/themed";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";

const HouseLogin = () => {
  const { userId, getToken } = useAuth();
  const { devices } = useAutoPiDiscovery();
  const [device, setDevice] = useState<(typeof devices)[number] | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSettingUpConfig, setIsSettingUpConfig] = useState(false);
  const [step, setStep] = useState<"controller" | "password">("controller");
  const [pendingConfig, setPendingConfig] = useState<ControllerConfig | null>(
    null,
  );
  const styles = useStyles();
  const { isLoading: isGettingLocalControllerConfig } =
    useGetMobileStorageData<ControllerConfig>(CONTROLLER_DEVICE_CONFIG);
  const { data: savedPasswords, isLoading: isGettingSavedPasswords } =
    useGetMobileStorageData<Record<string, string>>(
      CONTROLLER_DEVICE_PASSWORDS,
    );
  const { mutateAsync: saveControllerConfigLocal } =
    useSetMobileStorageData<ControllerConfig>(CONTROLLER_DEVICE_CONFIG);
  const { mutateAsync: saveControllerPasswords } = useSetMobileStorageData<
    Record<string, string>
  >(CONTROLLER_DEVICE_PASSWORDS);
  const { mutateAsync: setOrCheckPassword } = usePassword();
  const {
    data,
    isLoading: isCheckingControllerHealth,
    refetch: recheckHealth,
  } = useControllerHealth();

  const queryClient = useQueryClient();
  const router = useRouter();

  const isLoading =
    isCheckingControllerHealth ||
    isGettingLocalControllerConfig ||
    isGettingSavedPasswords;
  const isHealthy = data?.details == null && data?.data?.health === "ok";
  const isConfigured = device?.service.txt.configured === "true";
  const isSaving = isSettingUpConfig;

  const {
    theme: {
      colors: { grey2, grey3, grey5, secondary },
    },
  } = useTheme();

  useEffect(() => {
    if (__DEV__) {
      console.log("data?.details", data?.details);
      console.log("data?.data?.health", data?.data?.health);
      console.log("healthy", isHealthy);
    }
  }, [data?.data?.health, data?.details, isHealthy]);

  useEffect(() => {
    if (isHealthy) {
      router.replace("/(tabs)/home");
    }
  }, [isHealthy, router]);

  const showError = useCallback((error: Error) => {
    ToastAndroid.show(error.message, ToastAndroid.LONG);
  }, []);

  const continueToPassword = useCallback(async () => {
    if (!device) {
      showError(new Error("Select a controller first."));
      return;
    }

    const ip = device.addresses.at(0);
    const port = device.port;

    if (!ip) {
      showError(new Error("Controller IP address is unavailable."));
      return;
    }

    if (!port) {
      showError(new Error("Controller port is unavailable."));
      return;
    }

    try {
      setIsSettingUpConfig(true);
      const token = `Bearer ${await getToken()}`;
      const config = await configControllerOnLocalNetwork({
        localNetworkUrl: `http://${ip}:${port}`,
        userId: userId as string,
        controllerName: name,
        token,
      });

      setPassword(savedPasswords?.[config.controllerDevice.id] ?? "");
      setIsPasswordVisible(false);
      setPendingConfig(config);
      setStep("password");
    } catch (error) {
      showError(
        error instanceof Error
          ? error
          : new Error("Unable to configure controller."),
      );
    } finally {
      setIsSettingUpConfig(false);
    }
  }, [device, getToken, name, savedPasswords, showError, userId]);

  const initAndConnect = useCallback(async () => {
    if (!pendingConfig) {
      showError(new Error("Configure the controller before setting a password."));
      return;
    }

    if (!password) {
      showError(new Error("Enter the controller password."));
      return;
    }

    try {
      setIsSettingUpConfig(true);
      await setOrCheckPassword({
        controllerDeviceId: pendingConfig.controllerDevice.id,
        controllerDevicePassword: password,
      });

      await saveControllerPasswords({
        ...(savedPasswords ?? {}),
        [pendingConfig.controllerDevice.id]: password,
      });
      await queryClient.invalidateQueries({
        queryKey: ["mobile-storage", CONTROLLER_DEVICE_PASSWORDS],
      });

      await saveControllerConfigLocal(pendingConfig);
      await queryClient.invalidateQueries({
        queryKey: ["mobile-storage", CONTROLLER_DEVICE_CONFIG],
      });
      await recheckHealth();
    } catch (error) {
      showError(
        error instanceof Error
          ? error
          : new Error("Unable to configure controller."),
      );
    } finally {
      setIsSettingUpConfig(false);
    }
  }, [
    password,
    pendingConfig,
    queryClient,
    recheckHealth,
    saveControllerPasswords,
    saveControllerConfigLocal,
    savedPasswords,
    setOrCheckPassword,
    showError,
  ]);

  const onSaveAndConfig = useCallback(() => {
    void initAndConnect();
  }, [initAndConnect]);

  const selectDevice = useCallback(
    (selectedDevice: (typeof devices)[number]) => {
      setDevice(selectedDevice);
      setName(selectedDevice.name);
      setPassword("");
      setIsPasswordVisible(false);
      setPendingConfig(null);
      setStep("controller");
    },
    [],
  );

  const closeDevice = useCallback(() => {
    setDevice(null);
    setName("");
    setPassword("");
    setIsPasswordVisible(false);
    setPendingConfig(null);
    setStep("controller");
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Header skeleton */}
          <View
            style={{
              height: 28,
              width: 220,
              borderRadius: 6,
              backgroundColor: grey3,
              marginTop: 16,
              marginBottom: 20,
            }}
          />

          {/* Device card skeletons */}
          <View style={styles.deviceList}>
            {[1, 2, 3].map((item) => (
              <View
                key={item}
                style={[
                  styles.deviceCard,
                  {
                    backgroundColor: secondary,
                    borderColor: grey5,
                    borderWidth: 1,
                  },
                ]}
              >
                {/* Device icon */}
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    backgroundColor: grey3,
                  }}
                />

                {/* Device information */}
                <View style={styles.deviceInfo}>
                  <View
                    style={{
                      height: 16,
                      width: item === 2 ? "65%" : "75%",
                      borderRadius: 5,
                      backgroundColor: grey3,
                    }}
                  />

                  <View style={styles.deviceAddressRow}>
                    <View
                      style={{
                        width: 13,
                        height: 13,
                        borderRadius: 7,
                        backgroundColor: grey3,
                      }}
                    />

                    <View
                      style={{
                        height: 12,
                        width: "85%",
                        borderRadius: 4,
                        backgroundColor: grey3,
                      }}
                    />
                  </View>

                  <View style={styles.deviceStatusRow}>
                    <View
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: 4,
                        backgroundColor: grey3,
                      }}
                    />

                    <View
                      style={{
                        height: 12,
                        width: 90,
                        borderRadius: 4,
                        backgroundColor: grey3,
                      }}
                    />
                  </View>
                </View>

                {/* Selection indicator */}
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: grey3,
                  }}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Bottom-sheet form skeleton */}
        <View style={styles.bottomSheet}>
          <View
            style={{
              paddingVertical: 12,
              paddingHorizontal: 24,
              width: "100%",
            }}
          >
            {/* Sheet header */}
            <View style={styles.header}>
              <View
                style={{
                  width: 140,
                  height: 28,
                  borderRadius: 6,
                  backgroundColor: grey3,
                }}
              />

              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: grey3,
                }}
              />
            </View>

            {/* Input skeleton */}
            <View style={{ width: "100%", alignItems: "center" }}>
              <View style={{ width: "100%", marginBottom: 24 }}>
                <View
                  style={{
                    height: 14,
                    width: 160,
                    borderRadius: 4,
                    backgroundColor: grey3,
                    marginBottom: 10,
                  }}
                />

                <View
                  style={{
                    width: "100%",
                    height: 52,
                    borderRadius: 10,
                    backgroundColor: grey3,
                  }}
                />
              </View>

              {/* Button skeleton */}
              <View
                style={{
                  width: 240,
                  height: 48,
                  borderRadius: 25,
                  backgroundColor: grey3,
                  marginBottom: 24,
                }}
              />
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Header heading="Available Devices" />
        <FlatList
          data={devices}
          keyExtractor={(item) => item.name}
          contentContainerStyle={styles.deviceList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isSelected = device?.name === item.name;
            const configured = item.service.txt.configured === "true";
            const address = item.addresses.at(0);

            return (
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => selectDevice(item)}
                style={[
                  styles.deviceCard,
                  {
                    backgroundColor: secondary,
                    borderColor: isSelected ? "#3e31ab" : grey5,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
              >
                <View style={styles.deviceIcon}>
                  <Feather
                    name="cpu"
                    size={24}
                    color={isSelected ? "#3e31ab" : grey2}
                  />
                </View>

                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceName} numberOfLines={1}>
                    {item.name}
                  </Text>

                  <View style={styles.deviceAddressRow}>
                    <Feather name="globe" size={13} color={grey2} />
                    <Text
                      style={[styles.deviceAddress, { color: grey2 }]}
                      numberOfLines={1}
                    >
                      {address
                        ? `${address}:${item.port}`
                        : "Address unavailable"}
                    </Text>
                  </View>

                  <View style={styles.deviceStatusRow}>
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor: configured ? "#16a34a" : "#d97706",
                        },
                      ]}
                    />

                    <Text
                      style={[
                        styles.deviceStatus,
                        {
                          color: configured ? "#16a34a" : "#d97706",
                        },
                      ]}
                    >
                      {configured ? "Configured" : "Setup required"}
                    </Text>
                  </View>
                </View>

                <View style={styles.deviceAction}>
                  <Feather
                    name={isSelected ? "check-circle" : "chevron-right"}
                    size={22}
                    color={isSelected ? "#3e31ab" : grey3}
                  />
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Feather name="wifi" size={30} color={grey2} />
              </View>

              <Text style={styles.emptyTitle}>Searching for AutoPi Hub</Text>

              <Text style={[styles.emptyDescription, { color: grey2 }]}>
                Make sure your controller is powered on and connected to the
                same Wi-Fi network.
              </Text>
            </View>
          }
        />
      </View>

      {Boolean(device) && (
        <View style={styles.bottomSheet}>
          <View
            style={{
              paddingVertical: 12,
              paddingHorizontal: 24,
              width: "100%",
            }}
          >
            <View style={styles.header}>
              <Text
                style={{
                  fontFamily: "Lexend_600SemiBold",
                  fontSize: 24,
                }}
              >
                {isConfigured ? "Connect" : "Configure"}
              </Text>
              <TouchableOpacity onPress={closeDevice}>
                <Feather name="x" size={24} color={grey3} />
              </TouchableOpacity>
            </View>
            <View style={styles.stepper}>
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    {
                      backgroundColor: "#3e31ab",
                      borderColor: "#3e31ab",
                    },
                  ]}
                >
                  <Text style={styles.stepNumber}>1</Text>
                </View>
                <Text style={[styles.stepLabel, { color: "#3e31ab" }]}>
                  Controller
                </Text>
              </View>
              <View
                style={[
                  styles.stepLine,
                  {
                    backgroundColor: step === "password" ? "#3e31ab" : grey5,
                  },
                ]}
              />
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    {
                      backgroundColor:
                        step === "password" ? "#3e31ab" : secondary,
                      borderColor: step === "password" ? "#3e31ab" : grey5,
                    },
                  ]}
                >
                  <Text style={styles.stepNumber}>2</Text>
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    { color: step === "password" ? "#3e31ab" : grey3 },
                  ]}
                >
                  Password
                </Text>
              </View>
            </View>
            <View
              style={{
                width: "100%",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {step === "controller" ? (
                <ControllerDetailsStep
                  name={name}
                  isConfigured={isConfigured}
                  isSaving={isSaving}
                  styles={styles}
                  onNameChange={(text) => {
                    setName(text);
                    setPendingConfig(null);
                  }}
                  onContinue={() => void continueToPassword()}
                />
              ) : (
                <ControllerPasswordStep
                  password={password}
                  isPasswordVisible={isPasswordVisible}
                  isConfigured={isConfigured}
                  isSaving={isSaving}
                  canSubmit={Boolean(password.trim() && pendingConfig)}
                  styles={styles}
                  onPasswordChange={setPassword}
                  onTogglePasswordVisibility={() =>
                    setIsPasswordVisible((isVisible) => !isVisible)
                  }
                  onBack={() => {
                    setIsPasswordVisible(false);
                    setStep("controller");
                  }}
                  onSubmit={onSaveAndConfig}
                />
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default HouseLogin;

const useStyles = () => {
  const {
    theme: {
      colors: { primary, secondary },
    },
  } = useTheme();

  return StyleSheet.create({
    container: {
      height: "100%",
      backgroundColor: primary,
    },
    content: {
      paddingHorizontal: 12,
      backgroundColor: primary,
      height: "100%",
      width: "100%",
    },
    deviceList: {
      paddingTop: 16,
      paddingBottom: 280,
      gap: 12,
    },
    deviceCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderRadius: 16,
      gap: 14,
    },
    deviceIcon: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: "rgba(62, 49, 171, 0.10)",
      alignItems: "center",
      justifyContent: "center",
    },
    deviceInfo: {
      flex: 1,
      gap: 6,
    },
    deviceName: {
      fontFamily: "Lexend_600SemiBold",
      fontSize: 16,
    },
    deviceAddressRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    deviceAddress: {
      flex: 1,
      fontFamily: "Lexend_400Regular",
      fontSize: 12,
    },
    deviceStatusRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 2,
    },
    statusDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    deviceStatus: {
      fontFamily: "Lexend_400Regular",
      fontSize: 12,
    },
    deviceAction: {
      alignItems: "center",
      justifyContent: "center",
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 28,
      paddingTop: 64,
    },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: 20,
      backgroundColor: "rgba(128, 128, 128, 0.12)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
    },
    emptyTitle: {
      fontFamily: "Lexend_600SemiBold",
      fontSize: 17,
      textAlign: "center",
      marginBottom: 8,
    },
    emptyDescription: {
      fontFamily: "Lexend_400Regular",
      fontSize: 13,
      lineHeight: 20,
      textAlign: "center",
    },
    bottomSheet: {
      backgroundColor: secondary,
      height: "auto",
      width: "100%",
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      position: "absolute",
      bottom: 0,
      justifyContent: "center",
      alignItems: "center",
    },
    header: {
      width: "100%",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 24,
    },
    stepper: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      marginBottom: 16,
    },
    stepItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    stepLine: {
      width: 28,
      height: 2,
    },
    stepCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    stepNumber: {
      color: "#fff",
      fontSize: 12,
      fontFamily: "Lexend_600SemiBold",
    },
    stepLabel: {
      fontSize: 12,
      fontFamily: "Lexend_500Medium",
    },
    stepActions: {
      width: "100%",
      flexDirection: "column-reverse",
      justifyContent: "center",
      alignItems: "center",
      gap: 4,
    },
    button: {
      width: 240,
      borderRadius: 25,
      backgroundColor: "#3e31ab",
    },
    passwordButton: {
      width: 190,
      borderRadius: 25,
      backgroundColor: "#3e31ab",
    },
    buttonContainer: {
      elevation: 20,
      borderRadius: 25,
      shadowColor: "#3e31ab",
      marginBottom: 24,
    },
    buttonTitle: { fontFamily: "Lexend_400Regular" },
    backButtonTitle: {
      color: "#ffffff",
      fontFamily: "Lexend_500Medium",
    },
  });
};

type SetupStepStyles = ReturnType<typeof useStyles>;

type ControllerDetailsStepProps = {
  name: string;
  isConfigured: boolean;
  isSaving: boolean;
  styles: SetupStepStyles;
  onNameChange: (name: string) => void;
  onContinue: () => void;
};

const ControllerDetailsStep = ({
  name,
  isConfigured,
  isSaving,
  styles,
  onNameChange,
  onContinue,
}: ControllerDetailsStepProps) => (
  <>
    <InputField
      disabled={isConfigured}
      label="Controller Device Name"
      placeholder="Enter recognizable name..."
      value={name}
      onChangeText={onNameChange}
    />
    <Button
      size="lg"
      buttonStyle={styles.button}
      titleStyle={styles.buttonTitle}
      containerStyle={styles.buttonContainer}
      loading={isSaving}
      disabled={!name.trim() || isSaving}
      onPress={onContinue}
    >
      Continue
    </Button>
  </>
);

type ControllerPasswordStepProps = {
  password: string;
  isPasswordVisible: boolean;
  isConfigured: boolean;
  isSaving: boolean;
  canSubmit: boolean;
  styles: SetupStepStyles;
  onPasswordChange: (password: string) => void;
  onTogglePasswordVisibility: () => void;
  onBack: () => void;
  onSubmit: () => void;
};

const ControllerPasswordStep = ({
  password,
  isPasswordVisible,
  isConfigured,
  isSaving,
  canSubmit,
  styles,
  onPasswordChange,
  onTogglePasswordVisibility,
  onBack,
  onSubmit,
}: ControllerPasswordStepProps) => (
  <>
    <InputField
      label="Password"
      placeholder={
        isConfigured ? "Enter the password..." : "Set a new password..."
      }
      value={password}
      onChangeText={onPasswordChange}
      secureTextEntry={!isPasswordVisible}
      autoCapitalize="none"
      rightIcon={
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={
            isPasswordVisible ? "Hide password" : "Show password"
          }
          activeOpacity={0.7}
          onPress={onTogglePasswordVisibility}
        >
          <Feather
            name={isPasswordVisible ? "eye-off" : "eye"}
            color="#6e6b8c"
            size={20}
          />
        </TouchableOpacity>
      }
    />
    <View style={styles.stepActions}>
      <Button
        type="clear"
        disabled={isSaving}
        titleStyle={styles.backButtonTitle}
        onPress={onBack}
      >
        Back
      </Button>
      <Button
        size="lg"
        loading={isSaving}
        disabled={!canSubmit || isSaving}
        buttonStyle={styles.passwordButton}
        titleStyle={styles.buttonTitle}
        containerStyle={styles.buttonContainer}
        onPress={onSubmit}
      >
        {isConfigured ? "Login House" : "Set Password"}
      </Button>
    </View>
  </>
);
