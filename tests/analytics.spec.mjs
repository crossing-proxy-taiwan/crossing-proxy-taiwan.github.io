import { expect, test } from "@playwright/test";

const thirdParty = /goatcounter|gc\.zgo\.at|cloudflareinsights|umami\.is|google-analytics|googletagmanager/i;

function watchThirdParties(page) {
  const urls = [];
  page.on("request", (request) => {
    if (thirdParty.test(request.url())) urls.push(request.url());
  });
  return urls;
}

async function mockGoatCounter(page, site) {
  await page.route("**/data/analytics.json", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ provider: "goatcounter", site }),
    }),
  );
  await page.route("**/gc.zgo.at/count.js", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: `window.__gcCalls = window.__gcCalls || [];
window.__gcCalls.push({ pageview: true, search: location.search });
window.goatcounter = window.goatcounter || {};
window.goatcounter.count = function (vars) { window.__gcCalls.push(vars); };
window.goatcounter.filter = function () { return false; };
`,
    }),
  );
}

test("analytics stays unloaded when the site code is empty", async ({ page }) => {
  const urls = watchThirdParties(page);
  await page.goto(
    "/zh/?country=TW&passport=A123456789&phone=0912345678&utm_source=facebook&utm_medium=social&utm_campaign=repositioning-2026-12-post-r143-b1",
  );
  await expect(page.locator("html")).toHaveAttribute("data-analytics", "off");
  await expect(page.locator('script[src*="gc.zgo.at"], script[data-goatcounter]')).toHaveCount(0);
  await expect(page).toHaveURL(
    /\/zh\/\?country=TW&utm_source=facebook&utm_medium=social&utm_campaign=repositioning-2026-12-post-r143-b1$/,
  );
  expect(page.url()).not.toContain("passport");
  expect(page.url()).not.toContain("A123456789");
  expect(page.url()).not.toContain("0912345678");
  expect(urls).toEqual([]);
  const stored = await page.evaluate(() => ({
    source: sessionStorage.getItem("cp-utm-source"),
    campaign: sessionStorage.getItem("cp-utm-campaign"),
    localSource: localStorage.getItem("cp-utm-source"),
    cookie: document.cookie,
  }));
  expect(stored).toEqual({ source: null, campaign: null, localSource: null, cookie: "" });
  expect(await page.context().cookies()).toEqual([]);

  await page.locator('[data-service="documents"] [data-toggle-more]').click();
  await page.locator('[data-open-inquiry="documents"]').click();
  await expect(page.locator("#inquiry")).toBeVisible();
  expect(urls).toEqual([]);
  expect(await page.evaluate(() => sessionStorage.getItem("cp-utm-source"))).toBeNull();
});

test("a token-shaped site code does not load analytics", async ({ page }) => {
  const urls = watchThirdParties(page);
  await mockGoatCounter(page, "0123456789abcdef");
  await page.goto("/en/");
  await expect(page.locator("html")).toHaveAttribute("data-analytics", "off");
  await expect(page.locator("script[data-goatcounter]")).toHaveCount(0);
  expect(urls.filter((url) => url.includes("gc.zgo.at"))).toEqual([]);
});

