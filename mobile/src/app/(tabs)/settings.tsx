import Tile from "@/components/tile";
import LoadingSkeleton from "@/components/loading-skeleton";
import {
  CONTROLLER_DEVICE_CONFIG,
  CONTROLLER_DEVICE_URL,
} from "@/constants/storage";
import useControllerHealth from "@/hooks/use-controller-health";
import {
  useGetMobileStorageData,
  useSetMobileStorageData,
} from "@/hooks/use-mobile-storage-data";
import { ControllerConfig } from "@/models/controller-config";
import {
  ThemeMode,
  useThemePreference,
} from "@/providers/theme-preference-provider";
import { getTypedRoute, Routes } from "@/routes/routes";
import { useClerk, useUser } from "@clerk/expo";
import AntDesign from "@expo/vector-icons/AntDesign";
import Entypo from "@expo/vector-icons/Entypo";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { BottomSheet, Button, Text, useTheme } from "@rneui/themed";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useState } from "react";
import { Easing, ScrollView, TouchableOpacity, View } from "react-native";

const CONFIRMATION_SHEET_ANIMATION_DURATION = 260;
const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

enum SettingOption {
  HouseMembers = "House members",
  Observability = "Request history",
  LogoutUser = "Logout User",
  LogoutHouse = "Logout House",
  AboutUs = "About Us",
}

interface SettingItem {
  option: SettingOption;
  label: React.ReactNode;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  onAction?: () => void | Promise<void>;
  requiresConfirmation?: boolean;
}

