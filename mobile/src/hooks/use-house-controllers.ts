import { APIResponse } from "@/models/api";
import { HouseController } from "@/models/onboarding";
import { ApiRoutes } from "@/routes/routes";
import useApiQuery from "./use-api-query";
export default function useHouseControllers(houseId: string) {
  return useApiQuery<APIResponse<HouseController[]>>(
    ApiRoutes.HouseControllers,
    {
      searchParams: { houseId },
      queryConfig: { enabled: Boolean(houseId), staleTime: 0 },
    },
  );
}