test("configured event hooks fire without form contents", async ({ page }) => {
  const urls = watchThirdParties(page);
  await mockGoatCounter(page, "example");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(
    "/zh/?country=TW&utm_source=instagram&utm_medium=social&utm_campaign=repositioning-2026-12-post-ri12-i1&note=LEAKPROBE",
  );
  await expect(page.locator("html")).toHaveAttribute("data-analytics", "on");
  await expect(page.locator("html")).toHaveAttribute("data-country", "TW");
  const script = page.locator("script[data-goatcounter]");
  await expect(script).toHaveAttribute("src", "https://gc.zgo.at/count.js");
  await expect(script).toHaveAttribute("data-goatcounter", "https://example.goatcounter.com/count");
  await page.waitForFunction(() => window.goatcounter && typeof window.goatcounter.count === "function");
  await expect(page).toHaveURL(
    /utm_source=instagram&utm_medium=social&utm_campaign=repositioning-2026-12-post-ri12-i1$/,
  );
  expect(page.url()).not.toContain("LEAKPROBE");
  const stored = await page.evaluate(() => ({
    source: sessionStorage.getItem("cp-utm-source"),
    campaign: sessionStorage.getItem("cp-utm-campaign"),
    localSource: localStorage.getItem("cp-utm-source"),
    localCampaign: localStorage.getItem("cp-utm-campaign"),
    cookie: document.cookie,
  }));
  expect(stored).toEqual({
    source: "instagram",
    campaign: "repositioning-2026-12-post-ri12-i1",
    localSource: null,
    localCampaign: null,
    cookie: "",
  });
  expect(await page.context().cookies()).toEqual([]);
  expect(urls.every((url) => url === "https://gc.zgo.at/count.js")).toBe(true);
  expect(urls.some((url) => url.includes("example.goatcounter.com"))).toBe(false);

  const pageview = await page.evaluate(() => window.__gcCalls.find((call) => call && call.pageview));
  expect(pageview.search).toContain("utm_source=instagram");
  expect(pageview.search).toContain("utm_campaign=repositioning-2026-12-post-ri12-i1");
  expect(pageview.search).not.toContain("LEAKPROBE");

  await page.locator('[data-service="documents"] [data-toggle-more]').click();
  await page.locator('a[href="#service-driving-license-assistance"]').click();
  await page.locator('[data-open-inquiry="documents"]').click();
  const leak = "LEAKPROBE-姓名";
  await page.locator("#inquiry-fields input, #inquiry-fields textarea").first().fill(`${leak} A123456789`);
  await page.locator("#inquiry-line").click();
  await page.locator("#inquiry-copy").click();
  await page.locator('#inquiry button[value="cancel"]').click();
  await expect(page.locator("#inquiry")).toBeHidden();

  const [popup] = await Promise.all([
    page.waitForEvent("popup"),
    page.locator("a.line-link").click(),
  ]);
  await popup.close();

  const calls = await page.evaluate(() => window.__gcCalls.filter((call) => call && call.event));
  const paths = calls.map((call) => call.path);
  expect(paths).toContain("service-open:zh:documents:instagram");
  expect(paths).toContain("service-open:zh:driving-license-assistance:instagram");
  expect(paths).toContain("inquiry-open:zh:documents:instagram");
  expect(paths).toContain("line-click:zh:documents:instagram");
  expect(paths).toContain("line-click:zh:none:instagram");
  expect(paths.filter((path) => path === "line-click:zh:none:instagram").length).toBe(1);
  for (const call of calls) {
    expect(Object.keys(call).sort()).toEqual(["event", "no_session", "path", "referrer", "title"]);
    expect(call.referrer).toBe("");
    expect(call.title).toBe(call.path);
    expect(call.path).toMatch(eventName);
  }
  const dumped = JSON.stringify(await page.evaluate(() => window.__gcCalls));
  expect(dumped).not.toContain("LEAKPROBE");
  expect(dumped).not.toContain("A123456789");
  expect(page.url()).not.toContain("LEAKPROBE");
});

test("mobile LINE button is tracked when configured", async ({ page }) => {
  await mockGoatCounter(page, "example");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/vi/?country=VN");
  await expect(page.locator("html")).toHaveAttribute("data-analytics", "on");
  await expect(page.locator("html")).toHaveAttribute("data-country", "VN");
  await page.waitForFunction(() => window.goatcounter && typeof window.goatcounter.count === "function");
  const [popup] = await Promise.all([
    page.waitForEvent("popup"),
    page.locator(".mobile-bar a.button-line").click(),
  ]);
  await popup.close();
  const paths = await page.evaluate(() => window.__gcCalls.filter((call) => call && call.event).map((call) => call.path));
  expect(paths).toEqual(["line-click:vi:none:direct"]);
  expect(await page.evaluate(() => sessionStorage.getItem("cp-utm-source"))).toBeNull();
});

