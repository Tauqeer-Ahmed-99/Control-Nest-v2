import { SearchHouseUsersResponse } from "@/models/house-member";
import { ApiRoutes } from "@/routes/routes";
import useApiQuery from "./use-api-query";
import { useHouseId } from "./use-house";

const useSearchHouseUsers = (query: string, enabled = true) => {
  const houseId = useHouseId();
  const searchQuery = query.trim();

  return useApiQuery<SearchHouseUsersResponse>(ApiRoutes.HouseUsers, {
    searchParams: { houseId: houseId ?? "", query: searchQuery },
    queryConfig: {
      enabled: Boolean(houseId && searchQuery && enabled),
      staleTime: 1000 * 30,
      placeholderData: (previousData) => previousData,
    },
  });
};

export default useSearchHouseUsers;
