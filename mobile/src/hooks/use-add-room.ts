import { APIResponse } from "@/models/api";
import { Room } from "@/models/room";
import { ApiRoutes } from "@/routes/routes";
import useApiMutation from "./use-api-mutation";

type AddRoomRequest = {
  houseId: string;
  roomName: string;
};

export type AddRoomResponse = APIResponse<Room>;

const useAddRoom = () => {
  return useApiMutation<AddRoomRequest, AddRoomResponse>(ApiRoutes.AddRoom);
};

export default useAddRoom;
