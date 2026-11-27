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
  if (
    html.includes('role="radiogroup"') ||
    html.includes('class="flag-grid"') ||
    html.includes('class="flag-btn"') ||
    html.includes('id="countries"') ||
    html.includes('class="country-jump"') ||
    html.includes('id="country-help"')
  ) {
    errors.push(`${lang.id} still has the secondary country filter`);
  }
  if (!html.includes('class="lang-toggle"') || !html.includes('id="lang-menu"')) {
    errors.push(`${lang.id} missing unified language control`);
  }
  if (!html.includes(`data-lang="${lang.id}" data-country="${lang.country}"`)) {
    errors.push(`${lang.id} country is not tied to the language`);
  }
  for (const code of catalog.countryChoices) {
    if (!html.includes(`data-country="${code}"`)) errors.push(`${lang.id} missing country ${code}`);
  }
  for (const item of catalog.langs) {
    if (!html.includes(`href="/${item.id}/?country=${item.country}"`)) {
      errors.push(`${lang.id} missing ${item.id} country link`);
    }
  }
  const langMenu = html.split('class="lang-menu"')[1]?.split("</div>")[0] || "";
  const menuFlags = langMenu.split("flag-svg").length - 1;
  if (menuFlags !== catalog.langs.length) errors.push(`${lang.id} language menu flags ${menuFlags}`);
  if (!langMenu.includes("English") || !langMenu.includes("繁體中文") || !langMenu.includes("Filipino")) {
    errors.push(`${lang.id} language menu lost a native name`);
  }
  for (const service of catalog.services) {
    if (!html.includes(`data-service="${service.id}"`)) errors.push(`${lang.id} dropped service ${service.id}`);
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
  if (html.includes("英文不以單一國旗代表") || /not represented by one flag/i.test(html)) {
    errors.push(`${lang.id} still says English is not one flag`);
  }
  if (!html.includes('name="cp-translation-review" content="not-yet-native-reviewed"')) {
    errors.push(`${lang.id} missing translation review metadata`);
  }
  if (!html.includes('id="inquiry-confirm"')) errors.push(`${lang.id} missing confirmation`);
  if (!html.includes('id="community"')) errors.push(`${lang.id} missing community`);
  if (!html.includes('href="https://line.me/ti/g2/c8um63-f3JUv4x643EFZShKNiDHQY1UplD-djg"')) errors.push(`${lang.id} line community`);
  if (!html.includes('href="https://www.facebook.com/share/g/1FeefYhL9j/"')) errors.push(`${lang.id} facebook group`);
  const community = html.split('id="community"')[1]?.split("</div>")[0] || "";
  if (!community.includes('target="_blank"') || !community.includes('rel="noopener noreferrer"')) {
    errors.push(`${lang.id} community link attributes`);
  }
  if (/utm_/i.test(community)) errors.push(`${lang.id} community utm`);
  if (/停權|舊網站|合併進 main|suspended account|old website/i.test(html)) errors.push(`${lang.id} internal note`);
  if (lang.id !== "zh") {
    const visible = html.replace(/<script[\s\S]*?<\/script>/g, "");
    if (visible.includes("越境代辦")) errors.push(`${lang.id} shows the Chinese brand name`);
  }
  if (!html.includes("data-quick-group=")) errors.push(`${lang.id} quick links are not tied to groups`);
  const ld = JSON.parse(html.split('type="application/ld+json">')[1].split("</script>")[0]);
  const serviceNodes = ld["@graph"].filter((node) => node["@type"] === "Service");
  const openServices = catalog.services.filter((service) => service.status === "open");
  if (serviceNodes.length !== openServices.length) errors.push(`${lang.id} service schema count ${serviceNodes.length}`);
  const openNames = new Set(openServices.map((service) => locales[lang.id].services[service.id].title));
  for (const node of serviceNodes) {
    if (!openNames.has(node.name)) errors.push(`${lang.id} schema service ${node.name}`);
  }
  for (const service of catalog.services.filter((item) => item.status === "planned")) {
    const title = locales[lang.id].services[service.id].title;
    if (serviceNodes.some((node) => node.name === title)) errors.push(`${lang.id} planned service in schema ${title}`);
  }
}

const css = readFileSync(join(root, "assets/css/site.css"), "utf8");
if (!css.includes('html[data-show-planned="false"] .card.is-planned')) errors.push("css does not hide planned services");
if (!css.includes("#06c755") && !css.includes("#06C755")) errors.push("LINE green missing");

const analytics = JSON.parse(readFileSync(join(root, "data/analytics.json"), "utf8"));
if (analytics.enabled !== false || analytics.endpoint) errors.push("analytics must stay disabled until configured");

