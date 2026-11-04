import { type NextRequest } from "next/server";
import { readAuthConfig } from "@/lib/auth/config";
import { isConfiguredHost, PRIVATE_HEADERS } from "@/lib/auth/http";
import { verifySession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const config = readAuthConfig();
    if (!isConfiguredHost(request, config)) return new Response("Request not permitted.", { status: 403, headers: PRIVATE_HEADERS });
    const session = await verifySession(request.cookies.get(config.sessionCookie)?.value, config);
    if (!session) return new Response("Authentication required.", { status: 401, headers: PRIVATE_HEADERS });
    return Response.json({ expiresAt: session.expiresAt }, { headers: PRIVATE_HEADERS });
  } catch {
    return new Response("Private demonstration access is temporarily unavailable.", { status: 503, headers: PRIVATE_HEADERS });
  }
}
