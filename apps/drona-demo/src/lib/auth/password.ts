import "server-only";
import { scrypt, timingSafeEqual } from "node:crypto";
import { SCRYPT_PARAMETERS } from "./config";

// Valid, fixed-shape dummy record preserves expensive verification for unknown users.
const DUMMY_HASH = `scrypt$131072$8$1$${Buffer.alloc(16, 173).toString("base64url")}$${Buffer.alloc(64, 93).toString("base64url")}`;

export async function verifyPassword(password: string, passwordHash: string | undefined): Promise<boolean> {
  const encoded = passwordHash ?? DUMMY_HASH;
  const parts = encoded.split("$");
  if (parts.length !== 6 || parts.slice(0, 4).join("$") !== "scrypt$131072$8$1") return false;
  const salt = Buffer.from(parts[4], "base64url");
  const expected = Buffer.from(parts[5], "base64url");
  if (salt.length !== 16 || expected.length !== SCRYPT_PARAMETERS.keyLength) return false;
  if (password.length < 1 || Buffer.byteLength(password) > 1024) return false;
  const actual = await new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, SCRYPT_PARAMETERS.keyLength, { N: SCRYPT_PARAMETERS.N, r: SCRYPT_PARAMETERS.r, p: SCRYPT_PARAMETERS.p, maxmem: 256 * 1024 * 1024 }, (error, key) => error ? reject(error) : resolve(key));
  });
  return timingSafeEqual(actual, expected) && passwordHash !== undefined;
}
