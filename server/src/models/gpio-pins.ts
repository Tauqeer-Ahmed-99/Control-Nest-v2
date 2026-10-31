import z from "zod";

export const GetGPIOPinsConfigSchema = z.object({
  mode: z.enum(["all", "available"]).nonoptional(),
  houseId: z.uuidv4().nonempty().nonoptional(),
  controllerDeviceId: z.uuidv4(),
});
