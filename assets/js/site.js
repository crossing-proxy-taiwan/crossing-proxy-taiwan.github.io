const configNode = document.getElementById("cp-config");
const langsNode = document.getElementById("cp-langs");

function readStore(key) {
  try {
    return localStorage.getItem(key) || "";
  } catch (error) {
    return "";
  }
}

function writeStore(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    /* Private mode can block storage. The page still works. */
  }
}

function matchBrowser(list) {
  const codes = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ""];
  for (const code of codes) {
    const value = String(code || "").toLowerCase();
    if (value.startsWith("zh")) return "zh";
    if (value.startsWith("vi")) return "vi";
    if (value.startsWith("id")) return "id";
    if (value.startsWith("th")) return "th";
    if (value.startsWith("fil") || value.startsWith("tl")) return "fil";
    if (value.startsWith("hi")) return "hi";
    if (value.startsWith("en")) return "en";
  }
  return list[0] ? list[0].id : "";
}

if (langsNode) {
  const langs = JSON.parse(langsNode.textContent);
  const suggested = matchBrowser(langs);
  document.querySelectorAll("[data-pick-lang]").forEach((link) => {
    const badge = link.querySelector(".suggest-badge");
    if (badge && link.dataset.pickLang === suggested) {
      badge.hidden = false;
      link.classList.add("sug");
    }
    link.addEventListener("click", () => {
      writeStore("cp-lang", link.dataset.pickLang);
      writeStore("cp-country", link.dataset.defaultCountry || "ALL");
      writeStore("cp-country-source", "lang");
    });
  });
  document.querySelectorAll(`[data-gate-note="${suggested}"]`).forEach((note) => note.classList.add("show"));
}

