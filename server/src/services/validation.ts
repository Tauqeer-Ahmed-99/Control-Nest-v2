import { APIError } from "@/models/api";
import z from "zod";

export const validate = <T extends z.ZodType>({
  schema,
  object,
}: {
  schema: T;
  object: unknown;
}): z.infer<T> => {
  const { success, error, data } = schema.safeParse(object);

  if (!success) {
    console.log(JSON.stringify(z.treeifyError(error), null, 2));
    throw new APIError({
      message: "One or more validation errors occured.",
      statusCode: 400,
      errors: z.treeifyError(error),
    });
  }

  return data;
};
