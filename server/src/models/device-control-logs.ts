import z from "zod";

export const CreateDeviceControlLogSchema = z.object({
  controllerDeviceId: z.uuidv4().nonempty().nonoptional(),
  deviceId: z.uuidv4().nonempty().nonoptional(),
  statusFrom: z.boolean(),
  statusTo: z.boolean(),
});

export const SearchDeviceControlLogs = z.object({
  houseId: z.uuidv4().nonempty().optional(),
  deviceId: z.uuidv4().nonempty().optional(),
  page: z.number().nonnegative().nonoptional(),
  limit: z.number().nonnegative().nonoptional(),
});
