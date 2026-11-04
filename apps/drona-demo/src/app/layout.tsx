import type { Metadata, Viewport } from "next";
import { fontVariables } from "@/fonts";
import { THEME_BOOT_SCRIPT } from "@/lib/theme/theme";
import "./globals.css";
import { DESKTOP_BOOT_SCRIPT } from "@/lib/demo/desktop";
import { requireDemoSession } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Drona — Private guided demonstration",
  description:
    "An invitation-only guided demonstration using fictional order data and sample owner replies.",
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0d",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireDemoSession();
  return (
    /* The boot script sets data-theme before hydration; React is told not to mind. */
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: DESKTOP_BOOT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
