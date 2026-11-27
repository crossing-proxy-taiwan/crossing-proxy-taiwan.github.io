const configNode = document.getElementById("cp-config");
if (configNode) {
  const config = JSON.parse(configNode.textContent);
  const showPlannedServices = config.showPlannedServices === true;
  const analytics = { enabled: false, endpoint: "" };
  const allowed = new Set(["all", "TW", "VN", "ID", "TH", "PH"]);

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
    if (url.searchParams.get("country") !== country) {
      url.searchParams.set("country", country);
      history.replaceState(null, "", url.pathname + url.search + url.hash);
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
      link.href = url.pathname + url.search + url.hash;
      track("language_switch", { to: url.pathname });
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
      track("service_open", { service: card ? card.dataset.service : "" });
    });
  });

  document.querySelectorAll("[data-channel]").forEach((link) => {
    link.addEventListener("click", () => track("contact_channel", { channel: link.dataset.channel }));
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
    track(serviceId === "b2b-life" ? "enterprise_inquiry" : "inquiry_open", { service: serviceId });
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
      if (copied) track("inquiry_copy", { service: activeService });
    });
  }

  function track(name, detail) {
    if (!analytics.enabled || !analytics.endpoint) return;
    const payload = {
      event: name,
      lang: config.lang,
      service: detail && detail.service ? detail.service : "",
      country: currentCountry(),
      channel: detail && detail.channel ? detail.channel : "",
      to: detail && detail.to ? detail.to : "",
    };
    if (navigator.sendBeacon) {
      navigator.sendBeacon(analytics.endpoint, new Blob([JSON.stringify(payload)], { type: "application/json" }));
    }
  }

  fetch("/data/analytics.json")
    .then((response) => (response.ok ? response.json() : null))
    .then((data) => {
      if (!data || data.enabled !== true || !data.endpoint) return;
      analytics.enabled = true;
      analytics.endpoint = data.endpoint;
      track("page_view");
    })
    .catch(() => {
      /* Analytics stays off when it is not configured. */
    });
}
