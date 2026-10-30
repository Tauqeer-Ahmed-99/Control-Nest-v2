import { CONTROLLER_DEVICE_CONFIG } from "@/constants/storage";
import { APIResponse } from "@/models/api";
import { ControllerConfig } from "@/models/controller-config";
import { House } from "@/models/house";
import { ApiRoutes } from "@/routes/routes";
import { useUser } from "@clerk/expo";
import useApiQuery from "./use-api-query";
import { useGetMobileStorageData } from "./use-mobile-storage-data";

export interface UserHouseSearchParams {
  houseId: string;
}

export type GetHouseResponse = APIResponse<House>;

export const useHouseId = (): string | null => {
  const { data: controllerConfig } = useGetMobileStorageData<ControllerConfig>(
    CONTROLLER_DEVICE_CONFIG,
  );

  if (controllerConfig && controllerConfig.house && controllerConfig.house.id) {
    return controllerConfig.house.id;
  }

  return null;
};

// const useHouse = () => {
//   const houseId = useHouseId();
//   const { isSignedIn } = useUser();

//   const searchParams: UserHouseSearchParams = {
//     houseId: houseId as string,
//   };

//   return useApiQuery<GetHouseResponse>(ApiRoutes.UserHouse, {
//     searchParams,
//     queryConfig: { enabled: !!houseId && !!isSignedIn },
//   });
// };

// export const useHouseData = () => {
//   const { data } = useHouse();

//   return data?.details == null ? (data?.data ?? null) : null;
// };

// export const useRoomData = (roomId: string) => {
//   const { data } = useHouse();

//   return data?.details == null
//     ? (data?.data?.rooms.find((room) => room.id === roomId) ?? null)
//     : null;
// };

// export const useRoomsData = () => {
//   const { data } = useHouse();

//   return data?.details === null ? (data?.data?.rooms ?? []) : [];
// };

// export const useDeviceData = (roomId: string, deviceId: string | "default") => {
//   const { data } = useHouse();

//   const devices =
//     data?.details == null
//       ? (data?.data?.rooms?.find((room) => room.id === roomId)?.devices ?? null)
//       : null;

//   if (deviceId === "default") {
//     return devices?.find((device) => device.isDefault) ?? devices?.[0] ?? null;
//   }

//   return devices?.find((device) => device.id === deviceId) ?? null;
// };

// export const useDevicesData = () => {
//   const { data } = useHouse();

//   return data?.details == null
//     ? (data?.data?.rooms.flatMap((room) => room.devices) ?? [])
//     : [];
// };

const useHouse = () => {
  const houseId = useHouseId();
  const { isSignedIn } = useUser();

  return useApiQuery<GetHouseResponse>(ApiRoutes.UserHouse, {
    searchParams: {
      houseId: houseId ?? "",
    },
    queryConfig: {
      enabled: Boolean(houseId && isSignedIn),
    },
  });
};

export const useHouseData = () => {
  const { data } = useHouse();

  return data?.details == null ? (data?.data ?? null) : null;
};

export const useRoomsData = () => {
  const house = useHouseData();

  return house?.rooms ?? [];
};

export const useRoomData = (roomId: string) => {
  const house = useHouseData();

  return house?.rooms.find((room) => room.id === roomId) ?? null;
};

export const useDevicesData = () => {
  const house = useHouseData();

  return house?.rooms.flatMap((room) => room.devices) ?? [];
};

export const useDeviceData = (roomId: string, deviceId: string | "default") => {
  const room = useRoomData(roomId);
  const devices = room?.devices ?? [];

  if (deviceId === "default") {
    return devices.find((device) => device.isDefault) ?? devices[0] ?? null;
  }

  return devices.find((device) => device.id === deviceId) ?? null;
};

export default useHouse;
