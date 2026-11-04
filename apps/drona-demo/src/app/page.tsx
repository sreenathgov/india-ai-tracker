import DemoExperience from "@/components/DemoExperience";
import { requireDemoSession, getLogoutCsrfToken } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireDemoSession();
  return <DemoExperience logoutCsrf={await getLogoutCsrfToken()} />;
}
