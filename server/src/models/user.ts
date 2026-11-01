import z from "zod";

export const GetUserByIdSchema = z.object({
  userId: z.string().trim().nonempty({ error: "Valid userId is required." }),
});