const robots = readFileSync(join(root, "robots.txt"), "utf8");
const sitemap = readFileSync(join(root, "sitemap.xml"), "utf8");
if (!robots.includes(`Sitemap: ${catalog.siteUrl}/sitemap.xml`)) errors.push("robots sitemap");
if (!robots.includes("Disallow: /docs/plans/")) errors.push("robots should keep plans out of crawl");
if (!sitemap.includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"')) errors.push("sitemap xhtml");
const sitemapLocs = sitemap.match(/<loc>[^<]+<\/loc>/g) || [];
const expectedLocs = [catalog.siteUrl + "/", ...catalog.langs.map((lang) => `${catalog.siteUrl}/${lang.id}/`)];
if (sitemapLocs.length !== expectedLocs.length) errors.push(`sitemap url count ${sitemapLocs.length}`);
for (const loc of expectedLocs) {
  if (!sitemap.includes(`<loc>${loc}</loc>`)) errors.push(`sitemap missing ${loc}`);
}
for (const lang of catalog.langs) {
  if (!sitemap.includes(`hreflang="${lang.html}"`)) errors.push(`sitemap hreflang ${lang.html}`);
}
if (!sitemap.includes('hreflang="x-default"')) errors.push("sitemap x-default");
const gate = readFileSync(join(root, "index.html"), "utf8");
if (!gate.includes('name="cp-translation-review" content="not-yet-native-reviewed"')) errors.push("gate metadata");
if (!gate.includes('name="google-site-verification" content="O5v_Vbt6Z-JsQgCpghEn8o48Yh4prPGLoE3jebFfKPs"')) {
  errors.push("root homepage missing search console verification");
}
const notFoundPage = readFileSync(join(root, "404.html"), "utf8");
if (notFoundPage.includes("google-site-verification")) errors.push("404 should not carry the homepage verification tag");
if (!gate.includes(`<link rel="canonical" href="${catalog.siteUrl}/">`)) errors.push("gate canonical");
for (const lang of catalog.langs) {
  if (!lang.country || !lang.flag) errors.push(`lang ${lang.id} missing country or flag`);
  if (!gate.includes(`href="/${lang.id}/?country=${lang.country}"`)) errors.push(`gate missing ${lang.id} country link`);
}
const rollback = readFileSync(join(root, "docs/ROLLBACK.md"), "utf8");
if (!rollback.includes("v1-before-v2.0") || !rollback.includes("1d640b9cf55a0381c74841ab4f476e55202b7c4f")) {
  errors.push("rollback doc");
}
const cityIds = ["TPE","NTP","TAO","TXG","TNN","KHH","KEL","HSZ","CYI","HSQ","MIA","CHA","NAN","YUN","CYQ","PIF","ILA","HUA","TTT","PEN","KIN","LIE","OTHER"];
for (const lang of catalog.langs) {
  const ids = locales[lang.id].cities.map((city) => city.id).join(",");
  if (ids !== cityIds.join(",")) errors.push(`${lang.id} cities ${ids}`);
}
const flagSpec = {
  tw: { box: "0 0 60 40", colors: ["#FE0000", "#000095"] },
  vn: { box: "0 0 30 20", colors: ["#DA251D", "#FFCD00"] },
  id: { box: "0 0 30 20", colors: ["#CE1126", "#FFFFFF"] },
  th: { box: "0 0 9 6", colors: ["#A51931", "#2D2A4A", "#FFFFFF"] },
  ph: { box: "0 0 200 100", colors: ["#0038A8", "#CE1126", "#FCD116"] },
  all: { box: "0 0 60 40", colors: ["#0F2742"] },
  us: { box: "0 0 190 100", colors: ["#BF0A30", "#FFFFFF", "#002868"] },
};
for (const [code, spec] of Object.entries(flagSpec)) {
  const svg = readFileSync(join(root, "assets/flags", `${code}.svg`), "utf8");
  if (!svg.includes(`viewBox="${spec.box}"`)) errors.push(`flag ${code} ratio`);
  if (!svg.includes('preserveAspectRatio="xMidYMid meet"')) errors.push(`flag ${code} aspect`);
  for (const color of spec.colors) {
    if (!svg.toUpperCase().includes(color.toUpperCase())) errors.push(`flag ${code} color ${color}`);
  }
}

const siteJs = readFileSync(join(root, "assets/js/site.js"), "utf8");
const sensitiveStart = siteJs.indexOf("function looksSensitive");
const sensitiveEnd = siteJs.indexOf("function enteredText");
if (sensitiveStart < 0 || sensitiveEnd < sensitiveStart) errors.push("sensitive detector missing");
else {
  const looksSensitive = new Function(
    "config",
    `${siteJs.slice(sensitiveStart, sensitiveEnd)}\nreturn looksSensitive;`,
  )({ lineId: "@681ydjcz" });
  const allowedSamples = [
    "2026-11-26",
    "2026/11/26",
    "26.11.2026",
    "2026年11月26日",
    "2026年11月",
    "11月26日",
    "20261126",
    "NT$1,200",
    "NT$120000",
    "TWD 12,500.50",
    "$1,234",
    "1,500,000元",
    "300元",
    "0912345678",
    "0912-345-678",
    "02-12345678",
    "+886912345678",
    "訂單 20261126001",
    "Order AB-88421",
    "No. 884213",
    "#20261126",
    "@681ydjcz",
  ];
  const blockedSamples = [
    "A123456789",
    "A812345678",
    "AC12345678",
    "E12345678",
    "護照 123456789",
  ];
  for (const sample of allowedSamples) {
    if (looksSensitive(sample)) errors.push(`false positive ${sample}`);
  }
  for (const sample of blockedSamples) {
    if (!looksSensitive(sample)) errors.push(`missed id ${sample}`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Checked ${catalog.langs.length} locales, ${catalog.services.length} services, and generated pages.`);
console.log(`Locale files: ${readdirSync(join(root, "data/locales")).join(", ")}`);
