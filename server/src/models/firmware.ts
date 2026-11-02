import z from "zod";

export const VersionSchema = z
  .string()
  .regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/);
export const SignedSchema = z.object({
  keyId: z.string().regex(/^[\w-]{1,64}$/),
  payload: z.string().max(65536),
  signature: z.string().max(128),
});
export type Signed = z.infer<typeof SignedSchema>;
export const ManifestSchema = z.object({
  version: VersionSchema,
  commit: z.string().regex(/^[a-f0-9]{40}$/),
  archiveUrl: z
    .url()
    .refine(
      (v) =>
        new URL(v).protocol === "https:" &&
        !new URL(v).username &&
        !new URL(v).password,
    ),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  size: z
    .number()
    .int()
    .positive()
    .max(1024 ** 3),
  unpackedSize: z
    .number()
    .int()
    .positive()
    .max(4 * 1024 ** 3),
  os: z.literal("linux"),
  architecture: z.enum(["aarch64", "armv7l"]),
  python: z.string().regex(/^3\.\d+$/),
  minUpdater: VersionSchema,
  apiContract: z.literal(1),
  dataSchema: z.literal(1),
  rollback: z.literal("snapshot"),
  dependencies: z.literal("bundled-wheels"),
});
export type Manifest = z.infer<typeof ManifestSchema>;
export const PolicySchema = z.strictObject({
  revision: z.number().int().positive(),
  effectiveAt: z.iso.datetime(),
  minimumMobile: VersionSchema,
  minimumController: VersionSchema,
  latest: VersionSchema.nullable(),
  apiContracts: z.array(z.number().int()).min(1),
  mobile: z.strictObject({
    android: z.strictObject({
      runtimes: z.array(z.string()),
      minimumBuild: z.number().int().nonnegative(),
      installUrl: z.url().startsWith("https://").nullable(),
    }),
    ios: z.strictObject({
      runtimes: z.array(z.string()),
      minimumBuild: z.string().regex(/^\d+(\.\d+)*$/),
      installUrl: z.url().startsWith("https://").nullable(),
    }),
  }),
});
export type ReleasePolicy = z.infer<typeof PolicySchema>;
export const FirmwareQuerySchema = z.object({ controllerDeviceId: z.uuid() });
export const StartFirmwareSchema = FirmwareQuerySchema.extend({
  targetVersion: VersionSchema,
  idempotencyKey: z.uuid(),
  operation: z.enum(["update", "rollback"]).default("update"),
});
export const Phases = [
  "queued",
  "downloading",
  "verifying",
  "preparing",
  "backing_up",
  "switching",
  "restarting",
  "checking",
  "rolling_back",
  "completed",
  "failed",
  "rolled_back",
  "recovery_required",
] as const;
export const StatusSchema = z.object({
  installedRelease: VersionSchema.nullable(),
  apiContract: z.number().int(),
  dataSchema: z.number().int(),
  updaterVersion: VersionSchema,
  selectedRelease: VersionSchema.nullable().default(null),
  architecture: z.string(),
  os: z.string(),
  python: z.string(),
  capabilities: z.array(z.string()),
  previousRelease: VersionSchema.nullable(),
  recoveryRequired: z.boolean(),
  lastOutcome: z
    .object({
      jobId: z.uuid(),
      phase: z.enum(Phases),
      targetVersion: VersionSchema,
      failureCode: z.string().max(64).nullable(),
      localOnly: z.boolean(),
    })
    .nullable()
    .default(null),
});
export type FirmwareStatus = z.infer<typeof StatusSchema>;
export const EventSchema = z.object({
  sequence: z.number().int().nonnegative(),
  phase: z.enum(Phases),
  runningVersion: VersionSchema.nullable(),
  bytes: z.number().int().nonnegative().optional(),
  totalBytes: z.number().int().positive().optional(),
  failureCode: z
    .enum([
      "DOWNLOAD_FAILED",
      "SIGNATURE_INVALID",
      "UNSUPPORTED_TARGET",
      "PREPARATION_FAILED",
      "ACTIVATION_FAILED",
      "INTERRUPTED",
      "RECOVERY_REQUIRED",
      "AUTHORIZATION_EXPIRED",
    ])
    .nullable()
    .default(null),
  status: StatusSchema.optional(),
});
export const AcceptSchema = z.object({ nonce: z.uuid() });
export const terminalPhases = [
  "completed",
  "failed",
  "rolled_back",
  "recovery_required",
];
export function compareVersions(a: string, b: string) {
  const left = a.split(".").map(Number),
    right = b.split(".").map(Number);
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const delta = (left[i] ?? 0) - (right[i] ?? 0);
    if (delta) return Math.sign(delta);
  }
  return 0;
}
