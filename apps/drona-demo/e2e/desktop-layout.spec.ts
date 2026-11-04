import { readFileSync } from "node:fs";
import { test, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";

const origin = process.env.DRONA_E2E_BASE_URL ?? "http://127.0.0.1:3402";
let signedIn: Awaited<ReturnType<BrowserContext["storageState"]>>;
async function contextFor(browser: Browser, options: Parameters<Browser["newContext"]>[0] = {}) {
  const context = await browser.newContext({ baseURL:origin, storageState:signedIn, viewport:{width:1440,height:780}, reducedMotion:"reduce", ...options });
  await context.route("**/*", route => { const url = new URL(route.request().url()); return url.origin === origin || ["data:","blob:"].includes(url.protocol) ? route.continue() : route.abort(); });
  return context;
}
test.beforeAll(async ({ browser }) => {
  const context = await contextFor(browser, {storageState:undefined}), page = await context.newPage();
  try {
    const file = process.env.DRONA_E2E_CREDENTIALS_FILE;
    if (!file) throw new Error("Missing credentials");
    const raw = readFileSync(file,"utf8");
    const parsed = raw.trimStart().startsWith("{") || raw.trimStart().startsWith("[") ? JSON.parse(raw) : { username:raw.match(/^Username:\s*(.+)$/m)?.[1]?.trim(), password:raw.match(/^Password:\s*(.+)$/m)?.[1]?.trim() };
    const credentials = Array.isArray(parsed) ? parsed[0] : parsed;
    await page.goto("/login");
    await page.getByLabel("Username",{exact:true}).fill(credentials.username);
    await page.getByLabel("Password",{exact:true}).fill(credentials.password);
    await page.getByRole("button",{name:"Enter demo",exact:true}).click();
    await expect(page.getByRole("button",{name:"Start demo",exact:true})).toBeVisible();
    signedIn = await context.storageState();
  } catch { throw new Error("Desktop test sign-in failed; sensitive diagnostics omitted."); }
  finally { await context.close(); }
});
async function nativeOrder(page: Page) {
  await page.goto("/");
  await page.getByRole("button",{name:"Start demo",exact:true}).click();
  await page.locator('[data-guide-step="map"]').getByRole("button",{name:"Continue",exact:true}).click();
  const risks = page.locator('[data-guide-step="risks"]');
  for(let i=0;i<3;i++) await risks.getByRole("button",{name:"Next example",exact:true}).click();
  await risks.getByRole("button",{name:"Continue",exact:true}).click();
  for(const step of ["capital","exposure"]) await page.locator(`[data-guide-step="${step}"]`).getByRole("button",{name:"Continue",exact:true}).click();
  await page.getByRole("button",{name:"Open this order",exact:true}).click();
  await page.locator('[data-guide-step="order-overview"]').getByRole("button",{name:"Exit",exact:true}).click();
}

test("desktop-only entry covers phones, tablets, desktop-identity iPads and existing sessions", async ({browser},info) => {
  for(const device of [
    {name:"iphone",userAgent:"Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",width:390,height:844},
    {name:"android-landscape",userAgent:"Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36",width:1334,height:750},
    {name:"tablet",userAgent:"Mozilla/5.0 (Linux; Android 15; Tablet) AppleWebKit/537.36 Chrome/130.0 Safari/537.36",width:1280,height:800},
    {name:"ipad-desktop",userAgent:"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15",width:1366,height:1024},
  ]) {
    const context = await contextFor(browser,{userAgent:device.userAgent,viewport:{width:device.width,height:device.height}});
    if(device.name === "ipad-desktop") await context.addInitScript(() => { Object.defineProperty(navigator,"maxTouchPoints",{value:5}); Object.defineProperty(navigator,"platform",{value:"MacIntel"}); });
    const page=await context.newPage();
    await page.goto("/login");
    await expect(page.getByRole("heading",{name:"Explore Drona on a laptop or desktop.",exact:true})).toBeVisible();
    await expect(page.getByRole("button",{name:"Enter demo",exact:true})).toBeHidden();
    await page.goto("/");
    await expect(page.getByRole("heading",{name:"Explore Drona on a laptop or desktop.",exact:true})).toBeVisible();
    await expect(page.getByRole("button",{name:"Start demo",exact:true})).toHaveCount(0);
    await page.screenshot({path:info.outputPath(`entry-${device.name}.png`)});
    await context.close();
  }
  const context = await contextFor(browser,{javaScriptEnabled:false,userAgent:"iPhone Mobile",viewport:{width:390,height:844}}),page=await context.newPage();
  await page.goto("/login");
  await expect(page.getByRole("heading",{name:"Explore Drona on a laptop or desktop.",exact:true})).toBeVisible();
  await expect(page.locator("form")).toHaveCount(0);
  await page.goto("/");
  await expect(page.getByRole("heading",{name:"Explore Drona on a laptop or desktop.",exact:true})).toBeVisible();
  await context.close();
});

test("a narrow touch-enabled desktop can continue and resizing preserves the current order", async ({browser},info) => {
  const context=await contextFor(browser,{viewport:{width:980,height:700},userAgent:"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36"});
  await context.addInitScript(() => Object.defineProperty(navigator,"maxTouchPoints",{value:10}));
  const page=await context.newPage(); await page.goto("/login");
  await expect(page.getByText("For the best view, widen this window.",{exact:true})).toBeVisible();
  await expect(page.getByRole("button",{name:"Enter demo",exact:true})).toBeEnabled();
  await nativeOrder(page);
  await expect(page.locator('[data-brief-exposure]')).toHaveText("$6.4M");
  await page.setViewportSize({width:1440,height:780});
  await expect(page.locator('[data-brief-exposure]')).toHaveText("$6.4M");
  await expect(page.locator('[data-guide-cover]')).toHaveCount(0);
  await page.screenshot({path:info.outputPath("desktop-resize-retains-order.png")});
  // Effective CSS viewport of a small laptop at enlarged browser zoom. This
  // complements the separate native Safari zoom check; it is not CSS scaling.
  await page.setViewportSize({width:640,height:360});
  await expect(page.getByText("For the best view, widen this window.",{exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Investigate billet disruption",exact:true}).click();
  const question=page.locator('[data-working-question="allocation"]');
  await question.getByRole("button",{name:"Yes",exact:true}).click();
  await question.getByRole("button",{name:"Record sample reply and reassess",exact:true}).click();
  await expect(page.locator('[data-material-status="stock-protected"]')).toBeVisible();
  await page.getByRole("tab",{name:"Evidence & reasoning",exact:true}).click();
  await page.locator('[data-reasoning-node="claim:dc-receipt"]').click();
  const inspector=page.locator('[data-claim-inspector="dc-receipt"]');
  await expect(inspector).toBeVisible();
  await expect(inspector).toBeFocused();
  await expect(inspector.getByRole("button",{name:"Close the claim inspector",exact:true})).toBeInViewport();
  expect((await inspector.boundingBox())!.width).toBeLessThan(610);
  expect(await page.locator('[data-investigation]').evaluate(el=>el.scrollWidth>el.clientWidth+1)).toBe(false);
  await page.screenshot({path:info.outputPath("desktop-enlarged-viewport-case.png")});
  await inspector.getByRole("button",{name:"Close the claim inspector",exact:true}).click();
  await expect(page.locator('[data-reasoning-node="claim:dc-receipt"]')).toBeFocused();
  await page.getByRole("button",{name:"Order workspace",exact:true}).click();
  await page.setViewportSize({width:1440,height:780});
  await expect(page.locator('[data-brief-exposure]')).toHaveText("$4.8M");
  await context.close();
});

test("desktop screens use natural flow, complete categories and usable wheel and keyboard scrolling", async ({browser},info) => {
  test.setTimeout(180_000);
  const context=await contextFor(browser),page=await context.newPage();
  await nativeOrder(page);
  for(const viewport of [{width:1024,height:600},{width:1280,height:650},{width:1280,height:720},{width:1366,height:768},{width:1440,height:780},{width:1440,height:900},{width:1920,height:1080},{width:2560,height:1440}]) {
    await page.setViewportSize(viewport);
    await page.getByRole("button",{name:"Return to dashboard",exact:true}).click();
    await page.mouse.move(viewport.width-30,30);
    await expect(page.getByRole("navigation",{name:"Primary",exact:true})).toHaveCSS("width","64px");
    const handoff=page.getByRole("button",{name:"Dismiss completion note",exact:true}); if(await handoff.isVisible()) await handoff.click();
    const scroller=page.locator(".demo-reading-area");
    await scroller.evaluate(el => { el.scrollTop=0; });
    const map=await page.locator('[data-surface="map"]').boundingBox();
    expect(map!.height).toBeGreaterThanOrEqual(199); expect(map!.height).toBeLessThanOrEqual(281);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth+1)).toBe(false);
    expect(await scroller.evaluate(el => el.scrollWidth > el.clientWidth+1)).toBe(false);
    if(viewport.width>=1280) {
      const first=await page.locator('[data-guide-target="order:c1"]').boundingBox();
      expect(first!.y).toBeLessThan(viewport.height-60);
      if(viewport.width<1440 || viewport.height<820) expect(await page.locator('[data-risk-wheel]').evaluate(el=>el.getBoundingClientRect().width)).toBeLessThanOrEqual(201);
    }
    await page.screenshot({path:info.outputPath(`dashboard-${viewport.width}x${viewport.height}.png`)});
    const risks=page.locator('[data-surface="risks"]'); await risks.scrollIntoViewIfNeeded();
    const riskBody=await risks.locator('[data-risk-card-content]').evaluate(el=>({height:el.scrollHeight,visible:el.clientHeight}));
    expect(riskBody.height).toBeLessThanOrEqual(riskBody.visible+1);
    for(const category of await page.locator('[data-risk-category]').all()) await expect(category).toBeVisible();
    const assistant=page.getByRole("complementary",{name:"Drona",exact:true});
    await assistant.scrollIntoViewIfNeeded();
    expect((await assistant.boundingBox())!.height).toBeGreaterThanOrEqual(359);
    const note=page.getByLabel("Assistant note",{exact:true});
    expect(await note.evaluate(el=>el.clientHeight)).toBeGreaterThanOrEqual(180);
    await expect(assistant.getByRole("button",{name:"Investigate",exact:true})).toBeInViewport();
    await page.screenshot({path:info.outputPath(`assistant-reading-${viewport.width}x${viewport.height}.png`)});
    await assistant.getByRole("tab",{name:/Activity/}).click();
    const activity=assistant.getByRole("list",{name:"Activity",exact:true}); await activity.hover();
    await page.mouse.wheel(0,1800);
    await expect.poll(()=>activity.evaluate(el=>el.scrollTop)).toBeGreaterThan(0);
    await activity.focus(); await page.keyboard.press("Home"); await page.keyboard.press("End");
    await expect.poll(()=>activity.evaluate(el=>el.scrollTop+el.clientHeight>=el.scrollHeight-2)).toBe(true);
    await expect(assistant.getByLabel("Add a note for the team",{exact:true})).toBeInViewport();
    await page.screenshot({path:info.outputPath(`assistant-${viewport.width}x${viewport.height}.png`)});
    await assistant.getByRole("tab",{name:"Assistant",exact:true}).click();
    await page.locator('[data-guide-target="order:c1"]').click();
    const brief=page.locator('[data-surface="planning-brief"]');
    if(viewport.width>=1280 && (viewport.width<1440 || viewport.height<820)) expect((await brief.boundingBox())!.height).toBeLessThanOrEqual(320);
    await page.screenshot({path:info.outputPath(`order-${viewport.width}x${viewport.height}.png`)});
  }
  await context.close();
});
