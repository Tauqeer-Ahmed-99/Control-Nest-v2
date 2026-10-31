import { APIResponse } from "@/models/api";
import { Device } from "@/models/device";
import { ApiRoutes } from "@/routes/routes";
import useApiMutation from "./use-api-mutation";

// "device_id": self.device_id,
// "device_name": self.device_name,
// "pin_number": self.pin_number,
// "status": self.status,
// "room_id": self.room_id,
// "is_scheduled": self.is_scheduled,
// "days_scheduled": self.days_scheduled,
// "start_time": self.start_time,
// "off_time": self.off_time,
// "scheduled_by": self.scheduled_by,
// "created_at": self.created_at,
// "updated_at": self.updated_at,

// type AddedDevice = {
//   device_id: string;
//   device_name: string;
//   pin_number: number;
//   status: boolean;
//   room_id: string;
//   is_scheduled: boolean;
//   days_scheduled: string | null;
//   start_time: string | null;
//   off_time: string | null;
//   scheduled_by: string | null;
//   created_at: string;
//   updated_at: string;
// };

export type AddDeviceRequest = {
  roomId: string;
  controllerDeviceId: string;
  pinNumber: number;
  gpioPinNumber: number;
  deviceName: string;
  wattage: number;
};

export type AddDeviceResponse = APIResponse<Device>;

const useAddDevice = () => {
  return useApiMutation<AddDeviceRequest, AddDeviceResponse>(
    ApiRoutes.AddDevice,
  );
};

export default useAddDevice;
