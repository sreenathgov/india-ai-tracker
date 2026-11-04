import { NextResponse, type NextRequest } from "next/server";
import { readAuthConfig } from "@/lib/auth/config";
import { cookieOptions, isTrustedPost, logoutCsrfToken, PRIVATE_HEADERS, readBoundedForm, validCsrfToken } from "@/lib/auth/http";
import { verifySession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const config = readAuthConfig();
    if (!isTrustedPost(request, config)) return new Response("Request not permitted.", { status: 403, headers: PRIVATE_HEADERS });
    const token = request.cookies.get(config.sessionCookie)?.value;
    const session = await verifySession(token, config);
    if (!session) return new Response("Authentication required.", { status: 401, headers: PRIVATE_HEADERS });
    const form = await readBoundedForm(request, ["csrf"]);
    if (!token || !form || !validCsrfToken(form.get("csrf") ?? "", logoutCsrfToken(token, config))) return new Response("Request not permitted.", { status: 403, headers: PRIVATE_HEADERS });
    const response = NextResponse.redirect(new URL("/login", config.origin), { status: 303, headers: PRIVATE_HEADERS });
    response.cookies.set(config.sessionCookie, "", cookieOptions(config, 0));
    response.cookies.set(config.csrfCookie, "", cookieOptions(config, 0));
    return response;
  } catch {
    return new Response("Private demonstration access is temporarily unavailable.", { status: 503, headers: PRIVATE_HEADERS });
  }
}
