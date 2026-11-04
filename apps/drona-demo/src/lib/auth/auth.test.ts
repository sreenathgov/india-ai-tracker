// @vitest-environment node
import { scryptSync } from "node:crypto";
import { SignJWT } from "jose";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { readAuthConfig, AuthConfigurationError, SESSION_SECONDS, type AuthConfig } from "./config";
import { issueSession, verifySession } from "./session";
import { verifyPassword } from "./password";
import { cookieOptions, createCsrfToken, isConfiguredHost, isTrustedPost, logoutCsrfToken, readLoginBody, validCsrfToken } from "./http";
import { allowLocalLoginAttempt, clearLocalLoginLimitsForTesting } from "./rate-limit";

const NOW = Date.parse("2026-11-03T12:00:00Z");
const SECRET = Buffer.alloc(32, 67).toString("base64url");
const SALT = Buffer.alloc(16, 31);
const SHAPE_HASH = `scrypt$131072$8$1$${SALT.toString("base64url")}$${Buffer.alloc(64, 91).toString("base64url")}`;
const RECORD = { id: "fixture_invite", username: "reviewer.fixture", passwordHash: SHAPE_HASH, expiresAt: "2026-12-01T00:00:00.000Z", disabled: false, credentialVersion: 1 };
function env(overrides: Record<string, string | undefined> = {}): Record<string, string | undefined> {
  return { DRONA_DEMO_ORIGIN: "https://demo.example.test", DRONA_SESSION_SECRET: SECRET, DRONA_DEMO_INVITES_JSON: JSON.stringify([RECORD]), DRONA_EDGE_RATE_LIMIT_READY: "true", ...overrides };
}
function config(): AuthConfig { return readAuthConfig(env()); }
afterEach(() => clearLocalLoginLimitsForTesting());

describe("server-only invite configuration", () => {
  it("does not create default accounts or a default secret", () => {
    expect(() => readAuthConfig({})).toThrow(AuthConfigurationError);
    for (const key of ["DRONA_DEMO_ORIGIN", "DRONA_SESSION_SECRET", "DRONA_DEMO_INVITES_JSON"]) expect(() => readAuthConfig(env({ [key]: undefined }))).toThrow(AuthConfigurationError);
  });
  it("rejects unsafe origins, short secrets, malformed invites and duplicate identities", () => {
    for (const origin of ["http://demo.example.test", "https://demo.example.test/path", "https://user:pass@demo.example.test", "https://demo.example.test/?next=evil"]) expect(() => readAuthConfig(env({ DRONA_DEMO_ORIGIN: origin }))).toThrow(AuthConfigurationError);
    expect(() => readAuthConfig(env({ DRONA_SESSION_SECRET: "too-short" }))).toThrow(AuthConfigurationError);
    for (const records of [[], [RECORD, RECORD], [{ ...RECORD, passwordHash: "plaintext" }], [{ ...RECORD, credentialVersion: 0 }], [{ ...RECORD, disabled: "false" }], [{ ...RECORD, expiresAt: "not-a-date" }]]) expect(() => readAuthConfig(env({ DRONA_DEMO_INVITES_JSON: JSON.stringify(records) }))).toThrow(AuthConfigurationError);
  });
  it("requires persistent edge protection before production login opens", () => {
    expect(readAuthConfig(env({ DRONA_EDGE_RATE_LIMIT_READY: undefined })).loginEnabled).toBe(false);
    expect(readAuthConfig(env({ DRONA_EDGE_RATE_LIMIT_READY: "false" })).loginEnabled).toBe(false);
  });
  it("permits explicit loopback-only local development and never a Vercel bypass", () => {
    const local = { DRONA_DEMO_ORIGIN: "http://127.0.0.1:3412", DRONA_ALLOW_INSECURE_LOCAL: "true", DRONA_EDGE_RATE_LIMIT_READY: undefined };
    const value = readAuthConfig(env(local));
    expect(value.secure).toBe(false); expect(value.loginEnabled).toBe(true);
    expect(value.sessionCookie).toBe("drona_local_session");
    expect(() => readAuthConfig(env({ ...local, VERCEL_ENV: "preview" }))).toThrow(AuthConfigurationError);
    expect(() => readAuthConfig(env({ ...local, DRONA_DEMO_ORIGIN: "http://attacker.test" }))).toThrow(AuthConfigurationError);
  });
});

