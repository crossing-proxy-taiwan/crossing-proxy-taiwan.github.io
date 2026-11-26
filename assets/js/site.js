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

  const radios = [...document.querySelectorAll(".flag-btn")];
  const cards = [...document.querySelectorAll(".card")];
  const groups = [...document.querySelectorAll("[data-group]")];
  const openEmpty = document.getElementById("open-empty");
  const plannedEmpty = document.getElementById("planned-empty");
  const live = document.getElementById("filter-live");
  const countryJump = document.getElementById("country-jump");

  function readCountry() {
    const fromUrl = new URL(location.href).searchParams.get("country");
    let stored = "";
    try {
      stored = localStorage.getItem("cp-country") || "";
    } catch (error) {
      stored = "";
    }
    const value = fromUrl || stored || "all";
    return allowed.has(value) ? value : "all";
  }

  function countryName(code) {
    return config.countries[code] || code;
  }

  function matchesCountry(card, country) {
    if (!showPlannedServices && card.dataset.status === "planned") return false;
    if (country === "all") return true;
    const list = card.dataset.countries.split(",");
    return list.includes("*") || list.includes(country);
  }

  function applyFilters(persistCountry) {
    const selected = document.querySelector('.flag-btn[aria-checked="true"]');
    const country = selected ? selected.dataset.country : "all";
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
    if (country === "all") document.documentElement.removeAttribute("data-country");
    else document.documentElement.setAttribute("data-country", country);
    const name = countryName(country);
    if (countryJump) {
      countryJump.textContent = name;
      countryJump.setAttribute("aria-label", config.countryNow.replace("{name}", name));
    }
    if (live) live.textContent = config.filterLive.replace("{name}", name);
    radios.forEach((radio) => {
      const on = radio.dataset.country === country;
      radio.setAttribute("aria-checked", on ? "true" : "false");
      radio.tabIndex = on ? 0 : -1;
    });
    if (!persistCountry) return;
    try {
      localStorage.setItem("cp-country", country);
    } catch (error) {
      /* Ignore storage failures. */
    }
    const url = new URL(location.href);
    if (country === "all") url.searchParams.delete("country");
    else url.searchParams.set("country", country);
    history.replaceState(null, "", url.pathname + url.search + url.hash);
    track("country_change", { country });
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

  function selectCountry(code, persist) {
    const match = radios.find((radio) => radio.dataset.country === code) || radios[0];
    radios.forEach((radio) => radio.setAttribute("aria-checked", radio === match ? "true" : "false"));
    applyFilters(persist);
  }

  if (radios.length) {
    selectCountry(readCountry(), false);
    radios.forEach((radio, index) => {
      radio.addEventListener("click", () => selectCountry(radio.dataset.country, true));
      radio.addEventListener("keydown", (event) => {
        const key = event.key;
        if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"].includes(key)) return;
        event.preventDefault();
        let next = index;
        if (key === "ArrowRight" || key === "ArrowDown") next = (index + 1) % radios.length;
        if (key === "ArrowLeft" || key === "ArrowUp") next = (index - 1 + radios.length) % radios.length;
        if (key === "Home") next = 0;
        if (key === "End") next = radios.length - 1;
        radios[next].focus();
        selectCountry(radios[next].dataset.country, true);
      });
    });
  }

  document.querySelectorAll("[data-lang-switch]").forEach((link) => {
    link.addEventListener("click", () => {
      const url = new URL(link.getAttribute("href"), location.origin);
      const country = new URL(location.href).searchParams.get("country");
      if (country) url.searchParams.set("country", country);
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
    const selected = document.querySelector('.flag-btn[aria-checked="true"]');
    return selected ? selected.dataset.country : "all";
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
    return /\d{6,}/.test(scan);
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
