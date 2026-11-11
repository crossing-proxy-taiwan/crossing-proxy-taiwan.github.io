import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const catalog = JSON.parse(readFileSync(join(root, "data/catalog.json"), "utf8"));
const locales = Object.fromEntries(
  catalog.langs.map((lang) => [lang.id, JSON.parse(readFileSync(join(root, "data/locales", `${lang.id}.json`), "utf8"))]),
);

const fontHref =
  "https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;700&family=Noto+Sans+Thai:wght@400;500;700&display=swap";

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function jsonScript(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function icon(name) {
  return `<svg class="i" aria-hidden="true"><use href="/assets/icons.svg#ic-${name}"/></svg>`;
}

function pagePath(pageId) {
  return catalog.pages.find((page) => page.id === pageId).path;
}

function href(langId, path) {
  return `/${langId}/${path || ""}`;
}

function serviceById(id) {
  return catalog.services.find((service) => service.id === id);
}

function areaText(ui, setId) {
  const set = catalog.areaSets[setId];
  if (!set) return "";
  if (set.type === "nationwide") return ui.area.nationwide;
  if (set.type === "nationwide-short") return ui.area.nationwideShort;
  if (set.type === "online-nationwide") return ui.area.online;
  if (set.type === "life-help") return ui.area.life;
  return set.regions.map((id) => ui.regions[id]).join(ui.area.sep);
}

function tips(ui) {
  const one = (kind) => {
    const before = ui.tip[`${kind}Before`];
    const em1 = ui.tip[`${kind}Em1`];
    const mid = ui.tip[`${kind}Mid`];
    const em2 = ui.tip[`${kind}Em2`];
    const after = ui.tip[`${kind}After`];
    return `<p class="tip tip-${kind}">${esc(before)}<strong>${esc(em1)}</strong>${esc(mid)}<strong>${esc(em2)}</strong>${esc(after)}</p>`;
  };
  return one("long") + one("short");
}

function lineButton(ui, size) {
  const cls = size ? `btn ${size}` : "btn";
  return `<a class="${cls}" href="${esc(catalog.line.url)}" data-channel="line">${icon("chat")}<span class="btn-label">${esc(size === "sm" ? ui.nav.consult : ui.cta.line)}</span></a>`;
}

function lineHint(ui) {
  return `<p class="line-hint">${esc(ui.lineHint)}</p>`;
}

function lineStack(ui, size) {
  return `<div class="line-stack">${lineButton(ui, size)}${lineHint(ui)}</div>`;
}

function areaNote(ui) {
  return `<p class="area-ask">${esc(ui.areaAsk)}</p>`;
}

function noLine(ui) {
  return `<p class="no-line">${esc(ui.contact.noLineBefore)}<a href="tel:${esc(catalog.phoneTel)}">${esc(catalog.phone)}</a>${esc(ui.contact.noLineMid)}<a href="mailto:${esc(catalog.email)}">${esc(catalog.email)}</a>${esc(ui.contact.noLineAfter)}</p>`;
}

function hoursMeta(ui) {
  return `<div class="meta"><span>${icon("clock")}${esc(ui.hours)}</span><span>${icon("chat")}LINE ${esc(catalog.line.id)}</span></div>`;
}

function regionChips(ui, setId) {
  const set = catalog.areaSets[setId];
  return `<div class="regions">${set.regions
    .map((id) => `<span class="region">${icon("pin")}${esc(ui.regions[id])}</span>`)
    .join("")}</div>`;
}

function areaLine(ui, label, value) {
  return `<p class="area">${icon("pin")}<span><b>${esc(label)}</b>　${esc(value)}</span></p>`;
}

function stepsGrid(items) {
  return `<div class="steps">${items
    .map(
      (item, index) => `<article class="step"><span class="num">${index + 1}</span><div><p class="step-title">${esc(item.title)}</p><p>${esc(item.body)}</p></div></article>`,
    )
    .join("")}</div>`;
}

function priceTable(ui, priceId) {
  const block = catalog.prices.find((item) => item.id === priceId);
  const rows = block.items.map((item) => ({
    name: ui.price.items[item.id],
    priced: block.published === true && typeof item.basePrice === "number",
    item,
  }));
  const anyPriced = rows.some((row) => row.priced);
  if (!anyPriced) {
    return `<table class="price"><thead><tr><th>${esc(ui.price.name)}</th><th>${esc(ui.price.fee)}</th></tr></thead><tbody>${rows
      .map(
        (row) =>
          `<tr><td>${esc(row.name)}</td><td class="fb">${icon("tag")}${esc(ui.price.fallback)}</td></tr>`,
      )
      .join("")}</tbody></table>`;
  }
  const cell = (row, key) => {
    if (!row.priced) return "—";
    if (key === "base") return `${esc(row.item.currency)} ${esc(row.item.basePrice)}`;
    if (key === "unit") return esc(row.item.unit || "—");
    if (key === "extra") {
      const extra = (row.item.surcharges || []).map((part) => part.label || part.amount).filter(Boolean);
      return esc(extra.join(", ") || "—");
    }
    return esc(row.item.note || "—");
  };
  return `<table class="price"><thead><tr><th>${esc(ui.price.name)}</th><th>${esc(ui.price.base)}</th><th>${esc(ui.price.unit)}</th><th>${esc(ui.price.extra)}</th><th>${esc(ui.price.note)}</th></tr></thead><tbody>${rows
    .map(
      (row) =>
        `<tr><td>${esc(row.name)}</td><td>${row.priced ? cell(row, "base") : `<span class="fb">${esc(ui.price.fallback)}</span>`}</td><td>${cell(row, "unit")}</td><td>${cell(row, "extra")}</td><td>${cell(row, "note")}</td></tr>`,
    )
    .join("")}</tbody></table>`;
}

function priceSection(ui, priceId) {
  return `<section class="sec"><div class="wrap"><div class="sh"><p class="kicker">${esc(ui.price.kicker)}</p><h2>${esc(ui.price.title)}</h2></div>${priceTable(ui, priceId)}</div></section>`;
}

function ctaBand(ui, heading) {
  return `<section class="sec" id="contact"><div class="wrap"><div class="ctaband"><div><h2>${esc(heading)}</h2><p class="lead">${esc(ui.hours)}</p></div><div>${lineStack(ui, "lg")}${tips(ui)}${noLine(ui)}</div></div></div></section>`;
}

function zhText(value) {
  return `<span lang="zh-Hant">${esc(value)}</span>`;
}

function companyList(ui) {
  const rows = [
    [ui.company.name, zhText(catalog.company.name)],
    [ui.company.tax, esc(catalog.company.taxId)],
    [ui.company.rep, zhText(catalog.company.representative)],
    [ui.company.address, zhText(catalog.company.address)],
    [ui.company.hours, esc(ui.company.hoursValue)],
    [ui.company.languages, esc(ui.company.languagesValue)],
  ];
  return `<dl class="co">${rows.map(([label, value]) => `<dt>${esc(label)}</dt><dd>${value}</dd>`).join("")}</dl>`;
}

function qualNote(ui, id) {
  return `<aside class="note"${id ? ` id="${id}"` : ""}>${icon("info")}<div><p>${esc(ui.qual.lead)}</p><ul>${ui.qual.items
    .map((item) => `<li>${esc(item)}</li>`)
    .join("")}</ul><p>${esc(ui.qual.partners)}</p></div></aside>`;
}

function areaTable(ui) {
  return `<table class="areas"><thead><tr><th>${esc(ui.home.areasService)}</th><th>${esc(ui.home.areasPlace)}</th></tr></thead><tbody>${catalog.areaRows
    .map((row) => `<tr><td>${esc(ui.areaRows[row.id])}</td><td>${esc(areaText(ui, row.areaSet))}</td></tr>`)
    .join("")}</tbody></table>`;
}

function faqList(items) {
  return `<div class="faq">${items
    .map(
      (item, index) => `<details${index === 0 ? " open" : ""}><summary>${esc(item.q)}</summary><p>${esc(item.a)}</p></details>`,
    )
    .join("")}</div>`;
}

function menuDetail(ui, service) {
  if (service.id === "translate") return ui.cards.translate.summary;
  if (service.id === "documents") return ui.area.online;
  return areaText(ui, service.areaSet);
}

function serviceLink(lang, service) {
  return href(lang.id, service.page);
}

function anchors(service) {
  const ids = service.legacyIds || [];
  return {
    id: ids[0] || service.id,
    extra: ids.slice(1).map((id) => `<span id="${esc(id)}" class="anchor"></span>`).join(""),
  };
}

function countryBits(ui, className) {
  return catalog.countries
    .map(
      (country, index) =>
        `<span class="${className}" data-country="${esc(country.id)}" data-order="${index}">${esc(ui.countries[country.id])}</span>`,
    )
    .join("");
}

function hreflang(path) {
  const lines = catalog.langs.map(
    (lang) => `<link rel="alternate" hreflang="${esc(lang.html)}" href="${catalog.siteUrl}${href(lang.id, path)}">`,
  );
  lines.push(`<link rel="alternate" hreflang="x-default" href="${catalog.siteUrl}/">`);
  return lines.join("\n");
}

function header(lang, ui, pageId) {
  const servicePages = new Set(["services", "sim", "life", "translation"]);
  const items = catalog.nav
    .map((item) => {
      const label = ui.nav[item.id];
      const current = item.id === pageId || (item.id === "services" && servicePages.has(pageId));
      if (item.menu) {
        return `<button type="button" class="nav-drop" data-open="mega" aria-expanded="false" aria-controls="mega" aria-haspopup="true"${current ? ' aria-current="true"' : ""}>${esc(label)}${icon("down")}</button>`;
      }
      return `<a href="${href(lang.id, item.path)}"${current ? ' aria-current="page"' : ""}>${esc(label)}</a>`;
    })
    .join("");
  const columns = catalog.serviceMenu
    .map((group) => {
      const links = group.items
        .map((id) => {
          const service = serviceById(id);
          const card = ui.cards[id];
          const title = card.menuTitle || card.title;
          return `<a class="mi" href="${serviceLink(lang, service)}">${spanIcon(service.icon)}<span><b>${esc(title)}</b><small>${esc(menuDetail(ui, service))}</small></span></a>`;
        })
        .join("");
      return `<div><p class="kicker">${esc(ui.menu[group.id])}</p>${links}</div>`;
    })
    .join("");
  const mobileServices = catalog.serviceMenu
    .flatMap((group) => group.items)
    .map((id) => {
      const service = serviceById(id);
      const card = ui.cards[id];
      return `<a class="mi" href="${serviceLink(lang, service)}">${spanIcon(service.icon)}<span><b>${esc(card.menuTitle || card.title)}</b><small>${esc(menuDetail(ui, service))}</small></span></a>`;
    })
    .join("");
  const langLinks = catalog.langs
    .map((item) => {
      const current = item.id === lang.id ? ' aria-current="page"' : "";
      return `<a href="${href(item.id, pagePath(pageId))}" hreflang="${esc(item.html)}" lang="${esc(item.html)}" data-lang="${esc(item.id)}" data-default-country="${esc(item.defaultCountry)}"${current}>${esc(item.native)}</a>`;
    })
    .join("");
  const countryButtons = ["ALL", ...catalog.countries.map((country) => country.id)]
    .map((code) => {
      const pressed = code === lang.defaultCountry ? ' aria-pressed="true"' : ' aria-pressed="false"';
      return `<button type="button" data-country-press="${esc(code)}"${pressed}>${esc(ui.countries[code])}</button>`;
    })
    .join("");
  const mobileNav = catalog.nav
    .map((item) => {
      if (item.menu) {
        const open = servicePages.has(pageId);
        return `<div class="fold-panel"><button type="button" class="fold" data-fold="m-services" aria-expanded="${open ? "true" : "false"}" aria-controls="m-services">${esc(ui.nav.services)}<span aria-hidden="true">${open ? "–" : "+"}</span></button><div id="m-services"${open ? "" : " hidden"}>${mobileServices}<a class="mi" href="${href(lang.id, "services/")}">${spanIcon("file")}<span><b>${esc(ui.nav.allServices)}</b></span></a></div></div>`;
      }
      const current = item.id === pageId ? ' aria-current="page"' : "";
      return `<a href="${href(lang.id, item.path)}"${current}>${esc(ui.nav[item.id])}</a>`;
    })
    .join("");
  return `<header class="top">
  <div class="wrap bar">
    <a class="brand" href="${href(lang.id, "")}">
      <span class="mark" lang="en">CP</span>
      <span><b lang="zh-Hant">${esc(catalog.brand.zh)}</b><em lang="en">${esc(catalog.brand.en)}</em></span>
    </a>
    <nav class="nav" aria-label="${esc(ui.nav.menu)}">${items}</nav>
    <div class="tools">
      <button type="button" class="pill" data-open="lang-panel" aria-expanded="false" aria-controls="lang-panel" aria-haspopup="true">${icon("globe")}<span lang="${esc(lang.html)}">${esc(lang.native)}</span>${icon("down")}</button>
      <button type="button" class="iconbtn only-m" data-open="lang-panel" aria-expanded="false" aria-controls="lang-panel" aria-label="${esc(ui.nav.langCountry)}">${icon("globe")}</button>
      ${lineButton(ui, "sm")}
      <button type="button" class="iconbtn menu-button" data-open="mobile-menu" aria-expanded="false" aria-controls="mobile-menu" aria-label="${esc(ui.nav.openMenu)}">${icon("menu")}</button>
    </div>
  </div>
  <div id="mega" class="mega" hidden>
    <div class="wrap mega-grid">
      ${columns}
      <div class="mega-side">
        <p class="step-title">${esc(ui.menu.unsureTitle)}</p>
        <p>${esc(ui.menu.unsureBody)}</p>
        <p style="margin-top:12px">${lineButton(ui, "sm")}</p>
        <p class="muted" style="margin-top:8px">${esc(ui.hours)}</p>
        <p style="margin-top:8px"><a class="link" href="${href(lang.id, "services/")}">${esc(ui.nav.allServices)}${icon("right")}</a></p>
      </div>
    </div>
  </div>
  <div id="lang-panel" class="lang-panel" hidden>
    <div class="lang-list" aria-label="${esc(ui.nav.langCountry)}">${langLinks}</div>
    <div class="country-list" role="group" aria-label="${esc(ui.home.areasPlace)}">${countryButtons}</div>
    <p class="country-note">${esc(ui.countryNote)}</p>
  </div>
  <div id="mobile-menu" class="mobile-menu" hidden>
    <div class="wrap">
      <button type="button" class="pill full-pill" data-open="lang-panel" aria-expanded="false" aria-controls="lang-panel">${icon("globe")}<span lang="${esc(lang.html)}">${esc(lang.native)}</span>${icon("down")}</button>
      <nav class="mobile-links" aria-label="${esc(ui.nav.menu)}">${mobileNav}</nav>
    </div>
  </div>
</header>`;
}

function spanIcon(name) {
  return `<span class="ic">${icon(name)}</span>`;
}

function footer(lang, ui) {
  const zalo =
    lang.secondaryChannel === "zalo"
      ? `<li><a href="${esc(catalog.zalo.url)}">ZALO ${esc(catalog.zalo.display)}</a></li>`
      : "";
  return `<footer id="legal">
  <div class="wrap">
    <div>
      <div style="display:flex;gap:10px;align-items:center;margin-bottom:14px"><span class="mark" lang="en">CP</span><b style="color:#fff">${esc(catalog.brand.zh)} ${esc(catalog.brand.en)}</b></div>
      <p>${zhText(catalog.company.name)}｜${esc(ui.company.tax)} ${esc(catalog.company.taxId)}<br>${esc(ui.company.rep)}：${zhText(catalog.company.representative)}<br>${zhText(catalog.company.address)}</p>
    </div>
    <div>
      <p class="foot-label">${esc(ui.footer.contact)}</p>
      <ul>
        <li><a href="${esc(catalog.line.url)}">LINE ${esc(catalog.line.id)}</a></li>
        <li><a href="tel:${esc(catalog.phoneTel)}">${esc(ui.contact.phone)} ${esc(catalog.phone)}</a></li>
        <li><a href="mailto:${esc(catalog.email)}">${esc(catalog.email)}</a></li>
        ${zalo}
        <li>${esc(ui.hours)}</li>
      </ul>
    </div>
    <div>
      <p class="foot-label">${esc(ui.footer.info)}</p>
      <ul>
        <li><a href="${href(lang.id, "privacy/")}">${esc(ui.footer.privacy)}</a></li>
        <li><a href="${href(lang.id, "about/")}#qualifications">${esc(ui.footer.qual)}</a></li>
        <li><a href="${href(lang.id, "sitemap/")}">${esc(ui.footer.map)}</a></li>
      </ul>
    </div>
    <p class="fine">${esc(ui.footer.rights)}</p>
  </div>
</footer>`;
}

function dock(ui) {
  return `<div class="dock"><a class="btn" href="${esc(catalog.line.url)}" data-channel="line">${icon("chat")}<span>${esc(ui.cta.line)}</span></a><small>${esc(ui.hoursCompact)}<br>${esc(ui.replyCompact)}</small></div>`;
}

function crumbs(lang, ui, items) {
  const last = items.length - 1;
  return `<nav class="crumb" aria-label="${esc(ui.nav.breadcrumb)}"><ol>${items
    .map((item, index) =>
      index === last
        ? `<li aria-current="page">${esc(item.label)}</li>`
        : `<li><a href="${href(lang.id, item.path)}">${esc(item.label)}</a></li>`,
    )
    .join('<li aria-hidden="true">/</li>')}</ol></nav>`;
}

function heroArt(lang, ui) {
  const font = {
    zh: "Noto Sans TC, sans-serif",
    en: "Inter, sans-serif",
    vi: "Be Vietnam Pro, sans-serif",
    id: "Inter, sans-serif",
    th: "Noto Sans Thai, sans-serif",
    fil: "Inter, sans-serif",
    hi: "Noto Sans Devanagari, sans-serif",
  }[lang.id];
  return `<div class="art"><svg viewBox="0 0 520 440" role="img" aria-label="${esc(ui.hero.art)}">
    <rect width="520" height="440" rx="24" fill="#FFFAEF"/>
    <circle cx="400" cy="96" r="70" fill="#e7f1f1"/>
    <circle cx="110" cy="350" r="60" fill="#fbefd9"/>
    <path d="M92 132 C 180 60, 250 210, 300 150 S 420 210, 430 300" fill="none" stroke="#167c83" stroke-width="2" stroke-dasharray="2 9" stroke-linecap="round"/>
    <g fill="none" stroke="#167c83" stroke-linecap="round" stroke-linejoin="round">
      <g transform="translate(40 90)"><rect width="104" height="104" rx="26" fill="#fff" stroke="#133447" stroke-opacity=".14"/><g transform="translate(22 22) scale(2.5)" stroke-width=".75"><path d="M3 8l9-5 9 5-9 5-9-5z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/></g></g>
      <g transform="translate(240 60)"><rect width="104" height="104" rx="26" fill="#fff" stroke="#133447" stroke-opacity=".14"/><g transform="translate(22 22) scale(2.5)" stroke-width=".75"><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M10 18.5h4"/></g></g>
      <g transform="translate(372 248)"><rect width="104" height="104" rx="26" fill="#fff" stroke="#133447" stroke-opacity=".14"/><g transform="translate(22 22) scale(2.5)" stroke-width=".75"><circle cx="5.5" cy="17" r="3"/><circle cx="18.5" cy="17" r="3"/><path d="M5.5 17h6l3-7h3l1 7"/></g></g>
    </g>
    <g transform="translate(120 220)">
      <rect width="250" height="132" rx="22" fill="#fff" stroke="#133447" stroke-opacity=".14"/>
      <rect x="16" y="18" width="168" height="36" rx="18" fill="#e7f1f1"/>
      <text x="28" y="41" font-size="13" fill="#133447" font-family="${font}">${esc(ui.hero.chatUser)}</text>
      <rect x="70" y="64" width="164" height="36" rx="18" fill="#133447"/>
      <text x="84" y="87" font-size="13" fill="#ffffff" font-family="${font}">${esc(ui.hero.chatUs)}</text>
      <circle cx="30" cy="114" r="3" fill="#e5ad69"/><circle cx="42" cy="114" r="3" fill="#e5ad69"/><circle cx="54" cy="114" r="3" fill="#e5ad69"/>
    </g>
    <g font-size="14" fill="#0f6066" font-weight="600">
      <text x="372" y="214" font-family="Be Vietnam Pro, sans-serif">Xin chào</text>
      <text x="36" y="236" font-family="Noto Sans Thai, sans-serif">สวัสดี</text>
      <text x="392" y="390" font-family="Noto Sans Devanagari, sans-serif">नमस्ते</text>
      <text x="180" y="404" font-family="Inter, sans-serif">Halo · Kumusta · Hello</text>
    </g>
    <circle cx="92" cy="132" r="5" fill="#e5ad69"/><circle cx="300" cy="150" r="5" fill="#133447"/><circle cx="430" cy="300" r="5" fill="#167c83"/>
  </svg></div>`;
}

function scooterArt(ui) {
  return `<div class="art"><svg class="scooter-art" viewBox="0 0 440 220" role="img" aria-label="${esc(ui.motorcycle.art)}">
    <rect width="440" height="220" rx="24" fill="#FFFAEF"/>
    <g fill="none" stroke="#167c83" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="110" cy="150" r="36"/><circle cx="320" cy="150" r="36"/>
      <path d="M110 150 L150 78 H210"/><path d="M150 92 C128 98 120 118 128 132"/>
      <path d="M148 146 H250 C258 112 286 98 330 102 C354 104 360 128 346 146"/>
      <path d="M250 96 H330" stroke="#133447"/>
    </g>
    <circle cx="110" cy="150" r="8" fill="#e5ad69"/><circle cx="320" cy="150" r="8" fill="#e5ad69"/>
  </svg><p class="muted" style="margin-top:10px">${esc(ui.motorcycle.caption)}</p></div>`;
}

function languagesRow(ui) {
  return `<div class="langs" aria-label="${esc(ui.home.languagesLabel)}">${catalog.langs
    .map((lang) => `<span lang="${esc(lang.html)}">${esc(lang.native)}</span>`)
    .join("")}</div>`;
}

function homePage(lang, ui) {
  const shipping = serviceById("shipping");
  const moto = serviceById("moto");
  const sim = serviceById("sim");
  const shipA = anchors(shipping);
  const motoA = anchors(moto);
  const simA = anchors(sim);
  const tier2 = ["life", "aircon"]
    .map((id) => {
      const service = serviceById(id);
      const card = ui.cards[id];
      const mark = anchors(service);
      const chips =
        id === "aircon"
          ? `<div class="chips">${card.chips.map((chip) => `<span class="chip">${esc(chip)}</span>`).join("")}</div>`
          : "";
      return `<article class="card" id="${esc(mark.id)}">${mark.extra}${spanIcon(service.icon).replace('class="ic"', 'class="bigic"')}<div><h3>${esc(card.title)}</h3><p class="d">${esc(card.summary)}</p>${chips}${areaLine(ui, ui.area.service, areaText(ui, service.areaSet))}<p class="foot"><a class="link" href="${serviceLink(lang, service)}">${esc(ui.cta.seeServices)}${icon("right")}</a></p></div></article>`;
    })
    .join("");
  const tier3 = ["translate", "documents", "b2b"]
    .map((id) => {
      const service = serviceById(id);
      const card = ui.cards[id];
      const mark = anchors(service);
      return `<a class="row3" id="${esc(mark.id)}" href="${serviceLink(lang, service)}">${mark.extra}${spanIcon(service.icon)}<span><b>${esc(card.title)}</b><small>${esc(card.summary)}<br>${esc(areaText(ui, service.areaSet))}</small></span></a>`;
    })
    .join("");
  return `<section class="hero" id="top"><div class="wrap"><div>
    <p class="eyebrow">${esc(ui.hero.kicker)}</p>
    <h1>${esc(ui.hero.title)}</h1>
    <nav class="hero-entries" aria-label="${esc(ui.hero.entriesLabel)}"><a href="${href(lang.id, "shipping/")}">${esc(ui.hero.entries[0])}</a><a href="${href(lang.id, "motorcycle/")}">${esc(ui.hero.entries[1])}</a><a href="${href(lang.id, "services/")}">${esc(ui.hero.entries[2])}</a></nav>
    <p class="sub">${esc(ui.hero.sub)}</p>
    <div class="actions" data-hero-cta>${lineStack(ui, "lg")}<a class="btn lg ghost" href="#services">${esc(ui.cta.seeServices)}${icon("right")}</a></div>
    <p class="trust-strip">${esc(ui.trustStrip)}</p>
    ${tips(ui)}
    ${hoursMeta(ui)}
    ${languagesRow(ui)}
  </div>${heroArt(lang, ui)}</div></section>
  <section class="sec" id="services"><div class="wrap">
    <div class="sh"><p class="kicker">${esc(ui.home.tier1Kicker)}</p><h2>${esc(ui.home.tier1Title)}</h2><p>${esc(ui.home.tier1Lead)}</p></div>
    <div class="t1">
      <article class="card" id="${esc(shipA.id)}">${shipA.extra}${spanIcon("parcel").replace('class="ic"', 'class="bigic"')}<h3>${esc(ui.cards.shipping.title)}</h3><p class="d">${esc(ui.cards.shipping.summary)}</p><div class="chips" data-reorder>${countryBits(ui, "chip")}</div>${areaLine(ui, ui.cards.shipping.area, areaText(ui, "shipping-pickup"))}<div class="foot"><a class="link" href="${href(lang.id, "shipping/")}">${esc(ui.cards.shipping.link)}${icon("right")}</a></div></article>
      <article class="card" id="${esc(motoA.id)}">${motoA.extra}${spanIcon("scooter").replace('class="ic"', 'class="bigic"')}<h3>${esc(ui.cards.moto.title)}</h3><p class="d">${esc(ui.cards.moto.summary)}</p>${areaLine(ui, ui.cards.moto.trade, ui.area.nationwide)}${areaLine(ui, ui.cards.moto.rent, areaText(ui, "moto-rental"))}<div class="foot"><a class="link" href="${href(lang.id, "motorcycle/")}">${esc(ui.cards.moto.link)}${icon("right")}</a></div></article>
      <article class="card" id="${esc(simA.id)}">${simA.extra}${spanIcon("sim").replace('class="ic"', 'class="bigic"')}<h3>${esc(ui.cards.sim.title)}</h3><p class="d">${esc(ui.cards.sim.summary)}</p>${areaLine(ui, ui.cards.sim.area, areaText(ui, "sim-escort"))}<div class="foot"><a class="link" href="${href(lang.id, "services/sim/")}">${esc(ui.cards.sim.link)}${icon("right")}</a></div></article>
    </div>
  </div></section>
  <section class="sec alt"><div class="wrap">
    <div class="sh"><p class="kicker">${esc(ui.home.tier2Kicker)}</p><h2>${esc(ui.home.tier2Title)}</h2></div>
    <div class="t2">${tier2}</div>
    <div class="t3">${tier3}</div>
  </div></section>
  <section class="sec" id="countries"><div class="wrap">
    <div class="sh"><p class="kicker">${esc(ui.home.areasKicker)}</p><h2>${esc(ui.home.areasTitle)}</h2></div>
    ${areaTable(ui)}
    ${areaNote(ui)}
  </div></section>
  <section class="sec alt" id="steps"><div class="wrap">
    <div class="sh"><p class="kicker">${esc(ui.home.stepsKicker)}</p><h2>${esc(ui.home.stepsTitle)} <span class="badge-ex">${esc(ui.home.stepsBadge)}</span></h2></div>
    ${stepsGrid(ui.steps)}
  </div></section>
  <section class="sec" id="about"><div class="wrap">
    <div class="sh"><p class="kicker">${esc(ui.home.aboutKicker)}</p><h2>${esc(ui.home.aboutTitle)}</h2></div>
    <div class="trust"><div class="card">${companyList(ui)}</div><div id="trust">${qualNote(ui)}</div></div>
    <p style="margin-top:16px"><a class="link" href="${href(lang.id, "about/")}">${esc(ui.home.aboutMore)}${icon("right")}</a></p>
  </div></section>
  <section class="sec alt" id="faq"><div class="wrap">
    <div class="sh"><p class="kicker">${esc(ui.home.faqKicker)}</p><h2>${esc(ui.home.faqTitle)}</h2></div>
    ${faqList(ui.faq)}
  </div></section>
  <section class="sec" id="contact"><div class="wrap">
    <div class="sh"><p class="kicker">${esc(ui.home.contactKicker)}</p><h2>${esc(ui.home.contactTitle)}</h2></div>
    ${contactGrid(lang, ui)}
  </div></section>`;
}

function contactGrid(lang, ui) {
  const zalo =
    lang.secondaryChannel === "zalo"
      ? `<a class="ci zalo" href="${esc(catalog.zalo.url)}">${spanIcon("chat")}<span><small>${esc(ui.contact.zaloSecondary)}</small><b>ZALO ${esc(catalog.zalo.display)}</b></span></a><p class="muted">${esc(ui.contact.zaloBody)}</p>`
      : "";
  const socials = catalog.socials
    .map((item) => `<a href="${esc(item.url)}">${esc(ui.social[item.id])}</a>`)
    .join("");
  return `<div class="contact"><div class="linecard"><p class="line-kicker">${esc(ui.contact.primary)}</p><h3>${esc(ui.contact.lineTitle)}</h3><p class="id">${esc(catalog.line.id)}</p><p>${esc(ui.hours)}</p>${lineStack(ui, "lg").replace('class="btn lg"', 'class="btn lg light"')}</div><div class="clist"><a class="ci" href="tel:${esc(catalog.phoneTel)}">${spanIcon("phone")}<span><small>${esc(ui.contact.phone)}</small><b>${esc(catalog.phone)}</b></span></a><a class="ci" href="mailto:${esc(catalog.email)}">${spanIcon("mail")}<span><small>${esc(ui.contact.email)}</small><b>${esc(catalog.email)}</b></span></a>${zalo}<div><p class="social-label">${esc(ui.contact.social)}</p><div class="social">${socials}</div></div></div></div>${noLine(ui)}`;
}

function pageHero(lang, ui, { crumbItems, title, sub, aside }) {
  return `<section class="phero"><div class="wrap"><div>${crumbs(lang, ui, crumbItems)}<h1>${esc(title)}</h1><p class="sub">${esc(sub)}</p><div class="actions" data-hero-cta>${lineStack(ui, "lg")}</div>${tips(ui)}${hoursMeta(ui)}</div>${aside || ""}</div></section>`;
}

function shippingAside(ui) {
  return `<div class="card side-card">${[
    ["truck", ui.shipping.sidePickup, areaText(ui, "shipping-pickup")],
    ["parcel", ui.shipping.sideCountries, ui.shipping.sideCountryList],
    ["clock", ui.replyCompact, ui.hours],
  ]
    .map(
      ([name, title, body]) =>
        `<div class="side-row">${spanIcon(name)}<div><b style="color:#133447">${esc(title)}</b><p class="muted">${esc(body)}</p></div></div>`,
    )
    .join("")}</div>`;
}

function shippingPage(lang, ui) {
  const notice = lang.defaultCountry === "ALL" ? "VN" : lang.defaultCountry;
  const tabs = catalog.countries
    .map((country) => {
      const on = country.id === notice;
      return `<button type="button" class="tab${on ? " on" : ""}" data-notice="${esc(country.id)}" aria-pressed="${on ? "true" : "false"}">${esc(ui.countries[country.id])}</button>`;
    })
    .join("");
  const cards = catalog.countries
    .map(
      (country, index) =>
        `<article class="dcard" data-country="${esc(country.id)}" data-order="${index}"><div class="code">${esc(country.id)}</div><b>${esc(ui.countries[country.id])}</b><small>${icon("check")}${esc(ui.statusOpen)}</small><span class="viewing">${esc(ui.viewing)}</span></article>`,
    )
    .join("");
  const flow = ui.shipping.steps;
  return `${pageHero(lang, ui, {
    crumbItems: [
      { path: "", label: ui.nav.home },
      { path: "shipping/", label: ui.shipping.crumb },
    ],
    title: ui.shipping.title,
    sub: ui.shipping.sub,
    aside: shippingAside(ui),
  })}
  <section class="sec"><div class="wrap"><div class="sh"><p class="kicker">${esc(ui.shipping.destKicker)}</p><h2>${esc(ui.shipping.destTitle)}</h2></div><div class="dest" data-reorder>${cards}</div></div></section>
  <section class="sec alt"><div class="wrap"><div class="sh"><p class="kicker">${esc(ui.shipping.areaKicker)}</p><h2>${esc(ui.shipping.areaTitle)}</h2><p>${esc(ui.shipping.areaLead)}</p></div>${regionChips(ui, "shipping-pickup")}${areaNote(ui)}</div></section>
  ${estimateSlot()}
  <section class="sec"><div class="wrap"><div class="sh"><p class="kicker">${esc(ui.shipping.flowKicker)}</p><h2>${esc(ui.shipping.flowTitle)} <span class="badge-ex">${esc(ui.home.stepsBadge)}</span></h2></div>${stepsGrid(flow)}</div></section>
  <section class="sec alt"><div class="wrap"><div class="sh"><p class="kicker">${esc(ui.shipping.noticeKicker)}</p><h2>${esc(ui.shipping.noticeTitle)}</h2><p>${esc(ui.shipping.noticeLead)}</p></div><div class="tabs" role="group" aria-label="${esc(ui.shipping.destKicker)}">${tabs}</div><div class="panel"><p><b id="notice-current">${esc(ui.countries[notice])}</b></p><ul class="plain">${ui.shipping.principles.map((item) => `<li>${esc(item)}</li>`).join("")}</ul></div></div></section>
  ${priceSection(ui, "shipping")}
  ${ctaBand(ui, ui.shipping.cta)}`;
}

function estimateSlot() {
  // The calculator stays in catalog.shippingEstimator and is not rendered until enabled.
  if (catalog.shippingEstimator.enabled !== true) return "";
  return `<section class="sec" id="estimate"><div class="wrap"></div></section>`;
}

function motoFlows(ui) {
  const rest = ui.steps.slice(1);
  const modes = [
    ["buy", ui.motorcycle.buyTitle, ui.motorcycle.buySteps],
    ["sell", ui.motorcycle.sellTitle, ui.motorcycle.sellSteps],
    ["rent", ui.motorcycle.rentTitle, ui.motorcycle.rentSteps],
  ];
  const tabs = modes
    .map(([id, title], index) => {
      const on = index === 0;
      return `<button type="button" class="tab" role="tab" id="tab-${id}" aria-controls="panel-${id}" aria-selected="${on ? "true" : "false"}" tabindex="${on ? "0" : "-1"}">${esc(title)}</button>`;
    })
    .join("");
  const panels = modes
    .map(([id, , first], index) => {
      const items = [first[0], ...rest];
      return `<div role="tabpanel" id="panel-${id}" aria-labelledby="tab-${id}"${index ? " hidden" : ""}>${stepsGrid(items)}</div>`;
    })
    .join("");
  return `<div class="tabs" role="tablist" aria-label="${esc(ui.motorcycle.flowTitle)}">${tabs}</div>${panels}`;
}

function motorcyclePage(lang, ui) {
  const options = [
    ["key", "buy", ui.motorcycle.buyTitle, ui.motorcycle.buyBody, ui.area.nationwide],
    ["swap", "sell", ui.motorcycle.sellTitle, ui.motorcycle.sellBody, ui.area.nationwide],
    ["cal", "rent", ui.motorcycle.rentTitle, ui.motorcycle.rentBody, areaText(ui, "moto-rental")],
  ]
    .map(
      ([iconName, id, title, body, area]) =>
        `<article class="card" id="${id}">${spanIcon(iconName).replace('class="ic"', 'class="bigic"')}<h2>${esc(title)}</h2><p class="d">${esc(body)}</p>${areaLine(ui, ui.area.service, area)}</article>`,
    )
    .join("");
  return `${pageHero(lang, ui, {
    crumbItems: [
      { path: "", label: ui.nav.home },
      { path: "motorcycle/", label: ui.motorcycle.crumb },
    ],
    title: ui.motorcycle.title,
    sub: ui.motorcycle.sub,
    aside: scooterArt(ui),
  })}
  <section class="sec"><div class="wrap"><p class="moto-note">${esc(ui.motorcycle.noList)}</p><div class="opt">${options}</div>${areaNote(ui)}</div></section>
  <section class="sec alt"><div class="wrap"><div class="sh"><p class="kicker">${esc(ui.motorcycle.flowKicker)}</p><h2>${esc(ui.motorcycle.flowTitle)} <span class="badge-ex">${esc(ui.home.stepsBadge)}</span></h2></div>${motoFlows(ui)}</div></section>
  <section class="sec"><div class="wrap"><div class="sh"><p class="kicker">${esc(ui.motorcycle.docsKicker)}</p><h2>${esc(ui.motorcycle.docsTitle)}</h2></div><div class="panel"><p>${esc(ui.motorcycle.docsBody)}</p></div></div></section>
  ${priceSection(ui, "motorcycle")}
  <section class="sec alt"><div class="wrap"><div class="sh"><p class="kicker">${esc(ui.home.faqKicker)}</p><h2>${esc(ui.motorcycle.faqTitle)}</h2></div>${faqList(ui.motorcycle.faq)}</div></section>
  ${ctaBand(ui, ui.motorcycle.cta)}`;
}

function servicesPage(lang, ui) {
  const cards = ["sim", "life", "aircon", "translate", "documents"]
    .map((id) => {
      const service = serviceById(id);
      const card = ui.cards[id];
      return `<a class="row3" href="${serviceLink(lang, service)}">${spanIcon(service.icon)}<span><b>${esc(card.menuTitle || card.title)}</b><small>${esc(menuDetail(ui, service))}</small></span></a>`;
    })
    .join("");
  return `${pageHero(lang, ui, {
    crumbItems: [
      { path: "", label: ui.nav.home },
      { path: "services/", label: ui.servicesPage.title },
    ],
    title: ui.servicesPage.title,
    sub: ui.servicesPage.sub,
    aside: "",
  })}
  <section class="sec"><div class="wrap"><div class="stack">${cards}</div></div></section>
  <section class="sec alt"><div class="wrap"><h2>${esc(ui.servicesPage.also)}</h2><div class="t2" style="margin-top:16px"><a class="card" href="${href(lang.id, "shipping/")}"><span class="bigic">${icon("parcel")}</span><div><h3>${esc(ui.cards.shipping.title)}</h3><p class="d">${esc(areaText(ui, "shipping-pickup"))}</p></div></a><a class="card" href="${href(lang.id, "motorcycle/")}"><span class="bigic">${icon("scooter")}</span><div><h3>${esc(ui.cards.moto.title)}</h3><p class="d">${esc(ui.motorcycle.caption)}</p></div></a></div></div></section>
  ${ctaBand(ui, ui.menu.unsureTitle)}`;
}

function simpleService(lang, ui, { pageId, path, title, sub, body, priceId, cta, crumbParent }) {
  const parent = crumbParent || { path: "services/", label: ui.nav.services };
  return `${pageHero(lang, ui, {
    crumbItems: [
      { path: "", label: ui.nav.home },
      parent,
      { path, label: title },
    ],
    title,
    sub,
    aside: "",
  })}
  ${body}
  ${priceSection(ui, priceId)}
  ${ctaBand(ui, cta)}`;
}

function simPage(lang, ui) {
  const body = `<section class="sec"><div class="wrap"><div class="sh"><p class="kicker">${esc(ui.cards.sim.area)}</p><h2>${esc(ui.area.service)}</h2></div>${regionChips(ui, "sim-escort")}${areaNote(ui)}<div class="panel area-spacing"><p>${esc(ui.simPage.note)}</p></div></div></section><section class="sec alt"><div class="wrap"><div class="sh"><p class="kicker">${esc(ui.home.stepsKicker)}</p><h2>${esc(ui.home.stepsTitle)} <span class="badge-ex">${esc(ui.home.stepsBadge)}</span></h2></div>${stepsGrid(ui.steps)}</div></section>`;
  return simpleService(lang, ui, {
    pageId: "sim",
    path: "services/sim/",
    title: ui.simPage.title,
    sub: ui.simPage.sub,
    body,
    priceId: "sim",
    cta: ui.simPage.cta,
  });
}

function lifePage(lang, ui) {
  const body = `<section class="sec" id="life"><div class="wrap"><div class="sh"><h2>${esc(ui.lifePage.lifeTitle)}</h2><p>${esc(ui.cards.life.summary)}</p></div>${areaLine(ui, ui.area.service, areaText(ui, "life-help"))}${areaNote(ui)}</div></section>
  <section class="sec alt" id="aircon"><div class="wrap"><div class="sh"><h2>${esc(ui.lifePage.airconTitle)}</h2><p>${esc(ui.lifePage.airconLead)}</p></div><div class="chips">${ui.cards.aircon.chips.map((chip) => `<span class="chip">${esc(chip)}</span>`).join("")}</div><div class="area-spacing">${regionChips(ui, "aircon")}${areaNote(ui)}</div></div></section>
  <section class="sec"><div class="wrap">${stepsGrid(ui.steps)}</div></section>`;
  return simpleService(lang, ui, {
    pageId: "life",
    path: "services/life/",
    title: ui.lifePage.title,
    sub: ui.lifePage.sub,
    body,
    priceId: "life",
    cta: ui.lifePage.cta,
  });
}

function translationPage(lang, ui) {
  const pairKey = { VN: "tr-vi", TH: "tr-th", ID: "tr-id", PH: "tr-ph", IN: "tr-hi" };
  const pairs = catalog.countries
    .map(
      (country, index) =>
        `<article class="card" data-country="${esc(country.id)}" data-order="${index}"><h3>${esc(ui.price.items[pairKey[country.id]])}</h3><p class="d">${esc(ui.translationPage.pairBodies[country.id])}</p><span class="viewing">${esc(ui.viewing)}</span></article>`,
    )
    .join("");
  const body = `<section class="sec"><div class="wrap"><p>${esc(ui.translationPage.note)}</p><div class="sh sh-follow"><h2>${esc(ui.translationPage.pairsTitle)}</h2></div><div class="dest" data-reorder>${pairs}</div><div class="area-spacing">${areaLine(ui, ui.area.service, ui.area.online)}${areaNote(ui)}</div></div></section>
  <section class="sec alt" id="documents"><div class="wrap"><div class="sh"><h2>${esc(ui.translationPage.docsTitle)}</h2><p>${esc(ui.translationPage.docsLead)}</p></div>${areaLine(ui, ui.area.service, ui.area.online)}</div></section>`;
  return simpleService(lang, ui, {
    pageId: "translation",
    path: "services/translation/",
    title: ui.translationPage.title,
    sub: ui.translationPage.sub,
    body,
    priceId: "translation",
    cta: ui.translationPage.cta,
  });
}

function businessPage(lang, ui) {
  const body = `<section class="sec"><div class="wrap"><div class="panel"><p>${esc(ui.businessPage.note)}</p></div><div class="area-spacing">${areaLine(ui, ui.area.service, ui.area.nationwideShort)}${areaNote(ui)}</div>${qualNote(ui)}</div></section><section class="sec alt"><div class="wrap">${stepsGrid(ui.steps)}</div></section>`;
  return `${pageHero(lang, ui, {
    crumbItems: [
      { path: "", label: ui.nav.home },
      { path: "business/", label: ui.nav.business },
    ],
    title: ui.businessPage.title,
    sub: ui.businessPage.sub,
    aside: "",
  })}${body}${priceSection(ui, "business")}${ctaBand(ui, ui.businessPage.cta)}`;
}

function aboutPage(lang, ui) {
  return `${pageHero(lang, ui, {
    crumbItems: [
      { path: "", label: ui.nav.home },
      { path: "about/", label: ui.nav.about },
    ],
    title: ui.aboutPage.title,
    sub: ui.aboutPage.sub,
    aside: "",
  })}
  <section class="sec"><div class="wrap"><div class="trust"><div class="card">${companyList(ui)}<p class="muted" style="margin-top:12px">${esc(ui.aboutPage.placeNote)} ${esc(ui.company.addressPlace)}</p></div>${qualNote(ui, "qualifications")}</div></div></section>
  <section class="sec alt" id="countries"><div class="wrap"><div class="sh"><p class="kicker">${esc(ui.home.areasKicker)}</p><h2>${esc(ui.home.areasTitle)}</h2></div>${areaTable(ui)}${areaNote(ui)}</div></section>
  ${ctaBand(ui, ui.menu.unsureTitle)}`;
}

function privacyPage(lang, ui) {
  return `${pageHero(lang, ui, {
    crumbItems: [
      { path: "", label: ui.nav.home },
      { path: "privacy/", label: ui.privacyPage.title },
    ],
    title: ui.privacyPage.title,
    sub: ui.privacyPage.paragraphs[0],
    aside: "",
  })}
  <section class="sec" id="contact"><div class="wrap"><div class="stack">${ui.privacyPage.paragraphs
    .slice(1)
    .map((paragraph) => `<p>${esc(paragraph)}</p>`)
    .join("")}<p><a class="link" href="${href(lang.id, "about/")}#qualifications">${esc(ui.footer.qual)}${icon("right")}</a></p><div class="card">${companyList(ui)}</div></div></div></section>`;
}

function mapPage(lang, ui) {
  const labels = {
    home: ui.nav.home,
    shipping: ui.nav.shipping,
    motorcycle: ui.nav.motorcycle,
    services: ui.nav.services,
    sim: ui.simPage.title,
    life: ui.lifePage.title,
    translation: ui.translationPage.title,
    business: ui.nav.business,
    about: ui.nav.about,
    privacy: ui.privacyPage.title,
    map: ui.mapPage.title,
  };
  return `${pageHero(lang, ui, {
    crumbItems: [
      { path: "", label: ui.nav.home },
      { path: "sitemap/", label: ui.mapPage.title },
    ],
    title: ui.mapPage.title,
    sub: ui.mapPage.sub,
    aside: "",
  })}
  <section class="sec" id="contact"><div class="wrap"><nav class="map-list" aria-label="${esc(ui.mapPage.title)}">${catalog.pages
    .map((page) => `<a href="${href(lang.id, page.path)}">${esc(labels[page.id])}</a>`)
    .join("")}</nav></div></section>`;
}

const pages = {
  home: homePage,
  shipping: shippingPage,
  motorcycle: motorcyclePage,
  services: servicesPage,
  sim: simPage,
  life: lifePage,
  translation: translationPage,
  business: businessPage,
  about: aboutPage,
  privacy: privacyPage,
  map: mapPage,
};

function jsonLd(lang, ui, pageId, description, canonical) {
  const data = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: catalog.brand.en,
    alternateName: [catalog.brand.zh, catalog.company.name],
    url: canonical,
    description,
    slogan: catalog.tagline,
    telephone: catalog.phoneTel,
    email: catalog.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: "通河東街一段200巷2號4樓",
      addressLocality: "士林區",
      addressRegion: "台北市",
      addressCountry: "TW",
    },
    areaServed: { "@type": "Country", name: "Taiwan" },
    knowsLanguage: catalog.langs.map((item) => item.html),
    sameAs: [catalog.line.url, ...catalog.socials.map((item) => item.url), ...(lang.secondaryChannel === "zalo" ? [catalog.zalo.url] : [])],
    parentOrganization: {
      "@type": "Organization",
      name: catalog.company.name,
      taxID: catalog.company.taxId,
    },
  };
  return jsonScript(data);
}

