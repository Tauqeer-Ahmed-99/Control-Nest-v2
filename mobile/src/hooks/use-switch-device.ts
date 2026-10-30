import { APIResponse } from "@/models/api";
import { Device } from "@/models/device";
import { ApiRoutes } from "@/routes/routes";
import { HTTPMethod } from "@/utils/network";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { ToastAndroid } from "react-native";
import useApiMutation from "./use-api-mutation";
import { GetHouseResponse } from "./use-house";

export type SwitchDeviceRequest = {
  deviceId: string;
  statusFrom: boolean;
  statusTo: boolean;
};

export type SwitchDeviceResponse = APIResponse<Device>;

/**
 * Optimistic device switch hook.
 *
 * Immediately updates the global house query cache so every consumer of house
 * data sees the new status, then fires the server mutation in the background.
 * On error the cache is rolled back to the previous snapshot and a toast is
 * shown.
 *
 * Returns a thin `switchDevice(deviceId, roomId, newStatus)` wrapper — callers
 * don't need to touch the query client themselves.
 */
const useSwitchDevice = () => {
  const queryClient = useQueryClient();

  type SwitchContext = {
    previousHouses: [QueryKey, GetHouseResponse | undefined][];
  };

  const mutation = useApiMutation<
    SwitchDeviceRequest,
    SwitchDeviceResponse,
    SwitchContext
  >(
    ApiRoutes.SwitchDevice,
    {
      method: HTTPMethod.POST,
    },
    {
      onMutate: async (variables) => {
        // Cancel any in-flight refetches so they don't overwrite the optimistic
        // value before the mutation settles.
        await queryClient.cancelQueries({
          queryKey: [ApiRoutes.UserHouse],
        });

        // Snapshot every house query variant for rollback. The house query key
        // also includes its search params, so updating only [UserHouse] would
        // patch a separate cache entry that no screen reads.
        const previousHouses = queryClient.getQueriesData<GetHouseResponse>({
          queryKey: [ApiRoutes.UserHouse],
        });

        // Optimistically patch all matching house queries so every screen sees
        // the same device status immediately.
        queryClient.setQueriesData<GetHouseResponse>(
          { queryKey: [ApiRoutes.UserHouse] },
          (old) => {
            if (!old || !old.data) return old;
            return {
              ...old,
              data: {
                ...old.data,
                rooms: old.data.rooms.map((r) => ({
                  ...r,
                  devices: r.devices.map((d) =>
                    d.id === variables.deviceId
                      ? { ...d, status: variables.statusTo }
                      : d,
                  ),
                })),
              },
            } as GetHouseResponse;
          },
        );

        return { previousHouses };
      },

      onError: (_err, _variables, context) => {
        // Roll back each matching cache entry to the snapshot from onMutate.
        context?.previousHouses.forEach(([queryKey, previousHouse]) => {
          if (previousHouse) {
            queryClient.setQueryData(queryKey, previousHouse);
          }
        });
        ToastAndroid.show(
          _err.message ?? "Failed to switch device",
          ToastAndroid.LONG,
        );
      },

      // Whether the mutation succeeds or fails, re-sync with the server so
      // the cache doesn't drift.
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: [ApiRoutes.UserHouse],
        });
      },
    },
  );

  return mutation;
};

export default useSwitchDevice;
