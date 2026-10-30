import { APIResponse } from "@/models/api";
import { ApiRoutes } from "@/routes/routes";
import useApiQuery from "./use-api-query";

export type SearchDeviceControlLogsRequest = {
  houseId?: string;
  deviceId?: string;
  page: number;
  limit: number;
};

export type SearchDeviceControlLogsResponse = APIResponse<{
  data: {
    id: string;
    deviceId: string;
    statusChangedFrom: boolean;
    statusChangedTo: boolean;
    resourceStatus: "active" | "inactive";
    createdAt: string | null;
    createdBy: string;
    modifiedAt: string | null;
    modifiedBy: string | null;
  }[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}>;

const useDeviceControlLogs = (
  searchParams: SearchDeviceControlLogsRequest,
  options?: { refetchInterval?: number | false },
) => {
  return useApiQuery<SearchDeviceControlLogsResponse>(
    ApiRoutes.DeviceControlLogs,
    {
      searchParams,
      queryConfig: {
        staleTime: options?.refetchInterval ? 0 : undefined,
      },
    },
  );
};

export default useDeviceControlLogs;
