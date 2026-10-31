import { APIResponse } from "./api";

export type HouseMember = {
  houseId: string;
  userId: string;
  isAdmin: boolean;
};

export type HouseMemberProfile = {
  id: string;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  emailAddress: string | null;
  isMember: boolean;
  isAdmin: boolean;
};

export type GetHouseMembersResponse = APIResponse<HouseMemberProfile[]>;
export type SearchHouseUsersResponse = APIResponse<HouseMemberProfile[]>;
export type HouseMemberMutationResponse = APIResponse<HouseMember>;

export type AddHouseMemberRequest = {
  houseId: string;
  userId: string;
};

export type UpdateHouseMemberRequest = AddHouseMemberRequest & {
  isAdmin: boolean;
};

export type RemoveHouseMemberRequest = AddHouseMemberRequest;
