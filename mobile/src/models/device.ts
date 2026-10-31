import { Metadata } from "./metadata";

export type Device = {
  id: string;
  roomId: string;
  controllerDeviceId: string;
  name: string;
  pinNumber: number;
  gpioPinNumber: number;
  status: boolean;
  isDefault: boolean;
  isScheduled: boolean;
  daysScheduled: string | null;
  startTime: string | null;
  offTime: string | null;
  scheduledBy: string | null;
  wattage: number;
} & Metadata;
