import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const catalog = JSON.parse(readFileSync(join(root, "data/catalog.json"), "utf8"));
const locales = Object.fromEntries(
  catalog.langs.map((lang) => [
    lang.id,
    JSON.parse(readFileSync(join(root, "data/locales", `${lang.id}.json`), "utf8")),
  ]),
);

const icons = {
  translate:
    '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 12h18M17 12c0 10-6 16-14 20M14 20c2 4 6 8 12 10" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/><path d="M26 28h14l-7 10h-8" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/><path d="M30 28c1.5 3 3 5 6 7" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>',
  file:
    '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M16 8h12l8 8v24H16V8z" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/><path d="M28 8v8h8M20 24h12M20 30h12M20 36h8" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>',
  scooter:
    '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="14" cy="34" r="5" fill="none" stroke="currentColor" stroke-width="1.75"/><circle cx="34" cy="34" r="5" fill="none" stroke="currentColor" stroke-width="1.75"/><path d="M14 34h8l4-10h8l4 10M22 24l4-8h8" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  sim:
    '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M16 8h12l8 8v24H16V8z" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/><rect x="20" y="22" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.75"/></svg>',
  life:
    '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 40s-12-7.2-12-16a7 7 0 0 1 12-4 7 7 0 0 1 12 4c0 8.8-12 16-12 16z" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/></svg>',
  pickup:
    '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 20l16-10 16 10v18H8V20z" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/><path d="M20 38V26h8v12" fill="none" stroke="currentColor" stroke-width="1.75"/></svg>',
  parcel:
    '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 16l16-8 16 8-16 8-16-8z" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/><path d="M8 16v16l16 8 16-8V16M24 24v16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/></svg>',
  sofa:
    '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 28v-6a6 6 0 0 1 6-6h16a6 6 0 0 1 6 6v6M8 28h32v8H8v-8zM12 36v4M36 36v4" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/></svg>',
  building:
    '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 40V14l14-6 14 6v26" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/><path d="M18 40v-8h12v8M18 20h4M26 20h4M18 26h4M26 26h4" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>',
};

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function countryLabel(ui, code) {
  return ui.countries[code] || code;
}

function applies(ui, service) {
  if (service.countries.includes("*")) return ui.appliesAll;
  return service.countries.map((code) => countryLabel(ui, code)).join("、");
}

function hreflangLinks() {
  const lines = catalog.langs.map((lang) => {
    const href = `${catalog.siteUrl}/${lang.id}/`;
    return `<link rel="alternate" hreflang="${esc(lang.html)}" href="${href}">`;
  });
  lines.push(`<link rel="alternate" hreflang="x-default" href="${catalog.siteUrl}/">`);
  return lines.join("\n");
}

function langMenu(currentId, ui) {
  const links = catalog.langs
    .map((lang) => {
      const current = lang.id === currentId ? ' aria-current="page"' : "";
      return `<a href="/${lang.id}/" hreflang="${esc(lang.html)}" lang="${esc(lang.html)}" data-lang-switch${current}>${esc(lang.native)}</a>`;
    })
    .join("");
  const native = catalog.langs.find((item) => item.id === currentId).native;
  return `<details class="lang">
    <summary aria-label="${esc(ui.langLabel)}: ${esc(native)}"><span>${esc(native)}</span></summary>
    <div class="lang-menu">${links}</div>
  </details>`;
}

const skipText = {
  zh: "跳到主要內容",
  en: "Skip to content",
  vi: "Tới nội dung chính",
  id: "Loncat ke isi utama",
  th: "ข้ามไปเนื้อหาหลัก",
  fil: "Lumaktaw sa pangunahing nilalaman",
};

function nav(ui) {
  const items = [
    ["services", "services"],
    ["steps", "steps"],
    ["about", "about"],
    ["faq", "faq"],
  ];
  return `<nav class="nav" aria-label="${esc(ui.primaryNav.menu)}">
    ${items.map(([key, id]) => `<a href="#${id}">${esc(ui.primaryNav[key])}</a>`).join("")}
  </nav>`;
}

