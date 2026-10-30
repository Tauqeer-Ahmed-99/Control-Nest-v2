import z from "zod";

export const CreateHouseMemberSchema = z.object({
  houseId: z
    .uuidv4()
    .nonempty({ error: "Valid houseId is required." })
    .nonoptional({ error: "Valid houseId is required." }),
  userId: z
    .string()
    .nonempty({ error: "Valid userId is required." })
    .nonoptional({ error: "Valid userId is required." }),
});

export const RemoveHouseMemberSchema = CreateHouseMemberSchema;

export const UpdateHouseMemberSchema = CreateHouseMemberSchema.extend({
  isAdmin: z.boolean().nonoptional(),
});
