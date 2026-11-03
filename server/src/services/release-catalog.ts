import { createHash } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import z from "zod";
import database from "@/database";
import { releases, releasePolicies } from "@/database/schema";
import { APIError } from "@/models/api";
import {
  ManifestSchema,
  PolicySchema,
  SignedSchema,
  VersionSchema,
  compareVersions,
} from "@/models/firmware";
import tryCatch from "@/utils/try-catch";
import { decodeReleaseEnvelope } from "./firmware";

const CatalogSchema = z.object({
  version: VersionSchema,
  commit: z.string().regex(/^[a-f0-9]{40}$/),
  githubUrl: z.url(),
  manifests: z.array(SignedSchema).min(1),
  mobile: z.record(z.string(), z.string()).default({}),
});
const repository = "Tauqeer-Ahmed-99/Control-Nest-v2";
const checked = async <T>(work: () => Promise<T>) => {
  const { data, error } = await tryCatch(work);
  if (error)
    throw new APIError({
      message:
        "Catalog operation failed. Check the signed inputs, publication and artifact integrity.",
    });
  return data;
};
export const registerRelease = (input: unknown) =>
  checked(async () => {
    const record = CatalogSchema.parse(input);
    if (
      record.githubUrl !==
      `https://github.com/${repository}/releases/tag/v${record.version}`
    )
      throw new Error("Release URL mismatch");
    const github = async (path: string) => {
      const response = await fetch(
        `https://api.github.com/repos/${repository}/${path}`,
        {
          signal: AbortSignal.timeout(30000),
          headers: { Accept: "application/vnd.github+json" },
        },
      );
      if (!response.ok) throw new Error("Publication unavailable");
      return response.json();
    };
    const published = await github(`releases/tags/v${record.version}`);
    if (
      published.draft ||
      !published.published_at ||
      published.tag_name !== `v${record.version}`
    )
      throw new Error("Release not published");
    let reference = (await github(`git/ref/tags/v${record.version}`)).object;
    for (let depth = 0; reference.type === "tag" && depth < 4; depth++)
      reference = (await github(`git/tags/${reference.sha}`)).object;
    if (reference.type !== "commit" || reference.sha !== record.commit)
      throw new Error("Commit mismatch");
    for (const envelope of record.manifests) {
      const manifest = decodeReleaseEnvelope(envelope, ManifestSchema);
      if (
        manifest.version !== record.version ||
        manifest.commit !== record.commit
      )
        throw new Error("Manifest mismatch");
      const response = await fetch(manifest.archiveUrl, {
        signal: AbortSignal.timeout(300000),
        redirect: "follow",
      });
      if (
        !response.ok ||
        !response.body ||
        new URL(response.url).protocol !== "https:"
      )
        throw new Error("Artifact unavailable");
      const digest = createHash("sha256");
      let bytes = 0;
      const reader = response.body.getReader();
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          bytes += value.length;
          if (bytes > manifest.size) {
            await reader.cancel();
            throw new Error("Artifact size exceeded");
          }
          digest.update(value);
        }
      } finally {
        reader.releaseLock();
      }
      if (bytes !== manifest.size || digest.digest("hex") !== manifest.sha256)
        throw new Error("Artifact digest mismatch");
    }
    // Published identities are immutable, including revoked releases.
    await database
      .insert(releases)
      .values({ ...record, published: true, verified: true, revoked: false });
    return { registered: record.version };
  });
export const activateReleasePolicy = (
  input: unknown,
  activateMinimums: boolean,
  rollout: unknown = [],
) =>
  checked(async () => {
    const envelope = SignedSchema.parse(input);
    const policy = decodeReleaseEnvelope(envelope, PolicySchema);
    const raw = JSON.parse(
      Buffer.from(envelope.payload, "base64").toString("utf8"),
    );
    if (Object.keys(raw).some((key) => !Object.keys(policy).includes(key)))
      throw new Error("Public policy contains unsupported fields");
    const controllerIds = z.array(z.uuid()).parse(rollout);
    const [previous] = await database
      .select()
      .from(releasePolicies)
      .orderBy(desc(releasePolicies.revision))
      .limit(1);
    const previousPolicy = previous
      ? decodeReleaseEnvelope(previous.envelope, PolicySchema)
      : null;
    if (previous && policy.revision <= previous.revision)
      throw new Error("Revision must increase");
    if (
      (compareVersions(
        policy.minimumMobile,
        previousPolicy?.minimumMobile ?? "1.0.0",
      ) > 0 ||
        compareVersions(
          policy.minimumController,
          previousPolicy?.minimumController ?? "1.0.0",
        ) > 0) &&
      !activateMinimums
    )
      throw new Error("Explicit minimum activation required");
    if (policy.latest) {
      const [release] = await database
        .select()
        .from(releases)
        .where(eq(releases.version, policy.latest));
      if (!release?.published || !release.verified || release.revoked)
        throw new Error("Latest release is ineligible");
    }
    await database
      .insert(releasePolicies)
      .values({
        revision: policy.revision,
        envelope,
        controllerIds,
        effectiveAt: new Date(policy.effectiveAt),
      });
    return { revision: policy.revision, effectiveAt: policy.effectiveAt };
  });
export const revokeRelease = (input: unknown) =>
  checked(async () => {
    const version = VersionSchema.parse(input);
    await database
      .update(releases)
      .set({ revoked: true })
      .where(eq(releases.version, version));
    return { revoked: version };
  });
