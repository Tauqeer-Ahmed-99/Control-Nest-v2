import { APIResponse } from "./api";

export type UserProfile = {
  id: string;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  imageUrl: string | null;
};

export type GetUserByIdResponse = APIResponse<UserProfile>;
