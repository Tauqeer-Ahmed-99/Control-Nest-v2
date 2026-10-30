import { EnergyConsumptionData } from "@/models/energy-consumption";
import { ApiRoutes } from "@/routes/routes";
import { ApiResponse } from "@/utils/models";
import useApiQuery from "./use-api-query";

export type EnergyConsumptionRequest = { houseId: string };

export type EnergyConsumptionResponse = ApiResponse<EnergyConsumptionData>;

const useEnergyConsumption = (
  searchParams: EnergyConsumptionRequest,
  queryConfig: { enabled: boolean },
) => {
  return useApiQuery<EnergyConsumptionResponse>(ApiRoutes.EnergyConsumption, {
    searchParams,
    queryConfig,
  });
};

export default useEnergyConsumption;