describe("signed sessions and invitation lifecycle", () => {
  it("checks signature, origin audience and expiration", async () => {
    const value = config();
    const token = await issueSession(value, value.invites[0], NOW);
    expect(await verifySession(token, value, NOW)).toEqual({ subject: RECORD.id, username: RECORD.username, expiresAt: NOW + SESSION_SECONDS * 1000 });
    expect(await verifySession(token + "x", value, NOW)).toBeNull();
    expect(await verifySession(token, { ...value, secret: Buffer.alloc(32, 68) }, NOW)).toBeNull();
    expect(await verifySession(token, { ...value, origin: "https://elsewhere.test" }, NOW)).toBeNull();
    expect(await verifySession(token, value, NOW + SESSION_SECONDS * 1000)).toBeNull();
  });
  it("rechecks disabled, removed, expired and credential-version-changed invitations", async () => {
    const value = config(); const token = await issueSession(value, value.invites[0], NOW);
    for (const changes of [{ disabled: true }, { credentialVersion: 2 }, { expiresAt: NOW }]) expect(await verifySession(token, { ...value, invites: [{ ...value.invites[0], ...changes }] }, NOW)).toBeNull();
    expect(await verifySession(token, { ...value, invites: [] }, NOW)).toBeNull();
  });
  it("never lets a session outlive its invitation", async () => {
    const value = config(); const invite = { ...value.invites[0], expiresAt: NOW + 60000 };
    const bounded = { ...value, invites: [invite] };
    const token = await issueSession(bounded, invite, NOW);
    expect((await verifySession(token, bounded, NOW))?.expiresAt).toBe(NOW + 60000);
    expect(await verifySession(token, bounded, NOW + 60000)).toBeNull();
    await expect(issueSession({ ...bounded, invites: [{ ...invite, disabled: true }] }, invite, NOW)).rejects.toThrow();
  });
  it("rejects signed tokens with the wrong purpose, future issuance or excessive lifetime", async () => {
    const value = config();
    for (const claims of [{ purpose: "other", iat: NOW / 1000, exp: NOW / 1000 + 10 }, { purpose: "demo-session", iat: NOW / 1000 + 10, exp: NOW / 1000 + 20 }, { purpose: "demo-session", iat: NOW / 1000, exp: NOW / 1000 + SESSION_SECONDS + 10 }]) {
      const token = await new SignJWT({ ...claims, version: 1 }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setSubject(RECORD.id).setIssuer("drona-private-demonstration").setAudience(value.origin).sign(value.secret);
      expect(await verifySession(token, value, NOW)).toBeNull();
    }
  });
});

describe("password verification", () => {
  let realHash: string;
  beforeAll(() => {
    const key = scryptSync("fixture-only-long-password", SALT, 64, { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 });
    realHash = `scrypt$131072$8$1$${SALT.toString("base64url")}$${key.toString("base64url")}`;
  });
  it("verifies salted scrypt, rejects wrong passwords and unknown users", async () => {
    expect(await verifyPassword("fixture-only-long-password", realHash)).toBe(true);
    expect(await verifyPassword("wrong-password", realHash)).toBe(false);
    expect(await verifyPassword("fixture-only-long-password", undefined)).toBe(false);
  });
  it("rejects attacker-selected work factors and oversized inputs", async () => {
    expect(await verifyPassword("password", realHash.replace("131072", "1048576"))).toBe(false);
    expect(await verifyPassword("x".repeat(1025), realHash)).toBe(false);
  });
});

describe("request, CSRF, cookies and secondary abuse boundaries", () => {
  it("uses exact actual Host when Next supplies an internal URL, never forwarded-host", () => {
    const value = config();
    expect(isConfiguredHost(new Request("http://localhost:3000/login", { headers: { Host: "demo.example.test" } }), value)).toBe(true);
    expect(isConfiguredHost(new Request(value.origin + "/login", { headers: { Host: "other-preview.vercel.app", "X-Forwarded-Host": "demo.example.test" } }), value)).toBe(false);
    expect(isConfiguredHost(new Request(value.origin + "/login", { headers: { Host: "demo.example.test.attacker.test" } }), value)).toBe(false);
    expect(isConfiguredHost(new Request(value.origin + "/login", { headers: { Host: "demo.example.test:444" } }), value)).toBe(false);
    expect(isConfiguredHost(new Request("https://other-preview.vercel.app/login", { headers: { "X-Forwarded-Host": "demo.example.test" } }), value)).toBe(false);
    expect(isConfiguredHost(new Request(value.origin + "/login"), value)).toBe(true);
  });
  it("requires the exact configured Origin for state changes", () => {
    const value = config();
    const request = (origin?: string, site?: string) => new Request(value.origin + "/api/auth/login", { method: "POST", headers: { ...(origin ? { Origin: origin } : {}), ...(site ? { "Sec-Fetch-Site": site } : {}) } });
    expect(isTrustedPost(request(value.origin, "same-origin"), value)).toBe(true);
    expect(isTrustedPost(request(), value)).toBe(false);
    expect(isTrustedPost(request("https://demo.example.test.attacker.test"), value)).toBe(false);
    expect(isTrustedPost(request(value.origin, "cross-site"), value)).toBe(false);
  });
  it("binds logout proof to the session and uses host-only secure cookies", () => {
    const value = config(); const csrf = createCsrfToken();
    expect(validCsrfToken(csrf, csrf)).toBe(true);
    expect(validCsrfToken(csrf, createCsrfToken())).toBe(false);
    expect(validCsrfToken(csrf, undefined)).toBe(false);
    expect(logoutCsrfToken("session-a", value)).not.toBe(logoutCsrfToken("session-b", value));
    expect(cookieOptions(value, 300)).toEqual({ httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 300 });
    expect(value.sessionCookie.startsWith("__Host-")).toBe(true);
  });
  it("bounds actual streamed body size and rejects duplicate fields", async () => {
    const request = (body: string, contentType = "application/x-www-form-urlencoded") => new Request("https://demo.example.test/api/auth/login", { method: "POST", body, headers: { "Content-Type": contentType } });
    expect((await readLoginBody(request("username=reviewer&password=secret&csrf=token")))?.get("username")).toBe("reviewer");
    expect(await readLoginBody(request("username=a&username=b&password=c&csrf=d"))).toBeNull();
    expect(await readLoginBody(request("username=a&password=c&csrf=d&redirect=https://evil.test"))).toBeNull();
    expect(await readLoginBody(request("x".repeat(4097)))).toBeNull();
    expect(await readLoginBody(request("{}", "application/json"))).toBeNull();
  });
  it("blocks repeated local attempts and expires buckets", () => {
    const request = new Request("https://demo.example.test/api/auth/login");
    for (let attempt = 0; attempt < 8; attempt += 1) expect(allowLocalLoginAttempt(request, "test-account", NOW)).toBe(true);
    expect(allowLocalLoginAttempt(request, "test-account", NOW)).toBe(false);
    expect(allowLocalLoginAttempt(request, "another-account", NOW)).toBe(true);
    expect(allowLocalLoginAttempt(request, "test-account", NOW + 600001)).toBe(true);
  });
});
