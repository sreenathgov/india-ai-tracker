import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { readAuthConfig } from "@/lib/auth/config";
import { cookieOptions, createCsrfToken, isConfiguredHost, PRIVATE_HEADERS } from "@/lib/auth/http";
import { renderLoginPage } from "@/lib/login/presentation";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const config = readAuthConfig();
    if (!isConfiguredHost(request, config)) return new Response("Private demonstration unavailable.", { status: 403, headers: PRIVATE_HEADERS });
    const csrf = createCsrfToken();
    const nonce = randomBytes(16).toString("base64");
    const query = new URL(request.url).searchParams;
    const html = renderLoginPage({ csrf, nonce, enabled: config.loginEnabled, error: query.get("error") === "access", expired: query.get("expired") === "1" });
    const response = new NextResponse(html, { headers: {
      ...PRIVATE_HEADERS,
      "Content-Type": "text/html; charset=utf-8",
      // A nonce permits only the self-contained decorative renderer. Login and
      // its CSRF proof remain ordinary server-rendered HTML without JavaScript.
      "Content-Security-Policy": `default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'; connect-src 'none'; object-src 'none'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'`,
    } });
    response.cookies.set(config.csrfCookie, csrf, cookieOptions(config, 600));
    return response;
  } catch {
    return new Response("Access is temporarily unavailable.", { status: 503, headers: PRIVATE_HEADERS });
  }
}
