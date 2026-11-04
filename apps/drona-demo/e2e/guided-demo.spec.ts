import { readFileSync } from "node:fs";
import { test, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";

type StoredState = Awaited<ReturnType<BrowserContext["storageState"]>>;
type Credentials = { username: string; password: string };
let signedInState: StoredState;
let privateAssets: string[] = [];
const origin = process.env.DRONA_E2E_BASE_URL ?? "http://127.0.0.1:3402";

function credentials(): Credentials {
  const file = process.env.DRONA_E2E_CREDENTIALS_FILE;
  if (!file) throw new Error("DRONA_E2E_CREDENTIALS_FILE must identify a private local test credential file.");
  const content = readFileSync(file, "utf8");
  const parsed = content.trimStart().startsWith("{") || content.trimStart().startsWith("[")
    ? JSON.parse(content) as unknown
    : { username: content.match(/^Username:\s*(.+)$/m)?.[1]?.trim(), password: content.match(/^Password:\s*(.+)$/m)?.[1]?.trim() };
  const candidate = (Array.isArray(parsed) ? parsed[0] : parsed) as Partial<Credentials>;
  if (typeof candidate.username !== "string" || typeof candidate.password !== "string") {
    throw new Error("Test credentials must contain username and password fields.");
  }
  return candidate as Credentials;
}

/** Tests never navigate or send requests to the public Kanan site or third parties. */
async function localContext(browser: Browser, signedIn = true, mobile = false): Promise<BrowserContext> {
  const context = await browser.newContext({
    baseURL: origin,
    storageState: signedIn ? signedInState : undefined,
    reducedMotion: "reduce",
    viewport: mobile ? { width: 375, height: 812 } : { width: 1440, height: 1000 },
  });
  await context.route("**/*", (route) => {
    const url = new URL(route.request().url());
    return url.origin === origin || ["data:", "blob:"].includes(url.protocol) ? route.continue() : route.abort("blockedbyclient");
  });
  return context;
}

async function completeFinancialIntroduction(page: Page): Promise<void> {
  for (const step of ["capital", "exposure"]) {
    const stage = page.locator(`[data-guide-step="${step}"]`);
    await expect(stage).toBeVisible();
    await stage.getByRole("button", { name: "Continue", exact: true }).click();
  }
}

async function completeRiskIntroduction(page: Page): Promise<void> {
  const stage = page.locator('[data-guide-step="risks"]');
  await expect(stage).toHaveAttribute("data-risk-beat", "overview");
  for (const beat of ["material", "network", "regulatory"]) {
    await stage.getByRole("button", { name: "Next example", exact: true }).click();
    await expect(stage).toHaveAttribute("data-risk-beat", beat);
    await expect(page.locator("[data-risk-wheel]")).toHaveAttribute("data-selected-category", beat);
  }
  await stage.getByRole("button", { name: "Continue", exact: true }).click();
  await completeFinancialIntroduction(page);
}

async function startWalkthrough(page: Page): Promise<void> {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Know what puts an order at risk." })).toBeVisible();
  await page.getByRole("button", { name: "Start demo" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await completeRiskIntroduction(page);
  await expect(page.locator('[data-guide-step="order"]')).toBeVisible();
}

async function completeOrderOverview(page: Page): Promise<void> {
  const stage = page.locator('[data-guide-step="order-overview"]');
  await expect(stage).toBeVisible();
  // Act Two is a desktop presentation. Retain the older compact native-case
  // regression checks by exiting this desktop-only observation on compact screens.
  if ((page.viewportSize()?.width ?? 1440) < 1100) await page.keyboard.press("Escape");
  else {
    await stage.getByRole("button", { name: "Continue", exact: true }).click();
    const suppliers = page.locator('[data-guide-step="supplier-overview"]');
    await expect(suppliers).toBeVisible();
    await suppliers.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(suppliers).toHaveCount(0);
  }
  await expect(stage).toHaveCount(0);
  const launch = page.locator('[data-guide-step="material-launch"]');
  if (await launch.isVisible()) await launch.getByRole("button", { name: "Exit", exact: true }).click();
}

async function openCase(page: Page): Promise<void> {
  if (await page.locator('[data-guide-step="risks"]').isVisible()) await completeRiskIntroduction(page);
  if (await page.locator('[data-guide-step="capital"]').isVisible()) await completeFinancialIntroduction(page);
  await page.getByRole("button", { name: "Open this order", exact: true }).click();
  await completeOrderOverview(page);
  // The selected authored order can already have a completed assessment. A new
  // unassessed fixture must instead allow the explicit analysis action.
  const analysis = page.getByRole("button", { name: "Analyse production risk", exact: true });
  if (await analysis.isVisible()) await analysis.click();
  const investigate = page.getByRole("button", { name: "Investigate CBAM readiness", exact: true });
  await expect(investigate).toBeVisible();
  await investigate.click();
  await expect(page.locator('[data-investigation="sup:tiruchi-tower-sections"]')).toBeVisible();
  await expect(page.locator('[data-working-question="scope"]')).toBeVisible();
}

async function recordScope(page: Page, answer: "Yes" | "No" | "Unknown"): Promise<void> {
  const question = page.locator('[data-working-question="scope"]');
  await question.getByRole("button", { name: answer, exact: true }).click();
  await question.getByRole("button", { name: "Record sample scope check", exact: true }).click();
}

async function recordReadiness(page: Page, answer: "Yes" | "No" | "Unknown"): Promise<void> {
  const question = page.locator('[data-working-question="readiness"]');
  await question.getByRole("button", { name: answer, exact: true }).click();
  await question.getByRole("button", { name: "Record sample reply and reassess", exact: true }).click();
}

async function assertNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
  expect(overflow.document).toBeLessThanOrEqual(overflow.viewport + 1);
}

test.beforeAll(async ({ browser }) => {
  // One legitimate sign-in is reused as an in-memory session snapshot, avoiding
  // test noise in the deliberately small local login-attempt budget.
  const context = await localContext(browser, false);
  const page = await context.newPage();
  const login = await page.goto("/login");
  expect(login?.status(), "The optimized local login endpoint must be available before the browser suite starts.").toBe(200);
  await expect(page.getByLabel("Username", { exact: true })).toBeVisible();
  const access = credentials();
  await page.getByLabel("Username", { exact: true }).fill(access.username);
  await page.getByLabel("Password", { exact: true }).fill(access.password);
  const [submitted] = await Promise.all([
    page.waitForResponse((response) => new URL(response.url()).pathname === "/api/auth/login" && response.request().method() === "POST"),
    page.getByRole("button", { name: "Enter demo" }).click(),
  ]);
  if (submitted.status() !== 303) {
    const request = submitted.request();
    const headers = await request.allHeaders();
    console.info("Sign-in request diagnostics", {
      status: submitted.status(), origin: headers.origin ?? "absent", fetchSite: headers["sec-fetch-site"] ?? "absent",
      contentType: headers["content-type"] ?? "absent", hasCookie: Boolean(headers.cookie),
      message: (await submitted.text()).slice(0, 180),
    });
  }
  expect(submitted.status(), "The valid browser login form must succeed with a redirect.").toBe(303);
  try {
    await expect(page.getByRole("heading", { name: "Know what puts an order at risk." })).toBeVisible();
  } catch {
    // innerText excludes input values; no filled credentials are retained here.
    const visiblePage = (await page.locator("body").innerText()).slice(0, 1200);
    throw new Error(`The authenticated introduction did not render at ${new URL(page.url()).pathname}: ${visiblePage}`);
  }
  await expect(page.locator("main").first(), "The transferred app must retain its compiled layout utilities.").toHaveCSS("display", "flex");
  signedInState = await context.storageState();
  privateAssets = await page.evaluate(() => performance.getEntriesByType("resource")
    .map((entry) => entry.name)
    .filter((url) => /\.(?:js|woff2)(?:\?|$)/.test(url) && new URL(url).origin === location.origin));
  await context.close();
});

test("anonymous direct, encoded, RSC, JS and font requests cannot fetch the private app", async ({ browser }) => {
  const context = await localContext(browser, false);
  expect(privateAssets.some((url) => /\.js(?:\?|$)/.test(url))).toBeTruthy();
  expect(privateAssets.some((url) => /\.woff2(?:\?|$)/.test(url))).toBeTruthy();
  for (const path of ["/", "/styleguide", "/%73tyleguide", "/?_rsc=qa", "/api/auth/status", ...privateAssets]) {
    const response = await context.request.get(path, { maxRedirects: 0, headers: { accept: "text/x-component", rsc: "1" } });
    expect([303, 401, 403], `Anonymous access to ${new URL(path, origin).pathname}`).toContain(response.status());
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(await response.text()).not.toContain("Know what puts an order at risk.");
  }
  const navigation = await context.request.get("/", { maxRedirects: 0, headers: { accept: "text/html" } });
  expect(navigation.status()).toBe(303);
  expect(new URL(navigation.headers().location, origin).href).toBe(`${origin}/login`);
  const robots = await context.request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain("Disallow: /");
  await context.close();
});

test("login rejects an incorrect password without exposing the private experience", async ({ browser }) => {
  const context = await localContext(browser, false);
  const page = await context.newPage();
  await page.goto("/login");
  await page.getByLabel("Username", { exact: true }).fill("qa-invalid-invite");
  await page.getByLabel("Password", { exact: true }).fill("a-deliberately-wrong-test-password");
  await page.getByRole("button", { name: "Enter demo" }).click();
  await expect(page).toHaveURL(/\/login\?error=access$/);
  await expect(page.getByRole("alert")).toHaveText("Check your username and password.");
  expect((await context.cookies()).some((cookie) => cookie.name.includes("session"))).toBe(false);
  await context.close();
});

test("the dashboard hands off to the native case without legacy guidance and refresh resets state", async ({ browser }, testInfo) => {
  const context = await localContext(browser);
  const page = await context.newPage();
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Start demo" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("01-introduction.png"), fullPage: true });
  await page.getByRole("button", { name: "Start demo" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await completeRiskIntroduction(page);
  const unrelatedOrder = page.locator('[data-guide-target="order:c2"]');
  await expect(unrelatedOrder).toHaveAttribute("aria-disabled", "true");
  await unrelatedOrder.dispatchEvent("click");
  await expect(page.locator('[data-guide-step="order"]')).toBeVisible();
  await openCase(page);
  await expect(page.locator('[data-regulatory-status="applicability-review"]')).toBeVisible();
  await expect(page.getByRole("tab", { name: "Actions", exact: true })).toHaveCount(0);
  await recordScope(page, "Yes");
  await expect(page.locator('[data-working-question="readiness"]')).toBeVisible();
  await expect(page.locator('[data-regulatory-status="readiness-review"]')).toBeVisible();
  await recordReadiness(page, "No");
  await expect(page.locator('[data-regulatory-status="gap-confirmed"]')).toBeVisible();
  await expect(page.locator('[data-guide-target="next-action"]')).toContainText("Escalate the readiness gap to OEM logistics.");
  await expect(page.getByLabel("Drona guided demonstration")).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("02-supplier-result.png"), fullPage: true });
  await page.getByRole("tab", { name: "Evidence & reasoning", exact: true }).click();
  await expect(page.getByRole("tab", { name: "Evidence & reasoning", exact: true })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("tab", { name: "Overview", exact: true }).click();
  await expect(page.getByRole("tab", { name: "Overview", exact: true })).toHaveAttribute("aria-selected", "true");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Know what puts an order at risk." })).toBeVisible();
  await page.getByRole("button", { name: "Start demo" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await openCase(page);
  await expect(page.locator('[data-regulatory-status="applicability-review"]')).toBeVisible();
  await expect(page.locator("[data-current-readiness]")).toHaveText("No private scope reply recorded.");
  await expect(page.getByText("Replies and assessment changes · 0", { exact: true })).toBeVisible();
  expect(runtimeErrors).toEqual([]);
  await context.close();
});

test("Unknown remains under review and refresh returns a clean introduction", async ({ browser }) => {
  const context = await localContext(browser);
  const page = await context.newPage();
  await startWalkthrough(page);
  await openCase(page);
  await recordScope(page, "Unknown");
  await expect(page.locator('[data-working-question="scope"]')).toBeVisible();
  await expect(page.locator('[data-regulatory-status="applicability-review"]')).toBeVisible();
  await expect(page.locator("[data-current-readiness]")).toContainText("unknown");
  await page.keyboard.press("Escape");
  await expect(page.locator('[data-investigation="sup:tiruchi-tower-sections"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Investigate CBAM readiness", exact: true }).click();
  await expect(page.locator('[data-working-question="scope"]')).toBeVisible();
  await expect(page.locator("[data-current-readiness]")).toContainText("unknown");
  await recordScope(page, "Yes");
  await recordReadiness(page, "Unknown");
  await expect(page.locator('[data-working-question="readiness"]')).toBeVisible();
  await expect(page.locator('[data-regulatory-status="readiness-review"]')).toBeVisible();
  await expect(page.locator('[data-regulatory-status="gap-confirmed"]')).toHaveCount(0);
  await expect(page.locator("[data-current-readiness]")).toContainText("unknown");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Know what puts an order at risk." })).toBeVisible();
  await page.getByRole("button", { name: "Start demo" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await openCase(page);
  await expect(page.locator("[data-current-readiness]")).toHaveText("No private scope reply recorded.");
  await context.close();
});

test("separate browser contexts retain independent sample replies", async ({ browser }) => {
  const first = await localContext(browser);
  const second = await localContext(browser);
  const a = await first.newPage();
  const b = await second.newPage();
  await startWalkthrough(a); await openCase(a); await recordScope(a, "Yes"); await recordReadiness(a, "No");
  await expect(a.locator('[data-regulatory-status="gap-confirmed"]')).toBeVisible();
  await startWalkthrough(b); await openCase(b);
  await expect(b.locator('[data-regulatory-status="applicability-review"]')).toBeVisible();
  await expect(b.locator("[data-current-readiness]")).toHaveText("No private scope reply recorded.");
  await recordScope(b, "No");
  await expect(b.locator('[data-regulatory-status="scope-excluded"]')).toBeVisible();
  await expect(a.locator('[data-regulatory-status="gap-confirmed"]')).toBeVisible();
  await first.close(); await second.close();
});

test("mobile guidance fits and dialog keyboard focus remains inside the investigation", async ({ browser }, testInfo) => {
  const context = await localContext(browser, true, true);
  const page = await context.newPage();
  await startWalkthrough(page);
  await assertNoHorizontalOverflow(page);
  await openCase(page);
  await assertNoHorizontalOverflow(page);
  const header = await page.locator("[data-investigation-header]").boundingBox();
  expect(header?.height, "Mobile order context must not collapse into a tall, narrow breadcrumb column.").toBeLessThanOrEqual(220);
  await expect(page.getByRole("dialog")).toBeVisible();
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => Boolean(document.activeElement?.closest('[data-investigation="sup:tiruchi-tower-sections"]')))).toBe(true);
  }
  await recordScope(page, "Yes");
  await recordReadiness(page, "No");
  await assertNoHorizontalOverflow(page);
  await expect(page.getByLabel("Drona guided demonstration")).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("04-mobile-result.png"), fullPage: true });
  await page.getByRole("button", { name: "Order workspace", exact: true }).click();
  await expect(page.locator('[data-investigation="sup:tiruchi-tower-sections"]')).toHaveCount(0);
  await assertNoHorizontalOverflow(page);
  await context.close();
});

test("CSRF attempts fail and Sign out remains usable after exiting a focused stage", async ({ browser }) => {
  const anonymous = await localContext(browser, false);
  const login = await anonymous.request.get("/login");
  const html = await login.text();
  const csrf = html.match(/name="csrf" value="([A-Za-z0-9_-]+)"/)?.[1];
  expect(csrf).toBeTruthy();
  const forgedLogin = await anonymous.request.post("/api/auth/login", {
    maxRedirects: 0, headers: { origin: "https://untrusted.invalid" },
    form: { username: "qa-csrf", password: "unused", csrf: csrf! },
  });
  expect(forgedLogin.status()).toBe(403);
  const missingLoginProof = await anonymous.request.post("/api/auth/login", {
    maxRedirects: 0, headers: { origin }, form: { username: "qa-csrf", password: "unused", csrf: "invalid" },
  });
  expect(missingLoginProof.status()).toBe(403);
  await anonymous.close();

  const context = await localContext(browser);
  const cookies = await context.cookies();
  const session = cookies.find((cookie) => cookie.name.includes("session"));
  expect(session?.httpOnly).toBe(true);
  expect(session?.sameSite).toBe("Lax");
  const forgedLogout = await context.request.post("/api/auth/logout", {
    maxRedirects: 0, headers: { origin: "https://untrusted.invalid" }, form: { csrf: "invalid" },
  });
  expect(forgedLogout.status()).toBe(403);
  const missingLogoutProof = await context.request.post("/api/auth/logout", {
    maxRedirects: 0, headers: { origin }, form: { csrf: "invalid" },
  });
  expect(missingLogoutProof.status()).toBe(403);
  expect((await context.request.get("/api/auth/status")).status()).toBe(200);
  const page = await context.newPage();
  await startWalkthrough(page);
  // The order list is now a coherent modal focus scope, like the map and risk
  // spotlights. Account controls remain reachable through its explicit Exit.
  await expect(page.getByRole("dialog", { name: "Trace the exposure to an order." })).toBeVisible();
  await page.locator('[data-guide-step="order"]').getByRole("button", { name: "Exit", exact: true }).click();
  const signOut = page.getByRole("button", { name: "Sign out", exact: true });
  await expect(signOut).toBeEnabled();
  await signOut.click();
  await expect(page).toHaveURL(/\/login$/);
  expect((await context.request.get("/api/auth/status")).status()).toBe(401);
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await context.close();
});

test("the cover presents a case brief and optional details before the dashboard", async ({ browser }, testInfo) => {
  const context = await localContext(browser);
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByText("Designed for desktop.", { exact: true })).toBeVisible();
  const cover = page.locator('[data-guide-cover="intro"]');
  await expect(cover.getByRole("heading", { name: "Know what puts an order at risk." })).toBeVisible();
  const brief = cover.getByRole("region", { name: "Case brief" });
  await expect(brief.getByRole("heading", { name: "Wind Energy", exact: true })).toBeVisible();
  await expect(brief).toContainText("100 wind turbines");
  await expect(brief).toContainText("India → Denmark");
  await expect(brief.locator("dl > div").filter({ hasText: "Delivery required" })).toContainText("18 Nov 2026");
  await expect(brief.locator("dl > div").filter({ hasText: "Longest component lead time" })).toContainText("112 days");
  await expect(brief.getByRole("heading", { name: "Deccan Mainshaft Forgings" })).toBeVisible();
  await expect(brief).toContainText("Main-shaft forging lot");
  await expect(brief).toContainText("Could incoming billet miss its production window?");
  await expect(brief).toContainText("Illustrative case");
  await expect(cover.getByRole("img", { name: "Drona", exact: true })).toBeVisible();
  await expect(cover.getByRole("button", { name: "Sign out", exact: true })).toBeVisible();
  await expect(cover.getByRole("button", { name: "Start demo", exact: true })).toBeFocused();
  const geometry = await cover.evaluate(element => {
    const main = element.querySelector("main")!.getBoundingClientRect();
    const proposition = element.querySelector("main > section")!.getBoundingClientRect();
    const brief = element.querySelector('[aria-label="Case brief"]')!.getBoundingClientRect();
    return { mainWidth: main.width, propositionRight: proposition.right, briefLeft: brief.left };
  });
  expect(geometry.mainWidth).toBeLessThanOrEqual(1180);
  expect(geometry.briefLeft).toBeGreaterThan(geometry.propositionRight);
  const details = cover.locator("details");
  await expect(details).not.toHaveAttribute("open");
  await cover.getByText("About this demo", { exact: true }).click();
  await expect(details).toHaveAttribute("open", "");
  await expect(details.getByText(/Fictional companies, news and order records/)).toBeVisible();
  await cover.getByText("About this demo", { exact: true }).click();
  await page.screenshot({ path: testInfo.outputPath("cover-desktop.png"), fullPage: true });
  await cover.getByRole("button", { name: "Start demo", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await completeRiskIntroduction(page);
  await expect(page.locator('[data-guide-step="order"]')).toBeVisible();
  await expect(page.locator('[data-guide-target="order:c1"]')).toBeVisible();
  await page.getByRole("button", { name: "Exit", exact: true }).click();
  const replay = page.locator('[data-guide-cover="replay"]');
  await expect(replay.getByRole("heading", { name: "Know what puts an order at risk." })).toBeVisible();
  await expect(replay.getByRole("button", { name: "Replay demo", exact: true })).toBeFocused();
  await page.screenshot({ path: testInfo.outputPath("cover-early-exit.png"), fullPage: true });
  await replay.getByRole("button", { name: "Replay demo", exact: true }).click();
  await expect(page.locator('[data-guide-cover="intro"]')).toBeVisible();
  await context.close();
});

test("the cover stacks and remains keyboard-accessible on mobile and short screens", async ({ browser }, testInfo) => {
  for (const viewport of [{ width: 375, height: 812 }, { width: 768, height: 900 }, { width: 1024, height: 600 }]) {
    const context = await localContext(browser);
    const page = await context.newPage();
    await page.setViewportSize(viewport);
    await page.goto("/");
    const cover = page.locator('[data-guide-cover="intro"]');
    await expect(cover.getByRole("heading", { name: "Know what puts an order at risk." })).toBeVisible();
    await expect(cover.getByRole("button", { name: "Start demo", exact: true })).toBeFocused();
    const layout = await cover.evaluate(element => {
      const main = element.querySelector("main")!;
      const first = main.querySelector("section")!.getBoundingClientRect();
      const brief = element.querySelector('[aria-label="Case brief"]')!.getBoundingClientRect();
      return { overflow: element.scrollWidth > element.clientWidth + 1, firstBottom: first.bottom, briefTop: brief.top, columns: getComputedStyle(main).gridTemplateColumns.split(" ").length };
    });
    expect(layout.overflow).toBe(false);
    if (viewport.width < 900) {
      expect(layout.columns).toBe(1);
      expect(layout.briefTop).toBeGreaterThan(layout.firstBottom);
    } else expect(layout.columns).toBe(2);
    await page.screenshot({ path: testInfo.outputPath(`cover-${viewport.width}x${viewport.height}-top.png`), fullPage: true });
    await cover.getByText("About this demo", { exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(cover.locator("details")).toHaveAttribute("open", "");
    await expect(cover.locator("details p")).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`cover-${viewport.width}x${viewport.height}-details.png`), fullPage: true });
    await page.keyboard.press("Enter");
    await expect(cover.locator("details")).not.toHaveAttribute("open");
    await context.close();
  }
});


test("Act One spotlights the real map, keeps controls reachable and restores the dashboard", async ({ browser }, testInfo) => {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 1024, height: 768 }, { width: 375, height: 812 }, { width: 375, height: 480 }, { width: 320, height: 640 }]) {
    const context = await localContext(browser);
    const page = await context.newPage();
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.getByRole("button", { name: "Start demo", exact: true }).click();
    const stage = page.locator('[data-guide-step="map"]');
    await expect(stage).toBeVisible();
    await expect(stage.getByRole("heading", { name: "Your supplier network, mapped." })).toBeVisible();
    await expect(stage).toContainText("one digital twin");
    await expect(stage.getByRole("heading", { name: "Your supplier network, mapped." })).toBeFocused();
    await expect(page.locator("[data-spotlight-aperture]")).toBeVisible();
    await assertNoHorizontalOverflow(page);
    await expect(async () => {
      const map = (await page.locator('[data-surface="map"]').boundingBox())!;
      const card = (await page.locator("[data-spotlight-card]").boundingBox())!;
      const next = (await stage.getByRole("button", { name: "Continue", exact: true }).boundingBox())!;
      expect(map.y).toBeGreaterThanOrEqual(0);
      expect(map.y + map.height).toBeLessThanOrEqual(viewport.height);
      expect(card.x).toBeGreaterThanOrEqual(0);
      expect(card.x + card.width).toBeLessThanOrEqual(viewport.width);
      expect(next.y + next.height).toBeLessThanOrEqual(viewport.height);
      expect(card.x + card.width <= map.x || card.y >= map.y + map.height).toBe(true);
    }).toPass();
    expect(await page.locator("[data-guided-boundary]").evaluate(element => (element as HTMLElement).inert)).toBe(true);
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Tab");
      expect(await page.evaluate(() => Boolean(document.activeElement?.closest('[data-guide-step="map"]')))).toBe(true);
    }
    // Capture the reading-first entry state rather than a navigation focus ring.
    await stage.getByRole("heading", { name: "Your supplier network, mapped." }).focus();
    await page.screenshot({ path: testInfo.outputPath(`map-step-${viewport.width}x${viewport.height}.png`), fullPage: true });
    if (viewport.width === 1440) {
      for (const alpha of [.44, .48, .52]) {
        await stage.evaluate((element, opacity) => (element as HTMLElement).style.setProperty("--spotlight-veil", `rgba(17, 19, 18, ${opacity})`), alpha);
        await page.screenshot({ path: testInfo.outputPath(`map-veil-${Math.round(alpha * 100)}.png`), fullPage: true });
      }
      await stage.evaluate(element => (element as HTMLElement).style.removeProperty("--spotlight-veil"));
    }
    await stage.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page.locator('[data-guide-step="risks"]')).toBeVisible();
    await expect(page.locator('[data-guide-step="risks"]')).toHaveCSS("opacity", "1");
    await expect(page.getByRole("heading", { name: "See where an order may be exposed." })).toBeFocused();
    expect(await page.locator("[data-guided-boundary]").evaluate(element => (element as HTMLElement).inert)).toBe(false);
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await expect(stage).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Replay demo", exact: true })).toBeVisible();
    await context.close();
  }
});