function heroArt() {
  const tile = (x, y, paths) => `<g transform="translate(${x} ${y})">
    <rect width="92" height="92" rx="22" fill="#ffffff" stroke="#133447" stroke-opacity="0.14"/>
    <g transform="translate(22 22)" fill="none" stroke="#167C83" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${paths}</g>
  </g>`;
  return `<svg class="hero-svg" viewBox="0 0 640 520" aria-hidden="true">
    <rect x="24" y="28" width="592" height="464" rx="32" fill="#F5F7F5" stroke="#133447" stroke-opacity="0.1"/>
    <circle cx="492" cy="132" r="72" fill="#167C83" fill-opacity="0.08"/>
    <circle cx="150" cy="392" r="58" fill="#E5AD69" fill-opacity="0.18"/>
    <path d="M118 188 C 210 120, 250 250, 340 210 S 470 150, 530 250" fill="none" stroke="#167C83" stroke-width="1.75"/>
    <circle cx="118" cy="188" r="5" fill="#E5AD69"/>
    <circle cx="340" cy="210" r="5" fill="#133447"/>
    <circle cx="530" cy="250" r="5" fill="#167C83"/>
    ${tile(72, 210, '<path d="M6 4h12l6 6v22H6z"/><path d="M18 4v6h6M10 16h12M10 22h12M10 28h8"/>')}
    ${tile(286, 78, '<rect x="8" y="2" width="20" height="36" rx="4"/><path d="M16 32h4"/>')}
    ${tile(430, 268, '<circle cx="10" cy="30" r="4"/><circle cx="28" cy="30" r="4"/><path d="M10 30h6l4-10h8l4 10M16 20l4-8h8"/>')}
    ${tile(500, 96, '<path d="M8 16l16-8 16 8-16 8z"/><path d="M8 16v14l16 8 16-8V16M24 24v14"/>')}
  </svg>`;
}

function card(ui, service) {
  const copy = ui.services[service.id];
  const steps = copy.steps.map((step) => `<li>${esc(step)}</li>`).join("");
  const askLabel = service.status === "planned" ? ui.card.askPlanned : ui.card.ask;
  const askClass = service.status === "planned" ? "button button-quiet" : "button button-quiet";
  return `<article class="card${service.status === "planned" ? " is-planned" : ""}" id="service-${esc(service.id)}" data-category="${esc(service.category)}" data-countries="${esc(service.countries.join(","))}" data-service="${esc(service.id)}" data-status="${esc(service.status)}" data-inquiry="${esc(service.inquiry)}">
    <div class="card-top">
      <div class="card-icon">${icons[service.icon] || ""}</div>
      <p class="status status-${esc(service.status)}">${esc(ui.status[service.status])}</p>
    </div>
    <h3>${esc(copy.title)}</h3>
    <p class="summary-line">${esc(copy.summary)}</p>
    <details class="more">
      <summary>${esc(ui.card.details)}</summary>
      <dl>
        <dt>${esc(ui.card.applies)}</dt><dd>${esc(applies(ui, service))}</dd>
        <dt>${esc(ui.card.where)}</dt><dd>${esc(ui.areaPending)}</dd>
        <dt>${esc(ui.card.audience)}</dt><dd>${esc(copy.audience)}</dd>
        <dt>${esc(ui.card.scope)}</dt><dd>${esc(copy.scope)}</dd>
        <dt>${esc(ui.card.documents)}</dt><dd>${esc(copy.documents)}</dd>
        <dt>${esc(ui.card.pricing)}</dt><dd>${esc(copy.pricing)}</dd>
        <dt>${esc(ui.card.steps)}</dt><dd><ol>${steps}</ol></dd>
        <dt>${esc(ui.card.limits)}</dt><dd>${esc(copy.limits)}</dd>
      </dl>
      <div class="card-actions">
        <button type="button" class="${askClass}" data-open-inquiry="${esc(service.id)}">${esc(askLabel)}</button>
      </div>
    </details>
  </article>`;
}

function section(id, title, lead, inner) {
  return `<section id="${id}" class="section">
    <div class="section-head">
      <h2>${esc(title)}</h2>
      <p>${esc(lead)}</p>
    </div>
    ${inner}
  </section>`;
}

function cardsFor(ui, category) {
  return catalog.services
    .filter((service) => service.category === category && service.home)
    .map((service) => card(ui, service))
    .join("\n");
}

