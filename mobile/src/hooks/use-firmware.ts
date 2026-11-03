import { useCallback, useEffect } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";
import { APIResponse } from "@/models/api";
import { FirmwareAvailability } from "@/models/firmware";
import { ApiRoutes } from "@/routes/routes";
import useApiQuery from "./use-api-query";
import { useAuth } from "@clerk/expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useGetMobileStorageData } from "./use-mobile-storage-data";

export default function useFirmware(controllerDeviceId: string) {
  const { userId } = useAuth();
  const storageKey = `firmware-observation:${userId}:${controllerDeviceId}`;
  const cached = useGetMobileStorageData<APIResponse<FirmwareAvailability>>(
    storageKey,
    { enabled: Boolean(userId && controllerDeviceId) },
  );
  const query = useApiQuery<APIResponse<FirmwareAvailability>>(
    ApiRoutes.Firmware,
    {
      searchParams: { controllerDeviceId },
      queryConfig: { enabled: Boolean(controllerDeviceId), staleTime: 60000 },
    },
  );
  const refetch = query.refetch;
  useEffect(() => {
    if (query.data?.success)
      void AsyncStorage.setItem(storageKey, JSON.stringify(query.data)).catch(
        () => undefined,
      );
  }, [query.data, query.dataUpdatedAt, storageKey]);
  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void refetch();
    });
    return () => subscription.remove();
  }, [refetch]);
  const observation = query.data ?? cached.data ?? undefined;
  const data =
    observation?.success && (!query.data || query.isError)
      ? {
          ...observation,
          data: {
            ...observation.data,
            stale: true,
            connection: "offline" as const,
          },
        }
      : observation;
  return { ...query, data };
}
