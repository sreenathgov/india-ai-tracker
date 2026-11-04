"use client";

import * as React from "react";
import { DESKTOP_MESSAGE, DESKTOP_TITLE, isHandheldDevice } from "@/lib/demo/desktop";

export function DesktopNotice(): React.ReactElement {
  return <main className="desktop-access" data-desktop-notice style={{ display: "flex" }}>
    <div><p className="desktop-wordmark" aria-hidden="true">d</p><h1>{DESKTOP_TITLE}</h1><p>{DESKTOP_MESSAGE}</p><span>demo.kananlabs.in</span><small>Private demonstration · Illustrative data</small></div>
  </main>;
}

/** Width changes never remount the live session or discard recorded replies. */
export function DesktopAccessBoundary({ children }: { readonly children: React.ReactNode }): React.ReactElement {
  const [blocked, setBlocked] = React.useState(false);
  React.useLayoutEffect(() => {
    const handheld = isHandheldDevice({ userAgent: navigator.userAgent, platform: navigator.platform, maxTouchPoints: navigator.maxTouchPoints });
    if (handheld) { document.documentElement.setAttribute("data-device-blocked", "true"); setBlocked(true); }
  }, []);
  return <><div className="desktop-experience">{blocked ? null : children}</div><div className="desktop-browser-notice"><DesktopNotice /></div></>;
}
