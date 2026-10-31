import z from "zod";
import { HeaderPinType, pinHeaderConfig } from "./pin-header-config";
import { Metadata } from "./metadata";

const isValidPinSelection = (pinNumber: number, gpioPinNumber: number) =>
  pinHeaderConfig.some(
    (pin) =>
      pin.type === HeaderPinType.GPIO &&
      pin.headerPinNumber === pinNumber &&
      pin.gpioPinNumber === gpioPinNumber,
  );

const headerPinNumberSchema = z
  .number()
  .int()
  .refine(
    (pinNumber) =>
      pinHeaderConfig.some(
        (pin) =>
          pin.type === HeaderPinType.GPIO && pin.headerPinNumber === pinNumber,
      ),
    { message: "Invalid header pin number." },
  );

const gpioPinNumberSchema = z
  .number()
  .int()
  .refine(
    (gpioPinNumber) =>
      pinHeaderConfig.some(
        (pin) =>
          pin.type === HeaderPinType.GPIO &&
          pin.gpioPinNumber === gpioPinNumber,
      ),
    { message: "Invalid GPIO pin number." },
  );

export const CreateDeviceSchema = z
  .object({
    roomId: z.uuidv4().nonempty().nonoptional(),
    controllerDeviceId: z.uuidv4(),
    pinNumber: headerPinNumberSchema,
    gpioPinNumber: gpioPinNumberSchema,
    deviceName: z.string().nonempty().nonoptional(),
    wattage: z.number().nonnegative().nonoptional(),
  })
  .superRefine(({ pinNumber, gpioPinNumber }, ctx) => {
    if (!isValidPinSelection(pinNumber, gpioPinNumber)) {
      ctx.addIssue({
        code: "custom",
        path: ["gpioPinNumber"],
        message: "GPIO pin number does not match the header pin number.",
      });
    }
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
    pinNumber: headerPinNumberSchema.optional(),
    gpioPinNumber: gpioPinNumberSchema.optional(),
    status: z.boolean().optional(),
    isDefault: z.boolean().optional(),
    wattage: z.number().nonnegative().optional(),
  })
  .and(ScheduleSchema)
  .superRefine(({ pinNumber, gpioPinNumber }, ctx) => {
    if ((pinNumber === undefined) !== (gpioPinNumber === undefined)) {
      ctx.addIssue({
        code: "custom",
        path: ["gpioPinNumber"],
        message: "Header and GPIO pin numbers must be provided together.",
      });
      return;
    }

    if (
      pinNumber !== undefined &&
      gpioPinNumber !== undefined &&
      !isValidPinSelection(pinNumber, gpioPinNumber)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["gpioPinNumber"],
        message: "GPIO pin number does not match the header pin number.",
      });
    }
  });

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
