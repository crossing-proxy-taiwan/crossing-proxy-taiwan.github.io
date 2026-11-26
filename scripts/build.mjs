import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const catalog = JSON.parse(readFileSync(join(root, "data/catalog.json"), "utf8"));
const showPlannedServices = catalog.showPlannedServices === true;
const locales = Object.fromEntries(
  catalog.langs.map((lang) => [
    lang.id,
    JSON.parse(readFileSync(join(root, "data/locales", `${lang.id}.json`), "utf8")),
  ]),
);
const serviceById = Object.fromEntries(catalog.services.map((service) => [service.id, service]));

const icons = {
  translate:
    '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 12h18M17 12c0 10-6 16-14 20M14 20c2 4 6 8 12 10" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/><path d="M26 28h14l-7 10h-8" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/><path d="M30 28c1.5 3 3 5 6 7" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>',
  file:
    '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M16 8h12l8 8v24H16V8z" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/><path d="M28 8v8h8M20 24h12M20 30h12M20 36h8" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>',
  license:
    '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="8" y="12" width="32" height="22" rx="3" fill="none" stroke="currentColor" stroke-width="1.75"/><circle cx="18" cy="22" r="3.5" fill="none" stroke="currentColor" stroke-width="1.75"/><path d="M26 19h8M26 24h8M14 38h20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>',
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

function jsonScript(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function flagInline(code) {
  const raw = readFileSync(join(root, "assets/flags", `${code.toLowerCase()}.svg`), "utf8").trim();
  return raw.replace("<svg", '<svg class="flag-svg" aria-hidden="true" focusable="false"');
}

function countryFilterCss() {
  return catalog.countryChoices
    .filter((code) => code !== "all")
    .map(
      (code) =>
        `html[data-country="${code}"] .card:not([data-countries="*"]):not([data-countries*="${code}"]){display:none}`,
    )
    .join("");
}

function countryLabel(ui, code) {
  return ui.countries[code] || code;
}

function applies(ui, service) {
  if (service.countries.includes("*")) return ui.appliesAll;
  return service.countries.map((code) => countryLabel(ui, code)).join(ui.listSep || "、");
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
    ["planned", "planned"],
    ["about", "about"],
    ["faq", "faq"],
  ];
  return `<nav class="nav" aria-label="${esc(ui.primaryNav.menu)}">
    ${items
      .map(([key, id]) => {
        const hidden = id === "planned" && !showPlannedServices ? " hidden" : "";
        return `<a href="#${id}" data-nav="${id}"${hidden}>${esc(ui.primaryNav[key])}</a>`;
      })
      .join("")}
  </nav>`;
}

function heroArt() {
  return `<svg class="hero-svg" viewBox="0 0 640 420" aria-hidden="true">
    <rect width="640" height="420" rx="28" fill="#F8FAFC"/>
    <rect x="36" y="36" width="568" height="348" rx="24" fill="#ffffff" stroke="#0F2742" stroke-opacity="0.08"/>
    <circle cx="470" cy="118" r="72" fill="#2563EB" fill-opacity="0.08"/>
    <circle cx="168" cy="300" r="48" fill="#C5A572" fill-opacity="0.2"/>
    <path d="M120 210 C 210 150, 250 250, 340 214 S 470 150, 530 230" fill="none" stroke="#2563EB" stroke-width="1.75"/>
    <g fill="none" stroke="#0F2742" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <rect x="92" y="168" width="86" height="86" rx="18"/>
      <path d="M114 190h28l12 12v28h-40zM142 190v12h12M118 214h24M118 224h16"/>
      <rect x="392" y="86" width="86" height="86" rx="18"/>
      <circle cx="422" cy="132" r="8"/><circle cx="448" cy="132" r="8"/>
      <path d="M422 132h8l6-16h14l6 16"/>
      <rect x="430" y="230" width="86" height="86" rx="18"/>
      <path d="M452 286l18-10 18 10-18 10zM452 286v16l18 10 18-10v-16"/>
    </g>
  </svg>`;
}

function card(ui, service, entry) {
  const copy = ui.services[service.id];
  const askLabel = service.status === "planned" ? ui.card.askPlanned : ui.card.ask;
  const steps = copy.steps.map((step) => `<li>${esc(step)}</li>`).join("");
  const panelId = `more-${service.id}`;
  const detailsControl = entry
    ? `<a class="button button-quiet" href="#service-${esc(service.id)}">${esc(ui.card.details)}</a>`
    : `<button type="button" class="button button-quiet" data-toggle-more aria-expanded="false" aria-controls="${panelId}">${esc(ui.card.details)}</button>`;
  const panel = entry
    ? ""
    : `<div id="${panelId}" class="more-panel" hidden>
        <dl>
          <dt>${esc(ui.card.audience)}</dt><dd>${esc(copy.audience)}</dd>
          <dt>${esc(ui.card.scope)}</dt><dd>${esc(copy.scope)}</dd>
          <dt>${esc(ui.card.documents)}</dt><dd>${esc(copy.documents)}</dd>
          <dt>${esc(ui.card.pricing)}</dt><dd>${esc(copy.pricing)}</dd>
          <dt>${esc(ui.card.steps)}</dt><dd><ol>${steps}</ol></dd>
          <dt>${esc(ui.card.limits)}</dt><dd>${esc(copy.limits)}</dd>
          <dt>${esc(ui.card.where)}</dt><dd>${esc(ui.areaPending)}</dd>
        </dl>
      </div>`;
  return `<article class="card${service.status === "planned" ? " is-planned" : ""}${entry ? " is-entry" : ""}"${entry ? "" : ` id="service-${esc(service.id)}"`} data-category="${esc(service.category)}" data-countries="${esc(service.countries.join(","))}" data-service="${esc(service.id)}" data-status="${esc(service.status)}" data-inquiry="${esc(service.inquiry)}" data-entry="${entry ? "true" : "false"}">
    <div class="card-top">
      <div class="card-icon">${icons[service.icon] || ""}</div>
      <p class="status status-${esc(service.status)}">${esc(ui.status[service.status])}</p>
    </div>
    <h4>${esc(copy.title)}</h4>
    <p class="summary">${esc(copy.summary)}</p>
    <p class="applies"><span>${esc(ui.card.applies)}</span> ${esc(applies(ui, service))}</p>
    ${entry ? `<p class="entry-note">${esc(ui.entryNote)}</p>` : ""}
    <div class="card-actions">
      ${detailsControl}
      <button type="button" class="button${service.status === "planned" ? " button-quiet" : ""}" data-open-inquiry="${esc(service.id)}">${esc(askLabel)}</button>
    </div>
    ${panel}
  </article>`;
}

function groupBlock(ui, group, status, shownFull) {
  const items = group.services
    .map((id) => serviceById[id])
    .filter((service) => service && service.status === status);
  if (!items.length) return "";
  const cards = items
    .map((service) => {
      const entry = shownFull.has(service.id);
      if (!entry) shownFull.add(service.id);
      return card(ui, service, entry);
    })
    .join("\n");
  const copy = ui.groups[group.id];
  return `<div class="group" id="group-${esc(group.id)}-${status}" data-group="${esc(group.id)}" data-group-status="${esc(status)}">
    <h3>${esc(copy.title)}</h3>
    <p class="group-lead">${esc(copy.lead)}</p>
    <div class="cards">${cards}</div>
  </div>`;
}

function quickLinks(ui) {
  return catalog.groups
    .map((group) => {
      const services = group.services.map((id) => serviceById[id]).filter(Boolean);
      const hasOpen = services.some((service) => service.status === "open");
      if (!hasOpen && !showPlannedServices) return "";
      const href = hasOpen ? `#group-${group.id}-open` : `#group-${group.id}-planned`;
      const copy = ui.groups[group.id];
      return `<a class="quick" href="${href}">
        <span class="card-icon">${icons[group.icon] || ""}</span>
        <strong>${esc(copy.title)}</strong>
        <span>${esc(copy.blurb)}</span>
      </a>`;
    })
    .join("");
}

function page(lang) {
  const ui = locales[lang.id];
  const canonical = `${catalog.siteUrl}/${lang.id}/`;
  const sameAs = [catalog.line.url, ...catalog.socials.map((item) => item.url)];
  const organizationId = `${catalog.siteUrl}/#organization`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: catalog.brand.en,
        alternateName: catalog.brand.zh,
        url: catalog.siteUrl,
        slogan: catalog.tagline,
        description: ui.metaDescription,
        logo: `${catalog.siteUrl}/favicon.svg`,
        areaServed: { "@type": "Country", "name": "Taiwan" },
        sameAs,
        knowsLanguage: catalog.langs.map((item) => item.html),
      },
      {
        "@type": "WebSite",
        "@id": `${catalog.siteUrl}/#website`,
        name: catalog.brand.en,
        alternateName: catalog.brand.zh,
        url: catalog.siteUrl,
        inLanguage: catalog.langs.map((item) => item.html),
        publisher: { "@id": organizationId },
      },
      ...catalog.services.map((service) => ({
        "@type": "Service",
        "@id": `${canonical}#service-${service.id}`,
        name: ui.services[service.id].title,
        description: ui.services[service.id].summary,
        serviceType: ui.services[service.id].title,
        provider: { "@id": organizationId },
        areaServed: { "@type": "Country", "name": "Taiwan" },
        url: `${canonical}#service-${service.id}`,
      })),
      {
        "@type": "FAQPage",
        "@id": `${canonical}#faq`,
        url: `${canonical}#faq`,
        mainEntity: ui.faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ],
  };
  const config = {
    lang: lang.id,
    langNative: lang.native,
    lineUrl: catalog.line.url,
    lineId: catalog.line.id,
    showPlannedServices,
    countries: ui.countries,
    countryNow: ui.countryNow,
    filterLive: ui.filterLive,
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
  const socials = catalog.socials
    .map(
      (item) =>
        `<li><a href="${esc(item.url)}" rel="noopener noreferrer" target="_blank">${esc(ui.socialLabels[item.id])}</a></li>`,
    )
    .join("");
  const trust = ui.trustItems
    .map((item) => `<article class="trust"><h3>${esc(item.title)}</h3><p>${esc(item.body)}</p></article>`)
    .join("");
  const steps = ui.steps
    .map(
      (item, index) =>
        `<li><span>${String(index + 1).padStart(2, "0")}</span><h3>${esc(item.title)}</h3><p>${esc(item.body)}</p></li>`,
    )
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
  const notices = ui.notices.items.map((item) => `<li>${esc(item)}</li>`).join("");
  const principles = ui.principles
    .map(
      (item, index) => `<article class="principle">
        <span>0${index + 1}</span>
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.body)}</p>
      </article>`,
    )
    .join("");
  const flags = catalog.countryChoices
    .map((code) => {
      const name = code === "all" ? ui.countries.all : ui.countries[code];
      const selected = code === "all";
      return `<button type="button" class="flag-btn" role="radio" data-country="${esc(code)}" aria-checked="${selected ? "true" : "false"}" tabindex="${selected ? "0" : "-1"}">
        ${flagInline(code)}
        <span class="flag-name">${esc(name)}</span>
      </button>`;
    })
    .join("");
  const openShown = new Set();
  const plannedShown = new Set();
  const openGroups = catalog.groups.map((group) => groupBlock(ui, group, "open", openShown)).join("\n");
  const plannedGroups = catalog.groups
    .map((group) => groupBlock(ui, group, "planned", plannedShown))
    .join("\n");
  const alternates = catalog.langs
    .filter((item) => item.id !== lang.id)
    .map((item) => `<meta property="og:locale:alternate" content="${esc(item.og)}">`)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="${esc(lang.html)}" data-lang="${esc(lang.id)}" data-show-planned="${showPlannedServices ? "true" : "false"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(ui.metaTitle)}</title>
<meta name="description" content="${esc(ui.metaDescription)}">
<link rel="canonical" href="${canonical}">
${hreflangLinks()}
<meta property="og:type" content="website">
<meta property="og:locale" content="${esc(lang.og)}">
${alternates}
<meta property="og:site_name" content="${esc(catalog.brand.en)}">
<meta property="og:title" content="${esc(ui.metaTitle)}">
<meta property="og:description" content="${esc(ui.metaDescription)}">
<meta property="og:url" content="${canonical}">
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="#0F2742">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/css/site.css">
<style>${countryFilterCss()}</style>
<script type="application/ld+json">${jsonScript(jsonLd)}</script>
<script>
try {
  var countryQuery = new URLSearchParams(location.search).get("country");
  var countryStored = localStorage.getItem("cp-country");
  var countryValue = countryQuery || countryStored || "";
  if (countryValue && countryValue !== "all" && ["TW","VN","ID","TH","PH"].indexOf(countryValue) !== -1) {
    document.documentElement.setAttribute("data-country", countryValue);
  }
} catch (error) {}
</script>
</head>
<body>
<a class="skip" href="#main">${esc(skipText[lang.id])}</a>
<header class="top">
  <a class="brand" href="/${lang.id}/#top">
    <span class="mark" aria-hidden="true">CP</span>
    <span>
      <strong>${esc(catalog.brand.zh)}</strong>
      <em>${esc(catalog.brand.en)}</em>
    </span>
  </a>
  <button type="button" class="fold-button" aria-expanded="false" aria-controls="menu"><span></span><span class="visually-hidden">${esc(ui.primaryNav.menu)}</span></button>
  <div id="menu" class="menu">
    ${nav(ui)}
    <div class="tools">
      <a class="country-jump" id="country-jump" href="#countries" aria-label="${esc(ui.countryNow.replace("{name}", ui.countries.all))}">${esc(ui.countries.all)}</a>
      ${langMenu(lang.id, ui)}
      <a class="line-link" href="${esc(catalog.line.url)}" data-channel="line" target="_blank" rel="noopener noreferrer">LINE ${esc(catalog.line.id)}</a>
    </div>
  </div>
</header>
<main id="main">
  <section class="hero" id="top">
    <div class="hero-copy">
      <p class="eyebrow">${esc(catalog.tagline)}</p>
      <h1>${esc(ui.heroTitle)}</h1>
      <p class="lead">${esc(ui.heroLead)}</p>
      <div class="hero-actions">
        <a class="button" href="#services">${esc(ui.ctaServices)}</a>
        <a class="button button-line" href="${esc(catalog.line.url)}" data-channel="line" target="_blank" rel="noopener noreferrer">${esc(ui.ctaLine)}</a>
      </div>
    </div>
    <div class="hero-art">${heroArt()}</div>
  </section>
  <section id="countries" class="section">
    <div class="section-head">
      <h2>${esc(ui.sections.flags.title)}</h2>
      <p id="country-help" class="country-help">${esc(ui.countryHelp)}</p>
    </div>
    <div class="flag-grid" role="radiogroup" aria-describedby="country-help" aria-label="${esc(ui.countryLabel)}">${flags}</div>
    <p id="filter-live" class="visually-hidden" aria-live="polite"></p>
  </section>
  <section id="quick" class="section">
    <div class="section-head">
      <h2>${esc(ui.sections.quick.title)}</h2>
      <p>${esc(ui.sections.quick.lead)}</p>
    </div>
    <div class="quick-grid">${quickLinks(ui)}</div>
  </section>
  <section id="services" class="section">
    <div class="section-head">
      <h2>${esc(ui.sections.open.title)}</h2>
      <p>${esc(ui.sections.open.lead)}</p>
    </div>
    ${openGroups}
    <p id="open-empty" class="empty-note" hidden>${esc(ui.filters.empty)}</p>
  </section>
  <section id="steps" class="section">
    <div class="section-head">
      <h2>${esc(ui.sections.steps.title)}</h2>
      <p>${esc(ui.sections.steps.lead)}</p>
    </div>
    <ol class="steps">${steps}</ol>
  </section>
  <section id="planned" class="section"${showPlannedServices ? "" : " hidden"}>
    <div class="section-head">
      <h2>${esc(ui.sections.expansion.title)}</h2>
      <p>${esc(ui.sections.expansion.lead)}</p>
    </div>
    ${plannedGroups}
    <p id="planned-empty" class="empty-note planned-note" hidden>${esc(ui.filters.empty)}</p>
  </section>
  <section id="about" class="section">
    <div class="about-grid">
      <article class="about-block">
        <h2>${esc(ui.aboutTitle)}</h2>
        <p>${esc(ui.position)}</p>
        <p>${esc(ui.pendingStrip)}</p>
        <ul class="points">${points}</ul>
      </article>
      <div class="about-block">
        <h2>${esc(ui.sections.trust.title)}</h2>
        <p>${esc(ui.sections.trust.lead)}</p>
        <div class="trust-grid">${trust}</div>
      </div>
    </div>
    <div class="principles">${principles}</div>
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
    <article id="notices" class="about-block quiet">
      <h2>${esc(ui.notices.title)}</h2>
      <ul class="notice-list">${notices}</ul>
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
    <div>
      <h2>${esc(ui.sections.contact.title)}</h2>
      <p>${esc(ui.sections.contact.lead)}</p>
      <p>${esc(ui.contactHours)}</p>
      <p><a class="button button-line" href="${esc(catalog.line.url)}" data-channel="line" target="_blank" rel="noopener noreferrer">${esc(ui.ctaLine)} ${esc(catalog.line.id)}</a></p>
    </div>
  </section>
</main>
<footer class="foot" id="legal">
  <h2>${esc(ui.sections.legal.title)}</h2>
  ${legal}
  <ul class="socials">${socials}</ul>
  <p class="social-note">${esc(ui.contactSocialNote)}</p>
  <p class="fine">${esc(catalog.brand.zh)} · ${esc(catalog.brand.en)} · ${esc(catalog.tagline)}</p>
  <p class="fine">CROSSING PROXY WEBSITE V2.0</p>
  <p class="fine">${esc(ui.footerNote)}</p>
</footer>
<a class="float-line button button-line" href="${esc(catalog.line.url)}" data-channel="line" target="_blank" rel="noopener noreferrer">${esc(ui.floatLabel)}</a>
<div class="mobile-bar">
  <a class="button button-quiet" href="#services">${esc(ui.mobileBar.services)}</a>
  <a class="button button-line" href="${esc(catalog.line.url)}" data-channel="line" target="_blank" rel="noopener noreferrer">${esc(ui.mobileBar.line)}</a>
</div>
<dialog id="inquiry" aria-labelledby="inquiry-title">
  <form method="dialog" id="inquiry-form">
    <header class="dialog-head">
      <h2 id="inquiry-title">${esc(ui.inquiry.title)}</h2>
      <button value="cancel" class="icon-button" aria-label="${esc(ui.inquiry.close)}">×</button>
    </header>
    <p id="inquiry-intro"></p>
    <p id="inquiry-meta"></p>
    <div id="inquiry-fields"></div>
    <p class="privacy">${esc(ui.inquiry.privacy)}</p>
    <label class="preview-label" for="inquiry-output">${esc(ui.inquiry.preview)}</label>
    <textarea id="inquiry-output" readonly></textarea>
    <p class="not-sent">${esc(ui.inquiry.notSent)}</p>
    <div class="dialog-actions">
      <button type="button" class="button" id="inquiry-copy">${esc(ui.inquiry.copy)}</button>
      <a class="button button-line" id="inquiry-line" href="${esc(catalog.line.url)}" data-channel="line" target="_blank" rel="noopener noreferrer">${esc(ui.inquiry.line)}</a>
    </div>
    <p id="inquiry-status" role="status"></p>
  </form>
</dialog>
<script type="application/json" id="cp-config">${jsonScript(config)}</script>
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
<meta property="og:site_name" content="${esc(catalog.brand.en)}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/css/site.css">
<meta name="theme-color" content="#0F2742">
</head>
<body class="gate-body">
<main class="gate">
  <p class="mark mark-lg" aria-hidden="true">CP</p>
  <p class="eyebrow">${esc(catalog.brand.en)}</p>
  <h1>${esc(ui.root.title)}</h1>
  ${notFound ? `<p class="lead">${esc(ui.notFound)}</p>` : ""}
  <p class="lead">${esc(ui.root.lead)}</p>
  <p class="tagline">${esc(catalog.tagline)}</p>
  <p id="suggest" class="suggest" hidden></p>
  <div class="gate-links">${links}</div>
</main>
<script type="application/json" id="cp-langs">${jsonScript(
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
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#0F2742"/><text x="16" y="21" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" font-weight="700" fill="#C5A572">CP</text></svg>\n`,
);

console.log(`Built CROSSING PROXY WEBSITE V2.0: ${catalog.langs.length} language pages plus the language gate.`);
