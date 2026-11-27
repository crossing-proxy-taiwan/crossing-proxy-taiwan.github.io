const configNode = document.getElementById("cp-config");
if (configNode) {
  const config = JSON.parse(configNode.textContent);
  const showPlannedServices = config.showPlannedServices === true;
  const allowed = new Set(["all", "TW", "VN", "ID", "TH", "PH"]);
  const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  const campaignSources = new Set(["facebook", "instagram", "threads", "tiktok", "youtube", "line"]);
  const landingUtmSource = new URL(location.href).searchParams.has("utm_source")
    ? new URL(location.href).searchParams.get("utm_source")
    : null;
  let analyticsSite = "";
  const pendingEvents = [];

  try {
    localStorage.setItem("cp-lang", config.lang);
  } catch (error) {
    /* Private mode can block storage. The page still works. */
  }

  const menuButton = document.querySelector(".fold-button");
  const header = document.querySelector(".top");
  if (menuButton && header) {
    menuButton.addEventListener("click", () => {
      const open = header.classList.toggle("menu-open");
      menuButton.setAttribute("aria-expanded", open ? "true" : "false");
    });
    header.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        header.classList.remove("menu-open");
        menuButton.setAttribute("aria-expanded", "false");
      });
    });
  }

  const cards = [...document.querySelectorAll(".card")];
  const groups = [...document.querySelectorAll("[data-group]")];
  const openEmpty = document.getElementById("open-empty");
  const plannedEmpty = document.getElementById("planned-empty");
  const live = document.getElementById("filter-live");

  function pageCountry() {
    const fromPage = document.documentElement.dataset.country || config.country || "all";
    return allowed.has(fromPage) ? fromPage : "all";
  }

  function countryName(code) {
    return config.countries[code] || code;
  }

  function matchesCountry(card, country) {
    if (!showPlannedServices && card.dataset.status === "planned") return false;
    const list = (card.dataset.countries || "").split(",");
    if (country === "all") return list.includes("*");
    return list.includes("*") || list.includes(country);
  }

  function safeUtm(value) {
    return typeof value === "string" && /^[A-Za-z0-9._~-]{1,64}$/.test(value) && !/\d{6,}/.test(value);
  }

  function acceptedSite(site) {
    if (typeof site !== "string") return "";
    const code = site.trim();
    if (!/^[a-z0-9](?:[a-z0-9-]{0,28}[a-z0-9])?$/.test(code)) return "";
    if (/^[0-9a-f]{16,}$/.test(code)) return "";
    if (code.startsWith("sk-") || code.includes("secret") || code.includes("token") || code.includes("password")) return "";
    return code;
  }

  function publicSearch(country) {
    const current = new URL(location.href);
    const keep = new URLSearchParams();
    keep.set("country", country);
    utmKeys.forEach((key) => {
      const value = current.searchParams.get(key);
      if (safeUtm(value)) keep.set(key, value);
    });
    return keep.toString();
  }

  function applyFilters() {
    const country = pageCountry();
    cards.forEach((card) => {
      card.hidden = !matchesCountry(card, country);
    });
    groups.forEach((group) => {
      const groupCards = [...group.querySelectorAll(".card")];
      group.hidden = groupCards.length > 0 && groupCards.every((card) => card.hidden);
    });
    const openVisible = cards.some((card) => card.closest("#services") && !card.hidden);
    const plannedVisible = cards.some((card) => card.closest("#planned") && !card.hidden);
    if (openEmpty) openEmpty.hidden = openVisible;
    if (plannedEmpty) plannedEmpty.hidden = plannedVisible;
    syncQuickLinks();
    document.documentElement.setAttribute("data-country", country);
    if (live) live.textContent = config.filterLive.replace("{name}", countryName(country));
    try {
      localStorage.setItem("cp-country", country);
    } catch (error) {
      /* Ignore storage failures. */
    }
    const url = new URL(location.href);
    const next = `${url.pathname}?${publicSearch(country)}${url.hash}`;
    if (`${url.pathname}${url.search}${url.hash}` !== next) {
      history.replaceState(null, "", next);
    }
  }

  function syncQuickLinks() {
    document.querySelectorAll("[data-quick-group]").forEach((link) => {
      const id = link.dataset.quickGroup;
      const open = document.getElementById(`group-${id}-open`);
      const planned = document.getElementById(`group-${id}-planned`);
      const openOk = open && !open.hidden;
      const plannedOk = showPlannedServices && planned && !planned.hidden;
      if (openOk) {
        link.hidden = false;
        link.setAttribute("href", `#group-${id}-open`);
      } else if (plannedOk) {
        link.hidden = false;
        link.setAttribute("href", `#group-${id}-planned`);
      } else {
        link.hidden = true;
        link.removeAttribute("href");
      }
    });
  }

  applyFilters();

  const langRoot = document.querySelector(".lang");
  const langToggle = document.querySelector(".lang-toggle");
  const langMenu = document.getElementById("lang-menu");
  if (langRoot && langToggle && langMenu) {
    const options = [...langMenu.querySelectorAll("[data-lang-switch]")];
    function setLangOpen(open) {
      langToggle.setAttribute("aria-expanded", open ? "true" : "false");
      langMenu.hidden = !open;
    }
    langToggle.addEventListener("click", () => {
      setLangOpen(langToggle.getAttribute("aria-expanded") !== "true");
    });
    langToggle.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && langToggle.getAttribute("aria-expanded") === "true") {
        event.preventDefault();
        setLangOpen(false);
        return;
      }
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      event.preventDefault();
      setLangOpen(true);
      const target = event.key === "ArrowUp" ? options[options.length - 1] : options[0];
      if (target) target.focus();
    });
    langMenu.addEventListener("keydown", (event) => {
      const index = options.indexOf(document.activeElement);
      if (event.key === "Escape") {
        event.preventDefault();
        setLangOpen(false);
        langToggle.focus();
        return;
      }
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key) || index < 0) return;
      event.preventDefault();
      let next = index;
      if (event.key === "ArrowDown") next = (index + 1) % options.length;
      if (event.key === "ArrowUp") next = (index - 1 + options.length) % options.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = options.length - 1;
      options[next].focus();
    });
    document.addEventListener("click", (event) => {
      if (!langRoot.contains(event.target)) setLangOpen(false);
    });
    langRoot.addEventListener("focusout", (event) => {
      if (!langRoot.contains(event.relatedTarget)) setLangOpen(false);
    });
  }

  document.querySelectorAll("[data-lang-switch]").forEach((link) => {
    link.addEventListener("click", () => {
      const url = new URL(link.getAttribute("href"), location.origin);
      if (location.hash) url.hash = location.hash;
      const current = new URL(location.href);
      utmKeys.forEach((key) => {
        const value = current.searchParams.get(key);
        if (safeUtm(value)) url.searchParams.set(key, value);
      });
      link.href = url.pathname + url.search + url.hash;
    });
  });

  document.querySelectorAll("[data-toggle-more]").forEach((button) => {
    button.addEventListener("click", () => {
      const panel = document.getElementById(button.getAttribute("aria-controls"));
      if (!panel) return;
      const open = panel.hidden;
      panel.hidden = !open;
      button.setAttribute("aria-expanded", open ? "true" : "false");
      if (!open) return;
      const card = button.closest("[data-service]");
      track("service-open", { service: card ? card.dataset.service : "" });
    });
  });

  document.querySelectorAll('a[href^="#service-"]').forEach((link) => {
    link.addEventListener("click", () => {
      track("service-open", { service: (link.getAttribute("href") || "").replace("#service-", "") });
    });
  });

  function isOfficialLine(href) {
    try {
      const url = new URL(href, location.origin);
      const official = new URL(config.lineUrl, location.origin);
      return url.origin === official.origin && url.pathname === official.pathname;
    } catch (error) {
      return false;
    }
  }

  document.querySelectorAll("a[href]").forEach((link) => {
    if (!isOfficialLine(link.getAttribute("href"))) return;
    link.addEventListener("click", () => {
      const card = link.closest("[data-service]");
      let service = "none";
      if (card && Object.prototype.hasOwnProperty.call(config.services, card.dataset.service)) {
        service = card.dataset.service;
      } else if (link.id === "inquiry-line" && Object.prototype.hasOwnProperty.call(config.services, activeService)) {
        service = activeService;
      }
      track("line-click", { service: service });
    });
  });

  const dialog = document.getElementById("inquiry");
  const form = document.getElementById("inquiry-form");
  const intro = document.getElementById("inquiry-intro");
  const meta = document.getElementById("inquiry-meta");
  const fields = document.getElementById("inquiry-fields");
  const output = document.getElementById("inquiry-output");
  const copyButton = document.getElementById("inquiry-copy");
  const status = document.getElementById("inquiry-status");
  let lastFocus = null;
  let activeService = "general";

  function currentCountry() {
    return pageCountry();
  }

  function profileFor(serviceId) {
    if (serviceId === "general") return { id: "general", profile: config.inquiry.profiles.general, title: "", status: "" };
    const service = config.services[serviceId];
    const profileName = service ? service.inquiry : "general";
    return {
      id: serviceId,
      profile: config.inquiry.profiles[profileName] || config.inquiry.profiles.general,
      title: service ? service.title : "",
      status: service ? service.status : "",
    };
  }

  function fieldsFor(profile) {
    const list = profile.fields.map((field) => ({ ...field }));
    if (!list.some((field) => field.id === "nationality") && config.inquiry.shared) {
      list.unshift(config.inquiry.shared.nationality);
    }
    if (!list.some((field) => field.id === "city") && config.inquiry.shared) {
      const index = list.findIndex((field) => field.id === "nationality");
      list.splice(index + 1, 0, config.inquiry.shared.city);
    }
    return list;
  }

  const cityIds = new Set((config.cities || []).map((city) => city.id));

  function fieldText(field) {
    if (field.tagName === "SELECT") {
      const option = field.selectedOptions && field.selectedOptions[0];
      if (!option || !option.value) return config.inquiry.blank;
      return option.textContent.trim();
    }
    const value = field.value.trim();
    return value || config.inquiry.blank;
  }

  function looksSensitive(text) {
    let scan = String(text || "");
    if (config.lineId) scan = scan.split(config.lineId).join(" ");
    scan = scan.replace(/@681ydjcz/gi, " ");
    scan = scan.replace(/\d{4}\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*日/g, " ");
    scan = scan.replace(/\d{4}\s*年\s*\d{1,2}\s*月/g, " ");
    scan = scan.replace(/\d{1,2}\s*月\s*\d{1,2}\s*日/g, " ");
    scan = scan.replace(/\b\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\b/g, " ");
    scan = scan.replace(/\b\d{1,2}[-/.]\d{1,2}[-/.]\d{4}\b/g, " ");
    scan = scan.replace(/\b\d{4}[-/.]\d{1,2}\b/g, " ");
    scan = scan.replace(/\b(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\b/g, " ");
    scan = scan.replace(/(?:NT\$|TWD|USD|\$|＄)\s*\d{1,3}(?:,\d{3})*(?:\.\d+)?/gi, " ");
    scan = scan.replace(/(?:NT\$|TWD|USD|\$|＄)\s*\d+(?:\.\d+)?/gi, " ");
    scan = scan.replace(/\b\d{1,3}(?:,\d{3})+(?:\.\d+)?\s*(?:元|塊)?/g, " ");
    scan = scan.replace(/\b\d+(?:\.\d+)?\s*元/g, " ");
    scan = scan.replace(/(?:\+?886[-\s]?|0)9\d{2}[-\s]?\d{3}[-\s]?\d{3}/g, " ");
    scan = scan.replace(/\b09\d{8}\b/g, " ");
    scan = scan.replace(/\b0\d{1,2}[-\s]\d{3,4}[-\s]\d{4}\b/g, " ");
    scan = scan.replace(/\+\d{8,15}\b/g, " ");
    scan = scan.replace(/(?:訂單|單號|order|ord|no\.?|#)\s*[:：]?\s*[A-Z0-9-]{4,}/gi, " ");
    if (/\b[A-Z][1289]\d{8}\b/i.test(scan)) return true;
    if (/\b[A-Z]{2}\d{8}\b/i.test(scan)) return true;
    if (/\b[A-Z]{1,2}\d{7,9}\b/i.test(scan)) return true;
    return /\b\d{9}\b/.test(scan);
  }

  function enteredText() {
    return [...fields.querySelectorAll("input, textarea")]
      .map((field) => field.value)
      .join("\n");
  }

  function renderOutput() {
    const current = profileFor(activeService);
    const lines = ["CROSSING PROXY", `${config.inquiry.language}: ${config.langNative}`];
    if (current.title) {
      lines.push(`${config.inquiry.service}: ${current.title}`);
      lines.push(`${config.inquiry.status}: ${current.status}`);
    }
    fields.querySelectorAll("input, textarea, select").forEach((field) => {
      if (field.type === "checkbox") return;
      lines.push(`${field.dataset.label}: ${fieldText(field)}`);
    });
    lines.push(config.lineId);
    lines.push(config.inquiry.notSent);
    output.value = lines.join("\n");
    const sensitive = looksSensitive(enteredText());
    output.dataset.sensitive = sensitive ? "true" : "false";
    if (sensitive) status.textContent = config.inquiry.sensitiveBlock;
    else if (status.textContent === config.inquiry.sensitiveBlock) status.textContent = "";
  }

  function copyBlockedReason() {
    if (output.dataset.sensitive === "true") return config.inquiry.sensitiveBlock;
    const confirm = document.getElementById("inquiry-confirm");
    if (!confirm || !confirm.checked) return config.inquiry.confirmRequired;
    return "";
  }

  function makeControl(field) {
    if (field.id === "city" && cityIds.size) {
      const select = document.createElement("select");
      const blank = document.createElement("option");
      blank.value = "";
      blank.textContent = config.inquiry.selectPlaceholder;
      select.append(blank);
      config.cities.forEach((city) => {
        const node = document.createElement("option");
        node.value = city.id;
        node.textContent = city.label;
        select.append(node);
      });
      return select;
    }
    if (field.type === "select") {
      const select = document.createElement("select");
      const blank = document.createElement("option");
      blank.value = "";
      blank.textContent = config.inquiry.selectPlaceholder;
      select.append(blank);
      (field.options || []).forEach((option) => {
        const node = document.createElement("option");
        node.value = option.label;
        node.textContent = option.label;
        select.append(node);
      });
      return select;
    }
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = field.placeholder || "";
    input.autocomplete = "off";
    return input;
  }

  function openInquiry(serviceId) {
    activeService = serviceId;
    const current = profileFor(serviceId);
    intro.textContent = current.profile.intro;
    const bits = [];
    if (current.title) bits.push(`${config.inquiry.service}: ${current.title}`);
    if (current.status) bits.push(`${config.inquiry.status}: ${current.status}`);
    bits.push(`${config.inquiry.language}: ${config.langNative}`);
    meta.textContent = bits.join(" · ");
    fields.replaceChildren();
    const country = currentCountry();
    fieldsFor(current.profile).forEach((field) => {
      const wrap = document.createElement("label");
      wrap.className = "field";
      const name = document.createElement("span");
      name.textContent = field.label;
      const control = makeControl(field);
      control.name = field.id;
      control.dataset.label = field.label;
      if (field.id === "nationality" && ["VN", "ID", "TH", "PH"].includes(country)) {
        control.value = countryName(country);
      }
      if (field.id === "city") {
        try {
          const saved = localStorage.getItem("cp-city") || "";
          if (cityIds.has(saved)) control.value = saved;
          else localStorage.removeItem("cp-city");
        } catch (error) {
          /* Ignore storage failures. */
        }
        control.addEventListener("change", () => {
          try {
            if (cityIds.has(control.value)) localStorage.setItem("cp-city", control.value);
            else localStorage.removeItem("cp-city");
          } catch (error) {
            /* Ignore storage failures. */
          }
          renderOutput();
        });
      }
      control.addEventListener("input", renderOutput);
      control.addEventListener("change", renderOutput);
      wrap.append(name, control);
      fields.append(wrap);
    });
    const confirmBox = document.getElementById("inquiry-confirm");
    if (confirmBox) confirmBox.checked = false;
    status.textContent = "";
    renderOutput();
    lastFocus = document.activeElement;
    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else dialog.setAttribute("open", "");
    const first = fields.querySelector("input, select");
    if (first) first.focus();
    track("inquiry-open", { service: serviceId });
  }

  document.querySelectorAll("[data-open-inquiry]").forEach((button) => {
    button.addEventListener("click", () => openInquiry(button.dataset.openInquiry));
  });

  if (dialog) {
    dialog.addEventListener("close", () => {
      if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    });
  }

  if (form) {
    form.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && event.target.matches("input")) event.preventDefault();
    });
  }

  const lineButton = document.getElementById("inquiry-line");
  if (lineButton) {
    lineButton.addEventListener("click", (event) => {
      renderOutput();
      const reason = copyBlockedReason();
      if (!reason) return;
      event.preventDefault();
      status.textContent = reason;
      status.scrollIntoView({ block: "nearest" });
    });
  }

  if (copyButton) {
    copyButton.addEventListener("click", async () => {
      renderOutput();
      const reason = copyBlockedReason();
      if (reason) {
        status.textContent = reason;
        status.scrollIntoView({ block: "nearest" });
        return;
      }
      let copied = false;
      try {
        await navigator.clipboard.writeText(output.value);
        copied = true;
      } catch (error) {
        output.focus();
        output.select();
        copied = document.execCommand("copy");
      }
      status.textContent = copied ? config.inquiry.copied : config.inquiry.copyFailed;
      status.scrollIntoView({ block: "nearest" });
    });
  }

  function sendEvent(vars) {
    if (document.documentElement.dataset.analytics === "off") return;
    if (analyticsSite && window.goatcounter && typeof window.goatcounter.count === "function") {
      window.goatcounter.count(vars);
      return;
    }
    if (pendingEvents.length < 20) pendingEvents.push(vars);
  }

  function attributionSource() {
    const params = new URL(location.href).searchParams;
    if (params.has("utm_source")) {
      const value = params.get("utm_source");
      return campaignSources.has(value) ? value : "direct";
    }
    try {
      const stored = sessionStorage.getItem("cp-utm-source");
      if (campaignSources.has(stored)) return stored;
    } catch (error) {
      /* Private mode can block sessionStorage. */
    }
    return "direct";
  }

  function rememberCampaign() {
    try {
      if (landingUtmSource !== null && !campaignSources.has(landingUtmSource)) {
        sessionStorage.removeItem("cp-utm-source");
        sessionStorage.removeItem("cp-utm-campaign");
        return;
      }
      const current = new URL(location.href);
      const source = current.searchParams.get("utm_source");
      const campaign = current.searchParams.get("utm_campaign");
      if (campaignSources.has(source)) sessionStorage.setItem("cp-utm-source", source);
      if (safeUtm(campaign)) sessionStorage.setItem("cp-utm-campaign", campaign);
    } catch (error) {
      /* Private mode can block sessionStorage. Events still use the URL. */
    }
  }

  function track(name, detail) {
    if (name !== "service-open" && name !== "inquiry-open" && name !== "line-click") return;
    if (!/^(zh|en|vi|id|th|fil)$/.test(config.lang)) return;
    const source = attributionSource();
    if (!campaignSources.has(source) && source !== "direct") return;
    let service = detail && detail.service ? String(detail.service) : "";
    if (name === "line-click") {
      if (service !== "none" && !Object.prototype.hasOwnProperty.call(config.services, service)) service = "none";
      if (!service) service = "none";
    } else if (!Object.prototype.hasOwnProperty.call(config.services, service)) {
      return;
    }
    const path = `${name}:${config.lang}:${service}:${source}`;
    sendEvent({ path, title: path, event: true, referrer: "", no_session: true });
  }

  function loadAnalytics(data) {
    const site = acceptedSite(data && data.site);
    if (!data || data.provider !== "goatcounter" || !site) {
      pendingEvents.length = 0;
      document.documentElement.dataset.analytics = "off";
      return;
    }
    rememberCampaign();
    if (document.querySelector("script[data-goatcounter]")) return;
    analyticsSite = site;
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://gc.zgo.at/count.js";
    script.dataset.goatcounter = `https://${site}.goatcounter.com/count`;
    script.addEventListener("load", () => {
      if (!window.goatcounter || typeof window.goatcounter.count !== "function") return;
      while (pendingEvents.length) window.goatcounter.count(pendingEvents.shift());
    });
    document.body.appendChild(script);
    document.documentElement.dataset.analytics = "on";
  }

  fetch("/data/analytics.json")
    .then((response) => (response.ok ? response.json() : null))
    .then((data) => loadAnalytics(data))
    .catch(() => {
      document.documentElement.dataset.analytics = "off";
    });
}
