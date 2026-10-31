import { APIResponse } from "@/models/api";
import { Device } from "@/models/device";
import { ApiRoutes } from "@/routes/routes";
import { HTTPMethod } from "@/utils/network";
import useApiMutation from "./use-api-mutation";

export type ConfigureDeviceRequest = {
  roomId: string;
  deviceId: string;
  deviceName?: string;
  pinNumber?: number;
  gpioPinNumber?: number;
  status?: boolean;
  isDefault?: boolean;
  isScheduled?: boolean;
  daysScheduled?: string;
  startTime?: string;
  offTime?: string;
  wattage?: number;
};

export type ConfigureDeviceResponse = APIResponse<Device>;

const useConfigureDevice = () => {
  return useApiMutation<ConfigureDeviceRequest, ConfigureDeviceResponse>(
    ApiRoutes.ConfigureDevice,
    {
      method: HTTPMethod.PATCH,
    },
  );
};

export default useConfigureDevice;
