import z from "zod";

export const GetControllerDeviceHeathScgema = z.object({
  controllerDeviceId: z.uuidv4().nonempty().nonoptional(),
});

export type HealthData = { health: "ok" };
