import { NextResponse, type NextRequest } from "next/server";
import { readAuthConfig, SESSION_SECONDS } from "@/lib/auth/config";
import { cookieOptions, isTrustedPost, PRIVATE_HEADERS, readLoginBody, validCsrfToken } from "@/lib/auth/http";
import { verifyPassword } from "@/lib/auth/password";
import { allowLocalLoginAttempt } from "@/lib/auth/rate-limit";
import { issueSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const config = readAuthConfig();
    if (!config.loginEnabled) return new Response("Private demonstration access is temporarily unavailable.", { status: 503, headers: PRIVATE_HEADERS });
    if (!isTrustedPost(request, config)) return new Response("Request not permitted.", { status: 403, headers: PRIVATE_HEADERS });
    const body = await readLoginBody(request);
    if (!body || !validCsrfToken(body.get("csrf") ?? "", request.cookies.get(config.csrfCookie)?.value)) return new Response("Please reload the sign-in page and try again.", { status: 403, headers: PRIVATE_HEADERS });
    const username = (body.get("username") ?? "").trim().toLowerCase();
    const password = body.get("password") ?? "";
    if (!allowLocalLoginAttempt(request, username)) return new Response("Please wait before trying again.", { status: 429, headers: { ...PRIVATE_HEADERS, "Retry-After": "600" } });
    const invite = config.invites.find((candidate) => candidate.username === username);
    const passwordMatches = await verifyPassword(password, invite?.passwordHash);
    if (!passwordMatches || !invite || invite.disabled || invite.expiresAt <= Date.now()) return NextResponse.redirect(new URL("/login?error=access", config.origin), { status: 303, headers: PRIVATE_HEADERS });
    const token = await issueSession(config, invite);
    const response = NextResponse.redirect(new URL("/", config.origin), { status: 303, headers: PRIVATE_HEADERS });
    const maxAge = Math.min(SESSION_SECONDS, Math.floor((invite.expiresAt - Date.now()) / 1000));
    response.cookies.set(config.sessionCookie, token, cookieOptions(config, maxAge));
    response.cookies.set(config.csrfCookie, "", cookieOptions(config, 0));
    return response;
  } catch {
    return new Response("Private demonstration access is temporarily unavailable.", { status: 503, headers: PRIVATE_HEADERS });
  }
}