test("map introduction remains usable when WebGL is unavailable", async ({ browser }) => {
  const context = await localContext(browser);
  await context.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type.startsWith("webgl") || type === "experimental-webgl") return null;
      return getContext.apply(this, [type, ...args] as Parameters<typeof getContext>);
    } as typeof getContext;
  });
  const page = await context.newPage();
  await page.goto("/");
  await page.getByRole("button", { name: "Start demo", exact: true }).click();
  await expect(page.locator('[data-guide-step="map"]')).toContainText("The map is unavailable on this device.");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await openCase(page);
  await expect(page.locator('[data-working-question="scope"]')).toBeVisible();
  await context.close();
});


test("refined spotlight enters together and remains legible in both colour themes", async ({ browser }, testInfo) => {
  for (const theme of ["light", "dark"] as const) {
    const context = await localContext(browser);
    await context.addInitScript(value => localStorage.setItem("drona-theme", value), theme);
    const page = await context.newPage();
    await page.emulateMedia({ reducedMotion: "no-preference", colorScheme: theme });
    await page.goto("/");
    await page.getByRole("button", { name: "Start demo", exact: true }).click();
    const stage = page.locator('[data-guide-step="map"]');
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await expect(stage).toHaveAttribute("data-positioned", "true");
    await expect(stage).toHaveCSS("opacity", "1");
    await expect(stage.getByRole("heading", { name: "Your supplier network, mapped." })).toBeFocused();
    await expect(page.locator('[data-surface="map"] canvas').first()).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`refined-map-${theme}.png`), fullPage: true });
    await stage.getByRole("button", { name: "Continue", exact: true }).click();
    const riskStage = page.locator('[data-guide-step="risks"]');
    await expect(riskStage).toHaveCSS("opacity", "1");
    await expect(riskStage.getByRole("heading", { name: "See where an order may be exposed." })).toBeVisible();
    await expect(async () => {
      const target = (await page.locator('[data-surface="risks"]').boundingBox())!;
      const aperture = (await riskStage.locator("[data-spotlight-aperture]").boundingBox())!;
      const guide = (await riskStage.locator("[data-spotlight-card]").boundingBox())!;
      expect(Math.abs(target.x - aperture.x)).toBeLessThan(1);
      expect(Math.abs(target.y - aperture.y)).toBeLessThan(1);
      expect(target.y).toBeGreaterThanOrEqual(0);
      expect(target.y + target.height).toBeLessThanOrEqual(1000);
      expect(guide.x).toBeGreaterThanOrEqual(0);
      expect(guide.x + guide.width).toBeLessThanOrEqual(target.x);
    }).toPass();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.screenshot({ path: testInfo.outputPath(`refined-risks-${theme}.png`), fullPage: true });
    await context.close();
  }
});


