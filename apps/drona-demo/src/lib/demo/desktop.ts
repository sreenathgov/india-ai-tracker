/** Presentation eligibility only. Authentication remains the server's job. */
export interface DeviceSignals {
  readonly userAgent?: string | null;
  readonly mobileHint?: string | null;
  readonly platform?: string | null;
  readonly maxTouchPoints?: number;
}

export function isHandheldDevice(signals: DeviceSignals): boolean {
  if (signals.mobileHint === "?1") return true;
  const agent = signals.userAgent ?? "";
  if (/Android|iPhone|iPad|iPod|Mobile|Tablet|Kindle|Silk\//i.test(agent)) return true;
  // iPadOS may request a desktop identity. Do not reject touch-enabled PCs.
  return /Macintosh/i.test(agent) && (signals.maxTouchPoints ?? 0) > 1;
}

export const DESKTOP_TITLE = "Explore Drona on a laptop or desktop.";
export const DESKTOP_MESSAGE = "This demonstration is designed for a desktop viewing experience. Please open this link on your laptop or desktop to continue.";

/** Runs before paint in both entry surfaces; no storage or device fingerprint. */
export const DESKTOP_BOOT_SCRIPT = `if((${isHandheldDevice.toString()})({userAgent:navigator.userAgent,platform:navigator.platform,maxTouchPoints:navigator.maxTouchPoints})){document.documentElement.setAttribute('data-device-blocked','true');}`;

export function hasSideNarration(width: number, height: number): boolean {
  return width >= 1180 && height >= 700;
}