function shell(lang, ui, pageId, body) {
  const path = pagePath(pageId);
  const canonical = `${catalog.siteUrl}${href(lang.id, path)}`;
  const title = ui.meta[`${pageId}Title`] || ui.meta[pageId === "map" ? "mapTitle" : `${pageId}Title`];
  const description = ui.meta[`${pageId}Description`] || ui.meta[`${pageId}Description`];
  const metaTitle = ui.meta[`${pageId}Title`];
  const metaDescription = ui.meta[`${pageId}Description`];
  if (!metaTitle || !metaDescription) throw new Error(`Missing meta for ${lang.id} ${pageId}`);
  const config = {
    lang: lang.id,
    native: lang.native,
    defaultCountry: lang.defaultCountry,
    countries: ["ALL", ...catalog.countries.map((country) => country.id)],
    labels: ui.countries,
    live: ui.live,
    legacy: catalog.legacyHash,
    openMenu: ui.nav.openMenu,
    closeMenu: ui.nav.closeMenu,
    lineUrl: catalog.line.url,
  };
  return `<!DOCTYPE html>
<html lang="${esc(lang.html)}" data-lang="${esc(lang.id)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(metaTitle)}</title>
<meta name="description" content="${esc(metaDescription)}">
<link rel="canonical" href="${canonical}">
${hreflang(path)}
<meta property="og:type" content="website">
<meta property="og:locale" content="${esc(lang.og)}">
<meta property="og:site_name" content="${esc(catalog.brand.en)}">
<meta property="og:title" content="${esc(metaTitle)}">
<meta property="og:description" content="${esc(metaDescription)}">
<meta property="og:url" content="${canonical}">
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="#133447">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${fontHref}" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/site.css">
<script type="application/ld+json">${jsonLd(lang, ui, pageId, metaDescription, canonical)}</script>
</head>
<body data-page="${esc(pageId)}" data-default-country="${esc(lang.defaultCountry)}">
<a class="skip" href="#main">${esc(ui.skip)}</a>
${header(lang, ui, pageId)}
<main id="main" tabindex="-1">
${body}
</main>
${footer(lang, ui)}
${dock(ui)}
<div id="live" class="visually-hidden" aria-live="polite" aria-atomic="true"></div>
<script type="application/json" id="cp-config">${jsonScript(config)}</script>
<script src="/assets/js/site.js" defer></script>
</body>
</html>
`;
}

