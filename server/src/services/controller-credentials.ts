import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const generateControllerKey = (controllerId: string) =>
  `cn_${controllerId}.${randomBytes(32).toString("base64url")}`;
export const hashControllerKey = (key: string) =>
  createHash("sha256").update(key).digest("hex");
export const controllerIdFromKey = (key: string) =>
  /^cn_([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\.[A-Za-z0-9_-]{43}$/.exec(
    key,
  )?.[1];
export const matchesControllerKey = (key: string, hash: string) => {
  const expected = Buffer.from(hash, "hex");
  const actual = Buffer.from(hashControllerKey(key), "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
};