function page(lang) {
  const ui = locales[lang.id];
  const canonical = `${catalog.siteUrl}/${lang.id}/`;
  const sameAs = [catalog.line.url, ...catalog.socials.map((item) => item.url)];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: catalog.brand.en,
    alternateName: catalog.brand.zh,
    url: canonical,
    description: ui.metaDescription,
    slogan: catalog.tagline,
    areaServed: "TW",
    sameAs,
    knowsLanguage: catalog.langs.map((item) => item.html),
  };
  const config = {
    lang: lang.id,
    langNative: lang.native,
    lineUrl: catalog.line.url,
    lineId: catalog.line.id,
    inquiry: ui.inquiry,
    services: Object.fromEntries(
      catalog.services.map((service) => [
        service.id,
        {
          title: ui.services[service.id].title,
          status: ui.status[service.status],
          inquiry: service.inquiry,
        },
      ]),
    ),
  };
  const countryOptions = ["all", ...catalog.countries]
    .map((code) => `<option value="${esc(code)}">${esc(code === "all" ? ui.countries.all : ui.countries[code])}</option>`)
    .join("");
  const socials = catalog.socials
    .map(
      (item) =>
        `<li><a href="${esc(item.url)}" rel="noopener noreferrer">${esc(ui.socialLabels[item.id])}</a></li>`,
    )
    .join("");
  const trust = ui.trustItems
    .map((item) => `<article class="trust"><h3>${esc(item.title)}</h3><p>${esc(item.body)}</p></article>`)
    .join("");
  const steps = ui.steps
    .map((item, index) => `<li><span>${String(index + 1).padStart(2, "0")}</span><h3>${esc(item.title)}</h3><p>${esc(item.body)}</p></li>`)
    .join("");
  const faq = ui.faq
    .map(
      (item) => `<details class="faq">
        <summary>${esc(item.q)}</summary>
        <p>${esc(item.a)}</p>
      </details>`,
    )
    .join("");
  const legal = ui.legal.map((paragraph) => `<p>${esc(paragraph)}</p>`).join("");
  const points = ui.heroPoints.map((point) => `<li>${esc(point)}</li>`).join("");

  return `<!DOCTYPE html>
<html lang="${esc(lang.html)}" data-lang="${esc(lang.id)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(ui.metaTitle)}</title>
<meta name="description" content="${esc(ui.metaDescription)}">
<link rel="canonical" href="${canonical}">
${hreflangLinks()}
<meta property="og:type" content="website">
<meta property="og:locale" content="${esc(lang.og)}">
<meta property="og:site_name" content="${esc(catalog.brand.en)}">
<meta property="og:title" content="${esc(ui.metaTitle)}">
<meta property="og:description" content="${esc(ui.metaDescription)}">
<meta property="og:url" content="${canonical}">
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="#133447">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;700&family=Noto+Sans+Thai:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/site.css">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
<a class="skip" href="#main">${esc(skipText[lang.id])}</a>
<header class="top">
  <a class="brand" href="/${lang.id}/#top">
    <span class="mark">CP</span>
    <span>
      <strong>${esc(catalog.brand.zh)}</strong>
      <em>${esc(catalog.brand.en)}</em>
    </span>
  </a>
  <button type="button" class="fold-button" aria-expanded="false" aria-controls="menu"><span></span><span class="visually-hidden">${esc(ui.primaryNav.menu)}</span></button>
  <a class="line-link line-pin" href="${esc(catalog.line.url)}" data-channel="line">LINE</a>
  <div id="menu" class="menu">
    ${nav(ui)}
    <div class="tools">
      ${langMenu(lang.id, ui)}
      <label class="country-field">
        <span>${esc(ui.countryLabel)}</span>
        <select id="country" aria-label="${esc(ui.countryLabel)}">${countryOptions}</select>
      </label>
      <a class="line-link" href="${esc(catalog.line.url)}" data-channel="line">LINE</a>
    </div>
  </div>
</header>
<main id="main">
  <section class="hero" id="top">
    <div class="hero-copy">
      <p class="eyebrow">${esc(catalog.theme)}</p>
      <h1>${esc(ui.position)}</h1>
      <p class="lead">${esc(ui.heroLead)}</p>
      <div class="hero-actions">
        <a class="button" href="#services">${esc(ui.ctaServices)}</a>
        <a class="button button-line" href="${esc(catalog.line.url)}" data-channel="line">LINE</a>
      </div>
    </div>
    <div class="hero-art">${heroArt()}</div>
  </section>
  <section class="principles" aria-label="${esc(ui.primaryNav.about)}">
    ${ui.principles
      .map(
        (item, index) => `<article class="principle">
          <span>0${index + 1}</span>
          <h2>${esc(item.title)}</h2>
          <p>${esc(item.body)}</p>
        </article>`,
      )
      .join("")}
  </section>
  <section id="services" class="section">
    <div class="section-head">
      <h2>${esc(ui.sections.common.title)}</h2>
      <p>${esc(ui.sections.common.lead)}</p>
    </div>
    <div id="countries">
      <p>${esc(ui.countryHelp)} ${esc(ui.sections.country.lead)}</p>
      <div class="filters" role="group" aria-label="${esc(ui.filters.label)}">
        <button type="button" class="chip" data-view="all" aria-pressed="true">${esc(ui.filters.all)}</button>
        <button type="button" class="chip" data-view="open" aria-pressed="false">${esc(ui.filters.open)}</button>
        <button type="button" class="chip" data-view="country" aria-pressed="false">${esc(ui.filters.country)}</button>
        <button type="button" class="chip" data-view="planned" aria-pressed="false">${esc(ui.filters.planned)}</button>
      </div>
    </div>
    <p id="filter-empty" class="empty-note" hidden>${esc(ui.filters.empty)}</p>
    <div class="cards">
      ${cardsFor(ui, "common")}
      ${cardsFor(ui, "country")}
      <div id="planned"></div>
      ${cardsFor(ui, "expansion")}
    </div>
    <p class="empty-note">${esc(ui.sections.expansion.lead)}</p>
  </section>
  <section id="steps" class="section">
    <div class="section-head">
      <h2>${esc(ui.sections.steps.title)}</h2>
      <p>${esc(ui.sections.steps.lead)}</p>
    </div>
    <ol class="steps">${steps}</ol>
  </section>
  <section id="about" class="section">
    <div class="about-grid">
      <article class="about-block">
        <h2>${esc(ui.primaryNav.about)}</h2>
        <p>${esc(ui.position)}</p>
        <p>${esc(ui.pendingStrip)}</p>
        <ul class="points">${points}</ul>
      </article>
      <div id="trust" class="about-block">
        <h2>${esc(ui.sections.trust.title)}</h2>
        <p>${esc(ui.sections.trust.lead)}</p>
        ${trust}
      </div>
    </div>
    <article id="cases" class="about-block quiet">
      <h2>${esc(ui.sections.cases.title)}</h2>
      <p>${esc(ui.casesEmptyTitle)} ${esc(ui.casesEmptyBody)}</p>
    </article>
    <article id="business" class="about-block quiet">
      <h2>${esc(ui.sections.business.title)}</h2>
      <p>${esc(ui.sections.business.lead)}</p>
      <p>${esc(ui.businessNote)}</p>
      <button type="button" class="button button-quiet" data-open-inquiry="b2b-life">${esc(ui.card.askPlanned)}</button>
    </article>
  </section>
  <section id="faq" class="section">
    <div class="section-head">
      <h2>${esc(ui.sections.faq.title)}</h2>
      <p>${esc(ui.sections.faq.lead)}</p>
    </div>
    ${faq}
  </section>
  <section id="contact" class="cta-band">
    <div class="contact-row">
      <div>
        <h2>${esc(ui.sections.contact.title)}</h2>
        <p>${esc(ui.sections.contact.lead)}</p>
        <p>${esc(ui.contactHours)}</p>
        <p><a class="button button-line" href="${esc(catalog.line.url)}" data-channel="line">LINE ${esc(catalog.line.id)}</a></p>
      </div>
      <div>
        <ul class="socials">${socials}</ul>
        <p>${esc(ui.contactSocialNote)}</p>
      </div>
    </div>
  </section>
</main>
<footer class="foot" id="legal">
  <h2>${esc(ui.sections.legal.title)}</h2>
  ${legal}
  <p class="fine">${esc(catalog.brand.zh)} · ${esc(catalog.brand.en)} · ${esc(catalog.tagline)}</p>
  <p class="fine">${esc(ui.footerNote)}</p>
</footer>
<div class="dock">
  <a class="button button-line button-dock" href="${esc(catalog.line.url)}" data-channel="line">LINE ${esc(catalog.line.id)}</a>
</div>
<dialog id="inquiry" aria-labelledby="inquiry-title">
  <form method="dialog">
    <header class="dialog-head">
      <h2 id="inquiry-title">${esc(ui.inquiry.title)}</h2>
      <button value="cancel" class="icon-button" aria-label="${esc(ui.inquiry.close)}">×</button>
    </header>
    <p id="inquiry-intro"></p>
    <p id="inquiry-service"></p>
    <div id="inquiry-fields"></div>
    <p class="privacy">${esc(ui.inquiry.privacy)}</p>
    <textarea id="inquiry-output" readonly></textarea>
    <div class="dialog-actions">
      <button type="button" class="button" id="inquiry-copy">${esc(ui.inquiry.copy)}</button>
      <a class="button button-line" id="inquiry-line" href="${esc(catalog.line.url)}" data-channel="line">${esc(ui.inquiry.line)}</a>
    </div>
    <p id="inquiry-status" role="status"></p>
  </form>
</dialog>
<script type="application/json" id="cp-config">${JSON.stringify(config)}</script>
<script src="/assets/js/site.js" defer></script>
</body>
</html>
`;
}