function render(lang, pageId) {
  const ui = locales[lang.id];
  return shell(lang, ui, pageId, pages[pageId](lang, ui));
}

function gate(notFound) {
  const links = catalog.langs
    .map(
      (lang) =>
        `<a class="glink" href="${href(lang.id, "")}" hreflang="${esc(lang.html)}" lang="${esc(lang.html)}" data-pick-lang="${esc(lang.id)}" data-default-country="${esc(lang.defaultCountry)}"><span>${esc(lang.native)}</span><span class="suggest-badge" hidden lang="${esc(lang.html)}">${esc(locales[lang.id].gate.suggest)}</span></a>`,
    )
    .join("");
  const phrases = catalog.langs
    .filter((lang) => lang.id !== "zh" && lang.id !== "en")
    .map((lang) => `<span lang="${esc(lang.html)}">${esc(locales[lang.id].gate.choose)}</span>`)
    .join("");
  const notes = catalog.langs
    .map((lang) => `<p data-gate-note="${esc(lang.id)}" lang="${esc(lang.html)}">${esc(locales[lang.id].gate.note)}</p>`)
    .join("");
  const missing = catalog.langs
    .map((lang) => `<span lang="${esc(lang.html)}">${esc(locales[lang.id].gate.notFound)}</span>`)
    .join("");
  const ids = catalog.langs.map((lang) => lang.id);
  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(locales.zh.gate.choose)}｜${esc(catalog.brand.en)}</title>
