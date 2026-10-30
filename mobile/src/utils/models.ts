export interface ScheduledDevice {
  deviceId: string;
  deviceName: string;
  pinNumber: number;
  status: boolean;
  isScheduled: boolean;
  daysScheduled: string;
  startTime: string;
  offTime: string;
  houseId: string;
  userId: string;
  userName: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Device {
  device_id: string;
  device_name: string;
  pin_number: number;
  status: boolean;
  room_id: string;
  is_scheduled: boolean;
  is_default: boolean;
  days_scheduled: string;
  start_time: string;
  off_time: string;
  scheduledBy: string;
  wattage: number;
  created_at: string;
  updated_at: string;
}

export interface Room {
  room_id: string;
  room_name: string | null;
  house_id: string;
  created_at: string;
  updated_at: string;
  devices: Device[];
}

export interface House {
  house_id: string;
  house_name: string;
  created_at: string;
  updated_at: string;
  rooms: Room[];
}

export interface ControllerDevice {
  controllerDeviceId: number;
  houseId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ControllerDeviceData {
  ControllerDeviceID?: string;
  HouseID?: string;
  HouseName?: string;
  Password?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
  Rooms?: Room[];
}

export enum ResponseStatus {
  Error = "error",
  Success = "success",
}

export interface HouseMember {
  user_id: string;
  house_id: string;
}

export enum HeaderPinType {
  POWER = "POWER",
  GPIO = "GPIO",
  GROUND = "GROUND",
}

export enum Voltage {
  FIVE = "5v",
  THREE = "3v3",
}

export interface HeaderPinConfig {
  header_pin_number: number;
  gpio_pin_number: number;
  type?: HeaderPinType;
  voltage?: Voltage;
}

export enum SocketEvent {
  ADD_ROOM = "ADD_ROOM",
  REMOVE_ROOM = "REMOVE_ROOM",
  ADD_DEVICE = "ADD_DEVICE",
  SWITCH_DEVICE = "SWITCH_DEVICE",
  CONFIGURE_DEVICE = "CONFIGURE_DEVICE",
  REMOVE_DEVICE = "REMOVE_DEVICE",
  USER_LEFT = "USER_LEFT",
  ENERGY_CONSUMPTION_CALCULATED = "ENERGY_CONSUMPTION_CALCULATED",
}

export enum ResponseStatusCodes {
  INVALID_DATA = "INVALID_DATA",
  HOUSE_NOT_INITIALIZED = "HOUSE_NOT_INITIALIZED",
  INVALID_CREDS = "INVALID_CREDS",
  SERVER_ERROR = "SERVER_ERROR",
  USER_LOGGEDIN = "USER_LOGGEDIN",
  INVALID_REQUEST = "INVALID_REQUEST",
  REQUEST_FULLFILLED = "REQUEST_FULLFILLED",
  SWITCH_DEVICE_ERROR = "SWITCH_DEVICE_ERROR",
}

export interface ApiResponse<T> {
  status: ResponseStatus;
  status_code: ResponseStatusCodes;
  message: string;
  data: T;
}
