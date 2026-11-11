import { existsSync, readdirSync, readFileSync } from "node:fs";
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
  const expected = new Set(baseKeys.map((key) => key.replace(/^zh(?=\.)/, lang.id)));
  const actual = new Set(keys);
  const missing = [...expected].filter((key) => !actual.has(key));
  const extra = [...actual].filter((key) => !expected.has(key));
  if (missing.length || extra.length) {
    errors.push(`${lang.id} keys missing ${missing.slice(0, 6).join(", ")} extra ${extra.slice(0, 6).join(", ")}`);
  }
  if (!locales[lang.id].price.fallback) errors.push(`${lang.id} missing price fallback`);
}

if (catalog.langs.map((lang) => lang.id).join() !== "zh,en,vi,id,th,fil,hi") {
  errors.push("language list must be zh en vi id th fil hi");
}
if (catalog.countries.map((country) => country.id).join() !== "VN,TH,ID,PH,IN") {
  errors.push("countries must be VN TH ID PH IN");
}
if (catalog.vehicles.enabled !== false || catalog.vehicles.items.length) errors.push("vehicles must stay disabled and empty");
if (catalog.shippingEstimator.enabled !== false) errors.push("shipping estimator must stay disabled");
const rental = catalog.services.find((service) => service.id === "moto");
if (!rental || rental.status !== "open") errors.push("motorbike service must be open, not planned");
if (catalog.services.some((service) => service.id === "goods-rental" || service.status === "planned")) {
  errors.push("planned or furniture services must not be in the catalog");
}
if (catalog.areaSets["shipping-pickup"].regions.join() !== "keelung,taipei,new-taipei,taoyuan,yilan,hsinchu-city,hsinchu-county") {
  errors.push("shipping regions");
}
if (catalog.areaSets["sim-escort"].regions.join() !== "hsinchu-city,hsinchu-county,taoyuan,new-taipei,taipei,keelung,yilan") {
  errors.push("sim regions");
}
if (catalog.areaSets.aircon.regions.join() !== "taoyuan,new-taipei,taipei,keelung,yilan") errors.push("aircon regions");
if (catalog.socials.some((item) => item.url.includes("threads.net") || item.url.includes("wa.me"))) errors.push("social url");
if (!catalog.socials.some((item) => item.url === "https://www.threads.com/@crossing_proxy")) errors.push("threads.com missing");

const analytics = JSON.parse(readFileSync(join(root, "data/analytics.json"), "utf8"));
if (analytics.enabled !== false || analytics.endpoint) errors.push("analytics must stay disabled until configured");

function htmlFiles(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "cp-redesign") continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) htmlFiles(path, out);
    else if (entry.name.endsWith(".html")) out.push(path);
  }
  return out;
}

const files = htmlFiles(root);
const htmlByPath = new Map(files.map((file) => [file, readFileSync(file, "utf8")]));
const forbiddenVisible = [
  /<form[\s>]/i,
  /<input[\s>]/i,
  /<textarea[\s>]/i,
  /<select[\s>]/i,
  /<dialog[\s>]/i,
  /data-open-inquiry/,
  /inquiry-copy/,
  /data-status="planned"/,
  /家具/,
  /furniture/i,
  /furnitur/i,
  /เฟอร์นิเจอร์/,
  /muwebles/i,
  /फ़र्नीचर/,
  /認證合作夥伴/,
  /certified partner/i,
  /待確認/,
  /待經營者/,
  /縣市待確認/,
  /lorem/i,
  /whatsapp/i,
  /wa\.me/i,
  /threads\.net/i,
  /NT\$\s*\d/,
  /TWD\s*\d/,
  /最低價\s*\d/,
  /五星好評/,
  /100%/,
];

function visible(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
}

function stripPhones(html) {
  return ["0923-870-421", "0923870421", "+886923870421", "+886-923-870-421", "+886 907246207", "+886907246207", "907246207"].reduce(
    (text, phone) => text.split(phone).join(""),
    html,
  );
}