<meta name="description" content="${esc(locales.zh.gate.note)}">
${notFound ? '<meta name="robots" content="noindex">' : ""}
<link rel="canonical" href="${catalog.siteUrl}/">
${hreflang("")}
<meta property="og:title" content="${esc(catalog.brand.zh)} ${esc(catalog.brand.en)}">
<meta property="og:description" content="${esc(locales.en.gate.note)}">
<meta property="og:url" content="${catalog.siteUrl}/">
<meta property="og:type" content="website">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta name="theme-color" content="#133447">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${fontHref}" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/site.css">
${notFound ? "" : `<script>
try {
  var saved = localStorage.getItem("cp-lang");
  var allowed = ${JSON.stringify(ids)};
  if (allowed.indexOf(saved) !== -1 && location.pathname === "/") {
    location.replace("/" + saved + "/" + location.search + location.hash);
  }
} catch (error) {}
</script>`}
</head>
<body>
<a class="skip" href="#main">${esc(locales.zh.skip)}</a>
<main class="gate" id="main" tabindex="-1">
  <div class="gbox">
    <div style="display:flex;gap:10px;align-items:center"><span class="mark" lang="en">CP</span><div><b lang="zh-Hant" style="color:#133447">${esc(catalog.brand.zh)}</b><div lang="en" style="color:#0f6066;font-size:12px;font-weight:700;letter-spacing:.12em">${esc(catalog.brand.en)}</div></div></div>
    <h1 class="ghi"><span lang="zh-Hant">${esc(locales.zh.gate.choose)}</span> <span lang="en" style="color:#4d5e68;font-weight:600">/ ${esc(locales.en.gate.choose)}</span></h1>
    <p class="ghi2">${phrases}</p>
    ${notFound ? `<div class="not-found">${missing}</div>` : ""}
    <div class="glist">${links}</div>
    <div class="gnote">${icon("info")}<div>${notes}</div></div>
    <p class="gfoot">${esc(catalog.company.name)}｜${esc(locales.zh.hours)}｜LINE ${esc(catalog.line.id)}</p>
  </div>
</main>
<script type="application/json" id="cp-langs">${jsonScript(catalog.langs.map((lang) => ({ id: lang.id, html: lang.html, native: lang.native })))}</script>
<script src="/assets/js/site.js" defer></script>
</body>
</html>
`;
}

function listingsPage() {
  if (catalog.vehicles.enabled !== true) return;
  throw new Error("Vehicle listings are reserved. Add a renderer before enabling vehicles.");
}

listingsPage();

for (const lang of catalog.langs) {
  for (const page of catalog.pages) {
    const dir = join(root, lang.id, page.path);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "index.html"), render(lang, page.id));
  }
}
writeFileSync(join(root, "index.html"), gate(false));
writeFileSync(join(root, "404.html"), gate(true));

const urls = [catalog.siteUrl + "/", ...catalog.langs.flatMap((lang) => catalog.pages.map((page) => `${catalog.siteUrl}${href(lang.id, page.path)}`))];
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

console.log(`Built ${catalog.langs.length} languages × ${catalog.pages.length} pages, plus the language gate.`);
