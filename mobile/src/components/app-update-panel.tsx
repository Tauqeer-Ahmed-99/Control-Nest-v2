import { Button, Text, useTheme } from "@rneui/themed";
import { Linking, Platform, View } from "react-native";
import { useState } from "react";
import * as Updates from "expo-updates";
import { compareVersions, releaseMetadata } from "@/constants/release";
import { useRelease } from "@/providers/release-provider";

export function useMobileCompatibility() {
  const { policy } = useRelease();
  const native =
    Platform.OS === "android" || Platform.OS === "ios"
      ? policy?.mobile[Platform.OS]
      : null;
  const nativeRequired = Boolean(
    native &&
    ((native.runtimes.length &&
      !native.runtimes.includes(releaseMetadata.runtime)) ||
      compareVersions(releaseMetadata.build, String(native.minimumBuild)) < 0),
  );
  return {
    required: Boolean(
      policy &&
      (compareVersions(releaseMetadata.release, policy.minimumMobile) < 0 ||
        !policy.apiContracts.includes(releaseMetadata.apiContract) ||
        nativeRequired),
    ),
    nativeRequired,
    installUrl: native?.installUrl,
  };
}

export default function AppUpdatePanel() {
  const { theme } = useTheme();
  const {
    policy,
    observedAt,
    offline,
    policyError,
    checking,
    pending,
    otaError,
    refresh,
    restart,
  } = useRelease();
  const { required, nativeRequired, installUrl } = useMobileCompatibility();
  const [linkError, setLinkError] = useState("");
  return (
    <View style={{ gap: 14 }}>
      <Text
        accessibilityRole="header"
        style={{ fontSize: 22, fontFamily: "Lexend_600SemiBold" }}
      >
        {required ? "App update required" : "App updates"}
      </Text>
      <Text>
        Running {releaseMetadata.release} · Installed binary{" "}
        {releaseMetadata.binaryVersion} ({releaseMetadata.build})
      </Text>
      <Text style={{ color: theme.colors.grey2 }}>
        Runtime {releaseMetadata.runtime}
        {policy ? ` · Policy ${policy.revision}` : ""}
      </Text>
      {required && (
        <Text>
          Version {policy?.minimumMobile} or later is required.
          {nativeRequired
            ? " Install a new app build for this device."
            : " Apply a compatible app update to continue."}
        </Text>
      )}
      <Text>
        {offline
          ? "Offline. Keeping the last verified update requirements."
          : "Checks for compatible app updates when you open the app or return to it."}
        {observedAt
          ? ` Policy checked ${new Date(observedAt).toLocaleString()}.`
          : ""}
      </Text>
      {!!policyError && (
        <Text accessibilityRole="alert" style={{ color: theme.colors.warning }}>
          {policyError}
        </Text>
      )}
      {!!otaError && (
        <Text accessibilityRole="alert" style={{ color: theme.colors.error }}>
          {otaError}
        </Text>
      )}
      {!Updates.isEnabled && (
        <Text>
          Install an OTA-enabled app build to enable automatic updates.
        </Text>
      )}
      {pending && (
        <>
          <Text>
            An app update is downloaded. Finish your current action, then
            restart to apply it.
          </Text>
          <Button onPress={() => void restart()}>
            Restart and apply update
          </Button>
        </>
      )}
      <Button
        type="outline"
        loading={checking}
        disabled={checking}
        onPress={() => void refresh()}
      >
        Check for updates
      </Button>
      {installUrl && (
        <Button
          onPress={async () => {
            try {
              setLinkError("");
              if (!installUrl.startsWith("https://")) throw new Error();
              await Linking.openURL(installUrl);
            } catch {
              setLinkError("Could not open the app installation link.");
            }
          }}
        >
          Install app build
        </Button>
      )}
      {!!linkError && (
        <Text accessibilityRole="alert" style={{ color: theme.colors.error }}>
          {linkError}
        </Text>
      )}
    </View>
  );
}
