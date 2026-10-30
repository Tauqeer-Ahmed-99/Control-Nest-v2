import z from "zod";
import { HeaderPinType, pinHeaderConfig } from "./pin-header-config";
import { Metadata } from "./metadata";

export const CreateDeviceSchema = z.object({
  roomId: z.uuidv4().nonempty().nonoptional(),
  pinNumber: z
    .number()
    .int()
    .refine(
      (pinNumber) =>
        pinHeaderConfig.some(
          (pin) =>
            pin.type === HeaderPinType.GPIO && pin.gpioPinNumber === pinNumber,
        ),
      { message: "Invalid GPIO pin number." },
    ),
  deviceName: z.string().nonempty().nonoptional(),
  wattage: z.number().nonnegative().nonoptional(),
});

const TimeSchema = z
  .string()
  .regex(
    /^([01]\d|2[0-3]):[0-5]\d$/,
    "Time must be in HH:mm format (e.g., 09:30 or 23:59)",
  );

const ScheduleSchema = z.discriminatedUnion("isScheduled", [
  z.object({
    isScheduled: z.literal(true),
    daysScheduled: z.string().nonempty().nonoptional(),
    startTime: TimeSchema,
    offTime: TimeSchema,
  }),

  z.object({
    isScheduled: z.literal(false).optional(),
    daysScheduled: z.string().nonempty().optional(),
    startTime: TimeSchema.optional(),
    offTime: TimeSchema.optional(),
  }),
]);

export const UpdateDeviceSchema = z
  .object({
    roomId: z.uuidv4().nonempty().nonoptional(),
    deviceId: z.uuidv4().nonempty().nonoptional(),
    deviceName: z.string().nonempty().optional(),
    pinNumber: z
      .number()
      .int()
      .refine(
        (pinNumber) =>
          pinHeaderConfig.some(
            (pin) =>
              pin.type === HeaderPinType.GPIO &&
              pin.gpioPinNumber === pinNumber,
          ),
        { message: "Invalid GPIO pin number." },
      )
      .optional(),
    status: z.boolean().optional(),
    isDefault: z.boolean().optional(),
    wattage: z.number().nonnegative().optional(),
  })
  .and(ScheduleSchema);

export const RemoveDeviceSchema = z.object({
  roomId: z.uuidv4().nonempty().nonoptional(),
  deviceId: z.uuidv4().nonempty().nonoptional(),
});

export const SwitchDeviceSchema = z.object({
  deviceId: z.uuidv4().nonempty().nonoptional(),
  statusFrom: z.boolean().nonoptional(),
  statusTo: z.boolean().nonoptional(),
});

export type Device = {
  id: string;
  roomId: string;
  name: string;
  pinNumber: number;
  status: boolean;
  isDefault: boolean;
  isScheduled: boolean;
  daysScheduled: string | null;
  startTime: string | null;
  offTime: string | null;
  scheduledBy: string | null;
  wattage: number;
} & Metadata;
