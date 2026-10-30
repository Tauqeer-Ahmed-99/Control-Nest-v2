import { APIResponse } from "@/models/api";
import { ApiRoutes } from "@/routes/routes";
import useApiMutation from "./use-api-mutation";

export type PasswordRequest = {
  controllerDeviceId: string;
  controllerDevicePassword: string;
};

export type PasswordResponse = APIResponse<true>;

const usePassword = () => {
  return useApiMutation<PasswordRequest, PasswordResponse>(ApiRoutes.Password);
};

export default usePassword;
