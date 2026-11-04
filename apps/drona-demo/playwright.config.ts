import { defineConfig } from "@playwright/test";

// Installed Playwright's failure-context collector otherwise records a page's
// accessibility snapshot, which could include a filled sign-in form. Explicit
// authenticated screenshots below are the only retained browser visuals.
process.env.PLAYWRIGHT_NO_COPY_PROMPT = "1";
const webkit = process.env.DRONA_E2E_ENGINE === "webkit";

/** Browser checks run only against an explicitly started, local verified build. */
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  outputDir: "./e2e/artifacts/results",
  timeout: 60_000,
  expect: { timeout: 12_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["json", { outputFile: process.env.DRONA_E2E_REPORT ?? "e2e/artifacts/report.json" }]],
  use: {
    baseURL: process.env.DRONA_E2E_BASE_URL ?? "http://127.0.0.1:3402",
    browserName: webkit ? "webkit" : "chromium",
    headless: true,
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
    actionTimeout: 12_000,
    navigationTimeout: 20_000,
    // Authentication data must never be retained in a trace or video artifact.
    trace: "off",
    video: "off",
    screenshot: "off",
    launchOptions: webkit ? {} : {
      executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      args: ["--no-first-run", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
    },
  },
});
