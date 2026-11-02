import {
  createHash,
  createPrivateKey,
  createPublicKey,
  randomUUID,
  sign,
  verify,
} from "node:crypto";
import { and, desc, eq, isNull, lte, notInArray } from "drizzle-orm";
import database from "@/database";
import {
  controllerDevices,
  controllerFirmware,
  firmwareJobs,
  releasePolicies,
  releases,
  tunnels,
} from "@/database/schema";
import env from "@/env/vars";
import { APIError } from "@/models/api";
import {
  EventSchema,
  FirmwareStatus,
  ManifestSchema,
  PolicySchema,
  Signed,
  StartFirmwareSchema,
  StatusSchema,
  compareVersions,
  terminalPhases,
} from "@/models/firmware";
import tryCatch from "@/utils/try-catch";
import { authorizeHouseByControllerDevice } from "./auth-house";
import z from "zod";

const failure = (code: string, message: string, statusCode = 409) =>
  new APIError({ message, statusCode, errors: { code } });
const safe = async <T>(work: () => Promise<T>): Promise<T> => {
  const result = await tryCatch(work);
  if (result.error)
    throw result.error instanceof APIError
      ? result.error
      : failure(
          "UPDATE_UNAVAILABLE",
          "Firmware service unavailable. Retry shortly.",
          503,
        );
  return result.data;
};
export const decodeReleaseEnvelope = <T>(
  envelope: Signed,
  schema: z.ZodType<T>,
): T => {
  const keys = JSON.parse(env.variables.OTA_RELEASE_PUBLIC_KEYS) as Record<
    string,
    string
  >;
  const key = keys[envelope.keyId];
  const bytes = Buffer.from(envelope.payload, "base64");
  const publicKey = key && createPublicKey(key.replace(/\\n/g, "\n"));
  if (
    !publicKey ||
    publicKey.asymmetricKeyType !== "ed25519" ||
    !verify(null, bytes, publicKey, Buffer.from(envelope.signature, "base64"))
  )
    throw failure("SIGNATURE_INVALID", "Release signature is not trusted.");
  return schema.parse(JSON.parse(bytes.toString("utf8")));
};
export const getReleasePolicy = () =>
  safe(async () => {
    const [record] = await database
      .select()
      .from(releasePolicies)
      .where(lte(releasePolicies.effectiveAt, new Date()))
      .orderBy(desc(releasePolicies.revision))
      .limit(1);
    if (!record) return { policy: null, envelope: null };
    const policy = decodeReleaseEnvelope(record.envelope, PolicySchema);
    if (
      policy.revision !== record.revision ||
      new Date(policy.effectiveAt).getTime() !== record.effectiveAt.getTime()
    )
      throw failure(
        "SIGNATURE_INVALID",
        "Release policy identity does not match.",
        503,
      );
    return { policy, envelope: record.envelope };
  });
const eligibleController = async (id: string) => {
  const [record] = await database
    .select({ controllerIds: releasePolicies.controllerIds })
    .from(releasePolicies)
    .where(lte(releasePolicies.effectiveAt, new Date()))
    .orderBy(desc(releasePolicies.revision))
    .limit(1);
  return Boolean(
    record &&
    (!record.controllerIds.length || record.controllerIds.includes(id)),
  );
};

