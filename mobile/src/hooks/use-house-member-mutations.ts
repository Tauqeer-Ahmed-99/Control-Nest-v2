import {
  AddHouseMemberRequest,
  HouseMemberMutationResponse,
  RemoveHouseMemberRequest,
  UpdateHouseMemberRequest,
} from "@/models/house-member";
import { ApiRoutes } from "@/routes/routes";
import { HTTPMethod } from "@/utils/network";
import { useQueryClient } from "@tanstack/react-query";
import useApiMutation from "./use-api-mutation";

const useHouseMemberMutation = <TRequest,>(method: HTTPMethod) => {
  const queryClient = useQueryClient();

  return useApiMutation<TRequest, HouseMemberMutationResponse>(
    ApiRoutes.HouseMembers,
    { method },
    {
      onSettled: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: [ApiRoutes.HouseMembers],
          }),
          queryClient.invalidateQueries({ queryKey: [ApiRoutes.HouseUsers] }),
          queryClient.invalidateQueries({ queryKey: [ApiRoutes.UserHouse] }),
        ]);
      },
    },
  );
};

export const useAddHouseMember = () =>
  useHouseMemberMutation<AddHouseMemberRequest>(HTTPMethod.POST);

export const useUpdateHouseMember = () =>
  useHouseMemberMutation<UpdateHouseMemberRequest>(HTTPMethod.PATCH);

export const useRemoveHouseMember = () =>
  useHouseMemberMutation<RemoveHouseMemberRequest>(HTTPMethod.DELETE);
