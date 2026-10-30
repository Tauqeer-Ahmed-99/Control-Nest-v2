import { ApiRoutes } from "@/routes/routes";
import useApiQuery from "./use-api-query";
import { useHouseId } from "./use-house";
import { GetHouseMembersResponse } from "@/models/house-member";

const useHouseMembers = () => {
  const houseId = useHouseId();

  return useApiQuery<GetHouseMembersResponse>(ApiRoutes.HouseMembers, {
    searchParams: { houseId: houseId ?? "" },
    queryConfig: { enabled: Boolean(houseId) },
  });
};

export default useHouseMembers;
