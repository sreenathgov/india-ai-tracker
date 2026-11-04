// @vitest-environment node
import { scryptSync } from "node:crypto";
import { NextRequest } from "next/server";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { GET as loginPage } from "../../app/login/route";
import { POST as login } from "../../app/api/auth/login/route";
import { POST as logout } from "../../app/api/auth/logout/route";
import { GET as status } from "../../app/api/auth/status/route";
import { readAuthConfig } from "./config";
import { clearLocalLoginLimitsForTesting } from "./rate-limit";
import { createCsrfToken, logoutCsrfToken } from "./http";
import { issueSession, verifySession } from "./session";

const origin = "https://demo.example.test";
const password = "fixture-only-route-password";
let record: { id: string; username: string; passwordHash: string; expiresAt: string; disabled: boolean; credentialVersion: number };
beforeAll(() => {
  const salt = Buffer.alloc(16, 51);
  const hash = scryptSync(password, salt, 64, { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 });
  record = { id: "route_fixture", username: "reviewer.fixture", passwordHash: `scrypt$131072$8$1$${salt.toString("base64url")}$${hash.toString("base64url")}`, expiresAt: "2099-01-01T00:00:00.000Z", disabled: false, credentialVersion: 1 };
});
beforeEach(() => {
  vi.stubEnv("DRONA_DEMO_ORIGIN", origin);
  vi.stubEnv("DRONA_SESSION_SECRET", Buffer.alloc(32, 67).toString("base64url"));
  vi.stubEnv("DRONA_DEMO_INVITES_JSON", JSON.stringify([record]));
  vi.stubEnv("DRONA_EDGE_RATE_LIMIT_READY", "true");
  vi.stubEnv("DRONA_ALLOW_INSECURE_LOCAL", "false");
});
afterEach(() => { clearLocalLoginLimitsForTesting(); vi.unstubAllEnvs(); });

function loginRequest({ username = "reviewer.fixture", suppliedPassword = password, csrf = createCsrfToken(), cookie = csrf, requestOrigin = origin }: { username?: string; suppliedPassword?: string; csrf?: string; cookie?: string; requestOrigin?: string } = {}): NextRequest {
  const config = readAuthConfig();
  return new NextRequest(origin + "/api/auth/login", {
    method: "POST", body: new URLSearchParams({ username, password: suppliedPassword, csrf }).toString(),
    headers: { "Content-Type": "application/x-www-form-urlencoded", Origin: requestOrigin, Cookie: `${config.csrfCookie}=${cookie}`, "Sec-Fetch-Site": "same-origin" },
  });
}

