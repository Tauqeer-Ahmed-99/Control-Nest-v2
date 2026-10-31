import { EnergyConsumptionData } from "@/models/energy-consumption";
import { APIResponse } from "@/models/api";
import { ApiRoutes } from "@/routes/routes";
import useApiQuery from "./use-api-query";

export type EnergyConsumptionRequest = { houseId: string };

export type EnergyConsumptionResponse = APIResponse<EnergyConsumptionData>;

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