export const enforceMobileCompatibility = (request: Request) =>
  safe(async () => {
    // Membership, authentication and maintenance endpoints are always available.
    if (
      !/^\/api\/v1\/(device(?:\/|$)|room(?:\/|$)|house\/(?:energy-consumption|weather))/.test(
        new URL(request.url).pathname,
      )
    )
      return;
    const { policy } = await getReleasePolicy();
    if (!policy) return;
    const release = request.headers.get("x-mobile-release");
    const legacyAllowed = compareVersions(policy.minimumMobile, "1.0.0") === 0;
    if (!release && legacyAllowed) return;
    const platform = request.headers.get("x-mobile-platform");
    const native =
      platform === "android" || platform === "ios"
        ? policy.mobile[platform]
        : null;
    const version = z
      .string()
      .regex(/^\d+\.\d+\.\d+$/)
      .safeParse(release);
    const build = request.headers.get("x-mobile-build") ?? "0";
    if (
      !version.success ||
      compareVersions(version.data, policy.minimumMobile) < 0 ||
      !policy.apiContracts.includes(
        Number(request.headers.get("x-controller-contract")),
      ) ||
      (native &&
        ((native.runtimes.length > 0 &&
          !native.runtimes.includes(
            request.headers.get("x-mobile-runtime") ?? "",
          )) ||
          !/^\d+(\.\d+)*$/.test(build) ||
          compareVersions(build, String(native.minimumBuild)) < 0))
    )
      throw failure(
        "UPDATE_REQUIRED",
        `Update Control Nest to ${policy.minimumMobile} or later.`,
        426,
      );
  });

export const enforceControllerCompatibility = (id: string) =>
  safe(async () => {
    const { policy } = await getReleasePolicy();
    if (!policy || compareVersions(policy.minimumController, "1.0.0") === 0)
      return;
    const [observation] = await database
      .select()
      .from(controllerFirmware)
      .innerJoin(
        controllerDevices,
        and(
          eq(controllerDevices.id, controllerFirmware.controllerDeviceId),
          eq(
            controllerDevices.installationId,
            controllerFirmware.installationId,
          ),
        ),
      )
      .where(eq(controllerFirmware.controllerDeviceId, id));
    if (
      !observation?.controller_firmware.status.installedRelease ||
      compareVersions(
        observation.controller_firmware.status.installedRelease,
        policy.minimumController,
      ) < 0
    )
      throw failure(
        "UPDATE_REQUIRED",
        `Update this controller to ${policy.minimumController} or later. Status, updates and recovery remain available.`,
        426,
      );
  });

const controllerRecord = (id: string) =>
  safe(async () => {
    const [controller] = await database
      .select()
      .from(controllerDevices)
      .where(
        and(
          eq(controllerDevices.id, id),
          eq(controllerDevices.resourceStatus, "active"),
        ),
      );
    if (!controller?.apiKeyHash || !controller.installationId)
      throw failure(
        "BOOTSTRAP_REQUIRED",
        "Pair this controller and install its OTA bootstrap first.",
      );
    const [tunnel] = await database
      .select({ hostname: tunnels.hostname })
      .from(tunnels)
      .where(eq(tunnels.controllerDeviceId, id));
    if (!tunnel)
      throw failure(
        "CONTROLLER_OFFLINE",
        "The controller has no connection.",
        503,
      );
    const url = new URL(tunnel.hostname);
    if (url.protocol !== "https:" || url.username || url.password)
      throw failure(
        "CONTROLLER_OFFLINE",
        "Controller connection is invalid.",
        503,
      );
    return {
      ...controller,
      installationId: controller.installationId,
      url: url.origin,
    };
  });
