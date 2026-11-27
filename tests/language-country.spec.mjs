import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const catalog = JSON.parse(readFileSync(join(root, "data/catalog.json"), "utf8"));

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

function expectedIds(country) {
  return catalog.services
    .filter((service) => catalog.showPlannedServices === true || service.status !== "planned")
    .filter((service) => {
      if (service.countries.includes("*")) return true;
      if (country === "all") return false;
      return service.countries.includes(country);
    })
    .map((service) => service.id)
    .sort();
}

const commonIds = catalog.services
  .filter((service) => service.countries.includes("*"))
  .filter((service) => catalog.showPlannedServices === true || service.status !== "planned")
  .map((service) => service.id);

async function visibleIds(page) {
  const ids = await page.locator(".card").evaluateAll((cards) =>
    cards
      .filter((card) => !card.hidden && getComputedStyle(card).display !== "none")
      .map((card) => card.dataset.service),
  );
  return [...new Set(ids)].sort();
}

async function openLanguage(page, mobile) {
  if (mobile) await page.locator(".fold-button").click();
  const toggle = page.locator(".lang-toggle");
  await expect(toggle).toBeVisible();
  return toggle;
}

for (const locale of catalog.langs) {
  for (const viewport of viewports) {
    test(`${locale.id} ${viewport.name} filters from the language`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(`/${locale.id}/`);
      await expect(page).toHaveURL(new RegExp(`/${locale.id}/\\?country=${locale.country}$`));
      await expect(page.locator("html")).toHaveAttribute("data-lang", locale.id);
      await expect(page.locator("html")).toHaveAttribute("data-country", locale.country);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        `${catalog.siteUrl}/${locale.id}/`,
      );
      await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
        "href",
        `${catalog.siteUrl}/`,
      );
      await expect(page.locator("#countries, .flag-grid, .flag-btn, .country-jump, #country-help")).toHaveCount(0);

      const sectionIds = await page.locator("main > section").evaluateAll((nodes) => nodes.map((node) => node.id));
      expect(sectionIds[0]).toBe("top");
      expect(sectionIds[1]).toBe("quick");

      const toggle = await openLanguage(page, viewport.name === "mobile");
      await expect(toggle).toContainText(locale.native);
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      const flag = toggle.locator("svg.flag-svg");
      await expect(flag).toBeVisible();
      const flagBox = await flag.boundingBox();
      expect(flagBox?.width).toBeGreaterThan(8);
      expect(flagBox?.height).toBeGreaterThan(5);

      await toggle.click();
      const menu = page.locator("#lang-menu");
      await expect(menu).toBeVisible();
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      const menuBox = await menu.boundingBox();
      expect(menuBox.x).toBeGreaterThanOrEqual(-1);
      expect(menuBox.x + menuBox.width).toBeLessThanOrEqual(viewport.width + 1);

      for (const lang of catalog.langs) {
        const link = menu.locator(`a[href="/${lang.id}/?country=${lang.country}"]`);
        await expect(link).toBeVisible();
        await expect(link).toContainText(lang.native);
        await expect(link).toHaveAttribute("data-country", lang.country);
        const linkFlag = link.locator("svg.flag-svg");
        await expect(linkFlag).toHaveCount(1);
        const linkBox = await linkFlag.boundingBox();
        expect(linkBox?.width).toBeGreaterThan(8);
        expect(linkBox?.height).toBeGreaterThan(5);
      }

      const ids = await visibleIds(page);
      expect(ids).toEqual(expectedIds(locale.country));
      for (const id of commonIds) expect(ids).toContain(id);

      const toggleBox = await toggle.boundingBox();
      expect(toggleBox.x).toBeGreaterThanOrEqual(-1);
      expect(toggleBox.x + toggleBox.width).toBeLessThanOrEqual(viewport.width + 1);

      await page.reload();
      await expect(page).toHaveURL(new RegExp(`/${locale.id}/\\?country=${locale.country}$`));
      await expect(page.locator("html")).toHaveAttribute("data-country", locale.country);
      expect(await visibleIds(page)).toEqual(expectedIds(locale.country));
    });
  }
}

test("mismatched country is normalized to the language", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/vi/?country=TH");
  await expect(page).toHaveURL(/\/vi\/\?country=VN$/);
  await expect(page.locator("html")).toHaveAttribute("data-country", "VN");
  await expect(page.locator("html")).toHaveAttribute("lang", "vi");
  expect(await visibleIds(page)).toEqual(expectedIds("VN"));
  expect(await visibleIds(page)).toEqual(expect.arrayContaining(["ship-vn", "vn-papers", "translate-vi", "documents"]));
  expect(await visibleIds(page)).not.toContain("ship-other");
});

test("stored country cannot override the language", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("cp-country", "TH"));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/zh/");
  await expect(page).toHaveURL(/\/zh\/\?country=TW$/);
  await expect(page.locator("html")).toHaveAttribute("data-country", "TW");
  expect(await visibleIds(page)).toEqual(expectedIds("TW"));
  expect(await visibleIds(page)).not.toContain("ship-vn");
  expect(await visibleIds(page)).not.toContain("ship-other");
});

test("choosing a language switches the route and the filter", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/zh/?country=TW");
  await page.locator(".lang-toggle").click();
  await page.locator('#lang-menu a[hreflang="vi"]').click();
  await expect(page).toHaveURL(/\/vi\/\?country=VN$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "vi");
  await expect(page.locator(".lang-toggle")).toContainText("Tiếng Việt");
  expect(await visibleIds(page)).toEqual(expectedIds("VN"));

  await page.locator(".lang-toggle").click();
  await page.locator('#lang-menu a[hreflang="en"]').click();
  await expect(page).toHaveURL(/\/en\/\?country=all$/);
  await expect(page.locator("html")).toHaveAttribute("data-country", "all");
  expect(await visibleIds(page)).toEqual(expectedIds("all"));
  expect(await visibleIds(page)).not.toContain("vn-papers");
  expect(await visibleIds(page)).toContain("documents");
});

test("language menu supports keyboard", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/?country=PH");
  await expect(page).toHaveURL(/\/en\/\?country=all$/);
  const toggle = page.locator(".lang-toggle");
  await toggle.focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.locator("#lang-menu")).toBeVisible();
  await expect(page.locator('#lang-menu a[hreflang="zh-Hant"]')).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.locator('#lang-menu a[hreflang="en"]')).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("#lang-menu")).toBeHidden();
  await expect(toggle).toBeFocused();
});