function gate(notFound) {
  const ui = locales.zh;
  const links = catalog.langs
    .map(
      (lang) =>
        `<a class="gate-link" href="/${lang.id}/" hreflang="${esc(lang.html)}" lang="${esc(lang.html)}">${esc(lang.native)}</a>`,
    )
    .join("");
  const title = notFound ? `${ui.notFound}｜${catalog.brand.en}` : `${ui.root.title}｜${catalog.brand.en}`;
  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(ui.root.lead)}">
<link rel="canonical" href="${catalog.siteUrl}/">
${hreflangLinks()}
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(ui.root.lead)}">
<meta property="og:url" content="${catalog.siteUrl}/">
<meta property="og:type" content="website">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/css/site.css">
<meta name="theme-color" content="#133447">
</head>
<body class="gate-body">
<main class="gate">
  <p class="mark mark-lg">CP</p>
  <p class="eyebrow">${esc(catalog.brand.en)}</p>
  <h1>${esc(ui.root.title)}</h1>
  ${notFound ? `<p class="lead">${esc(ui.notFound)}</p>` : ""}
  <p class="lead">${esc(ui.root.lead)}</p>
  <p class="tagline">${esc(catalog.tagline)}</p>
  <p id="suggest" class="suggest" hidden></p>
  <div class="gate-links">${links}</div>
