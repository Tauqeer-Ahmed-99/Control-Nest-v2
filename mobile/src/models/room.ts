import { Device } from "./device";
import { Metadata } from "./metadata";

export type Room = {
  id: string;
  houseId: string;
  name: string;
  devices: Device[];
} & Metadata;
