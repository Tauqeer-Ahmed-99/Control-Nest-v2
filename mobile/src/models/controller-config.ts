// Only public connection details are stored on the phone. Keys and tunnel tokens stay on the Pi.
export type HouseConfig = { id: string; name: string };
export type ControllerDeviceConfig = {
  id: string;
  houseId: string;
  name: string;
};
export type TunnelConfig = { hostname: string };
export type ControllerConfig = {
  // Associates the last chosen house with its signed-in account on this phone.
  userId?: string;
  house: HouseConfig;
  controllerDevice: ControllerDeviceConfig;
  tunnel: TunnelConfig;
};
