import { Metadata } from "./metadata";

export type HouseConfig = {
  id: string;
  name: string;
} & Metadata;

export type ControllerDeviceConfig = {
  id: string;
  houseId: string;
  name: string;
} & Metadata;

export type TunnelConfig = {
  id: string;
  controllerDeviceId: string;
  name: string;
  hostname: string;
  token: string;
  dnsRecordId: string;
} & Metadata;

export type ControllerConfig = {
  house: HouseConfig;
  controllerDevice: ControllerDeviceConfig;
  tunnel: TunnelConfig;
};
