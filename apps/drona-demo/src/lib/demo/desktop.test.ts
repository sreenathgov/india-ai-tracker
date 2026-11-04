// @vitest-environment node
import vm from "node:vm";
import { describe, expect, it } from "vitest";
import { DESKTOP_BOOT_SCRIPT, isHandheldDevice } from "./desktop";

describe("desktop presentation eligibility", () => {
  it.each([
    { userAgent:"Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile" },
    { userAgent:"Mozilla/5.0 (Linux; Android 15; Pixel)" },
    { userAgent:"Mozilla/5.0 (Linux; Android 15; Tablet)", mobileHint:"?0" },
    { userAgent:"Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)" },
    { userAgent:"Mozilla/5.0 (Macintosh; Intel Mac OS X)", platform:"MacIntel", maxTouchPoints:5 },
    { userAgent:"Unknown", mobileHint:"?1" },
  ])("blocks a positive handheld signal without relying on viewport width (%j)", signals => {
    expect(isHandheldDevice(signals)).toBe(true);
  });
  it.each([
    { userAgent:"Mozilla/5.0 (Windows NT 10.0; Win64; x64)", maxTouchPoints:10, platform:"MacIntel" },
    { userAgent:"Mozilla/5.0 (Macintosh; Intel Mac OS X)", platform:"MacIntel", maxTouchPoints:0 },
    { userAgent:"Mozilla/5.0 (X11; Linux x86_64)" },
    {},
  ])("keeps desktops, touch PCs and unknown identities eligible (%j)", signals => {
    expect(isHandheldDevice(signals)).toBe(false);
  });
  it("the pre-paint script uses the same standalone iPad rule without storage", () => {
    const attributes: Record<string,string> = {};
    vm.runInNewContext(DESKTOP_BOOT_SCRIPT, { navigator:{ userAgent:"Macintosh", platform:"MacIntel", maxTouchPoints:5 }, document:{ documentElement:{ setAttribute:(key:string,value:string) => { attributes[key] = value; } } } });
    expect(attributes["data-device-blocked"]).toBe("true");
  });
});
