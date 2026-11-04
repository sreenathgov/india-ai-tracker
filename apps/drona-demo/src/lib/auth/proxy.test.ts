// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("server-only", () => ({}));
import { proxy } from "../../proxy";
import { readAuthConfig } from "./config";
import { issueSession } from "./session";

const origin = "https://demo.example.test";
const invite = { id: "proxy_fixture", username: "reviewer.fixture", passwordHash: `scrypt$131072$8$1$${Buffer.alloc(16, 31).toString("base64url")}$${Buffer.alloc(64, 91).toString("base64url")}`, expiresAt: "2099-01-01T00:00:00.000Z", disabled: false, credentialVersion: 1 };

beforeEach(() => {
  vi.stubEnv("DRONA_DEMO_ORIGIN", origin);
  vi.stubEnv("DRONA_SESSION_SECRET", Buffer.alloc(32, 67).toString("base64url"));
  vi.stubEnv("DRONA_DEMO_INVITES_JSON", JSON.stringify([invite]));
  vi.stubEnv("DRONA_EDGE_RATE_LIMIT_READY", "true");
});
afterEach(() => vi.unstubAllEnvs());

describe("private deployment request boundary", () => {
  it("serves only exact public login/robots endpoints without a session", async () => {
    for (const path of ["/login", "/robots.txt"]) expect((await proxy(new NextRequest(origin + path))).headers.get("x-middleware-next")).toBe("1");
    expect((await proxy(new NextRequest(origin + "/api/auth/login", { method: "POST" }))).headers.get("x-middleware-next")).toBe("1");
    expect((await proxy(new NextRequest(origin + "/api/auth/login"))).status).toBe(401);
  });
  it("protects JS, fonts, images, RSC, APIs and hidden pages", async () => {
    for (const path of ["/", "/styleguide", "/_next/static/chunks/app/page.js", "/_next/static/media/private.woff2", "/_next/image?url=private", "/?__rsc=fixture", "/api/auth/status", "/api/auth/logout", "/login/not-public"]) {
      const result = await proxy(new NextRequest(origin + path, { headers: { RSC: "1", "Next-Router-Prefetch": "1", "x-middleware-subrequest": "proxy:proxy:proxy" } }));
      expect(result.status).toBe(401);
      expect(result.headers.get("Cache-Control")).toContain("no-store");
    }
  });
  it("redirects a document to a fixed local login, never a submitted return URL", async () => {
    const result = await proxy(new NextRequest(origin + "/?returnTo=https://attacker.test", { headers: { Accept: "text/html" } }));
    expect(result.status).toBe(303); expect(result.headers.get("location")).toBe(origin + "/login");
  });
  it("rejects alternate deployment origins and fails closed without config", async () => {
    expect((await proxy(new NextRequest("https://unconfigured-preview.vercel.app/login"))).status).toBe(403);
    vi.stubEnv("DRONA_SESSION_SECRET", "");
    expect((await proxy(new NextRequest(origin + "/"))).status).toBe(503);
    expect((await proxy(new NextRequest(origin + "/login"))).status).toBe(503);
  });
  it("handles Next loopback normalization using actual Host and rejects forwarded-host spoofing", async () => {
    vi.stubEnv("DRONA_DEMO_ORIGIN", "http://127.0.0.1:3402");
    vi.stubEnv("DRONA_ALLOW_INSECURE_LOCAL", "true");
    vi.stubEnv("VERCEL", ""); vi.stubEnv("VERCEL_ENV", "");
    const local = new NextRequest("http://127.0.0.1:3402/login", { headers: { Host: "127.0.0.1:3402" } });
    expect(local.url).toContain("localhost");
    expect((await proxy(local)).headers.get("x-middleware-next")).toBe("1");
    const spoofed = new NextRequest("http://127.0.0.1:3402/login", { headers: { Host: "unapproved.example.test", "X-Forwarded-Host": "127.0.0.1:3402" } });
    expect((await proxy(spoofed)).status).toBe(403);
  });
  it("admits a valid session for assets and rechecks account revocation", async () => {
    const config = readAuthConfig(); const token = await issueSession(config, config.invites[0]);
    const request = () => new NextRequest(origin + "/_next/static/chunks/app/page.js", { headers: { Cookie: `${config.sessionCookie}=${token}` } });
    expect((await proxy(request())).headers.get("x-middleware-next")).toBe("1");
    vi.stubEnv("DRONA_DEMO_INVITES_JSON", JSON.stringify([{ ...invite, disabled: true }]));
    expect((await proxy(request())).status).toBe(401);
  });
});
