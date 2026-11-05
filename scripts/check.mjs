import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const catalog = JSON.parse(readFileSync(join(root, "data/catalog.json"), "utf8"));
const locales = Object.fromEntries(
  catalog.langs.map((lang) => [lang.id, JSON.parse(readFileSync(join(root, "data/locales", `${lang.id}.json`), "utf8"))]),
);
const errors = [];

function walk(value, path, out) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, `${path}[${index}]`, out));
    return;
  }
  if (value && typeof value === "object") {
    Object.keys(value).sort().forEach((key) => walk(value[key], `${path}.${key}`, out));
    return;
  }
  out.push(path);
}

const baseKeys = [];
walk(locales.zh, "zh", baseKeys);
for (const lang of catalog.langs) {
  const keys = [];
  walk(locales[lang.id], lang.id, keys);
  if (keys.join("\n") !== baseKeys.join("\n").replaceAll("zh", lang.id)) {
    const expected = new Set(baseKeys.map((key) => key.replace(/^zh/, lang.id)));
    const actual = new Set(keys);
    const missing = [...expected].filter((key) => !actual.has(key));
    const extra = [...actual].filter((key) => !expected.has(key));
    if (missing.length || extra.length) {
      errors.push(`${lang.id} keys missing ${missing.slice(0, 8).join(", ")} extra ${extra.slice(0, 8).join(", ")}`);
    }
  }
  for (const service of catalog.services) {
    if (!locales[lang.id].services[service.id]) errors.push(`${lang.id} missing service ${service.id}`);
  }
}

const forbidden = [
  /NT\$\s*\d/,
  /TWD\s*\d/,
  /最低價\s*\d/,
  /100%/,
  /五星好評/,
  /\b09\d{8}\b/,
  /https?:\/\/wa\.me/i,
  /m\.me\//i,
];

for (const lang of catalog.langs) {
  const html = readFileSync(join(root, lang.id, "index.html"), "utf8");
  if (!html.includes(`hreflang="zh-Hant"`) || !html.includes('hreflang="fil"')) {
    errors.push(`${lang.id} missing hreflang`);
  }
  if (!html.includes(`<link rel="canonical" href="${catalog.siteUrl}/${lang.id}/">`)) {
    errors.push(`${lang.id} canonical`);
  }
  if (!html.includes("@681ydjcz") || !html.includes("https://lin.ee/SQbAREU")) {
    errors.push(`${lang.id} missing LINE`);
  }
  if (!html.includes('data-service="moto-rental"') || !html.includes('data-status="planned"')) {
    errors.push(`${lang.id} rental not planned`);
  }
  if (!html.includes('data-service="ship-vn"') || !html.includes('data-status="open"')) {
    errors.push(`${lang.id} Vietnam shipping missing`);
  }
  const rental = html.split('id="service-moto-rental"')[1]?.slice(0, 400) || "";
  if (!rental.includes("planned")) errors.push(`${lang.id} rental card is not planned`);
  for (const pattern of forbidden) {
    if (pattern.test(html)) errors.push(`${lang.id} forbidden ${pattern}`);
  }
  if (html.includes("待確認的假") || html.includes("lorem")) errors.push(`${lang.id} placeholder copy`);
}

const analytics = JSON.parse(readFileSync(join(root, "data/analytics.json"), "utf8"));
if (analytics.enabled !== false || analytics.endpoint) errors.push("analytics must stay disabled until configured");

const robots = readFileSync(join(root, "robots.txt"), "utf8");
const sitemap = readFileSync(join(root, "sitemap.xml"), "utf8");
if (!robots.includes("Sitemap:")) errors.push("robots");
for (const lang of catalog.langs) {
  if (!sitemap.includes(`${catalog.siteUrl}/${lang.id}/`)) errors.push(`sitemap ${lang.id}`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Checked ${catalog.langs.length} locales, ${catalog.services.length} services, and generated pages.`);
console.log(`Locale files: ${readdirSync(join(root, "data/locales")).join(", ")}`);
