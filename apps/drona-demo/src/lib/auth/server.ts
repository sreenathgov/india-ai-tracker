import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readAuthConfig } from "./config";
import { verifySession, type DemoSession } from "./session";
import { logoutCsrfToken } from "./http";

/** Required at the server page/handler boundary, in addition to the full-path proxy. */
export async function requireDemoSession(): Promise<DemoSession> {
  const config = readAuthConfig();
  const jar = await cookies();
  const session = await verifySession(jar.get(config.sessionCookie)?.value, config);
  if (!session) redirect("/login");
  return session;
}

/** Pass into the private client component's ordinary POST logout form. */
export async function getLogoutCsrfToken(): Promise<string> {
  const config = readAuthConfig();
  const token = (await cookies()).get(config.sessionCookie)?.value;
  if (!token || !await verifySession(token, config)) redirect("/login");
  return logoutCsrfToken(token, config);
}
