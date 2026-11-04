import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { AuthConfig } from "./config";

export const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "X-Content-Type-Options": "nosniff",
  // Chrome serializes a form's Origin as null under no-referrer. Preserve the
  // same-origin POST proof while omitting referrers to other origins.
  "Referrer-Policy": "same-origin",
  "X-Frame-Options": "DENY",
} as const;

export function cookieOptions(config: AuthConfig, maxAge: number) {
  return { httpOnly: true, secure: config.secure, sameSite: "lax" as const, path: "/", maxAge };
}

export function isConfiguredHost(request: Request, config: AuthConfig): boolean {
  try {
    // NextURL normalizes loopback names to localhost and may use an internal
    // origin. Compare the actual HTTP authority to the one configured authority.
    // Never accept X-Forwarded-Host or a wildcard/provider-host fallback.
    const host = request.headers.get("host");
    if (host !== null) return host === new URL(config.origin).host;
    // Native/synthetic Request fixtures may have no Host header at all.
    return new URL(request.url).origin === config.origin;
  } catch { return false; }
}

/** Browser Origin is required; no fallback to an attacker-supplied Host header. */
export function isTrustedPost(request: Request, config: AuthConfig): boolean {
  if (request.method !== "POST" || !isConfiguredHost(request, config)) return false;
  if (request.headers.get("origin") !== config.origin) return false;
  const site = request.headers.get("sec-fetch-site");
  return !site || site === "same-origin" || site === "none";
}

export function createCsrfToken(): string { return randomBytes(32).toString("base64url"); }
export function validCsrfToken(submitted: string, cookie: string | undefined): boolean {
  if (!cookie || !/^[A-Za-z0-9_-]{43}$/.test(submitted) || !/^[A-Za-z0-9_-]{43}$/.test(cookie)) return false;
  return timingSafeEqual(Buffer.from(submitted), Buffer.from(cookie));
}

/** Bounded streaming reader, including chunked bodies without Content-Length. */
export async function readBoundedForm(request: Request, fields: readonly string[]): Promise<URLSearchParams | null> {
  if (!/^application\/x-www-form-urlencoded(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) return null;
  const length = request.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > 4096)) return null;
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 4096) { await reader.cancel(); return null; }
      chunks.push(value);
    }
    const joined = Buffer.concat(chunks);
    const params = new URLSearchParams(new TextDecoder("utf-8", { fatal: true }).decode(joined));
    for (const name of fields) if (params.getAll(name).length !== 1) return null;
    if ([...params.keys()].some((key) => !fields.includes(key))) return null;
    return params;
  } catch { return null; }
}

export function readLoginBody(request: Request): Promise<URLSearchParams | null> {
  return readBoundedForm(request, ["username", "password", "csrf"]);
}

/** Session-bound CSRF proof; the signed session itself is never exposed to JS. */
export function logoutCsrfToken(sessionToken: string, config: AuthConfig): string {
  return createHmac("sha256", config.secret).update(`drona-logout:${sessionToken}`).digest("base64url");
}
