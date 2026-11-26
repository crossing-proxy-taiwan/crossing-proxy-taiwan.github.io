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
      errors.push(`${lang.id} keys missing ${missing.slice(0, 12).join(", ")} extra ${extra.slice(0, 12).join(", ")}`);
    }
  }
  for (const service of catalog.services) {
    if (!locales[lang.id].services[service.id]) errors.push(`${lang.id} missing service ${service.id}`);
  }
  const drivingIds = (locales[lang.id].inquiry.profiles.driving?.fields || []).map((field) => field.id).join(",");
  if (drivingIds !== "nationality,city,licenseNeed,hasLicense,when,need") {
    errors.push(`${lang.id} driving fields ${drivingIds}`);
  }
}

const seen = new Map();
for (const group of catalog.groups || []) {
  for (const id of group.services) {
    if (!catalog.services.some((service) => service.id === id)) errors.push(`group ${group.id} missing ${id}`);
    seen.set(id, (seen.get(id) || 0) + 1);
  }
}
for (const service of catalog.services) {
  if (!seen.has(service.id)) errors.push(`service ${service.id} is not in a group`);
}
if (seen.get("driving-license-assistance") !== 2) errors.push("driving license must be one record linked from two groups");

const requiredStatus = {
  "driving-license-assistance": "open",
  documents: "open",
  "translate-vi": "open",
  "moto-sale": "open",
  sim: "open",
  "life-help": "open",
  pickup: "open",
  "ship-vn": "open",
  "vn-papers": "open",
  "ship-other": "planned",
  "translate-more": "planned",
  "moto-rental": "planned",
  "goods-rental": "planned",
  "b2b-life": "planned",
};
for (const [id, status] of Object.entries(requiredStatus)) {
  const service = catalog.services.find((item) => item.id === id);
  if (!service || service.status !== status) errors.push(`${id} status should be ${status}`);
}

const forbidden = [
  /NT\$\s*\d/,
  /TWD\s*\d/,
  /最低價\s*\d/,
  /100%/,
  /五星好評/,
  /\b09\d{2}-?\d{3}-?\d{3}\b/,
  /\b09\d{8}\b/,
  /https?:\/\/wa\.me/i,
  /m\.me\//i,
  /免費諮詢/,
  /free consultation/i,
  /42700785/,
  /懿翔實業/,
  /0923-870-421/,
  /fonts\.googleapis\.com/,
  /🇻🇳|🇹🇼|🇮🇩|🇹🇭|🇵🇭|🇺🇸|🇬🇧/,
];

for (const lang of catalog.langs) {
  const html = readFileSync(join(root, lang.id, "index.html"), "utf8");
  const ui = locales[lang.id];
  if (!html.includes(`hreflang="zh-Hant"`) || !html.includes('hreflang="fil"')) errors.push(`${lang.id} missing hreflang`);
  if (!html.includes(`<link rel="canonical" href="${catalog.siteUrl}/${lang.id}/">`)) errors.push(`${lang.id} canonical`);
  if (!html.includes("@681ydjcz") || !html.includes("https://lin.ee/SQbAREU")) errors.push(`${lang.id} missing LINE`);
  if (!html.includes('id="service-driving-license-assistance"') || !html.includes('data-service="driving-license-assistance"')) {
    errors.push(`${lang.id} missing driving license`);
  }
  if (!html.includes(ui.services["driving-license-assistance"].title)) errors.push(`${lang.id} missing driving title`);
  if (!html.includes('data-entry="true"')) errors.push(`${lang.id} missing shared driving entry`);
  if (!html.includes('role="radiogroup"')) errors.push(`${lang.id} missing flag radiogroup`);
  for (const code of catalog.countryChoices) {
    if (!html.includes(`data-country="${code}"`)) errors.push(`${lang.id} missing country ${code}`);
  }
  const langMenu = html.split('class="lang-menu"')[1]?.split("</div>")[0] || "";
  if (langMenu.includes("flag-svg")) errors.push(`${lang.id} language menu contains a flag`);
  if (!langMenu.includes("English") || !langMenu.includes("繁體中文") || !langMenu.includes("Filipino")) {
    errors.push(`${lang.id} language menu lost a native name`);
  }
  if (!html.includes('"@type":"FAQPage"') || !html.includes('"@type":"Organization"') || !html.includes('"@type":"Service"')) {
    errors.push(`${lang.id} structured data`);
  }
  if (!html.includes(ui.inquiry.notSent)) errors.push(`${lang.id} missing not-sent notice`);
  if (html.includes('name=\\"passport\\"') || html.includes('type=\\"file\\"')) errors.push(`${lang.id} sensitive field`);
  const rental = html.split('id="service-moto-rental"')[1]?.slice(0, 500) || "";
  if (!rental.includes('data-status="planned"')) errors.push(`${lang.id} rental is not planned`);
  if (!html.includes('data-service="ship-vn"') || !html.includes('data-status="open"')) errors.push(`${lang.id} Vietnam shipping missing`);
  const showPlanned = catalog.showPlannedServices === true;
  if (showPlanned) {
    if (!html.includes('data-show-planned="true"')) errors.push(`${lang.id} planned flag off`);
    if (!html.includes('id="planned"')) errors.push(`${lang.id} planned section missing`);
  } else if (!html.includes('data-show-planned="false"') || !html.includes('id="planned" hidden')) {
    errors.push(`${lang.id} planned section should stay hidden`);
  }
  for (const pattern of forbidden) {
    if (pattern.test(html)) errors.push(`${lang.id} forbidden ${pattern}`);
  }
  if (html.includes("待確認的假") || html.includes("lorem")) errors.push(`${lang.id} placeholder copy`);
}

const css = readFileSync(join(root, "assets/css/site.css"), "utf8");
if (!css.includes('html[data-show-planned="false"] .card.is-planned')) errors.push("css does not hide planned services");
if (!css.includes("#06c755") && !css.includes("#06C755")) errors.push("LINE green missing");

const analytics = JSON.parse(readFileSync(join(root, "data/analytics.json"), "utf8"));
if (analytics.enabled !== false || analytics.endpoint) errors.push("analytics must stay disabled until configured");

const robots = readFileSync(join(root, "robots.txt"), "utf8");
const sitemap = readFileSync(join(root, "sitemap.xml"), "utf8");
if (!robots.includes("Sitemap:")) errors.push("robots");
for (const lang of catalog.langs) {
  if (!sitemap.includes(`${catalog.siteUrl}/${lang.id}/`)) errors.push(`sitemap ${lang.id}`);
}
for (const code of ["all", "tw", "vn", "id", "th", "ph"]) {
  const svg = readFileSync(join(root, "assets/flags", `${code}.svg`), "utf8");
  if (!svg.includes("<svg") || svg.includes("emoji")) errors.push(`flag ${code}`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Checked ${catalog.langs.length} locales, ${catalog.services.length} services, and generated pages.`);
console.log(`Locale files: ${readdirSync(join(root, "data/locales")).join(", ")}`);
