import argon2 from "argon2";

/**
 * Hash a plaintext password.
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}

/**
 * Compare plaintext password with stored hash.
 */
export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  try {
    return await argon2.verify(passwordHash, password);
  } catch {
    return false;
  }
}

/**
 * Check whether password hash needs updating.
 */
export function needsPasswordRehash(passwordHash: string): boolean {
  return argon2.needsRehash(passwordHash);
}
