import { headers } from "next/headers";
import { DesktopAccessBoundary, DesktopNotice } from "@/components/DesktopAccess";
import { isHandheldDevice } from "@/lib/demo/desktop";
import DemoExperience from "@/components/DemoExperience";
import { requireDemoSession, getLogoutCsrfToken } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireDemoSession();
  const requestHeaders = await headers();
  if (isHandheldDevice({ userAgent: requestHeaders.get("user-agent"), mobileHint: requestHeaders.get("sec-ch-ua-mobile") })) return <div style={{ display: "contents" }}><DesktopNotice /></div>;
  return <DesktopAccessBoundary><DemoExperience logoutCsrf={await getLogoutCsrfToken()} /></DesktopAccessBoundary>;
}