const controllerRequest = async (
  url: string,
  token: string,
  path: string,
  body?: unknown,
) => {
  return fetch(`${url}${path}`, {
    method: body ? "POST" : "GET",
    signal: AbortSignal.timeout(12000),
    redirect: "error",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
};
const saveStatus = async (
  id: string,
  installationId: string,
  status: FirmwareStatus,
) => {
  await database
    .insert(controllerFirmware)
    .values({ controllerDeviceId: id, installationId, status })
    .onConflictDoUpdate({
      target: controllerFirmware.controllerDeviceId,
      set: { installationId, status, observedAt: new Date() },
    });
};
export const reportFirmwareStatus = (
  id: string,
  installationId: string,
  status: FirmwareStatus,
) =>
  safe(async () => {
    await saveStatus(id, installationId, status);
    return getReleasePolicy();
  });
const probe = async (id: string, token: string) => {
  const controller = await controllerRecord(id);
  const response = await tryCatch(
    controllerRequest(controller.url, token, "/controller/firmware"),
  );
  if (response.error)
    return { controller, connection: "offline" as const, status: null };
  if (response.data.status === 404)
    return {
      controller,
      connection: "bootstrap_required" as const,
      status: null,
    };
  if (response.data.status === 401 || response.data.status === 403)
    throw failure(
      "ACCESS_DENIED",
      "Controller authorization failed.",
      response.data.status,
    );
  if (!response.data.ok)
    return { controller, connection: "offline" as const, status: null };
  const parsed = StatusSchema.parse((await response.data.json()).data);
  await saveStatus(id, controller.installationId, parsed);
  return { controller, connection: "online" as const, status: parsed };
};
const approvedRelease = async (version: string) => {
  const [release] = await database
    .select()
    .from(releases)
    .where(eq(releases.version, version));
  if (!release?.published || !release.verified || release.revoked)
    throw failure(
      "RELEASE_INELIGIBLE",
      "This release is not available for installation.",
    );
  return release;
};
const publicJob = (job: typeof firmwareJobs.$inferSelect) => ({
  id: job.id,
  controllerDeviceId: job.controllerDeviceId,
  sourceVersion: job.sourceVersion,
  targetVersion: job.targetVersion,
  operation: job.operation,
  phase: job.phase,
  sequence: job.sequence,
  ...job.progress,
  updatedAt: job.updatedAt,
  acceptedAt: job.acceptedAt,
});
export const getFirmware = (id: string, userId: string, token: string) =>
  safe(async () => {
    const member = await authorizeHouseByControllerDevice({
      controllerDeviceId: id,
      userId,
    });
    const { connection, status, controller } = await probe(id, token);
    const [observation] = await database
      .select()
      .from(controllerFirmware)
      .where(
        and(
          eq(controllerFirmware.controllerDeviceId, id),
          eq(controllerFirmware.installationId, controller.installationId),
        ),
      );
    const { policy } = await getReleasePolicy();
    let available: { version: string; githubUrl: string } | null = null;
    if (policy?.latest && (await eligibleController(id))) {
      const candidate = await tryCatch(approvedRelease(policy.latest));
      if (candidate.data)
        available = {
          version: candidate.data.version,
          githubUrl: candidate.data.githubUrl,
        };
    }
    const [job] = await database
      .select()
      .from(firmwareJobs)
      .where(
        and(
          eq(firmwareJobs.controllerDeviceId, id),
          eq(firmwareJobs.installationId, controller.installationId),
        ),
      )
      .orderBy(desc(firmwareJobs.createdAt))
      .limit(1);
    const installed = status ?? observation?.status ?? null;
    return {
      controllerDeviceId: id,
      isAdmin: member.isAdmin,
      connection,
      status: installed,
      stale: connection !== "online",
      observedAt: observation?.observedAt ?? null,
      available,
      required: Boolean(
        policy &&
        installed?.installedRelease &&
        compareVersions(installed.installedRelease, policy.minimumController) <
          0,
      ),
      minimumController: policy?.minimumController ?? "1.0.0",
      job: job ? publicJob(job) : null,
    };
  });
const signTicket = (payload: object): Signed => {
  const { OTA_JOB_KEY_ID: keyId, OTA_JOB_PRIVATE_KEY: pem } = env.variables;
  if (!keyId || !pem)
    throw failure(
      "UPDATER_NOT_CONFIGURED",
      "Update authorization has not been configured.",
      503,
    );
  const key = createPrivateKey(pem.replace(/\\n/g, "\n"));
  if (key.asymmetricKeyType !== "ed25519")
    throw failure(
      "UPDATER_NOT_CONFIGURED",
      "Update authorization key is invalid.",
      503,
    );
  const bytes = Buffer.from(JSON.stringify(payload));
  return {
    keyId,
    payload: bytes.toString("base64"),
    signature: sign(null, bytes, key).toString("base64"),
  };
};
const recoveryGrant = (
  controllerDeviceId: string,
  installationId: string,
  release: string,
) =>
  signTicket({
    purpose: "recovery",
    controllerDeviceId,
    installationId,
    release,
    nonce: randomUUID(),
    issuedAt: Math.floor(Date.now() / 1000),
    expiresAt: Math.floor(Date.now() / 1000) + 86400,
  });
export const issueRecoveryGrant = (id: string, userId: string, token: string) =>
  safe(async () => {
    await authorizeHouseByControllerDevice({
      controllerDeviceId: id,
      userId,
      checkAdmin: true,
    });
    const { controller, status } = await probe(id, token);
    if (!status?.installedRelease)
      throw failure(
        "CONTROLLER_OFFLINE",
        "A running controller must be verified before issuing a recovery grant.",
      );
    return {
      grant: recoveryGrant(
        id,
        controller.installationId,
        status.installedRelease,
      ),
    };
  });
export const startFirmwareJob = (
  input: z.infer<typeof StartFirmwareSchema>,
  userId: string,
  token: string,
) =>
  safe(async () => {
    await authorizeHouseByControllerDevice({
      controllerDeviceId: input.controllerDeviceId,
      userId,
      checkAdmin: true,
    });
    const controller = await controllerRecord(input.controllerDeviceId);
    let [job] = await database
      .select()
      .from(firmwareJobs)
      .where(
        and(
          eq(firmwareJobs.controllerDeviceId, controller.id),
          eq(firmwareJobs.idempotencyKey, input.idempotencyKey),
        ),
      );
    if (
      job &&
      (job.requestedBy !== userId ||
        job.targetVersion !== input.targetVersion ||
        job.operation !== input.operation ||
        job.installationId !== controller.installationId)
    )
      throw failure(
        "IDEMPOTENCY_CONFLICT",
        "This request ID belongs to another update.",
      );
    if (job && terminalPhases.includes(job.phase))
      return { job: publicJob(job), delivery: "finished", recoveryGrant: null };
    if (!job) {
      const { status, connection } = await probe(controller.id, token);
      const sourceVersion =
        status?.installedRelease ??
        (input.operation === "rollback" ? status?.selectedRelease : null);
      if (connection !== "online" || !status || !sourceVersion)
        throw failure(
          connection === "bootstrap_required"
            ? "BOOTSTRAP_REQUIRED"
            : "CONTROLLER_OFFLINE",
          "Connect to an OTA-enabled controller before updating.",
        );
      if (status.recoveryRequired && input.operation !== "rollback")
        throw failure(
          "RECOVERY_REQUIRED",
          "Restore the working release before updating.",
        );
      const { policy } = await getReleasePolicy();
      if (
        input.operation === "update" &&
        (!policy ||
          policy.latest !== input.targetVersion ||
          !(await eligibleController(controller.id)))
      )
        throw failure(
          "RELEASE_INELIGIBLE",
          "This controller is outside the release rollout.",
        );
      if (
        input.operation === "rollback" &&
        status.previousRelease !== input.targetVersion
      )
        throw failure(
          "RELEASE_INELIGIBLE",
          "Only the recorded working release can be restored.",
        );
      const release = await approvedRelease(input.targetVersion);
      const envelope = release.manifests.find((signed) => {
        const manifest = decodeReleaseEnvelope(signed, ManifestSchema);
        return (
          manifest.architecture === status.architecture &&
          manifest.python === status.python &&
          manifest.os === status.os
        );
      });
      if (!envelope)
        throw failure(
          "UNSUPPORTED_TARGET",
          "No package supports this controller's OS, architecture and Python.",
        );
      const manifest = decodeReleaseEnvelope(envelope, ManifestSchema);
      if (
        manifest.version !== release.version ||
        manifest.commit !== release.commit ||
        compareVersions(status.updaterVersion, manifest.minUpdater) < 0 ||
        manifest.dataSchema !== status.dataSchema
      )
        throw failure(
          "UNSUPPORTED_TARGET",
          "An intermediate bootstrap or migration is required.",
        );
      // Serialize concurrent admins against the controller, then the partial unique index.
      job = await database.transaction(async (tx) => {
        await tx
          .select()
          .from(controllerDevices)
          .where(eq(controllerDevices.id, controller.id))
          .for("update");
        const [duplicate] = await tx
          .select()
          .from(firmwareJobs)
          .where(
            and(
              eq(firmwareJobs.controllerDeviceId, controller.id),
              eq(firmwareJobs.idempotencyKey, input.idempotencyKey),
            ),
          );
        if (duplicate) return duplicate;
        await tx
          .update(firmwareJobs)
          .set({
            phase: "failed",
            progress: {
              runningVersion: sourceVersion,
              failureCode: "AUTHORIZATION_EXPIRED",
            },
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(firmwareJobs.controllerDeviceId, controller.id),
              isNull(firmwareJobs.acceptedAt),
              lte(firmwareJobs.expiresAt, new Date()),
              eq(firmwareJobs.phase, "queued"),
            ),
          );
        const [active] = await tx
          .select()
          .from(firmwareJobs)
          .where(
            and(
              eq(firmwareJobs.controllerDeviceId, controller.id),
              notInArray(firmwareJobs.phase, terminalPhases),
            ),
          );
        if (active)
          throw failure(
            "UPDATE_IN_PROGRESS",
            "An update is already pending. Reconcile its status before starting another.",
          );
        const [created] = await tx
          .insert(firmwareJobs)
          .values({
            id: randomUUID(),
            controllerDeviceId: controller.id,
            installationId: controller.installationId,
            requestedBy: userId,
            idempotencyKey: input.idempotencyKey,
            operation: input.operation,
            sourceVersion,
            targetVersion: release.version,
            manifest: envelope,
            manifestDigest: createHash("sha256")
              .update(Buffer.from(envelope.payload, "base64"))
              .digest("hex"),
            nonce: randomUUID(),
            expiresAt: new Date(Date.now() + 5 * 60000),
            progress: { runningVersion: status.installedRelease },
          })
          .returning();
        return created;
      });
    }
    if (
      job.requestedBy !== userId ||
      job.targetVersion !== input.targetVersion ||
      job.operation !== input.operation ||
      job.installationId !== controller.installationId
    )
      throw failure(
        "IDEMPOTENCY_CONFLICT",
        "This request ID belongs to another update.",
      );
    const authorization = signTicket({
      jobId: job.id,
      userId,
      controllerDeviceId: controller.id,
      installationId: controller.installationId,
      operation: job.operation,
      manifestDigest: job.manifestDigest,
      fallback: job.sourceVersion,
      nonce: job.nonce,
      issuedAt: Math.floor(job.createdAt.getTime() / 1000),
      expiresAt: Math.floor(job.expiresAt.getTime() / 1000),
    });
    const delivered = await tryCatch(
      controllerRequest(
        controller.url,
        token,
        job.operation === "rollback"
          ? "/controller/firmware/rollback"
          : "/controller/firmware/jobs",
        { authorization, manifest: job.manifest },
      ),
    );
    if (delivered.data && !delivered.data.ok) {
      const body = await tryCatch(delivered.data.json());
      throw failure(
        body.data?.errors?.code ?? "UPDATE_REJECTED",
        "Controller could not accept this update. Refresh its status.",
        delivered.data.status,
      );
    }
    return {
      job: publicJob(job),
      delivery: delivered.error ? "uncertain" : "accepted",
      recoveryGrant: recoveryGrant(
        controller.id,
        controller.installationId,
        job.sourceVersion,
      ),
    };
  });
const findJob = async (id: string) => {
  const [job] = await database
    .select()
    .from(firmwareJobs)
    .where(eq(firmwareJobs.id, id));
  if (!job) throw failure("JOB_NOT_FOUND", "Update job not found.", 404);
  return job;
};
export const acceptFirmwareJob = (
  id: string,
  controllerId: string,
  installationId: string,
  nonce: string,
) =>
  safe(async () => {
    return database.transaction(async (tx) => {
      const [job] = await tx
        .select()
        .from(firmwareJobs)
        .where(eq(firmwareJobs.id, id))
        .for("update");
      if (
        !job ||
        job.controllerDeviceId !== controllerId ||
        job.installationId !== installationId ||
        job.nonce !== nonce
      )
        throw failure(
          "ACCESS_DENIED",
          "Job authorization does not match this installation.",
          403,
        );
      await authorizeHouseByControllerDevice({
        controllerDeviceId: controllerId,
        userId: job.requestedBy,
        checkAdmin: true,
      });
      if (
        terminalPhases.includes(job.phase) ||
        job.expiresAt.getTime() < Date.now()
      )
        throw failure(
          "AUTHORIZATION_EXPIRED",
          "Request a fresh update authorization.",
          403,
        );
      await approvedRelease(job.targetVersion);
      if (job.operation === "update") {
        const { policy } = await getReleasePolicy();
        if (
          !policy ||
          policy.latest !== job.targetVersion ||
          !(await eligibleController(controllerId))
        )
          throw failure(
            "RELEASE_INELIGIBLE",
            "This controller is outside the active release rollout.",
          );
      }
      await tx
        .update(firmwareJobs)
        .set({
          acceptedAt: job.acceptedAt ?? new Date(),
          updatedAt: new Date(),
        })
        .where(eq(firmwareJobs.id, id));
      return getReleasePolicy();
    });
  });
export const recordFirmwareEvent = (
  id: string,
  controllerId: string,
  installationId: string,
  event: z.infer<typeof EventSchema>,
) =>
  safe(async () => {
    const changed = await database.transaction(async (tx) => {
      const [job] = await tx
        .select()
        .from(firmwareJobs)
        .where(eq(firmwareJobs.id, id))
        .for("update");
      if (
        !job ||
        job.controllerDeviceId !== controllerId ||
        job.installationId !== installationId ||
        (!job.acceptedAt && event.phase !== "failed")
      )
        throw failure(
          "ACCESS_DENIED",
          "This installation cannot update this job.",
          403,
        );
      if (terminalPhases.includes(job.phase) || event.sequence <= job.sequence)
        return false;
      await tx
        .update(firmwareJobs)
        .set({
          phase: event.phase,
          sequence: event.sequence,
          progress: {
            runningVersion: event.runningVersion,
            failureCode: event.failureCode,
            bytes: event.bytes,
            totalBytes: event.totalBytes,
          },
          updatedAt: new Date(),
        })
        .where(eq(firmwareJobs.id, id));
      return true;
    });
    if (changed && event.status)
      await saveStatus(controllerId, installationId, event.status);
    return { recorded: true };
  });
export const getFirmwareJob = (id: string, userId: string, token: string) =>
  safe(async () => {
    let job = await findJob(id);
    await authorizeHouseByControllerDevice({
      controllerDeviceId: job.controllerDeviceId,
      userId,
    });
    const controller = await controllerRecord(job.controllerDeviceId);
    if (job.installationId !== controller.installationId)
      throw failure(
        "JOB_NOT_FOUND",
        "This job belongs to a previous installation.",
        404,
      );
    const result = await tryCatch(async () => {
      const response = await controllerRequest(
        controller.url,
        token,
        `/controller/firmware/jobs/${job.id}`,
      );
      if (!response.ok) return false;
      const event = EventSchema.parse((await response.json()).data);
      await recordFirmwareEvent(
        id,
        controller.id,
        controller.installationId,
        event,
      );
      return true;
    });
    // An unaccepted authorization is safe to expire; accepted work must be reconciled locally.
    if (!job.acceptedAt && job.expiresAt.getTime() < Date.now()) {
      await database
        .update(firmwareJobs)
        .set({
          phase: "failed",
          progress: {
            runningVersion: job.sourceVersion,
            failureCode: "AUTHORIZATION_EXPIRED",
          },
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(firmwareJobs.id, id),
            isNull(firmwareJobs.acceptedAt),
            eq(firmwareJobs.phase, "queued"),
          ),
        );
    }
    job = await findJob(id);
    return { ...publicJob(job), stale: !result.data };
  });
