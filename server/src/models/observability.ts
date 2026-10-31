import z from "zod";

export const ControllerObservabilityEventSchema = z.object({
  id: z.uuidv4(),
  requestId: z.uuidv4(),
  source: z.literal("controller"),
  method: z.string().min(1),
  path: z.string().min(1),
  statusCode: z.number().int().min(100).max(599),
  durationMs: z.number().int().nonnegative(),
  input: z.unknown().optional(),
  output: z.unknown().optional(),
  error: z.unknown().optional(),
  controllerDeviceId: z.uuidv4().nullable().optional(),
});

export type ControllerObservabilityEvent = z.infer<
  typeof ControllerObservabilityEventSchema
>;

export const GetObservabilityLogsSchema = z.object({
  requestId: z.uuidv4().optional(),
  limit: z.coerce.number().int().min(1).max(250).default(100),
});
