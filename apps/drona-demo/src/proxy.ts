import { NextResponse, type NextRequest } from "next/server";
import { readAuthConfig } from "@/lib/auth/config";
import { isConfiguredHost, PRIVATE_HEADERS } from "@/lib/auth/http";
import { verifySession } from "@/lib/auth/session";

function privateResponse(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(PRIVATE_HEADERS)) response.headers.set(key, value);
  return response;
}

/** No exclusion matcher: private JS, fonts, RSC and direct asset URLs are gated. */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const path = request.nextUrl.pathname;
  if (path === "/robots.txt" && ["GET", "HEAD"].includes(request.method)) return privateResponse(NextResponse.next());
  try {
    const config = readAuthConfig();
    if (!isConfiguredHost(request, config)) return privateResponse(new NextResponse("Private demonstration unavailable.", { status: 403 }));
    const publicLogin = (path === "/login" && ["GET", "HEAD"].includes(request.method)) || (path === "/api/auth/login" && request.method === "POST");
    if (publicLogin) return privateResponse(NextResponse.next());
    const session = await verifySession(request.cookies.get(config.sessionCookie)?.value, config);
    if (!session) {
      const document = ["GET", "HEAD"].includes(request.method) && (request.headers.get("sec-fetch-dest") === "document" || request.headers.get("accept")?.includes("text/html"));
      return privateResponse(document
        ? NextResponse.redirect(new URL("/login", config.origin), 303)
        : new NextResponse("Authentication required.", { status: 401 }));
    }
    return privateResponse(NextResponse.next());
  } catch {
    return privateResponse(new NextResponse("Private demonstration access is temporarily unavailable.", { status: 503 }));
  }
}