const idsIn = (html) => [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);

for (const [file, html] of htmlByPath) {
  const rel = file.slice(root.length + 1);
  const text = visible(html);
  for (const pattern of forbiddenVisible) {
    if (pattern.test(text)) errors.push(`${rel} forbidden ${pattern}`);
  }
  if (/\b09\d{8}\b/.test(stripPhones(text)) || /09\d{2}-\d{3}-\d{3}/.test(stripPhones(text))) {
    errors.push(`${rel} unexpected phone number`);
  }
  if (html.includes('id="estimate"')) errors.push(`${rel} estimator was rendered`);
  const ids = idsIn(html);
  const dupes = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (dupes.length) errors.push(`${rel} duplicate id ${[...new Set(dupes)].join(",")}`);
  const headings = [...text.matchAll(/<h([1-6])\b/g)].map((match) => Number(match[1]));
  if (headings[0] !== 1) errors.push(`${rel} first heading is h${headings[0] || "none"}`);
  if (headings.filter((level) => level === 1).length !== 1) errors.push(`${rel} h1 count ${headings.filter((level) => level === 1).length}`);
  headings.forEach((level, index) => {
    if (index && level > headings[index - 1] + 1) errors.push(`${rel} heading skip h${headings[index - 1]} to h${level}`);
  });
  if (!html.includes('class="skip"') || !html.includes('id="main"')) errors.push(`${rel} skip link`);
  const hrefs = [...html.matchAll(/\shref="([^"]+)"/g)].map((match) => match[1]);
  for (const href of hrefs) {
    if (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("https://fonts.")) continue;
    if (href.startsWith("#")) {
      const id = href.slice(1);
      if (id && !ids.includes(id)) errors.push(`${rel} missing anchor ${href}`);
      continue;
    }
    if (href.startsWith("https://") || href.startsWith("http://")) continue;
    if (!href.startsWith("/")) {
      errors.push(`${rel} relative link ${href}`);
      continue;
    }
    const [pathname, hash] = href.split("#");
    const clean = pathname.endsWith("/") ? `${pathname}index.html` : pathname;
    const target = join(root, decodeURIComponent(clean).replace(/^\//, ""));
    if (!existsSync(target)) errors.push(`${rel} broken internal ${href}`);
    else if (hash) {
      const targetHtml = htmlByPath.get(target) || readFileSync(target, "utf8");
      if (!idsIn(targetHtml).includes(hash)) errors.push(`${rel} broken hash ${href}`);
    }
  }
}

for (const lang of catalog.langs) {
  const home = htmlByPath.get(join(root, lang.id, "index.html"));
  if (!home) {
    errors.push(`missing ${lang.id} home`);
    continue;
  }
  for (const item of catalog.langs) {
    if (!home.includes(`hreflang="${item.html}"`)) errors.push(`${lang.id} missing hreflang ${item.html}`);
  }
  if (!home.includes(`<link rel="canonical" href="${catalog.siteUrl}/${lang.id}/">`)) errors.push(`${lang.id} canonical`);
  if (!home.includes("@681ydjcz") || !home.includes("https://lin.ee/SQbAREU")) errors.push(`${lang.id} missing LINE`);
  if (!home.includes("0923-870-421") || !home.includes(catalog.email)) errors.push(`${lang.id} missing phone or email`);
  if (!home.includes(catalog.company.name) || !home.includes(catalog.company.taxId)) errors.push(`${lang.id} missing company`);
  if (!home.includes('aria-live="polite"')) errors.push(`${lang.id} missing aria-live`);
  if (!home.includes("Noto Sans Thai") || !home.includes("Noto Sans Devanagari")) errors.push(`${lang.id} missing Thai or Devanagari font`);
  const shipping = htmlByPath.get(join(root, lang.id, "shipping", "index.html"));
  if (!shipping || !shipping.includes(locales[lang.id].price.fallback)) errors.push(`${lang.id} missing price fallback text`);
  if (lang.id === "vi" && !home.includes("https://zalo.me/886907246207")) errors.push("vi missing ZALO");
  if (lang.id !== "vi" && home.includes("zalo.me")) errors.push(`${lang.id} should not show ZALO`);
  if (lang.id === "zh") {
    const longTip = "在台灣遇到不熟悉的事情，別擔心，都可以先和我們聊聊。";
    const shortTip = "在台灣遇到不熟悉的事，都可以先問我們。";
    if (!home.includes(longTip) || !home.includes(shortTip)) errors.push("zh tips");
    if (!home.includes("免費初步諮詢，確認需求後提供正式報價。")) errors.push("zh price sentence");
    if (!home.includes("新竹市") || !home.includes("新竹縣")) errors.push("zh hsinchu city and county");
    if (!home.includes("在台灣遇到生活上的大小事，我們陪您一起處理。")) errors.push("zh hero title");
    for (const id of ["services", "steps", "about", "faq", "contact", "legal", "countries", "trust", "service-ship-vn", "service-moto-rental", "service-sim", "service-b2b-life", "business"]) {
      if (!home.includes(`id="${id}"`)) errors.push(`zh missing legacy anchor ${id}`);
    }
  }
}

const gate = htmlByPath.get(join(root, "index.html"));
if (!gate.includes("cp-lang") || !catalog.langs.every((lang) => gate.includes(lang.native))) errors.push("language gate");
if (gate.includes("<form") || gate.includes("待確認")) errors.push("gate content");

const robots = readFileSync(join(root, "robots.txt"), "utf8");
const sitemap = readFileSync(join(root, "sitemap.xml"), "utf8");
if (!robots.includes("Sitemap:")) errors.push("robots");
for (const lang of catalog.langs) {
  for (const page of catalog.pages) {
    const url = `${catalog.siteUrl}/${lang.id}/${page.path}`;
    if (!sitemap.includes(url)) errors.push(`sitemap missing ${url}`);
  }
}
if (sitemap.includes("/goods") || sitemap.includes("listings")) errors.push("sitemap has reserved listings");

const css = readFileSync(join(root, "assets/css/site.css"), "utf8");
if (!css.includes(":focus-visible") || !css.includes("prefers-reduced-motion") || !css.includes("min-height: 44px")) {
  errors.push("css accessibility basics");
}
if (!css.includes("#FFFAEF") && !css.includes("#fffaef")) errors.push("background");
const js = readFileSync(join(root, "assets/js/site.js"), "utf8");
if (/<form|inquiry-copy|openInquiry/.test(js)) errors.push("js still has inquiry form");

const external = new Set();
for (const html of htmlByPath.values()) {
  for (const match of html.matchAll(/\shref="(https?:\/\/[^"]+)"/g)) {
    if (!match[1].startsWith("https://fonts.")) external.add(match[1]);
  }
}
const allowedExternal = new Set([
  catalog.line.url,
  catalog.zalo.url,
  ...catalog.socials.map((item) => item.url),
]);
for (const url of external) {
  if (url.startsWith(catalog.siteUrl)) continue;
  if (!allowedExternal.has(url)) errors.push(`unexpected external ${url}`);
}

const remote = process.env.CHECK_SKIP_REMOTE === "1" ? [] : [...allowedExternal];
for (const url of remote) {
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(20000),
      headers: { "user-agent": "CrossingProxyLinkCheck/1.0" },
    });
    if (response.status === 404 || response.status === 410) errors.push(`external ${response.status} ${url}`);
    else if (response.status >= 400 && response.status !== 403 && response.status !== 429 && response.status !== 401) {
      errors.push(`external ${response.status} ${url}`);
    } else {
      console.log(`external ${response.status} ${url}`);
    }
  } catch (error) {
    errors.push(`external failed ${url} ${error.message}`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Checked ${catalog.langs.length} locales, ${files.length} HTML files, ${catalog.services.length} services.`);
