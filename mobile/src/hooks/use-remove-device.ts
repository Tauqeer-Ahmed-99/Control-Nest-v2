import { APIResponse } from "@/models/api";
import { Device } from "@/models/device";
import { ApiRoutes } from "@/routes/routes";
import { HTTPMethod } from "@/utils/network";
import useApiMutation from "./use-api-mutation";

export type RemoveDeviceRequest = { roomId: string; deviceId: string };

export type RemoveDeviceResponse = APIResponse<Device>;

const useRemoveDevice = () => {
  return useApiMutation<RemoveDeviceRequest, RemoveDeviceResponse>(
    ApiRoutes.RemoveDevice,
    {
      method: HTTPMethod.DELETE,
    },
  );
};

export default useRemoveDevice;
