import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { activeInvite, SESSION_SECONDS, type AuthConfig, type DemoInvite } from "./config";

const ISSUER = "drona-private-demonstration";
export interface DemoSession {
  readonly subject: string;
  readonly username: string;
  readonly expiresAt: number;
}

export async function issueSession(config: AuthConfig, invite: DemoInvite, now = Date.now()): Promise<string> {
  const issuedAt = Math.floor(now / 1000);
  const expiresAt = Math.min(issuedAt + SESSION_SECONDS, Math.floor(invite.expiresAt / 1000));
  if (!activeInvite(config, invite.id, invite.credentialVersion, now) || expiresAt <= issuedAt) throw new Error("Access unavailable.");
  return new SignJWT({ version: invite.credentialVersion, purpose: "demo-session" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(invite.id).setIssuer(ISSUER).setAudience(config.origin)
    .setIssuedAt(issuedAt).setExpirationTime(expiresAt).sign(config.secret);
}

/** Recheck current invite state as well as cryptographic/dated token validity. */
export async function verifySession(token: string | undefined, config: AuthConfig, now = Date.now()): Promise<DemoSession | null> {
  if (!token || token.length > 2048) return null;
  try {
    const { payload, protectedHeader } = await jwtVerify(token, config.secret, {
      algorithms: ["HS256"], issuer: ISSUER, audience: config.origin,
      currentDate: new Date(now), maxTokenAge: SESSION_SECONDS, clockTolerance: 0,
    });
    if (protectedHeader.typ !== "JWT" || payload.purpose !== "demo-session" || typeof payload.sub !== "string" || !Number.isSafeInteger(payload.version) || !Number.isSafeInteger(payload.exp) || !Number.isSafeInteger(payload.iat)) return null;
    if (Number(payload.iat) > Math.floor(now / 1000) || Number(payload.exp) > Number(payload.iat) + SESSION_SECONDS) return null;
    const invite = activeInvite(config, payload.sub, Number(payload.version), now);
    return invite ? { subject: invite.id, username: invite.username, expiresAt: Math.min(Number(payload.exp) * 1000, invite.expiresAt) } : null;
  } catch { return null; }
}
