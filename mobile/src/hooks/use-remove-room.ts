import { APIResponse } from "@/models/api";
import { Room } from "@/models/room";
import { ApiRoutes } from "@/routes/routes";
import { HTTPMethod } from "@/utils/network";
import useApiMutation from "./use-api-mutation";

export type RemoveRoomRequest = {
  houseId: string;
  roomId: string;
};

export type RemoveRoomResponse = APIResponse<Room>;

const useRemoveRoom = () => {
  return useApiMutation<RemoveRoomRequest, RemoveRoomResponse>(
    ApiRoutes.RemoveRoom,
    {
      method: HTTPMethod.DELETE,
    },
  );
};

export default useRemoveRoom;