</main>
<script type="application/json" id="cp-langs">${JSON.stringify(
    catalog.langs.map((lang) => ({ id: lang.id, html: lang.html, native: lang.native })),
  )}</script>
<script>
const langs = JSON.parse(document.getElementById("cp-langs").textContent);
const box = document.getElementById("suggest");
let saved = "";
try { saved = localStorage.getItem("cp-lang") || ""; } catch (error) { saved = ""; }
const browser = (navigator.languages && navigator.languages[0] || navigator.language || "").toLowerCase();
function match(code) {
  const value = code.toLowerCase();
  return langs.find((lang) => value === lang.id || value === lang.html.toLowerCase() || value.startsWith(lang.id) || value.startsWith(lang.html.toLowerCase().slice(0, 2)));
}
const savedLang = langs.find((lang) => lang.id === saved);
const browserLang = match(browser);
const parts = [];
if (savedLang) parts.push(${JSON.stringify(ui.root.suggest)} + " " + savedLang.native + ".");
if (browserLang && (!savedLang || browserLang.id !== savedLang.id)) parts.push(${JSON.stringify(ui.root.browser)} + " " + browserLang.native + ".");
if (parts.length) {
  box.hidden = false;
  box.textContent = parts.join(" ");
}
</script>
</body>
</html>
`;
}

for (const lang of catalog.langs) {
  const dir = join(root, lang.id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), page(lang));
}
writeFileSync(join(root, "index.html"), gate(false));
writeFileSync(join(root, "404.html"), gate(true));

const urls = [catalog.siteUrl + "/", ...catalog.langs.map((lang) => `${catalog.siteUrl}/${lang.id}/`)];
writeFileSync(
  join(root, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((url) => `  <url><loc>${url}</loc></url>`)
    .join("\n")}\n</urlset>\n`,
);
writeFileSync(join(root, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${catalog.siteUrl}/sitemap.xml\n`);
writeFileSync(
  join(root, "favicon.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#133447"/><text x="16" y="21" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" font-weight="700" fill="#E5AD69">CP</text></svg>\n`,
);

console.log(`Built ${catalog.langs.length} language pages plus the language gate.`);