test("risk categories share a real accessible spotlight and retain the order evidence", async ({ browser }, testInfo) => {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 1024, height: 768 }, { width: 375, height: 812 }, { width: 375, height: 480 }, { width: 320, height: 640 }]) {
    const context = await localContext(browser);
    const page = await context.newPage();
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("/");
    await page.getByRole("button", { name: "Start demo", exact: true }).click();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    const stage = page.locator('[data-guide-step="risks"]');
    const card = page.locator('[data-surface="risks"]');
    await expect(stage).toHaveAttribute("data-positioned", "true");
    await expect(stage).toHaveCSS("opacity", "1");
    await expect(page.getByRole("dialog", { name: "See where an order may be exposed." })).toContainText("Material availability");
    expect(await card.getByRole("button", { name: "Material availability 7", exact: true }).getAttribute("aria-disabled")).toBeNull();
    await assertNoHorizontalOverflow(page);
    await expect(async () => {
      const target = (await card.boundingBox())!;
      const guide = (await page.locator("[data-spotlight-card]").boundingBox())!;
      expect(target.y).toBeGreaterThanOrEqual(0);
      expect(target.y + target.height).toBeLessThanOrEqual(viewport.height);
      expect(guide.x).toBeGreaterThanOrEqual(0);
      expect(guide.y).toBeGreaterThanOrEqual(0);
      expect(guide.y + guide.height).toBeLessThanOrEqual(viewport.height + 1);
      expect(guide.x + guide.width <= target.x || guide.y >= target.y + target.height).toBe(true);
    }).toPass();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.screenshot({ path: testInfo.outputPath(`risks-overview-${viewport.width}x${viewport.height}.png`), fullPage: true });
    const ringIdentity = await card.evaluate(element => { element.setAttribute("data-mounted-once", "true"); return true; });
    expect(ringIdentity).toBe(true);
    for (const [category, label, count] of [["process", "Production capacity", 5], ["logistics", "Transport & routes", 2], ["liquidity", "Working capital", 2], ["external", "External conditions", 1]] as const) {
      await card.getByRole("button", { name: `${label} ${count}`, exact: true }).click();
      await expect(card.locator("[data-risk-wheel]")).toHaveAttribute("data-selected-category", category);
      await expect(stage).toHaveAttribute("data-risk-beat", category);
      await expect(card).toHaveAttribute("data-mounted-once", "true");
      await expect(card.locator("[data-risk-explanation]")).toContainText(label);
    }
    // Keyboard can reach the actual target and cannot escape to the dashboard.
    await card.getByRole("button", { name: "Material availability 7", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(stage).toHaveAttribute("data-risk-beat", "material");
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press("Tab");
      expect(await page.evaluate(() => Boolean(document.activeElement?.closest('[data-surface="risks"], [data-risk-spotlight]')))).toBe(true);
    }
    await stage.getByRole("button", { name: "Next example", exact: true }).click();
    await expect(stage).toHaveAttribute("data-risk-beat", "network");
    if (viewport.width === 1440) await page.screenshot({ path: testInfo.outputPath("risks-shared-desktop.png"), fullPage: true });
    await stage.getByRole("button", { name: "Next example", exact: true }).click();
    await expect(stage).toHaveAttribute("data-risk-beat", "regulatory");
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.screenshot({ path: testInfo.outputPath(`risks-regulatory-${viewport.width}x${viewport.height}.png`), fullPage: true });
    await stage.getByRole("button", { name: "Continue", exact: true }).click();
    await completeFinancialIntroduction(page);
    await expect(page.locator('[data-guide-step="order"]')).toBeVisible();
    await expect(card).not.toHaveAttribute("style");
    await expect(page.getByRole("dialog", { name: "Trace the exposure to an order." })).toBeVisible();
    for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Back", exact: true }).click();
    await expect(stage).toHaveAttribute("data-risk-beat", "regulatory");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Replay demo", exact: true })).toBeFocused();
    expect(errors).toEqual([]);
    await context.close();
  }
});


