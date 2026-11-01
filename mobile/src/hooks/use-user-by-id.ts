import { GetUserByIdResponse } from "@/models/user";
import { ApiRoutes } from "@/routes/routes";
import useApiQuery from "./use-api-query";

const useUserById = (userId: string | null | undefined) => {
  return useApiQuery<GetUserByIdResponse>(ApiRoutes.User, {
    searchParams: { userId: userId ?? "" },
    queryConfig: { enabled: Boolean(userId && !userId.startsWith("CD-")) },
  });
};

export default useUserById;
