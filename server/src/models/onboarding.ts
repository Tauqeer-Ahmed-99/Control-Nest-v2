import z from "zod";
export const CreateHouseSchema = z.object({
  name: z.string().trim().min(1).max(100),
});
export const HouseIdSchema = z.object({ houseId: z.uuidv4() });
export const CreateControllerSchema = HouseIdSchema.extend({
  name: z.string().trim().min(1).max(100),
});
export const ControllerIdSchema = z.object({
  controllerDeviceId: z.uuidv4(),
});
export const ControllerKeyActionSchema = ControllerIdSchema.extend({
  action: z.enum(["rotate", "revoke"]),
});
export const PairControllerSchema = z.object({
  installationId: z.uuidv4(),
  accessToken: z.string().min(1).optional(),
});
