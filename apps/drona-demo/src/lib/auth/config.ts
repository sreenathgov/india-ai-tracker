import "server-only";

export const SESSION_SECONDS = 8 * 60 * 60;
export const SCRYPT_PARAMETERS = { N: 131072, r: 8, p: 1, keyLength: 64 } as const;
const USERNAME = /^[a-z0-9][a-z0-9._-]{2,63}$/;
const PASSWORD_HASH = /^scrypt\$131072\$8\$1\$[A-Za-z0-9_-]{22}\$[A-Za-z0-9_-]{86}$/;

export interface DemoInvite {
  readonly id: string;
  readonly username: string;
  readonly passwordHash: string;
  readonly expiresAt: number;
  readonly disabled: boolean;
  readonly credentialVersion: number;
}

export interface AuthConfig {
  readonly origin: string;
  readonly secret: Uint8Array;
  readonly secure: boolean;
  readonly sessionCookie: string;
  readonly csrfCookie: string;
  readonly invites: readonly DemoInvite[];
  readonly loginEnabled: boolean;
}

export class AuthConfigurationError extends Error {
  constructor() { super("Private demonstration access is unavailable."); }
}

function fail(): never { throw new AuthConfigurationError(); }

/** Server-only, validated on each request: configuration errors never open access. */
export function readAuthConfig(env: Readonly<Record<string, string | undefined>> = process.env): AuthConfig {
  let url: URL;
  try { url = new URL(env.DRONA_DEMO_ORIGIN ?? ""); } catch { return fail(); }
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) return fail();
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  const insecureLocal = env.DRONA_ALLOW_INSECURE_LOCAL === "true" && loopback && !env.VERCEL && !env.VERCEL_ENV;
  if (url.protocol !== "https:" && !(url.protocol === "http:" && insecureLocal)) return fail();
  const encodedSecret = env.DRONA_SESSION_SECRET ?? "";
  if (!/^[A-Za-z0-9_-]{43,86}$/.test(encodedSecret)) return fail();
  const secret = Buffer.from(encodedSecret, "base64url");
  if (secret.length < 32 || secret.length > 64 || secret.toString("base64url") !== encodedSecret) return fail();
  const encodedInvites = env.DRONA_DEMO_INVITES_JSON ?? "";
  if (!encodedInvites || Buffer.byteLength(encodedInvites) > 65536) return fail();
  let records: unknown;
  try { records = JSON.parse(encodedInvites); } catch { return fail(); }
  if (!Array.isArray(records) || records.length < 1 || records.length > 64) return fail();
  const identifiers = new Set<string>();
  const usernames = new Set<string>();
  const invites: DemoInvite[] = records.map((record: unknown) => {
    if (!record || typeof record !== "object" || Array.isArray(record)) return fail();
    const value = record as Record<string, unknown>;
    if (typeof value.id !== "string" || !/^[A-Za-z0-9_-]{8,64}$/.test(value.id) || identifiers.has(value.id)) return fail();
    if (typeof value.username !== "string" || !USERNAME.test(value.username) || usernames.has(value.username)) return fail();
    if (typeof value.passwordHash !== "string" || !PASSWORD_HASH.test(value.passwordHash)) return fail();
    const [, , , , salt, hash] = value.passwordHash.split("$");
    if (Buffer.from(salt, "base64url").length !== 16 || Buffer.from(salt, "base64url").toString("base64url") !== salt) return fail();
    if (Buffer.from(hash, "base64url").length !== 64 || Buffer.from(hash, "base64url").toString("base64url") !== hash) return fail();
    const expiresAt = typeof value.expiresAt === "string" ? Date.parse(value.expiresAt) : NaN;
    if (!Number.isFinite(expiresAt) || typeof value.disabled !== "boolean" || !Number.isSafeInteger(value.credentialVersion) || Number(value.credentialVersion) < 1) return fail();
    identifiers.add(value.id); usernames.add(value.username);
    return { id: value.id, username: value.username, passwordHash: value.passwordHash, expiresAt, disabled: value.disabled, credentialVersion: Number(value.credentialVersion) };
  });
  const secure = url.protocol === "https:";
  return {
    origin: url.origin, secret, secure, invites,
    sessionCookie: secure ? "__Host-drona_session" : "drona_local_session",
    csrfCookie: secure ? "__Host-drona_csrf" : "drona_local_csrf",
    loginEnabled: insecureLocal || env.DRONA_EDGE_RATE_LIMIT_READY === "true",
  };
}

export function activeInvite(config: AuthConfig, id: string, version: number, now = Date.now()): DemoInvite | null {
  return config.invites.find((invite) => invite.id === id && invite.credentialVersion === version && !invite.disabled && invite.expiresAt > now) ?? null;
}
