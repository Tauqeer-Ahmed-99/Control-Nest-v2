// Only public connection details are stored on the phone. Keys and tunnel tokens stay on the Pi.
export type HouseConfig = { id: string; name: string };
export type ControllerDeviceConfig = {
  id: string;
  houseId: string;
  name: string;
};
export type TunnelConfig = { hostname: string };
export type ControllerConfig = {
  house: HouseConfig;
  controllerDevice: ControllerDeviceConfig;
  tunnel: TunnelConfig;
};