test("hover previews and pinned category selections highlight the wheel and dim other rows", async ({ browser }, testInfo) => {
  const context = await localContext(browser);
  const page = await context.newPage();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.getByRole("button", { name: "Start demo", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  const stage = page.locator('[data-guide-step="risks"]');
  const card = page.locator('[data-surface="risks"]');
  const wheel = card.locator("[data-risk-wheel]");
  const material = card.getByRole("button", { name: "Material availability 7", exact: true });
  const capacity = card.getByRole("button", { name: "Production capacity 5", exact: true });
  await expect(stage).toHaveCSS("opacity", "1");
  await capacity.hover();
  await expect(wheel).toHaveAttribute("data-selected-category", "process");
  await expect(wheel).toHaveAttribute("data-pinned-category", "overview");
  await expect(stage).toHaveAttribute("data-risk-beat", "overview");
  await expect(capacity).toHaveAttribute("aria-pressed", "false");
  await expect(capacity).toHaveCSS("opacity", "1");
  await expect(material).toHaveCSS("opacity", "0.76");
  await expect(card.locator('[data-risk-segment="material"]')).toHaveCSS("opacity", "0.22");
  await page.screenshot({ path: testInfo.outputPath("risk-hover-preview.png"), fullPage: true });
  await stage.getByRole("heading").hover();
  await expect(wheel).toHaveAttribute("data-selected-category", "overview");
  await expect(material).toHaveCSS("opacity", "1");
  await material.click();
  await stage.getByRole("heading").hover();
  await expect(wheel).toHaveAttribute("data-pinned-category", "material");
  await expect(material).toHaveAttribute("aria-pressed", "true");
  await expect(capacity).toHaveCSS("opacity", "0.76");
  // Hover a point on the actual arc, away from its unfilled SVG bounding box.
  const arc = card.locator('[data-risk-segment="process"]');
  const point = await arc.evaluate(element => {
    const path = element as SVGPathElement;
    const local = path.getPointAtLength(path.getTotalLength() / 2);
    const screen = new DOMPoint(local.x, local.y).matrixTransform(path.getScreenCTM()!);
    return { x: screen.x, y: screen.y };
  });
  await page.mouse.move(point.x, point.y);
  await expect(wheel).toHaveAttribute("data-selected-category", "process");
  await stage.getByRole("heading").hover();
  await expect(wheel).toHaveAttribute("data-selected-category", "material");
  await expect(stage).toHaveAttribute("data-risk-beat", "material");
  await capacity.focus();
  await expect(wheel).toHaveAttribute("data-selected-category", "process");
  await page.keyboard.press("Enter");
  await expect(wheel).toHaveAttribute("data-pinned-category", "process");
  await expect(capacity).toHaveAttribute("aria-pressed", "true");
  await stage.getByRole("heading").hover();
  await expect(material).toHaveCSS("opacity", "0.76");
  await page.screenshot({ path: testInfo.outputPath("risk-pinned-selection.png"), fullPage: true });
  await context.close();
});


test("capital precedes exposure and a continuous order-list spotlight opens Act Two", async ({ browser }, testInfo) => {
  test.setTimeout(90_000);
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 1024, height: 768 }, { width: 375, height: 812 }, { width: 375, height: 480 }, { width: 320, height: 640 }]) {
    const context = await localContext(browser);
    if (viewport.width === 1024) await context.addInitScript(() => localStorage.setItem("drona-theme", "dark"));
    const page = await context.newPage();
    if (viewport.width === 1440) await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("/");
    await page.getByRole("button", { name: "Start demo", exact: true }).click();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    const risks = page.locator('[data-guide-step="risks"]');
    for (let i = 0; i < 3; i++) await risks.getByRole("button", { name: "Next example", exact: true }).click();
    await risks.getByRole("button", { name: "Continue", exact: true }).click();
    const queue = page.locator('[data-surface="commitments"]');
    await queue.evaluate(element => element.setAttribute("data-original-financial-target", "true"));
    let productionFrame: { x: number; y: number; width: number; height: number } | null = null;
    for (const [step, selector, title] of [["capital", '[data-surface="capital"]', "Track funding alongside production."], ["exposure", '[data-surface="commitments"]', "Understand the financial exposure."], ["order", '[data-surface="commitments"]', "Trace the exposure to an order."]] as const) {
      const stage = page.locator(`[data-guide-step="${step}"]`);
      const target = page.locator(selector);
      await expect(stage).toHaveAttribute("data-positioned", "true");
      await expect(stage.getByRole("heading", { name: title, exact: true })).toBeFocused();
      await expect(page.getByRole("dialog", { name: title })).toBeVisible();
      await expect(stage).toHaveAttribute("data-guide-act", "1");
      await expect(page.getByLabel("Drona guided demonstration")).toHaveCount(0);
      await expect(page.locator('[data-guide-act="2"]')).toHaveCount(0);
      await assertNoHorizontalOverflow(page);
      await expect(async () => {
        const box = (await target.boundingBox())!;
        const guide = (await stage.locator("[data-spotlight-card]").boundingBox())!;
        const aperture = (await stage.locator("[data-spotlight-aperture]").boundingBox())!;
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.y).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
        expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
        expect(guide.y + guide.height).toBeLessThanOrEqual(viewport.height + 1);
        expect(guide.x + guide.width).toBeLessThanOrEqual(viewport.width + 1);
        expect(guide.x >= box.x + box.width || guide.x + guide.width <= box.x || guide.y >= box.y + box.height).toBe(true);
        if (step !== "capital") {
          const focal = (await target.locator(step === "exposure" ? "[data-financial-summary]" : "[data-production-orders]").boundingBox())!;
          expect(Math.abs(aperture.x - box.x)).toBeLessThan(1);
          expect(aperture.y).toBeGreaterThanOrEqual(focal.y - 11);
          expect(Math.abs(aperture.width - box.width)).toBeLessThan(1);
          expect(aperture.height).toBeLessThan(box.height);
          expect(aperture.height).toBeGreaterThan(20);
        }
      }).toPass();
      if (step === "capital") {
        await expect(target.locator("[data-capital-disbursed]")).toHaveText("$1.8M");
        await expect(target).toContainText("$600K");
      } else {
        await expect(queue).toHaveAttribute("data-original-financial-target", "true");
        if (step === "exposure") {
          await stage.evaluate(element => element.setAttribute("data-continuous-stage", "true"));
          productionFrame = await target.boundingBox();
          await expect(target.locator("[data-financial-total]")).toBeVisible();
          await expect(stage).toContainText("$8.6M");
          await expect(target.locator('[data-guide-target="order:c1"]')).toHaveAttribute("aria-disabled", "true");
          await target.locator("[data-commercial-basis] summary").click();
          await expect(target.locator("[data-commercial-basis]")).toContainText("demo-po:0417:tower:10");
          await target.locator("[data-commercial-basis] summary").click();
        } else {
          await expect(stage).toHaveAttribute("data-continuous-stage", "true");
          await expect(stage).toContainText("$6.4M");
          expect(await target.locator('[data-guide-target="order:c1"]').getAttribute("aria-disabled")).toBeNull();
          await expect(target.locator('[data-guide-target="order:c2"]')).toHaveAttribute("aria-disabled", "true");
          await target.locator('[data-guide-target="order:c2"]').dispatchEvent("click");
          await expect(stage).toBeVisible();
          if (viewport.width >= 1100) {
            const current = (await target.boundingBox())!;
            expect(current.x).toBe(productionFrame!.x);
            expect(current.y).toBe(productionFrame!.y);
            expect(current.width).toBe(productionFrame!.width);
          }
        }
      }
      for (let i = 0; i < 6; i++) {
        await page.keyboard.press("Tab");
        expect(await page.evaluate(() => !document.activeElement?.closest("[inert]") && Boolean(document.activeElement?.closest('[data-financial-presenting], [data-risk-spotlight]')))).toBe(true);
      }
      await stage.getByRole("heading").focus();
      await target.evaluate((element, beat) => {
        const summary = element.querySelector("[data-financial-summary]");
        const body = summary?.parentElement;
        const list = element.querySelector("[data-production-orders]");
        if (body) {
          body.scrollTop = 0;
          const row = element.querySelector('[data-guide-target="order:c1"]');
          const rowRect = row?.getBoundingClientRect();
          const view = body.getBoundingClientRect();
          if (beat === "order" && list && (!rowRect || rowRect.bottom > view.bottom)) body.scrollTop = list.getBoundingClientRect().top - view.top;
        }
      }, step);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await page.screenshot({ path: testInfo.outputPath(`arc-${step}-${viewport.width}x${viewport.height}.png`), fullPage: true });
      if (step !== "order") await stage.getByRole("button", { name: "Continue", exact: true }).click();
    }
    if (viewport.width === 1440) {
      for (const step of ["exposure", "capital"]) {
        await page.getByRole("button", { name: "Back", exact: true }).click();
        await expect(page.locator(`[data-guide-step="${step}"]`)).toBeVisible();
      }
      await completeFinancialIntroduction(page);
      // The real highlighted row, rather than a simulated click, opens the order.
      await queue.locator('[data-guide-target="order:c1"]').click();
    } else await page.getByRole("button", { name: "Open this order", exact: true }).click();
  await completeOrderOverview(page);
    await expect(queue).toHaveCount(0);
    await expect(page.getByLabel("Drona guided demonstration")).toHaveCount(0);
    await expect(page.locator("[data-guide-step]")).toHaveCount(0);
    await expect(page.locator('[data-investigation="sup:tiruchi-tower-sections"]')).toHaveCount(0);
    const analysis = page.getByRole("button", { name: "Analyse production risk", exact: true });
    if (await analysis.isVisible()) await analysis.click();
    await expect(page.getByRole("button", { name: "Investigate CBAM readiness", exact: true })).toBeVisible();
    if (viewport.width === 1440) {
      await page.screenshot({ path: testInfo.outputPath("arc-act-two-order.png"), fullPage: true });
      await page.getByRole("button", { name: "Investigate CBAM readiness", exact: true }).click();
      await expect(page.locator('[data-investigation="sup:tiruchi-tower-sections"]')).toBeVisible();
      await expect(page.getByRole("dialog")).toContainText("$4,800,000");
      await expect(page.getByLabel("Drona guided demonstration")).toHaveCount(0);
      await page.screenshot({ path: testInfo.outputPath("arc-act-two-case.png"), fullPage: true, animations: "disabled" });
    }
    if (viewport.width === 1440) await page.getByRole("button", { name: "Order workspace", exact: true }).click();
    await page.getByRole("button", { name: "Portfolio", exact: true }).click();
    // Exiting the new supplier launcher releases the demo for exploration;
    // returning to the portfolio must not unexpectedly restart the old tour.
    await expect(page.locator('[data-guide-step]')).toHaveCount(0);
    await expect(page.locator('[data-exploration-handoff]')).toBeVisible();
    await page.getByRole("button", { name: "Replay walkthrough", exact: true }).click();
    await expect(page.getByRole("button", { name: "Start demo", exact: true })).toBeFocused();
    await expect(page.locator("[data-guided-boundary]")).not.toHaveAttribute("role");
    expect(errors).toEqual([]);
    await context.close();
  }
});


