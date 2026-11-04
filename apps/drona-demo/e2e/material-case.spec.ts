import { readFileSync } from "node:fs";
import { test, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";
let signedIn: Awaited<ReturnType<BrowserContext["storageState"]>>;
const origin = process.env.DRONA_E2E_BASE_URL ?? "http://127.0.0.1:3402";
async function contextFor(browser: Browser, authenticated = true, width = 1440, height = 1000, dark = false) {
  const context = await browser.newContext({ baseURL: origin, storageState: authenticated ? signedIn : undefined, viewport: { width, height }, reducedMotion: "reduce" });
  await context.route("**/*", route => { const url = new URL(route.request().url()); return url.origin === origin || ["data:", "blob:"].includes(url.protocol) ? route.continue() : route.abort("blockedbyclient"); });
  if (dark) await context.addInitScript(() => localStorage.setItem("drona-theme", "dark"));
  return context;
}
async function openMaterial(page: Page, guided = false) {
  await page.goto("/");
  await page.getByRole("button", { name: "Start demo", exact: true }).click();
  await page.locator('[data-guide-step="map"]').getByRole("button", { name: "Continue", exact: true }).click();
  const risk = page.locator('[data-guide-step="risks"]');
  for (let i = 0; i < 3; i++) await risk.getByRole("button", { name: "Next example", exact: true }).click();
  await risk.getByRole("button", { name: "Continue", exact: true }).click();
  for (const step of ["capital", "exposure"]) await page.locator(`[data-guide-step="${step}"]`).getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Open this order", exact: true }).click();
  await page.locator('[data-guide-step="order-overview"]').getByRole("button", { name: "Continue", exact: true }).click();
  await page.locator('[data-guide-step="supplier-overview"]').getByRole("button", { name: "Continue", exact: true }).click();
  const suppliers = page.locator('[data-guide-step="supplier-overview"]');
  if (await suppliers.isVisible()) await suppliers.getByRole("button", { name: "Continue", exact: true }).click();
  const launch = page.locator('[data-guide-step="material-launch"]');
  if (guided) await launch.getByRole("button", { name: "Open case", exact: true }).click();
  else {
    if (await launch.isVisible()) await launch.getByRole("button", { name: "Exit", exact: true }).click();
    await page.getByRole("button", { name: "Investigate billet disruption", exact: true }).click();
  }
  await expect(page.locator('[data-material-status="forecast-review"]')).toBeVisible();
}
async function record(page: Page, question: string, answer: "Yes" | "No" | "Unknown") {
  const section = page.locator(`[data-working-question="${question}"]`);
  await section.getByRole("button", { name: answer, exact: true }).click();
  await section.getByRole("button", { name: "Record sample reply and reassess", exact: true }).click();
}
test.beforeAll(async ({ browser }) => {
  const file = process.env.DRONA_E2E_CREDENTIALS_FILE;
  if (!file) throw new Error("A private local credential file is required.");
  const raw = readFileSync(file, "utf8");
  const parsed = raw.trimStart().startsWith("{") || raw.trimStart().startsWith("[") ? JSON.parse(raw) : { username: raw.match(/^Username:\s*(.+)$/m)?.[1]?.trim(), password: raw.match(/^Password:\s*(.+)$/m)?.[1]?.trim() };
  const credentials = Array.isArray(parsed) ? parsed[0] : parsed;
  if (!credentials?.username || !credentials?.password) throw new Error("Credential file is incomplete.");
  const context = await contextFor(browser, false), page = await context.newPage();
  await page.goto("/login");
  await page.getByLabel("Username", { exact: true }).fill(credentials.username);
  await page.getByLabel("Password", { exact: true }).fill(credentials.password);
  await page.getByRole("button", { name: "Enter demo", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Know what puts an order at risk." })).toBeVisible();
  signedIn = await context.storageState();
  await context.close();
});

test("material case presents the prospective warning, readable path and inspectable source basis", async ({ browser }, info) => {
  const context = await contextFor(browser), page = await context.newPage();
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await openMaterial(page);
  const dialog = page.locator('[data-investigation="sup:deccan-mainshaft-forgings"]');
  await expect(dialog).toContainText("$1,600,000"); await expect(dialog).toContainText("4 days"); await expect(dialog).toContainText("12 / 100");
  await expect(dialog).not.toContainText("September"); await expect(dialog).not.toContainText("Historical snapshot");
  await page.screenshot({ path: info.outputPath("material-overview-light.png"), animations: "disabled" });
  await dialog.getByRole("button", { name: "Prepare for call ↗", exact: true }).click();
  await expect(dialog).toContainText("Ordered or in transit is not on-site cover");
  await dialog.getByRole("tab", { name: "Supply chain", exact: true }).click();
  await expect(dialog.locator("[data-material-critical-path]")).toBeVisible();
  const critical = await dialog.locator("[data-graph-node]").count();
  await expect(dialog.locator('[data-graph-node="sc:dc-jalna"]')).toBeVisible();
  await expect(dialog.locator('[data-graph-node="sc:dc-varna"]')).toBeVisible();
  await page.screenshot({ path: info.outputPath("material-supply-chain.png"), animations: "disabled" });
  await dialog.getByRole("button", { name: "Relevant network", exact: true }).click();
  expect(await dialog.locator("[data-graph-node]").count()).toBeGreaterThan(critical);
  await dialog.getByRole("button", { name: "All mapped", exact: true }).click();
  expect(await dialog.locator("[data-graph-node]").count()).toBeGreaterThan(25);
  await dialog.getByRole("tab", { name: "Evidence & reasoning", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "Decision path", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(dialog.locator('[data-reasoning-node="claim:dc-receipt"]')).toContainText("Usable receipt: 15–17 Nov");
  await page.screenshot({ path: info.outputPath("material-reasoning-path.png"), animations: "disabled" });
  await dialog.locator('[data-reasoning-node="claim:dc-receipt"]').click();
  const inspector = dialog.locator("[data-claim-inspector]");
  await expect(inspector).toContainText("Moderate confidence");
  await expect(inspector).toContainText("minimum hold");
  await inspector.getByRole("button", { name: /Aster Freight · AF-884 advisory/ }).click();
  const extract = dialog.locator('[data-source-extract="dc-ev-carrier"]');
  await expect(extract).toBeVisible(); await expect(extract).toContainText("Earliest release is 7 Nov");
  await page.screenshot({ path: info.outputPath("material-source-extract.png"), animations: "disabled" });
  await dialog.getByRole("tab", { name: "Overview", exact: true }).click();
  await dialog.getByRole("button", { name: "Why does this affect my order?", exact: true }).click();
  await expect(dialog.locator('[aria-label="Supplier-specific Drona conversation"]')).toContainText("15–17 Nov");
  expect(errors).toEqual([]);
  await context.close();
});

test("uncovered stock and late receipt update the forecast, plan and confirmed exposure together", async ({ browser }, info) => {
  const context = await contextFor(browser), page = await context.newPage(); await openMaterial(page);
  await record(page, "allocation", "No"); await record(page, "dealer-stock", "No"); await record(page, "arrival", "Yes");
  await expect(page.locator('[data-material-status="timing-gap"]')).toBeVisible();
  await page.locator("[data-material-response-plan] > summary").click();
  await expect(page.locator("[data-material-response-plan]")).toContainText("Reserve approved domestic cover by 6 Nov");
  await page.screenshot({ path: info.outputPath("material-timing-gap-response.png"), animations: "disabled" });
  await page.getByRole("tab", { name: "Evidence & reasoning", exact: true }).click();
  await expect(page.locator('[data-reasoning-node="claim:dc-current-assessment"]')).toContainText("Timing gap supported");
  await page.getByRole("button", { name: "Order workspace", exact: true }).click();
  await expect(page.locator("[data-brief-exposure]")).toHaveText("$6.4M");
  await expect(page.locator("[data-order-financial-context]")).toContainText("$1.6M confirmed exposure");
  await context.close();
});

test("protective evidence removes only Deccan’s exposure and leaves CBAM available", async ({ browser }, info) => {
  const context = await contextFor(browser), page = await context.newPage(); await openMaterial(page);
  await record(page, "allocation", "Yes");
  await expect(page.locator('[data-material-status="stock-protected"]')).toBeVisible();
  await expect(page.locator("[data-overview]")).toContainText("Monitor cover");
  await page.getByRole("tab", { name: "Supply chain", exact: true }).click();
  await expect(page.locator('[data-graph-node="sc:dc-billet"]')).toContainText("Stock or timing cover evidenced");
  await page.getByRole("tab", { name: "Evidence & reasoning", exact: true }).click();
  await page.getByRole("tab", { name: "Evidence register", exact: true }).click();
  await page.getByRole("button", { name: "Contradicting", exact: true }).click();
  await expect(page.locator('[data-evidence-row="dc-ev-reply-1"]')).toBeVisible();
  await page.getByRole("button", { name: "Order workspace", exact: true }).click();
  await expect(page.locator("[data-brief-exposure]")).toHaveText("$4.8M");
  await page.getByRole("button", { name: "Investigate CBAM readiness", exact: true }).click();
  await expect(page.locator('[data-working-question="scope"]')).toBeVisible();
  await page.screenshot({ path: info.outputPath("cbam-preserved.png"), animations: "disabled" });
  await context.close();
});

test("unknown, declined and pending stay unresolved; restart clears the authored reply history", async ({ browser }) => {
  const context = await contextFor(browser), page = await context.newPage(); await openMaterial(page);
  await record(page, "allocation", "Unknown");
  for (const answer of ["refused", "delayed"]) {
    await page.getByRole("combobox", { name: "Other owner reply", exact: true }).selectOption(answer);
    await page.getByRole("button", { name: "Record sample reply and reassess", exact: true }).click();
  }
  await expect(page.locator('[data-working-question="allocation"]')).toBeVisible();
  await expect(page.locator('[data-material-status="forecast-review"]')).toContainText("v4");
  await page.getByText("Replies and assessment history · 3", { exact: true }).click();
  await page.getByRole("button", { name: "Restart this case", exact: true }).click();
  await expect(page.locator('[data-material-status="forecast-review"]')).toContainText("v1");
  await context.close();
});

test("earlier receipt challenges the original forecast and desktop dark/short layouts stay usable", async ({ browser }, info) => {
  const context = await contextFor(browser, true, 1366, 800, true), page = await context.newPage(); await openMaterial(page);
  await page.screenshot({ path: info.outputPath("material-overview-dark-short.png"), animations: "disabled" });
  await record(page, "allocation", "No"); await record(page, "dealer-stock", "No"); await record(page, "arrival", "No");
  await expect(page.locator('[data-material-status="arrival-revised"]')).toBeVisible();
  await expect(page.locator("[data-material-timeline]")).toContainText("10–11 Nov");
  await page.getByRole("tab", { name: "Evidence & reasoning", exact: true }).click();
  expect(Number((await page.getByRole("button", { name: "Fit reasoning graph", exact: true }).innerText()).replace("%", ""))).toBeGreaterThanOrEqual(80);
  await page.screenshot({ path: info.outputPath("material-reasoning-dark-short.png"), animations: "disabled" });
  await page.locator('[data-reasoning-node="claim:dc-receipt"]').click();
  await expect(page.locator("[data-claim-inspector]")).toContainText("What challenges it");
  await expect(page.locator("[data-claim-inspector]")).toContainText("sample reply 3");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  expect(overflow).toBe(false);
  await page.keyboard.press("Escape");
  await expect(page.locator("[data-investigation]")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Investigate billet disruption", exact: true })).toBeFocused();
  await context.close();
});


test("Act Three guides the real case, follows actual replies and hands control to exploration", async ({ browser }, info) => {
  test.setTimeout(120_000);
  const context = await contextFor(browser), page = await context.newPage();
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await openMaterial(page, true);
  const coach = page.locator("[data-material-guide]");
  const ready = async (beat: string) => { await expect(coach).toHaveAttribute("data-material-guide", beat); await expect(coach).toHaveAttribute("data-material-ready", "true"); };
  const advance = async (beat: string) => { await ready(beat); await coach.getByRole("button", { name: "Continue", exact: true }).click(); };
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await expect(coach.getByRole("heading", { name: "See the disruption before the production gap." })).toBeFocused();
  await page.screenshot({ path: info.outputPath("act-three-forecast.png"), animations: "disabled" });
  await advance("forecast"); await advance("stakes");
  await expect(page.locator("[data-material-critical-path]")).toBeVisible();
  await ready("path");
  await page.screenshot({ path: info.outputPath("act-three-upstream-path.png"), animations: "disabled" });
  await advance("path");
  await expect(page.getByRole("button", { name: "All mapped", exact: true })).toHaveAttribute("aria-pressed", "true");
  await advance("network");
  for (const q of ["allocation", "dealer-stock", "arrival"]) {
    await expect(coach).toHaveAttribute("data-material-guide", "question");
    await record(page, q, q === "arrival" ? "Yes" : "No");
    await expect(coach).toHaveAttribute("data-material-guide", "assessment");
    await coach.getByRole("button", { name: q === "arrival" ? "Continue" : "Next question", exact: true }).click();
  }
  await expect(page.locator('[data-material-status="timing-gap"]')).toBeVisible();
  await advance("action");
  await page.getByRole("button", { name: "Why does this affect my order?", exact: true }).click();
  await expect(page.locator('[aria-label="Supplier-specific Drona conversation"]')).toContainText("15–17 Nov");
  await advance("assistant");
  await ready("reasoning");
  await expect.poll(() => page.evaluate(() => {
    const target = document.querySelector('[data-reasoning-node="claim:dc-receipt"]')!.getBoundingClientRect();
    const scope = document.querySelector('[data-investigation]')!.getBoundingClientRect();
    const cutout = document.querySelector('[data-material-aperture]')!;
    return Math.abs(Number(cutout.getAttribute("x")) + scope.left - target.left) + Math.abs(Number(cutout.getAttribute("y")) + scope.top - target.top) + Math.abs(Number(cutout.getAttribute("width")) - target.width) + Math.abs(Number(cutout.getAttribute("height")) - target.height);
  })).toBeLessThan(2);
  await page.screenshot({ path: info.outputPath("act-three-reasoning.png"), animations: "disabled" });
  await advance("reasoning");
  await expect(page.locator('[data-claim-inspector="dc-receipt"]')).toBeVisible();
  await coach.getByRole("button", { name: "Open source", exact: true }).click();
  await ready("source");
  await expect(page.locator('[data-source-extract="dc-ev-carrier"]')).toBeVisible();
  await page.screenshot({ path: info.outputPath("act-three-source.png"), animations: "disabled" });
  await advance("source");
  await ready("complete");
  const box = await coach.locator("[data-material-coach]").boundingBox();
  expect(box!.x).toBeLessThan(300);
  await page.screenshot({ path: info.outputPath("act-three-completion-left.png"), animations: "disabled" });
  await coach.getByRole("button", { name: "Explore Drona", exact: true }).click();
  await expect(page.locator("[data-material-guide]")).toHaveCount(0);
  await expect(page.locator("[data-investigation]")).toHaveCount(0);
  await expect(page.locator("[data-exploration-handoff]")).toBeVisible();
  await page.screenshot({ path: info.outputPath("act-three-exploration-handoff.png"), animations: "disabled" });
  await page.getByRole("button", { name: "View regulatory case", exact: true }).click();
  await expect(page.locator('[data-working-question="scope"]')).toBeVisible();
  await page.getByRole("button", { name: "Order workspace", exact: true }).click();
  await page.getByRole("button", { name: "Replay walkthrough", exact: true }).click();
  await expect(page.getByRole("button", { name: "Start demo", exact: true })).toBeVisible();
  expect(errors).toEqual([]); await context.close();
});

test("Act Three accepts a protected outcome and restores all focus and controls on Exit", async ({ browser }, info) => {
  test.setTimeout(90_000);
  const context = await contextFor(browser, true, 1366, 800, true), page = await context.newPage();
  await openMaterial(page, true);
  const coach = page.locator("[data-material-guide]");
  for (const beat of ["forecast", "stakes", "path", "network"]) { await expect(coach).toHaveAttribute("data-material-guide", beat); await coach.getByRole("button", { name: "Continue", exact: true }).click(); }
  await record(page, "allocation", "Yes");
  await expect(coach).toHaveAttribute("data-material-guide", "assessment");
  await expect(page.locator('[data-material-status="stock-protected"]')).toBeVisible();
  await page.screenshot({ path: info.outputPath("act-three-protected-dark.png"), animations: "disabled" });
  await page.keyboard.press("Escape");
  await expect(page.locator("[data-investigation]")).toHaveCount(0);
  await expect(page.locator("[data-guided-boundary]")).not.toHaveAttribute("inert", "");
  await expect(page.getByRole("button", { name: "Investigate billet disruption", exact: true })).toBeFocused();
  await page.getByRole("button", { name: "Investigate billet disruption", exact: true }).click();
  await expect(page.locator("[data-material-guide]")).toHaveCount(0);
  await expect(page.locator('[data-material-status="stock-protected"]')).toBeVisible();
  await context.close();
});
