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
  await page.goto("/zh/?country=TW&passport=A123456789&phone=0912345678&utm_source=facebook&utm_medium=social&utm_campaign=repositioning-2026-12");
  await expect(page.locator("html")).toHaveAttribute("data-analytics", "off");
  await expect(page.locator('script[src*="gc.zgo.at"], script[data-goatcounter]')).toHaveCount(0);
  await expect(page).toHaveURL(
    /\/zh\/\?country=TW&utm_source=facebook&utm_medium=social&utm_campaign=repositioning-2026-12$/,
  );
  expect(page.url()).not.toContain("passport");
  expect(page.url()).not.toContain("A123456789");
  expect(page.url()).not.toContain("0912345678");
  expect(urls).toEqual([]);

  await page.locator('[data-service="documents"] [data-toggle-more]').click();
  await page.locator('[data-open-inquiry="documents"]').click();
  await expect(page.locator("#inquiry")).toBeVisible();
  expect(urls).toEqual([]);
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
    "/zh/?country=TW&utm_source=line&utm_medium=post&utm_campaign=repositioning-2026-12&note=LEAKPROBE",
  );
  await expect(page.locator("html")).toHaveAttribute("data-analytics", "on");
  await expect(page.locator("html")).toHaveAttribute("data-country", "TW");
  const script = page.locator("script[data-goatcounter]");
  await expect(script).toHaveAttribute("src", "https://gc.zgo.at/count.js");
  await expect(script).toHaveAttribute("data-goatcounter", "https://example.goatcounter.com/count");
  await page.waitForFunction(() => window.goatcounter && typeof window.goatcounter.count === "function");
  await expect(page).toHaveURL(/utm_source=line&utm_medium=post&utm_campaign=repositioning-2026-12$/);
  expect(page.url()).not.toContain("LEAKPROBE");
  expect(urls.every((url) => url === "https://gc.zgo.at/count.js")).toBe(true);
  expect(urls.some((url) => url.includes("example.goatcounter.com"))).toBe(false);

  const pageview = await page.evaluate(() => window.__gcCalls.find((call) => call && call.pageview));
  expect(pageview.search).toContain("utm_source=line");
  expect(pageview.search).toContain("utm_campaign=repositioning-2026-12");
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
  expect(paths).toContain("service-open:zh:documents");
  expect(paths).toContain("service-open:zh:driving-license-assistance");
  expect(paths).toContain("inquiry-open:zh:documents");
  expect(paths.filter((path) => path === "line-click:zh").length).toBeGreaterThanOrEqual(2);
  for (const call of calls) {
    expect(Object.keys(call).sort()).toEqual(["event", "no_session", "path", "referrer", "title"]);
    expect(call.referrer).toBe("");
    expect(call.title).toBe(call.path);
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
  expect(paths).toContain("line-click:vi");
});

test("language switch keeps a safe campaign and drops the old country", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/zh/?country=TW&utm_source=instagram&utm_medium=profile&utm_campaign=repositioning-2026-12");
  await expect(page.locator("html")).toHaveAttribute("data-analytics", "off");
  await page.locator(".lang-toggle").click();
  await page.locator('#lang-menu a[hreflang="vi"]').click();
  await expect(page).toHaveURL(
    /\/vi\/\?country=VN&utm_source=instagram&utm_medium=profile&utm_campaign=repositioning-2026-12$/,
  );
  await expect(page.locator("html")).toHaveAttribute("data-country", "VN");
  await expect(page.locator("html")).toHaveAttribute("lang", "vi");
});
