import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@clerk/expo";
import { Button, Text, useTheme } from "@rneui/themed";
import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Alert,
  AppState,
  Linking,
  View,
} from "react-native";
import * as Crypto from "expo-crypto";
import useFirmware from "@/hooks/use-firmware";
import useApiQuery from "@/hooks/use-api-query";
import useApiMutation from "@/hooks/use-api-mutation";
import { APIResponse } from "@/models/api";
import { FirmwareJob, Signed, isTerminal, phaseLabel } from "@/models/firmware";
import * as SecureStore from "expo-secure-store";
import OfflineRecovery from "./offline-recovery";
import { ApiRoutes } from "@/routes/routes";
import { compareVersions } from "@/constants/release";
import { usePathname } from "expo-router";
type Pending = {
  idempotencyKey: string;
  targetVersion: string;
  operation: "update" | "rollback";
  jobId?: string;
};
type Start = Pending & { controllerDeviceId: string };

export default function FirmwareController({
  id,
  name,
  blocked,
  onBusy,
}: {
  id: string;
  name: string;
  blocked: boolean;
  onBusy: (id: string, busy: boolean) => void;
}) {
  const { theme } = useTheme();
  const { userId } = useAuth();
  const query = useFirmware(id);
  const firmware = query.data?.success ? query.data.data : null;
  const storageKey = `firmware-request:${userId}:${id}`;
  const [savedPending, setPending] = useState<Pending | null>(null);
  const [loadedKey, setLoadedKey] = useState("");
  const reconciled = loadedKey === storageKey;
  const pending = reconciled ? savedPending : null;
  const focused = usePathname() === "/firmware-updates";
  const [error, setError] = useState("");
  const [showRecovery, setShowRecovery] = useState(false);
  const [foreground, setForeground] = useState(
    AppState.currentState === "active",
  );
  const submitting = useRef(false);
  useEffect(() => {
    let current = true;
    void AsyncStorage.getItem(storageKey)
      .then((value) => {
        if (current) {
          setPending(value ? JSON.parse(value) : null);
          setLoadedKey(storageKey);
        }
      })
      .catch(() =>
        setError(
          "Couldn't load the saved update request. Restore phone storage access before starting another update.",
        ),
      );
    return () => {
      current = false;
    };
  }, [storageKey]);
  useEffect(() => {
    const listener = AppState.addEventListener("change", (state) =>
      setForeground(state === "active"),
    );
    return () => listener.remove();
  }, []);
  const jobId =
    firmware?.job && !isTerminal(firmware.job.phase)
      ? firmware.job.id
      : (pending?.jobId ?? firmware?.job?.id);
  const progress = useApiQuery<APIResponse<FirmwareJob>>(
    `${ApiRoutes.FirmwareJobs}/${jobId ?? "pending"}`,
    {
      queryConfig: {
        enabled: Boolean(jobId) && foreground && focused,
        staleTime: 0,
        refetchInterval: (query) => {
          const job = query.state.data?.success ? query.state.data.data : null;
          if (!foreground || !focused || (job && isTerminal(job.phase)))
            return false;
          return query.state.error || job?.stale
            ? 10000
            : ["switching", "restarting", "checking"].includes(job?.phase ?? "")
              ? 5000
              : 2500;
        },
      },
    },
  );
  const job = progress.data?.success ? progress.data.data : firmware?.job;
  const active = Boolean(job && !isTerminal(job.phase));
  const mutation = useApiMutation<
    Start,
    APIResponse<{
      job: FirmwareJob;
      delivery: string;
      recoveryGrant: Signed | null;
    }>
  >(ApiRoutes.FirmwareJobs);
  const busy =
    active || mutation.isPending || Boolean(jobId && progress.isLoading);
  useEffect(() => {
    if (job?.phase)
      AccessibilityInfo.announceForAccessibility(
        phaseLabel[job.phase] ?? job.phase,
      );
  }, [job?.phase]);
  useEffect(() => {
    onBusy(id, busy);
    return () => onBusy(id, false);
  }, [busy, id, onBusy]);
  const phase = job?.phase;
  const refetch = query.refetch;
  useEffect(() => {
    if (phase && isTerminal(phase)) void refetch();
  }, [phase, refetch]);
  const persist = async (value: Pending) => {
    await AsyncStorage.setItem(storageKey, JSON.stringify(value));
    setPending(value);
  };
  const start = async (
    operation: "update" | "rollback",
    targetVersion: string,
  ) => {
    if (submitting.current || !reconciled) return;
    submitting.current = true;
    setError("");
    try {
      if (
        pending &&
        !pending.jobId &&
        (pending.operation !== operation ||
          pending.targetVersion !== targetVersion)
      )
        throw new Error(
          "Retry the saved request to reconcile its outcome before starting a different update.",
        );
      const pendingFinished = Boolean(
        pending?.jobId && job?.id === pending.jobId && isTerminal(job.phase),
      );
      const request =
        pending &&
        !pendingFinished &&
        pending.targetVersion === targetVersion &&
        pending.operation === operation
          ? pending
          : { idempotencyKey: Crypto.randomUUID(), operation, targetVersion };
      await persist(request);
      const response = await mutation.mutateAsync({
        ...request,
        controllerDeviceId: id,
      });
      if (!response.success) throw new Error(response.message);
      await persist({ ...request, jobId: response.data.job.id });
      if (response.data.recoveryGrant)
        await SecureStore.setItemAsync(
          `firmware-recovery.${userId}.${id}`,
          JSON.stringify(response.data.recoveryGrant),
        );
      if (response.data.delivery === "uncertain")
        setError(
          "Delivery is uncertain. Refresh progress or retry this saved request; it will not install twice.",
        );
      void query.refetch();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Couldn't request the update.",
      );
    } finally {
      submitting.current = false;
    }
  };
  const confirm = (operation: "update" | "rollback", target: string) =>
    Alert.alert(
      operation === "update" ? `Update ${name}?` : `Restore ${name}?`,
      `Install ${target}. Device control will pause briefly. Installation continues if you leave this screen or close the app.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: operation === "update" ? "Update" : "Restore",
          onPress: () => void start(operation, target),
        },
      ],
    );
  const available = firmware?.available;
  const newer = Boolean(
    available &&
    (!firmware?.status?.installedRelease ||
      compareVersions(available.version, firmware.status.installedRelease) > 0),
  );
  const label = query.isError
    ? "Offline or access unavailable"
    : firmware?.connection === "bootstrap_required"
      ? "Bootstrap required"
      : firmware?.status?.recoveryRequired
        ? "Recovery required"
        : firmware?.connection === "offline"
          ? "Offline"
          : firmware?.required
            ? "Update required"
            : newer
              ? "Update available"
              : firmware
                ? "Up to date"
                : "Checking…";
  const disabled =
    blocked ||
    busy ||
    !reconciled ||
    query.isFetching ||
    firmware?.connection !== "online";
  return (
    <View
      style={{
        padding: 20,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: theme.colors.greyOutline,
        backgroundColor: theme.colors.secondary,
        gap: 12,
      }}
    >
      <Text
        accessibilityRole="header"
        style={{ fontSize: 20, fontFamily: "Lexend_600SemiBold" }}
      >
        {name}
      </Text>
      <Text style={{ color: theme.colors.grey1 }}>{label}</Text>
      <Text>
        Installed: {firmware?.status?.installedRelease ?? "Unknown"}
        {available ? ` · Available: ${available.version}` : ""}
      </Text>
      {firmware?.status?.lastOutcome?.localOnly && (
        <Text accessibilityLiveRegion="polite">
          Local recovery:{" "}
          {phaseLabel[firmware.status.lastOutcome.phase] ??
            firmware.status.lastOutcome.phase}{" "}
          · {firmware.status.lastOutcome.targetVersion}
        </Text>
      )}
      {(firmware?.stale || query.isError) && (
        <Text style={{ color: theme.colors.warning }}>
          Status may be stale.
          {firmware?.observedAt
            ? ` Last observed ${new Date(firmware.observedAt).toLocaleString()}.`
            : ""}
        </Text>
      )}
      {firmware?.connection === "bootstrap_required" && (
        <Text>
          An owner must install the protected updater over SSH once. See the
          controller bootstrap instructions.
        </Text>
      )}
      {job && (
        <View style={{ gap: 8 }} accessibilityLiveRegion="polite">
          <Text style={{ fontFamily: "Lexend_500Medium" }}>
            {phaseLabel[job.phase] ?? job.phase}
          </Text>
          <Text>
            {job.sourceVersion} → {job.targetVersion} · Running{" "}
            {job.runningVersion ?? "unavailable"}
          </Text>
          {job.phase === "downloading" && !!job.totalBytes && (
            <Text>
              {Math.floor((job.bytes ?? 0) / 1024)} /{" "}
              {Math.floor(job.totalBytes / 1024)} KB
            </Text>
          )}
          {!!job.failureCode && (
            <Text style={{ color: theme.colors.warning }}>
              {job.failureCode.replaceAll("_", " ").toLowerCase()}
            </Text>
          )}
          {(job.stale || progress.isError) && (
            <Text>
              Reconnecting. Installation keeps running on the controller.
            </Text>
          )}
          <Text style={{ color: theme.colors.grey2 }}>
            Last reported {new Date(job.updatedAt).toLocaleString()}
          </Text>
        </View>
      )}
      {query.isError && (
        <Text accessibilityRole="alert" style={{ color: theme.colors.error }}>
          {query.error.message}
        </Text>
      )}
      {!!error && (
        <Text accessibilityRole="alert" style={{ color: theme.colors.error }}>
          {error}
        </Text>
      )}
      {firmware && !firmware.isAdmin && (
        <Text>
          A house admin must start updates and recovery. You can follow progress
          here.
        </Text>
      )}
      {firmware?.isAdmin &&
        newer &&
        available &&
        !firmware.status?.recoveryRequired && (
          <Button
            loading={mutation.isPending}
            disabled={disabled}
            onPress={() => confirm("update", available.version)}
          >
            Update to {available.version}
          </Button>
        )}
      {firmware?.isAdmin && firmware.status?.previousRelease && (
        <Button
          type="outline"
          disabled={disabled}
          onPress={() => confirm("rollback", firmware.status!.previousRelease!)}
        >
          Restore {firmware.status.previousRelease}
        </Button>
      )}
      {firmware?.isAdmin &&
        pending &&
        (!pending.jobId || !job || !isTerminal(job.phase)) && (
          <Button
            type="outline"
            disabled={mutation.isPending || blocked || !reconciled}
            onPress={() => void start(pending.operation, pending.targetVersion)}
          >
            Retry delivery of saved request
          </Button>
        )}
      {firmware?.status?.recoveryRequired && (
        <Text>
          If neither release starts, use a preissued recovery grant on the LAN
          or authenticated SSH recovery.
        </Text>
      )}
      {available && (
        <Button
          type="clear"
          onPress={() => {
            void Linking.openURL(available.githubUrl).catch(() =>
              setError("Could not open release notes."),
            );
          }}
        >
          Release notes
        </Button>
      )}
      <Button
        type="clear"
        loading={query.isFetching || progress.isFetching}
        onPress={() => {
          void query.refetch();
          if (jobId) void progress.refetch();
        }}
      >
        Refresh status
      </Button>
      <Button type="clear" onPress={() => setShowRecovery((value) => !value)}>
        LAN recovery
      </Button>
      {showRecovery && <OfflineRecovery id={id} />}
    </View>
  );
}
