import { APIResponse } from "@/models/api";
import { GPIOPinConfig } from "@/models/pin-header-config";
import { ApiRoutes } from "@/routes/routes";
import useApiQuery from "./use-api-query";

export interface AvailableGPIOPinsSearchParams {
  userId: string;
}

export type AvailableGPIOPinsResponse = APIResponse<GPIOPinConfig[]>;

const useAvailableGPIOPins = ({ houseId }: { houseId: string }) => {
  return useApiQuery<AvailableGPIOPinsResponse>(ApiRoutes.AvailableGPIOPins, {
    searchParams: { mode: "available", houseId },
  });
};

export default useAvailableGPIOPins;
