import nacl from "tweetnacl";
import { toByteArray } from "base64-js";
import type { Signed, ReleasePolicy } from "@/models/firmware";

export function verifyPolicy(envelope: Signed): ReleasePolicy {
  const keys: Record<string, string> = JSON.parse(
    process.env.EXPO_PUBLIC_OTA_POLICY_KEYS ?? "{}",
  );
  if (envelope.payload.length > 65536 || !keys[envelope.keyId])
    throw new Error("Release policy key is not trusted.");
  const payload = toByteArray(envelope.payload);
  if (
    !nacl.sign.detached.verify(
      payload,
      toByteArray(envelope.signature),
      toByteArray(keys[envelope.keyId]),
    )
  )
    throw new Error("Release policy signature is invalid.");
  const policy: ReleasePolicy = JSON.parse(new TextDecoder().decode(payload));
  if (
    !Number.isSafeInteger(policy.revision) ||
    policy.revision < 1 ||
    !/^\d+\.\d+\.\d+$/.test(policy.minimumMobile) ||
    !/^\d+\.\d+\.\d+$/.test(policy.minimumController) ||
    !policy.mobile?.android ||
    !policy.mobile?.ios ||
    !Array.isArray(policy.apiContracts) ||
    !Number.isFinite(Date.parse(policy.effectiveAt))
  )
    throw new Error("Release policy is invalid.");
  return policy;
}
