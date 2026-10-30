import z from "zod";

export const InitControllerDeviceSchema = z.object({
  userId: z
    .string()
    .nonempty({ error: "userId is required" })
    .nonoptional({ error: "userId is required" }),
  accessToken: z
    .string()
    .nonempty({ error: "accessToken is required" })
    .nonoptional({ error: "accessToken is required" }),
  controllerName: z
    .string()
    .nonempty({ error: "controllerName is required" })
    .nonoptional({ error: "controllerName is required" }),
});

export const GetControllerDeviceHeathScgema = z.object({
  controllerDeviceId: z.uuidv4().nonempty().nonoptional(),
});

export const ControllerDevicePasswordSchema = z.object({
  controllerDeviceId: z.uuidv4().nonempty().nonoptional(),
  controllerDevicePassword: z.string().min(8).nonempty().nonoptional(),
});

export type HealthData = { health: "ok" };