test("closing the regulatory condition updates portfolio exposure without erasing other purchase commitments", async ({ browser }) => {
  const context = await localContext(browser);
  const page = await context.newPage();
  await startWalkthrough(page);
  await openCase(page);
  await expect(page.getByRole("dialog")).toContainText("$4,800,000");
  await recordScope(page, "No");
  await expect(page.locator('[data-regulatory-status="scope-excluded"]')).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("$4,800,000");
  await page.getByRole("button", { name: "Order workspace", exact: true }).click();
  await page.getByRole("button", { name: "Portfolio", exact: true }).click();
  await expect(page.locator('[data-guide-step]')).toHaveCount(0);
  await expect(page.locator('[data-exploration-handoff]')).toBeVisible();
  await expect(page.locator("[data-financial-total]")).toHaveText("$3.8M");
  await expect(page.locator("[data-financial-confirmed]")).toHaveText("$0");
  await expect(page.locator('[data-order-exposure="c1"]')).toContainText("$1.6M");
  await expect(page.locator('[data-order-exposure="c5"]')).toContainText("$2.2M");
  await expect(page.locator('[data-surface="capital"] [data-capital-disbursed]')).toHaveText("$1.8M");
  await context.close();
});


test("polished supplier cards and List share concise data and a working featured case", async ({ browser }, testInfo) => {
  test.setTimeout(90_000);
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 1024, height: 768 }, { width: 375, height: 812 }, { width: 320, height: 640 }]) {
    const context = await localContext(browser);
    if (viewport.width === 1024) await context.addInitScript(() => localStorage.setItem("drona-theme", "dark"));
    const page = await context.newPage();
    await page.setViewportSize(viewport);
    await startWalkthrough(page);
    await page.getByRole("button", { name: "Open this order", exact: true }).click();
  await completeOrderOverview(page);
    await expect(page.locator("[data-brief-exposure]")).toHaveText("$6.4M");
    await expect(page.getByText("Regulatory investigation", { exact: true })).toHaveCount(0);
    await expect(page.getByText("On this order", { exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Critical 5", exact: true }).click();
    const read = () => page.locator("[data-supplier-record]").evaluateAll(elements => elements.map(el => ({
      id: el.getAttribute("data-supplier-record"), component: el.querySelector("[data-supplier-component]")?.textContent,
      concern: el.querySelector("[data-supplier-concern]")?.textContent,
    })));
    const cards = await read();
    expect(cards.length).toBe(5);
    const opener = page.getByRole("button", { name: "Investigate CBAM readiness", exact: true });
    await opener.focus();
    await expect(page.getByRole("tooltip", { name: "Tiruchi Tower Sections", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await assertNoHorizontalOverflow(page);
    await page.locator("[data-workbench-heading]").scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath(`suppliers-cards-${viewport.width}.png`), animations: "disabled" });
    await page.getByRole("tab", { name: "List", exact: true }).click();
    expect(await read()).toEqual(cards);
    await assertNoHorizontalOverflow(page);
    await page.screenshot({ path: testInfo.outputPath(`suppliers-list-${viewport.width}.png`), animations: "disabled" });
    await page.getByRole("button", { name: "Investigate CBAM readiness", exact: true }).click();
    await expect(page.locator('[data-investigation="sup:tiruchi-tower-sections"]')).toBeVisible();
    await recordScope(page, "No");
    await page.getByRole("button", { name: "Order workspace", exact: true }).click();
    await expect(page.locator("[data-brief-exposure]")).toHaveText("$1.6M");
    await expect(page.locator('[data-supplier-record="sup:tiruchi-tower-sections"] [data-supplier-concern]')).toContainText("this shipment excluded");
    await page.getByRole("tab", { name: "Cards", exact: true }).click();
    await expect(page.locator('[data-supplier-record="sup:tiruchi-tower-sections"] [data-supplier-concern]')).toContainText("this shipment excluded");
    await context.close();
  }
});


test("Act Two spotlights the real planning brief, separates market value and supplier exposure, and supports Back and Exit", async ({ browser }, testInfo) => {
  test.setTimeout(90_000);
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 1366, height: 768 }, { width: 1280, height: 720 }]) {
    const context = await localContext(browser);
    if (viewport.width === 1366) await context.addInitScript(() => localStorage.setItem("drona-theme", "dark"));
    const page = await context.newPage();
    await page.setViewportSize(viewport);
    await startWalkthrough(page);
    await expect(page.locator('[data-guide-step="order-overview"]')).toHaveCount(0);
    await page.getByRole("button", { name: "Open this order", exact: true }).click();
    const stage = page.locator('[data-guide-step="order-overview"]');
    const brief = page.locator('[data-surface="planning-brief"]');
    await expect(stage).toBeVisible();
    await expect(stage).toHaveAttribute("data-guide-act", "2");
    await expect(stage.getByRole("heading", { name: "The commitment behind the order." })).toBeFocused();
    await expect(brief.locator("[data-estimated-order-value]")).toHaveText("≈ $300M");
    await expect(brief.locator("[data-brief-exposure]")).toHaveText("$6.4M");
    await expect(brief).toContainText("3 MW onshore turbines");
    expect(await page.locator("[data-guided-boundary]").evaluate(el => (el as HTMLElement).inert)).toBe(true);
    await expect(page.getByRole("dialog")).toHaveCount(1);
    await expect(page.locator('[data-investigation="sup:tiruchi-tower-sections"]')).toHaveCount(0);
    await expect(async () => {
      const target = (await brief.boundingBox())!;
      const aperture = (await stage.locator("[data-spotlight-aperture]").boundingBox())!;
      const guide = (await stage.locator("[data-spotlight-card]").boundingBox())!;
      expect(Math.abs(aperture.x - target.x)).toBeLessThan(1);
      expect(Math.abs(aperture.width - target.width)).toBeLessThan(1);
      expect(Math.abs(aperture.height - target.height)).toBeLessThan(1);
      expect(guide.x).toBeGreaterThanOrEqual(target.x + target.width);
      expect(guide.x + guide.width).toBeLessThanOrEqual(viewport.width);
      expect(guide.y + guide.height).toBeLessThanOrEqual(viewport.height);
    }).toPass();
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Tab");
      expect(await page.evaluate(() => Boolean(document.activeElement?.closest('[data-guide-step="order-overview"]')))).toBe(true);
    }
    await stage.getByRole("heading", { name: "The commitment behind the order." }).focus();
    await page.screenshot({ path: testInfo.outputPath(`act-two-brief-${viewport.width}.png`), animations: "disabled" });
    await stage.getByRole("button", { name: "Back", exact: true }).click();
    await expect(page.locator('[data-guide-step="order"]')).toBeVisible();
    await page.getByRole("button", { name: "Open this order", exact: true }).click();
    await page.keyboard.press("Escape");
    await expect(stage).toHaveCount(0);
    expect(await page.locator("[data-guided-boundary]").evaluate(el => (el as HTMLElement).inert)).toBe(false);
    await expect(page.getByRole("button", { name: "Investigate CBAM readiness", exact: true })).toBeFocused();
    await brief.locator("summary").click();
    await expect(brief.locator("[data-planning-source]")).toContainText("$299.4M");
    await expect(brief.locator("[data-planning-source]")).toContainText("customer contract value is not held");
    await page.screenshot({ path: testInfo.outputPath(`act-two-basis-${viewport.width}.png`), animations: "disabled" });
    await brief.locator("summary").click();
    await page.getByRole("button", { name: "Investigate CBAM readiness", exact: true }).click();
    await recordScope(page, "No");
    await page.getByRole("button", { name: "Order workspace", exact: true }).click();
    await expect(brief.locator("[data-brief-exposure]")).toHaveText("$1.6M");
    await expect(brief.locator("[data-estimated-order-value]")).toHaveText("≈ $300M");
    await context.close();
  }
});