if (configNode) {
  const config = JSON.parse(configNode.textContent);
  const live = document.getElementById("live");
  const header = document.querySelector(".top");
  const countryName = document.getElementById("country-name");

  writeStore("cp-lang", config.lang);

  const allowed = new Set(config.countries);
  const url = new URL(location.href);
  const fromUrl = url.searchParams.get("country");
  let country = "";
  let source = readStore("cp-country-source") || "lang";
  if (fromUrl && allowed.has(fromUrl)) {
    country = fromUrl;
    source = "user";
    writeStore("cp-country", country);
    writeStore("cp-country-source", "user");
  } else {
    const stored = readStore("cp-country");
    if (stored && allowed.has(stored)) country = stored;
    else {
      country = config.defaultCountry;
      source = "lang";
      writeStore("cp-country", country);
      writeStore("cp-country-source", "lang");
    }
  }

  function say(message) {
    if (!live) return;
    live.textContent = "";
    window.setTimeout(() => {
      live.textContent = message;
    }, 40);
  }

  function fill(template, name) {
    return template.replace("{name}", name);
  }

  function applyCountry(announce) {
    const name = config.labels[country] || country;
    document.querySelectorAll("[data-country-press]").forEach((button) => {
      const on = button.dataset.countryPress === country;
      button.setAttribute("aria-pressed", on ? "true" : "false");
    });
    document.querySelectorAll("[data-reorder]").forEach((group) => {
      const items = [...group.children];
      items.sort((a, b) => {
        const aHit = a.dataset.country === country && country !== "ALL" ? 0 : 1;
        const bHit = b.dataset.country === country && country !== "ALL" ? 0 : 1;
        const aOrder = Number(a.dataset.order || 0);
        const bOrder = Number(b.dataset.order || 0);
        return aHit - bHit || aOrder - bOrder;
      });
      items.forEach((item) => group.appendChild(item));
    });
    document.querySelectorAll("[data-country]").forEach((node) => {
      if (!node.dataset.order) return;
      node.classList.toggle("is-current", country !== "ALL" && node.dataset.country === country);
    });
    if (countryName) countryName.textContent = name;
    const noticeCountry = country === "ALL" ? config.countries.find((item) => item !== "ALL") : country;
    const notice = document.getElementById("notice-current");
    if (notice) notice.textContent = config.labels[noticeCountry] || name;
    document.querySelectorAll("[data-notice]").forEach((button) => {
      const on = button.dataset.notice === noticeCountry;
      button.setAttribute("aria-pressed", on ? "true" : "false");
      button.classList.toggle("on", on);
    });
    if (announce) say(fill(config.live.country, name));
  }

  applyCountry(false);
  window.setTimeout(() => say(fill(config.live.language, config.native)), 300);

  document.querySelectorAll("[data-country-press]").forEach((button) => {
    button.addEventListener("click", () => {
      country = button.dataset.countryPress;
      source = "user";
      writeStore("cp-country", country);
      writeStore("cp-country-source", "user");
      const next = new URL(location.href);
      if (country === "ALL") next.searchParams.delete("country");
      else next.searchParams.set("country", country);
      history.replaceState(null, "", next.pathname + next.search + next.hash);
      applyCountry(true);
    });
  });

  document.querySelectorAll("[data-notice]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-notice]").forEach((item) => {
        const on = item === button;
        item.setAttribute("aria-pressed", on ? "true" : "false");
        item.classList.toggle("on", on);
      });
      const notice = document.getElementById("notice-current");
      if (notice) notice.textContent = config.labels[button.dataset.notice] || "";
    });
  });

  document.querySelectorAll("[data-lang]").forEach((link) => {
    link.addEventListener("click", () => {
      const id = link.dataset.lang;
      const fallback = link.dataset.defaultCountry || "ALL";
      writeStore("cp-lang", id);
      if (source !== "user") {
        writeStore("cp-country", fallback);
        writeStore("cp-country-source", "lang");
      } else if (country && country !== "ALL") {
        const href = new URL(link.getAttribute("href"), location.origin);
        href.searchParams.set("country", country);
        if (location.hash) href.hash = location.hash;
        link.href = href.pathname + href.search + href.hash;
      } else if (location.hash) {
        const href = new URL(link.getAttribute("href"), location.origin);
        href.hash = location.hash;
        link.href = href.pathname + href.search + href.hash;
      }
    });
  });

  const panels = [
    ["mega", "[data-open='mega']"],
    ["lang-panel", "[data-open='lang-panel']"],
    ["mobile-menu", "[data-open='mobile-menu']"],
  ];

  function closePanels(except) {
    panels.forEach(([id]) => {
      if (id === except) return;
      const panel = document.getElementById(id);
      if (!panel || panel.hidden) return;
      panel.hidden = true;
      document.querySelectorAll(`[data-open='${id}']`).forEach((button) => button.setAttribute("aria-expanded", "false"));
    });
    document.body.classList.remove("menu-open");
    updateDock();
    const menuButton = document.querySelector("[data-open='mobile-menu']");
    if (menuButton && document.getElementById("mobile-menu")?.hidden) {
      menuButton.setAttribute("aria-label", config.openMenu);
    }
  }

  function toggle(id, button) {
    const panel = document.getElementById(id);
    if (!panel) return;
    const willOpen = panel.hidden;
    closePanels(willOpen ? id : "");
    panel.hidden = !willOpen;
    document.querySelectorAll(`[data-open='${id}']`).forEach((item) => item.setAttribute("aria-expanded", willOpen ? "true" : "false"));
    if (id === "mobile-menu") {
      document.body.classList.toggle("menu-open", willOpen);
      button.setAttribute("aria-label", willOpen ? config.closeMenu : config.openMenu);
    }
    updateDock();
    if (willOpen) {
      const focusable = panel.querySelector("a, button");
      if (focusable) focusable.focus();
    }
  }

  document.querySelectorAll("[data-open]").forEach((button) => {
    button.addEventListener("click", () => toggle(button.dataset.open, button));
  });

  document.querySelectorAll("[data-fold]").forEach((button) => {
    button.addEventListener("click", () => {
      const panel = document.getElementById(button.dataset.fold);
      if (!panel) return;
      const willOpen = panel.hidden;
      panel.hidden = !willOpen;
      button.setAttribute("aria-expanded", willOpen ? "true" : "false");
      const mark = button.querySelector("span");
      if (mark) mark.textContent = willOpen ? "–" : "+";
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const opener = document.querySelector("[aria-expanded='true']");
      closePanels("");
      if (opener) opener.focus();
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const panel = [...document.querySelectorAll("#mega, #lang-panel, #mobile-menu")].find((item) => !item.hidden);
    if (!panel || !panel.contains(document.activeElement)) return;
    const items = [...panel.querySelectorAll("a, button")].filter((item) => !item.hidden && item.getClientRects().length);
    const index = items.indexOf(document.activeElement);
    if (index < 0) return;
    event.preventDefault();
    const next = event.key === "ArrowDown" ? (index + 1) % items.length : (index - 1 + items.length) % items.length;
    items[next].focus();
  });

  document.addEventListener("click", (event) => {
    if (!header) return;
    if (header.contains(event.target)) return;
    closePanels("");
  });

  document.querySelectorAll("[role='tablist']").forEach((list) => {
    const tabs = [...list.querySelectorAll("[role='tab']")];
    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => selectTab(tabs, tab));
      tab.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft" && event.key !== "Home" && event.key !== "End") return;
        event.preventDefault();
        let next = index;
        if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
        if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = tabs.length - 1;
        selectTab(tabs, tabs[next]);
        tabs[next].focus();
      });
    });
  });

  function selectTab(tabs, tab) {
    tabs.forEach((item) => {
      const on = item === tab;
      item.setAttribute("aria-selected", on ? "true" : "false");
      item.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(item.getAttribute("aria-controls"));
      if (panel) panel.hidden = !on;
    });
  }

  const nav = document.querySelector(".nav");
  function measure() {
    if (!header || !nav) return;
    const mobile = window.matchMedia("(max-width: 1039px)").matches;
    header.classList.remove("collapsed", "tight");
    if (mobile) return;
    if (nav.scrollWidth > nav.clientWidth + 1) header.classList.add("collapsed");
    const bar = header.querySelector(".bar");
    if (bar && bar.scrollWidth > bar.clientWidth + 1) header.classList.add("tight");
  }
  measure();
  window.addEventListener("resize", measure);
  if (window.ResizeObserver && nav) new ResizeObserver(measure).observe(nav);

  const heroCta = document.querySelector("[data-hero-cta]");
  const contact = document.getElementById("contact");
  let heroGone = false;
  let contactSeen = false;
  function updateDock() {
    const mobile = window.matchMedia("(max-width: 1039px)").matches;
    document.body.classList.toggle("dock-on", mobile && heroGone && !contactSeen && !document.body.classList.contains("menu-open"));
  }
  if (heroCta && "IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        heroGone = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      });
      updateDock();
    }).observe(heroCta);
  }
  if (contact && "IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      contactSeen = entries.some((entry) => entry.isIntersecting);
      updateDock();
    }, { rootMargin: "0px 0px -70px 0px" }).observe(contact);
  }
  window.addEventListener("resize", updateDock);

  const retired = config.legacy || {};
  const hash = location.hash.replace("#", "");
  if (hash && retired[hash] && !document.getElementById(hash)) {
    location.replace(`${location.pathname}${location.search}#${retired[hash]}`);
  }
}
