import { HouseMember } from "./house-member";
import { Metadata } from "./metadata";
import { Room } from "./room";

export type House = {
  id: string;
  name: string;
  houseMembers: HouseMember[];
  rooms: Room[];
  controllerDevice: { id: string; name: string; houseId: string }[];
} & Metadata;