describe("actual authentication handlers", () => {
  it("renders an asset-independent login with CSRF and strict CSP", async () => {
    const response = await loginPage(new Request(origin + "/login"));
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("__Host-drona_csrf=");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    const policy = response.headers.get("content-security-policy") ?? "";
    const nonce = /script-src 'nonce-([^']+)'/.exec(policy)?.[1];
    expect(nonce).toBeTruthy();
    expect(policy).toContain("connect-src 'none'");
    expect(policy).not.toMatch(/unsafe-inline|unsafe-eval/);
    expect(html).toContain(`<script nonce="${nonce}">`);
    expect(html).toContain(`<style nonce="${nonce}">`);
    expect(html).not.toMatch(/<script[^>]+src=|<link[^>]+href=/i);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(html).toContain('autocomplete="current-password"');
    expect(html).toContain('name="csrf"');
    expect(html).not.toContain("/_next/"); expect(html).not.toContain("Paragon"); expect(html).not.toContain(record.passwordHash);
  });
  it("uses the approved minimal copy and shows messages only when relevant", async () => {
    const normal = await (await loginPage(new Request(origin + "/login"))).text();
    expect(normal).toContain("Explore Drona.");
    expect(normal).toContain("A guided demonstration of supply-chain risk intelligence.");
    expect(normal).toContain("Enter demo");
    expect(normal).toContain("Private demonstration · Illustrative data");
    expect(normal).not.toContain("By Kanan");
    expect(normal).not.toContain("Kanan host");
    expect(normal).not.toContain('class="notice');
    const error = await (await loginPage(new Request(origin + "/login?error=access"))).text();
    expect(error).toContain('role="alert">Check your username and password.');
    const expired = await (await loginPage(new Request(origin + "/login?expired=1"))).text();
    expect(expired).toContain('role="status">Session ended. Sign in again.');
    const arbitrary = await (await loginPage(new Request(origin + "/login?error=%3Cscript%3E&expired=%3Csvg%3E"))).text();
    expect(arbitrary).not.toContain('class="notice');
    const first = await loginPage(new Request(origin + "/login"));
    const second = await loginPage(new Request(origin + "/login"));
    expect(first.headers.get("content-security-policy")).not.toBe(second.headers.get("content-security-policy"));
  });
  it("issues a host-only signed session only after valid password and CSRF", async () => {
    const response = await login(loginRequest()); const config = readAuthConfig();
    expect(response.status).toBe(303); expect(response.headers.get("location")).toBe(origin + "/");
    const cookie = response.headers.get("set-cookie") ?? "";
    const token = cookie.match(/__Host-drona_session=([^;]+)/)?.[1];
    expect((await verifySession(token, config))?.username).toBe(record.username);
    expect(cookie).toContain("Secure"); expect(cookie).toContain("HttpOnly"); expect(cookie).toContain("SameSite=lax"); expect(cookie).not.toContain("Domain=");
  });
  it("does not reveal wrong, absent or disabled invitations", async () => {
    for (const request of [loginRequest({ suppliedPassword: "incorrect" }), loginRequest({ username: "unknown.fixture" })]) {
      const response = await login(request);
      expect(response.status).toBe(303); expect(response.headers.get("location")).toBe(origin + "/login?error=access");
      expect(response.headers.get("set-cookie")).toBeNull();
    }
    vi.stubEnv("DRONA_DEMO_INVITES_JSON", JSON.stringify([{ ...record, disabled: true }]));
    const response = await login(loginRequest());
    expect(response.status).toBe(303); expect(response.headers.get("location")).toBe(origin + "/login?error=access");
  });
  it("rejects cross-origin and mismatched CSRF before password verification", async () => {
    expect((await login(loginRequest({ requestOrigin: "https://attacker.test" }))).status).toBe(403);
    expect((await login(loginRequest({ cookie: createCsrfToken() }))).status).toBe(403);
  });
  it("keeps production login closed until edge configuration is confirmed", async () => {
    vi.stubEnv("DRONA_EDGE_RATE_LIMIT_READY", "false");
    expect((await login(loginRequest())).status).toBe(503);
    expect(await (await loginPage(new Request(origin + "/login"))).text()).toContain("disabled");
  });
  it("returns only session expiry through the private status endpoint", async () => {
    const config = readAuthConfig(); const token = await issueSession(config, config.invites[0]);
    const response = await status(new NextRequest(origin + "/api/auth/status", { headers: { Cookie: `${config.sessionCookie}=${token}` } }));
    expect(response.status).toBe(200);
    expect(Object.keys(await response.json())).toEqual(["expiresAt"]);
    expect((await status(new NextRequest(origin + "/api/auth/status"))).status).toBe(401);
  });
  it("clears cookies only for a valid session-bound, same-origin logout", async () => {
    const config = readAuthConfig(); const token = await issueSession(config, config.invites[0]);
    const request = (csrf: string, requestOrigin = origin) => new NextRequest(origin + "/api/auth/logout", { method: "POST", body: new URLSearchParams({ csrf }).toString(), headers: { "Content-Type": "application/x-www-form-urlencoded", Origin: requestOrigin, Cookie: `${config.sessionCookie}=${token}` } });
    expect((await logout(request(createCsrfToken()))).status).toBe(403);
    expect((await logout(request(logoutCsrfToken(token, config), "https://attacker.test"))).status).toBe(403);
    const response = await logout(request(logoutCsrfToken(token, config)));
    expect(response.status).toBe(303); expect(response.headers.get("location")).toBe(origin + "/login");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
