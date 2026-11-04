import { readFileSync } from "node:fs";
import { test, expect, type Browser, type BrowserContext } from "@playwright/test";

const origin = process.env.DRONA_E2E_BASE_URL ?? "http://127.0.0.1:3402";
const screenshotDirectory = "e2e/artifacts/login-redesign";

async function isolated(browser: Browser, options: Parameters<Browser["newContext"]>[0] = {}): Promise<BrowserContext> {
  const context = await browser.newContext({ baseURL: origin, viewport: { width: 1440, height: 1000 }, reducedMotion: "no-preference", serviceWorkers: "block", ...options });
  await context.route("**/*", route => {
    const target = new URL(route.request().url());
    return target.origin === origin || ["data:", "blob:"].includes(target.protocol) ? route.continue() : route.abort();
  });
  return context;
}

test("login prism is self-contained, centered, and can be paused without affecting the form", async ({ browser }) => {
  const context = await isolated(browser);
  const page = await context.newPage();
  const external: string[] = [], failures: string[] = [];
  page.on("pageerror", () => failures.push("runtime-error"));
  page.on("request", request => { if (new URL(request.url()).origin !== origin) external.push("external-request"); });
  const response = await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Explore Drona.", exact: true })).toBeVisible();
  await expect(page.locator('#demo-prism-bg[data-render="ready"] canvas')).toBeVisible();
  await expect(page.getByText("A guided demonstration of supply-chain risk intelligence.", { exact: true })).toBeVisible();
  await expect(page.locator("header, .notice, script[src], link[href]")).toHaveCount(0);
  const form = await page.locator("form").boundingBox();
  expect(form?.width).toBe(360);
  expect(Math.abs((form?.x ?? 0) + 180 - 720)).toBeLessThanOrEqual(1);
  expect(response?.headers()["content-security-policy"]).toMatch(/script-src 'nonce-[^']+'/);
  await expect(page.getByRole("button", { name: "Enter demo" })).toBeEnabled();
  await page.getByRole("button", { name: "Pause background animation", exact: true }).click();
  await expect(page.locator("#demo-prism-bg")).toHaveAttribute("data-motion-state", "paused");
  await expect(page.getByRole("button", { name: "Resume background animation", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.screenshot({ path: `${screenshotDirectory}/01-desktop.png`, fullPage: true });
  await page.getByRole("button", { name: "Resume background animation", exact: true }).click();
  await expect(page.locator("#demo-prism-bg")).toHaveAttribute("data-motion-state", "running");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("#demo-prism-bg")).toHaveAttribute("data-motion-state", "reduced");
  await expect(page.locator("#motion-toggle")).toBeHidden();
  expect(external).toEqual([]);
  expect(failures).toEqual([]);
  await context.close();
});

test("login remains readable and keyboard-accessible on mobile and short screens", async ({ browser }) => {
  for (const viewport of [{ width: 375, height: 812 }, { width: 375, height: 480 }, { width: 1024, height: 600 }]) {
    const context = await isolated(browser, { viewport, reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/login?expired=1");
    await expect(page.getByRole("status")).toHaveText("Session ended. Sign in again.");
    const metrics = await page.locator("form").evaluate(form => ({
      width: form.getBoundingClientRect().width,
      x: form.getBoundingClientRect().x,
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      fontSize: getComputedStyle(form.querySelector("input[name=username]")!).fontSize,
    }));
    expect(metrics.width).toBeLessThanOrEqual(360);
    expect(metrics.x).toBeGreaterThanOrEqual(24);
    expect(metrics.overflow).toBe(false);
    expect(metrics.fontSize).toBe("16px");
    await page.getByLabel("Username", { exact: true }).focus();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Password", { exact: true })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Enter demo" })).toBeFocused();
    await expect(page.getByRole("button", { name: "Enter demo" })).toBeInViewport();
    await page.screenshot({ path: `${screenshotDirectory}/02-${viewport.width}x${viewport.height}.png`, fullPage: true });
    await page.goto("/login?error=access");
    await expect(page.getByRole("alert")).toHaveText("Check your username and password.");
    await context.close();
  }
});

test("failed WebGL preserves the styled login without exposing a dead animation control", async ({ browser }) => {
  const context = await isolated(browser);
  await context.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type.includes("webgl")) return null;
      return Reflect.apply(getContext, this, [type, ...args]);
    } as typeof getContext;
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", () => errors.push("runtime-error"));
  await page.goto("/login");
  await expect(page.locator("#demo-prism-bg")).toHaveAttribute("data-render", "fallback");
  await expect(page.locator("#motion-toggle")).toBeHidden();
  await expect(page.getByRole("heading", { name: "Explore Drona." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Enter demo" })).toBeEnabled();
  await page.screenshot({ path: `${screenshotDirectory}/03-no-webgl.png`, fullPage: true });
  expect(errors).toEqual([]);
  await context.close();
});

test("native form signs in with JavaScript disabled", async ({ browser }) => {
  const context = await isolated(browser, { javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Explore Drona." })).toBeVisible();
  await expect(page.locator("#motion-toggle")).toBeHidden();
  await page.screenshot({ path: `${screenshotDirectory}/04-no-javascript.png`, fullPage: true });
  try {
    const file = process.env.DRONA_E2E_CREDENTIALS_FILE;
    if (!file) throw new Error("Missing test credentials");
    const source = readFileSync(file, "utf8");
    const username = source.match(/^Username:\s*(.+)$/m)?.[1]?.trim();
    const password = source.match(/^Password:\s*(.+)$/m)?.[1]?.trim();
    if (!username || !password) throw new Error("Invalid test credentials");
    await page.getByLabel("Username", { exact: true }).fill(username);
    await page.getByLabel("Password", { exact: true }).fill(password);
    const [response] = await Promise.all([
      page.waitForResponse(response => new URL(response.url()).pathname === "/api/auth/login" && response.request().method() === "POST"),
      page.getByRole("button", { name: "Enter demo" }).click(),
    ]);
    expect(response.status()).toBe(303);
    await expect(page).toHaveURL(`${origin}/`);
    expect((await context.request.get("/api/auth/status")).status()).toBe(200);
  } catch {
    // No raw locator logs, request bodies or filled credentials enter artifacts.
    throw new Error("Native sign-in verification failed; sensitive diagnostics omitted.");
  } finally {
    await context.close();
  }
});
