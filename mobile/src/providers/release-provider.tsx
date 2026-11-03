import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Updates from "expo-updates";
import useApiQuery from "@/hooks/use-api-query";
import { APIResponse } from "@/models/api";
import { ReleasePolicy, Signed } from "@/models/firmware";
import { ApiRoutes } from "@/routes/routes";
import { verifyPolicy } from "@/utils/release-policy";

const ReleaseContext = createContext<{
  policy: ReleasePolicy | null;
  observedAt: number | null;
  policyError: string;
  offline: boolean;
  pending: boolean;
  checking: boolean;
  otaError: string;
  refresh: () => Promise<void>;
  restart: () => Promise<void>;
}>({
  policy: null,
  observedAt: null,
  policyError: "",
  offline: false,
  pending: false,
  checking: false,
  otaError: "",
  refresh: async () => {},
  restart: async () => {},
});
const CACHE = "verified-release-policy-v1";

export function ReleaseProvider({ children }: PropsWithChildren) {
  const [cached, setCached] = useState<{
    policy: ReleasePolicy;
    observedAt: number;
  } | null>(null);
  const [policyError, setPolicyError] = useState("");
  const [otaError, setOtaError] = useState("");
  const [checking, setChecking] = useState(false);
  const inFlight = useRef(false);
  const revision = useRef(0);
  const { isUpdatePending } = Updates.useUpdates();
  const query = useApiQuery<APIResponse<{ envelope: Signed | null }>>(
    ApiRoutes.ReleasePolicy,
    { publicRequest: true, queryConfig: { staleTime: 60000 } },
  );
  const refetch = query.refetch;
  useEffect(() => {
    void AsyncStorage.getItem(CACHE)
      .then((value) => {
        if (!value) return;
        const entry = JSON.parse(value);
        const policy = verifyPolicy(entry.envelope);
        if (policy.revision > revision.current) {
          revision.current = policy.revision;
          setCached({ policy, observedAt: entry.observedAt });
        }
      })
      .catch(() =>
        setPolicyError(
          "Saved release policy could not be verified. Connect to refresh it.",
        ),
      );
  }, []);
  useEffect(() => {
    const envelope = query.data?.success ? query.data.data.envelope : null;
    if (!envelope) return;
    void Promise.resolve().then(async () => {
      try {
        const policy = verifyPolicy(envelope);
        if (
          Date.parse(policy.effectiveAt) > Date.now() ||
          policy.revision < revision.current
        )
          return;
        revision.current = policy.revision;
        const observedAt = Date.now();
        setCached({ policy, observedAt });
        setPolicyError("");
        await AsyncStorage.setItem(
          CACHE,
          JSON.stringify({ envelope, observedAt }),
        ).catch(() =>
          setPolicyError("Release policy could not be saved for offline use."),
        );
      } catch (error) {
        setPolicyError(
          error instanceof Error
            ? error.message
            : "Release policy could not be verified.",
        );
      }
    });
  }, [query.data, query.dataUpdatedAt]);
  const refresh = useCallback(async () => {
    void refetch();
    if (inFlight.current || !Updates.isEnabled || __DEV__) return;
    inFlight.current = true;
    setChecking(true);
    setOtaError("");
    try {
      const result = await Updates.checkForUpdateAsync();
      if (result.isAvailable || result.isRollBackToEmbedded)
        await Updates.fetchUpdateAsync();
    } catch {
      setOtaError(
        "Could not check for an app update. Your current bundle remains available.",
      );
    } finally {
      inFlight.current = false;
      setChecking(false);
    }
  }, [refetch]);
  useEffect(() => {
    void Promise.resolve().then(refresh);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });
    return () => subscription.remove();
  }, [refresh]);
  const restart = async () => {
    try {
      await Updates.reloadAsync();
    } catch {
      setOtaError(
        "Couldn't apply the update. Close and reopen the app to try again.",
      );
    }
  };
  return (
    <ReleaseContext.Provider
      value={{
        policy: cached?.policy ?? null,
        observedAt: cached?.observedAt ?? null,
        policyError,
        offline: query.isError,
        pending: isUpdatePending,
        checking,
        otaError,
        refresh,
        restart,
      }}
    >
      {children}
    </ReleaseContext.Provider>
  );
}

export const useRelease = () => useContext(ReleaseContext);