test("language switch keeps a safe campaign and drops the old country", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(
    "/zh/?country=TW&utm_source=threads&utm_medium=social&utm_campaign=repositioning-2026-12-post-rt12-t2",
  );
  await expect(page.locator("html")).toHaveAttribute("data-analytics", "off");
  expect(await page.evaluate(() => sessionStorage.getItem("cp-utm-source"))).toBeNull();
  await page.locator(".lang-toggle").click();
  await page.locator('#lang-menu a[hreflang="vi"]').click();
  await expect(page).toHaveURL(
    /\/vi\/\?country=VN&utm_source=threads&utm_medium=social&utm_campaign=repositioning-2026-12-post-rt12-t2$/,
  );
  await expect(page.locator("html")).toHaveAttribute("data-country", "VN");
  await expect(page.locator("html")).toHaveAttribute("lang", "vi");
  expect(await page.evaluate(() => sessionStorage.getItem("cp-utm-campaign"))).toBeNull();
});

const eventName = /^(service-open|inquiry-open|line-click):(zh|en|vi|id|th|fil):[a-z0-9-]+:(facebook|instagram|threads|tiktok|youtube|line|direct)$/;

test("landing source stays in sessionStorage and later events, not in cookies", async ({ page }) => {
  await mockGoatCounter(page, "example");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(
    "/zh/?country=TW&utm_source=facebook&utm_medium=social&utm_campaign=repositioning-2026-12-post-r143-b1",
  );
  await expect(page.locator("html")).toHaveAttribute("data-analytics", "on");
  await page.goto("/en/?country=all");
  await expect(page.locator("html")).toHaveAttribute("data-analytics", "on");
  await expect(page).toHaveURL(/\/en\/\?country=all$/);
  await page.waitForFunction(() => window.goatcounter && typeof window.goatcounter.count === "function");
  const [popup] = await Promise.all([page.waitForEvent("popup"), page.locator("a.line-link").click()]);
  await popup.close();
  const stored = await page.evaluate(() => ({
    source: sessionStorage.getItem("cp-utm-source"),
    campaign: sessionStorage.getItem("cp-utm-campaign"),
    localSource: localStorage.getItem("cp-utm-source"),
    cookie: document.cookie,
    paths: window.__gcCalls.filter((call) => call && call.event).map((call) => call.path),
  }));
  expect(stored.source).toBe("facebook");
  expect(stored.campaign).toBe("repositioning-2026-12-post-r143-b1");
  expect(stored.localSource).toBeNull();
  expect(stored.cookie).toBe("");
  expect(await page.context().cookies()).toEqual([]);
  expect(stored.paths).toContain("line-click:en:none:facebook");
  for (const path of stored.paths) expect(path).toMatch(eventName);
});

test("unknown utm source is not stored and events use direct", async ({ page }) => {
  await mockGoatCounter(page, "example");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(
    "/zh/?country=TW&utm_source=newsletter&utm_medium=social&utm_campaign=repositioning-2026-12-profile",
  );
  await expect(page.locator("html")).toHaveAttribute("data-analytics", "on");
  await page.waitForFunction(() => window.goatcounter && typeof window.goatcounter.count === "function");
  expect(await page.evaluate(() => sessionStorage.getItem("cp-utm-source"))).toBeNull();
  expect(await page.evaluate(() => sessionStorage.getItem("cp-utm-campaign"))).toBe(
    "repositioning-2026-12-profile",
  );
  await page.locator('[data-service="documents"] [data-toggle-more]').click();
  const paths = await page.evaluate(() => window.__gcCalls.filter((call) => call && call.event).map((call) => call.path));
  expect(paths).toEqual(["service-open:zh:documents:direct"]);
  expect(JSON.stringify(paths)).not.toContain("newsletter");
});

test("a campaign with a six-digit run is dropped", async ({ page }) => {
  await page.goto(
    "/en/?country=all&utm_source=tiktok&utm_medium=social&utm_campaign=repositioning-20261201-post-r143-b1",
  );
  await expect(page).toHaveURL(/\/en\/\?country=all&utm_source=tiktok&utm_medium=social$/);
  expect(page.url()).not.toContain("20261201");
  expect(await page.evaluate(() => sessionStorage.getItem("cp-utm-campaign"))).toBeNull();
});