test("optional order Drona stays separate from the walkthrough and uses current sample evidence", async ({ browser }, testInfo) => {
  test.setTimeout(90_000);
  for (const dark of [false, true]) {
    const context = await localContext(browser);
    if (dark) await context.addInitScript(() => localStorage.setItem("drona-theme", "dark"));
    const page = await context.newPage();
    await startWalkthrough(page);
    await page.getByRole("button", { name: "Open this order", exact: true }).click();
    const chat = page.locator("[data-order-drona]");
    const brief = page.locator('[data-surface="planning-brief"]');
    await expect(page.locator('[data-guide-step="order-overview"]')).toBeVisible();
    expect(await chat.evaluate(el => Boolean(el.closest("[inert]")))).toBe(true);
    await completeOrderOverview(page);
    await page.emulateMedia({ reducedMotion: dark ? "reduce" : "no-preference" });
    const mappedTotal = Number(await brief.locator("[data-mapped-supplier-total]").innerText());
    expect(mappedTotal).toBeGreaterThan(41);
    await expect(brief).toContainText(`41 direct · ${mappedTotal - 41} upstream`);
    await expect(brief).toContainText("Partial network coverage");
    await expect(chat.getByText("Sample responses", { exact: true })).toBeVisible();
    await expect(chat.locator("[data-order-drona-response]")).toHaveCount(0);
    await expect(chat).not.toContainText("$6.4M");
    await chat.scrollIntoViewIfNeeded();
    await chat.getByRole("heading", { name: "Drona", exact: true }).click();
    await page.screenshot({ path: testInfo.outputPath(`order-conversation-empty-${dark ? "dark" : "light"}.png`), animations: "disabled" });
    await chat.getByRole("button", { name: "How much of this order’s supplier network is mapped?", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(chat.getByRole("status")).toHaveAttribute("aria-busy", "true");
    await expect(chat.locator("[data-order-drona-response]")).toHaveCount(0);
    await expect(chat.locator("[data-order-drona-review]")).toContainText("Reviewing mapped suppliers");
    await page.screenshot({ path: testInfo.outputPath(`order-conversation-buffer-${dark ? "dark" : "light"}.png`), animations: "disabled" });
    await expect(chat.getByRole("status")).toContainText(`${mappedTotal} distinct suppliers`);
    await expect(chat.getByRole("status")).toHaveAttribute("aria-busy", "false");
    await chat.locator("[data-order-drona-review-complete] summary").click();
    await expect(chat.getByRole("list", { name: "Completed sample review" })).toContainText("Shared identities checked");
    await expect(chat.getByRole("status")).toContainText("do not confirm every party");
    await chat.getByRole("textbox", { name: "Your question" }).fill("Call the supplier now");
    await chat.getByRole("button", { name: "Ask Drona ↗", exact: true }).click();
    await expect(chat.getByRole("status")).toContainText("Live AI is not connected");
    await expect(brief.locator("[data-brief-exposure]")).toHaveText("$6.4M");
    await chat.getByRole("textbox", { name: "Your question" }).fill("What CBAM evidence is still needed?");
    await chat.getByRole("button", { name: "Ask Drona ↗", exact: true }).click();
    await expect(chat.getByRole("status")).toContainText("customs broker");
    await chat.getByRole("button", { name: "How could CBAM affect the tower-section shipment?", exact: true }).click();
    await expect(chat.getByRole("status")).toContainText("shipment applicability from importer readiness");
    await expect(chat.getByRole("status")).toContainText("Applicability remains under review");
    await chat.scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath(`order-conversation-answer-${dark ? "dark" : "light"}.png`), animations: "disabled" });
    await chat.getByRole("button", { name: "Clear conversation", exact: true }).click();
    await expect(chat.getByRole("textbox", { name: "Your question" })).toBeFocused();
    await expect(chat.locator("[data-order-drona-response]")).toHaveCount(0);
    await brief.locator("summary").click();
    await expect(brief.locator("[data-planning-source]")).toContainText("Shared identities");
    await expect(brief.locator("[data-planning-source]")).toContainText("Case-only parties");
    await brief.locator("summary").click();
    await page.getByRole("button", { name: "Investigate CBAM readiness", exact: true }).click();
    await expect(page.locator('[data-regulatory-status="applicability-review"]')).toBeVisible();
    await recordScope(page, "No");
    await page.getByRole("button", { name: "Order workspace", exact: true }).click();
    await expect(page.locator('[data-guide-step="order-overview"]')).toHaveCount(0);
    await chat.getByRole("button", { name: "What CBAM evidence is still needed?", exact: true }).click();
    await expect(chat.getByRole("status")).toContainText("excludes this shipment");
    await expect(brief.locator("[data-brief-exposure]")).toHaveText("$1.6M");
    await expect(brief.locator("[data-mapped-supplier-total]")).toHaveText(String(mappedTotal));
    await assertNoHorizontalOverflow(page);
    await context.close();
  }
});