const Settings = () => {
  const { signOut } = useClerk();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { data: config, isLoading: isLoadingConfig } =
    useGetMobileStorageData<ControllerConfig>(CONTROLLER_DEVICE_CONFIG);
  const { mutateAsync: setControllerConfig } = useSetMobileStorageData<null>(
    CONTROLLER_DEVICE_CONFIG,
  );
  const { mutateAsync: setControllerDvcUrl } = useSetMobileStorageData<null>(
    CONTROLLER_DEVICE_URL,
  );
  const [selectedSetting, setSelectedSetting] = useState<SettingItem | null>(
    null,
  );
  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();
  const { themeMode, setThemeMode } = useThemePreference();
  const {
    data: health,
    isLoading: isCheckingHealth,
    isFetching: isRefreshingHealth,
    refetch: refreshHealth,
  } = useControllerHealth();
  const queryClient = useQueryClient();

  const controllerUrl = config?.tunnel?.hostname
    ? `https://${config.tunnel.hostname}`
    : null;
  const isConfigured = Boolean(
    config?.house?.name && config?.controllerDevice?.name && controllerUrl,
  );
  const isHealthy = health?.success === true && health.data.health === "ok";
  const isHealthBusy = isCheckingHealth || isRefreshingHealth;
  const isInitialHealthLoading = isLoadingConfig || isCheckingHealth;
  const healthStatus =
    isLoadingConfig || isHealthBusy
      ? "Checking"
      : !isConfigured
        ? "Not connected"
        : isHealthy
          ? "Online"
          : "Offline";
  const healthColor = isHealthBusy
    ? theme.colors.success
    : !isConfigured
      ? theme.colors.grey2
      : isHealthy
        ? theme.colors.success
        : theme.colors.error;
  const healthMessage =
    isLoadingConfig || isHealthBusy
      ? "Checking the controller connection now."
      : !isConfigured
        ? "Connect a controller to see its live health."
        : isHealthy
          ? "Your controller is responding normally."
          : "The controller is not responding. Check its connection and try again.";

  const closeConfirmation = () => {
    setIsConfirmationVisible(false);
  };

  const settings: SettingItem[] = [
    {
      option: SettingOption.HouseMembers,
      label: "House members",
      iconLeft: (
        <MaterialIcons
          name="people-outline"
          size={20}
          color={theme.colors.success}
        />
      ),
      iconRight: (
        <MaterialIcons name="keyboard-arrow-right" size={24} color="grey" />
      ),
      onAction: () => router.push(getTypedRoute(Routes.HouseMembers)),
      requiresConfirmation: false,
    },
    {
      option: SettingOption.Observability,
      label: "Request history",
      iconLeft: (
        <MaterialIcons
          name="timeline"
          size={20}
          color={theme.colors.success}
        />
      ),
      iconRight: (
        <MaterialIcons name="keyboard-arrow-right" size={24} color="grey" />
      ),
      onAction: () => router.push(getTypedRoute(Routes.Observability)),
      requiresConfirmation: false,
    },
    {
      option: SettingOption.LogoutHouse,
      label: "Disconnect this home",
      iconLeft: (
        <FontAwesome6
          name="house-circle-xmark"
          size={20}
          color={theme.colors.success}
        />
      ),
      iconRight: (
        <MaterialIcons name="keyboard-arrow-right" size={24} color="grey" />
      ),
      onAction: async () => {
        setIsLoading(true);
        try {
          await Promise.all([
            setControllerConfig(null),
            setControllerDvcUrl(null),
          ]);
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: ["mobile-storage", CONTROLLER_DEVICE_CONFIG],
            }),
            queryClient.invalidateQueries({
              queryKey: ["mobile-storage", CONTROLLER_DEVICE_URL],
            }),
          ]);
          closeConfirmation();
          router.replace(getTypedRoute(Routes.Auth));
        } finally {
          setIsLoading(false);
        }
      },
    },
    {
      option: SettingOption.LogoutUser,
      label: "Log out",
      iconLeft: (
        <AntDesign name="logout" size={20} color={theme.colors.success} />
      ),
      iconRight: (
        <MaterialIcons name="keyboard-arrow-right" size={24} color="grey" />
      ),
      onAction: async () => {
        setIsLoading(true);
        try {
          await signOut();
        } finally {
          setIsLoading(false);
        }
      },
    },
    {
      option: SettingOption.AboutUs,
      label: "About us",
      iconLeft: (
        <Entypo
          name="info-with-circle"
          size={20}
          color={theme.colors.success}
        />
      ),
      iconRight: (
        <MaterialIcons name="keyboard-arrow-right" size={24} color="grey" />
      ),
      onAction: () => {},
    },
  ];

  const getConfirmationMessage = () => {
    switch (selectedSetting?.option) {
      case SettingOption.LogoutUser:
        return "Are you sure you want to log out of this account?";
      case SettingOption.LogoutHouse:
        return "This will remove the saved home and controller from this device. Continue?";
      case SettingOption.AboutUs:
        return "Open the about page?";
      default:
        return "Are you sure?";
    }
  };

  const accountName = user?.fullName ?? user?.firstName ?? "Signed-in account";
  const accountEmail = user?.emailAddresses[0]?.emailAddress;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.primary,
      }}
    >
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 132,
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 8 }}>
          <Text
            style={{
              color: theme.colors.grey2,
              fontSize: 12,
              fontFamily: "Lexend_600SemiBold",
              letterSpacing: 1.2,
            }}
          >
            APPEARANCE
          </Text>

          <View
            style={{
              backgroundColor: theme.colors.secondary,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: theme.colors.grey5,
              padding: 18,
              gap: 14,
            }}
          >
            <View style={{ gap: 4 }}>
              <Text style={{ fontFamily: "Lexend_600SemiBold", fontSize: 16 }}>
                Theme
              </Text>
              <Text style={{ color: theme.colors.grey2, fontSize: 12 }}>
                Follow your device settings or choose a fixed theme.
              </Text>
            </View>

            <View style={{ flexDirection: "row", gap: 8 }}>
              {THEME_OPTIONS.map(({ value, label }) => {
                const isSelected = themeMode === value;

                return (
                  <TouchableOpacity
                    key={value}
                    accessibilityRole="button"
                    accessibilityLabel={`${label} theme`}
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => setThemeMode(value)}
                    activeOpacity={0.75}
                    style={{
                      flex: 1,
                      minHeight: 48,
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 4,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: isSelected
                        ? theme.colors.success
                        : theme.colors.greyOutline,
                      backgroundColor: isSelected
                        ? theme.colors.success
                        : theme.colors.primary,
                    }}
                  >
                    <Text
                      style={{
                        color: isSelected
                          ? theme.mode === "dark"
                            ? "#10201A"
                            : "#FFFFFF"
                          : theme.colors.black,
                        fontFamily: "Lexend_600SemiBold",
                        fontSize: 13,
                      }}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <Text
            style={{
              color: theme.colors.grey2,
              fontSize: 12,
              fontFamily: "Lexend_600SemiBold",
              letterSpacing: 1.2,
            }}
          >
            SYSTEM HEALTH
          </Text>

          <View
            style={{
              backgroundColor: theme.colors.secondary,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: theme.colors.grey5,
              padding: 18,
              gap: 16,
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
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor:
                    theme.mode === "dark"
                      ? "rgba(104, 212, 181, 0.14)"
                      : "rgba(18, 107, 91, 0.10)",
                }}
              >
                <Feather
                  name="activity"
                  size={24}
                  color={theme.colors.success}
                />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text
                  style={{ fontSize: 17, fontFamily: "Lexend_600SemiBold" }}
                >
                  Controller connection
                </Text>
                {isInitialHealthLoading ? (
                  <LoadingSkeleton height={12} width="88%" borderRadius={5} />
                ) : (
                  <Text style={{ color: theme.colors.grey2, fontSize: 12 }}>
                    {healthMessage}
                  </Text>
                )}
              </View>
            </View>

            <View
              style={{
                height: 1,
                backgroundColor: theme.colors.grey5,
              }}
            />

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                {isInitialHealthLoading ? (
                  <>
                    <LoadingSkeleton height={13} width="37%" />
                    <LoadingSkeleton height={26} width={82} borderRadius={99} />
                  </>
                ) : (
                  <>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 9,
                      }}
                    >
                      <View
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: 5,
                          backgroundColor: healthColor,
                        }}
                      />
                      <Text style={{ color: theme.colors.grey2, fontSize: 13 }}>
                        {isConfigured ? "Controller API" : "Controller setup"}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor: `${healthColor}1F`,
                        paddingHorizontal: 11,
                        paddingVertical: 6,
                        borderRadius: 99,
                      }}
                    >
                      <Text
                        style={{
                          color: healthColor,
                          fontSize: 12,
                          fontFamily: "Lexend_600SemiBold",
                        }}
                      >
                        {healthStatus}
                      </Text>
                    </View>
                  </>
                )}
            </View>

            {isInitialHealthLoading ? (
              <LoadingSkeleton height={16} width={106} borderRadius={5} />
            ) : (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Check controller health again"
                disabled={!isConfigured || isHealthBusy}
                onPress={() => void refreshHealth()}
                activeOpacity={0.7}
                style={{
                  alignSelf: "flex-start",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  opacity: !isConfigured || isHealthBusy ? 0.55 : 1,
                  paddingVertical: 2,
                }}
              >
                <Feather
                  name="refresh-cw"
                  size={15}
                  color={theme.colors.success}
                  style={
                    isHealthBusy
                      ? { transform: [{ rotate: "-30deg" }] }
                      : undefined
                  }
                />
                <Text
                  style={{
                    color: theme.colors.success,
                    fontSize: 13,
                    fontFamily: "Lexend_500Medium",
                  }}
                >
                  {isHealthBusy ? "Checking…" : "Check again"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <Text
            style={{
              color: theme.colors.grey2,
              fontSize: 12,
              fontFamily: "Lexend_600SemiBold",
              letterSpacing: 1.2,
            }}
          >
            YOUR SETUP
          </Text>

          <View
            style={{
              backgroundColor: theme.colors.secondary,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: theme.colors.grey5,
              padding: 18,
              gap: 17,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <Feather name="home" size={18} color={theme.colors.success} />
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ color: theme.colors.grey2, fontSize: 12 }}>
                  Home
                </Text>
                {isLoadingConfig ? (
                  <LoadingSkeleton height={14} width="62%" borderRadius={5} />
                ) : (
                  <Text
                    style={{ fontFamily: "Lexend_500Medium" }}
                    numberOfLines={1}
                  >
                    {config?.house?.name ?? "Not connected"}
                  </Text>
                )}
              </View>
            </View>

            <View
              style={{
                height: 1,
                backgroundColor: theme.colors.grey5,
                marginLeft: 30,
              }}
            />

            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <Feather name="cpu" size={18} color={theme.colors.success} />
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ color: theme.colors.grey2, fontSize: 12 }}>
                  Controller device
                </Text>
                {isLoadingConfig ? (
                  <LoadingSkeleton height={14} width="71%" borderRadius={5} />
                ) : (
                  <Text
                    style={{ fontFamily: "Lexend_500Medium" }}
                    numberOfLines={1}
                  >
                    {config?.controllerDevice?.name ?? "Not connected"}
                  </Text>
                )}
              </View>
            </View>

            <View
              style={{
                height: 1,
                backgroundColor: theme.colors.grey5,
                marginLeft: 30,
              }}
            />

            <View style={{ gap: 9 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <Feather name="globe" size={18} color={theme.colors.success} />
                <Text style={{ color: theme.colors.grey2, fontSize: 12 }}>
                  Controller device URL
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: theme.colors.primary,
                  borderRadius: 12,
                  paddingHorizontal: 13,
                  paddingVertical: 12,
                  marginLeft: 30,
                }}
              >
                {isLoadingConfig ? (
                  <LoadingSkeleton height={18} width="78%" borderRadius={5} />
                ) : (
                  <Text
                    selectable
                    accessibilityLabel="Controller device URL"
                    style={{
                      color: controllerUrl
                        ? theme.colors.success
                        : theme.colors.grey3,
                      fontSize: 13,
                      lineHeight: 20,
                      fontFamily: "Lexend_500Medium",
                    }}
                  >
                    {controllerUrl ?? "No controller URL saved"}
                  </Text>
                )}
                {Boolean(controllerUrl) && (
                  <Text
                    style={{
                      color: theme.colors.grey3,
                      fontSize: 10,
                      marginTop: 6,
                    }}
                  >
                    Press and hold the address to copy it.
                  </Text>
                )}
              </View>
            </View>

            <View
              style={{
                height: 1,
                backgroundColor: theme.colors.grey5,
                marginLeft: 30,
              }}
            />

            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <Feather name="user" size={18} color={theme.colors.success} />
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ color: theme.colors.grey2, fontSize: 12 }}>
                  Signed in as
                </Text>
                {isUserLoaded ? (
                  <Text
                    style={{ fontFamily: "Lexend_500Medium" }}
                    numberOfLines={1}
                  >
                    {accountName}
                  </Text>
                ) : (
                  <LoadingSkeleton height={14} width="57%" borderRadius={5} />
                )}
                {isUserLoaded && Boolean(accountEmail) ? (
                  <Text
                    style={{ color: theme.colors.grey2, fontSize: 12 }}
                    numberOfLines={1}
                  >
                    {accountEmail}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <Text
            style={{
              color: theme.colors.grey2,
              fontSize: 12,
              fontFamily: "Lexend_600SemiBold",
              letterSpacing: 1.2,
            }}
          >
            ACCOUNT
          </Text>
          {settings.map((setting) => (
            <TouchableOpacity
              key={setting.option}
              accessibilityRole="button"
              onPress={() => {
                if (setting.requiresConfirmation === false) {
                  void setting.onAction?.();
                  return;
                }

                setSelectedSetting(setting);
                setIsConfirmationVisible(true);
              }}
              activeOpacity={0.75}
            >
              <Tile>
                <View
                  style={{
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexDirection: "row",
                  }}
                >
                  <View
                    style={{
                      alignItems: "center",
                      gap: 12,
                      flexDirection: "row",
                    }}
                  >
                    <View
                      style={{
                        width: 30,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      {setting.iconLeft}
                    </View>
                    <Text>{setting.label}</Text>
                  </View>
                  {setting.iconRight}
                </View>
              </Tile>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <BottomSheet
        isVisible={isConfirmationVisible}
        animationType="slide"
        animationDuration={CONFIRMATION_SHEET_ANIMATION_DURATION}
        easing={Easing.out(Easing.cubic)}
        onBackdropPress={closeConfirmation}
      >
        <View
          style={{
            padding: 18,
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            backgroundColor: theme.colors.secondary,
            gap: 18,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "center",
              gap: 16,
            }}
          >
            {selectedSetting?.iconLeft}
            <Text style={{ fontSize: 20 }}>{selectedSetting?.label}</Text>
          </View>
          <Text>{getConfirmationMessage()}</Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Button
              type="clear"
              disabled={isLoading}
              onPress={closeConfirmation}
            >
              Cancel
            </Button>
            <Button
              color={
                selectedSetting?.option === SettingOption.LogoutUser ||
                selectedSetting?.option === SettingOption.LogoutHouse
                  ? "error"
                  : "success"
              }
              loading={isLoading}
              onPress={() => void selectedSetting?.onAction?.()}
            >
              Yes
            </Button>
          </View>
        </View>
      </BottomSheet>
    </View>
  );
};

export default Settings;
