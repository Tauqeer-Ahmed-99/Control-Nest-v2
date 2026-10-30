import { Href } from "expo-router";

export enum Routes {
  Main = "index",
  Auth = "auth",
  HouseLogin = "house-login",
  Home = "(tabs)/home",
  Room = "(tabs)/room/[roomId]",
  Rooms = "(tabs)/rooms",
  Device = "(tabs)/room/[roomId]/[deviceId]",
  ControlLogs = "(tabs)/room/[roomId]/[deviceId]/control-logs",
  Devices = "(tabs)/devices",
  Notifications = "(tabs)/notifications",
  Settings = "(tabs)/settings",
  HouseMembers = "(tabs)/house-members",
}

export enum ApiRoutes {
  HouseMember = "/api/v1/house-member",
  UserHouse = "/api/v1/house",
  HouseMembers = "/api/v1/house/members",
  HouseUsers = "/api/v1/house/users",
  HouseLogin = "/api/v1/house/login",
  SwitchDevice = "/api/v1/device/switch",
  ConfigureDevice = "/api/v1/device",
  AddRoom = "/api/v1/room",
  RemoveRoom = "/api/v1/room",
  AddDevice = "/api/v1/device",
  RemoveDevice = "/api/v1/device",
  AvailableGPIOPins = "/api/v1/gpio-pins",
  EnergyConsumption = "/api/v1/house/energy-consumption",
  DeviceControlLogs = "/api/v1/device-control-logs",
  Password = "/api/v1/controller-device/password",
  ControllerHealth = "/api/v1/controller-device/health",
}

export interface Route {
  path: Routes;
  label: string;
  showheader?: boolean;
}

const routes: Route[] = [
  { path: Routes.Main, label: "Home" },
  { path: Routes.Auth, label: "Authentication", showheader: true },
  { path: Routes.Home, label: "Home", showheader: true },

  { path: Routes.HouseLogin, label: "Login to House", showheader: true },
  { path: Routes.Room, label: "Room", showheader: true },
  { path: Routes.Rooms, label: "Rooms", showheader: true },
  { path: Routes.Device, label: "Device", showheader: true },
  { path: Routes.ControlLogs, label: "Control Logs", showheader: true },
  { path: Routes.Devices, label: "Devices", showheader: true },
  { path: Routes.Notifications, label: "Notifications", showheader: true },
];

export const getTypedRoute = <T>(route: T) => route as unknown as Href;

export default routes;