test("Act Two supplier overview spotlights the actual full-width panel and hands off without opening a case", async ({ browser }, testInfo) => {
  test.setTimeout(120_000);
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 1366, height: 768 }, { width: 1280, height: 720 }]) {
    const context = await localContext(browser);
    if (viewport.width === 1366) await context.addInitScript(() => localStorage.setItem("drona-theme", "dark"));
    const page = await context.newPage();
    await page.setViewportSize(viewport);
    await startWalkthrough(page);
    await page.getByRole("button", { name: "Open this order", exact: true }).click();
    const brief = page.locator('[data-guide-step="order-overview"]');
    await brief.getByRole("button", { name: "Continue", exact: true }).click();
    const stage = page.locator('[data-guide-step="supplier-overview"]');
    const panel = page.locator('[data-surface="suppliers"]');
    await expect(stage).toBeVisible();
    await expect(stage).toHaveAttribute("data-guide-act", "2");
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await expect(stage.getByRole("heading", { name: "See which suppliers need attention." })).toBeFocused();
    await expect(panel).toHaveCount(1);
    await expect(panel.locator('[data-supplier-records="cards"] > li')).toHaveCount(41);
    await expect(panel.getByRole("button", { name: "All 41", exact: true, includeHidden: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator('[data-investigation]')).toHaveCount(0);
    expect(await page.locator('[data-guided-boundary]').evaluate(el => (el as HTMLElement).inert)).toBe(true);
    await expect(async () => {
      const target = (await panel.boundingBox())!;
      const aperture = (await stage.locator('[data-spotlight-aperture]').boundingBox())!;
      const guide = (await stage.locator('[data-spotlight-card]').boundingBox())!;
      const first = (await panel.locator('[data-supplier-records="cards"] > li').first().boundingBox())!;
      expect(Math.abs(aperture.x - target.x)).toBeLessThan(1);
      expect(Math.abs(aperture.width - target.width)).toBeLessThan(1);
      expect(aperture.y).toBeGreaterThanOrEqual(0);
      expect(target.y).toBeLessThan(120);
      expect(first.y + first.height).toBeLessThanOrEqual(viewport.height);
      expect(guide.x).toBeGreaterThanOrEqual(target.x + target.width + 8);
      expect(guide.x + guide.width).toBeLessThanOrEqual(viewport.width - 12);
      expect(guide.y).toBeGreaterThanOrEqual(12);
      expect(guide.y + guide.height).toBeLessThanOrEqual(viewport.height - 12);
    }).toPass();
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Tab");
      expect(await page.evaluate(() => Boolean(document.activeElement?.closest('[data-guide-step="supplier-overview"]')))).toBe(true);
    }
    await stage.getByRole("heading", { name: "See which suppliers need attention." }).focus();
    await page.screenshot({ path: testInfo.outputPath(`supplier-overview-${viewport.width}.png`), animations: "disabled" });
    await stage.getByRole("button", { name: "Back", exact: true }).click();
    await expect(brief).toBeVisible();
    await brief.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(stage).toBeVisible();
    if (viewport.width === 1366) await page.keyboard.press("Escape");
    else await stage.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(stage).toHaveCount(0);
    if (viewport.width !== 1366) {
      const launch = page.locator('[data-guide-step="material-launch"]');
      await expect(launch.getByRole("heading", { name: "Follow an early material warning." })).toBeFocused();
      await expect(page.locator('[data-investigation]')).toHaveCount(0);
      await launch.getByRole("button", { name: "Exit", exact: true }).click();
    }
    const opener = page.getByRole("button", { name: "Investigate billet disruption", exact: true });
    await expect(opener).toBeFocused();
    expect(await page.locator('[data-guided-boundary]').evaluate(el => (el as HTMLElement).inert)).toBe(false);
    await expect(page.locator('[data-investigation]')).toHaveCount(0);
    const first = (await opener.boundingBox())!;
    expect(first.y).toBeGreaterThanOrEqual(0);
    expect(first.y + first.height).toBeLessThanOrEqual(viewport.height);
    await expect(page.locator('[data-brief-exposure]')).toHaveText("$6.4M");
    await opener.click();
    await expect(page.locator('[data-investigation="sup:deccan-mainshaft-forgings"]')).toBeVisible();
    await page.getByRole("button", { name: "Order workspace", exact: true }).click();
    await expect(stage).toHaveCount(0);
    await expect(brief).toHaveCount(0);
    await context.close();
  }
});
