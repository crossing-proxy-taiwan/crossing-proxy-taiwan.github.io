const configNode = document.getElementById("cp-config");
if (configNode) {
  const config = JSON.parse(configNode.textContent);
  const analytics = { enabled: false, endpoint: "" };

  try {
    localStorage.setItem("cp-lang", config.lang);
  } catch (error) {
    /* Private mode can block storage. The page still works. */
  }

  const countrySelect = document.getElementById("country");
  const cards = [...document.querySelectorAll("[data-countries]")];

  function readCountry() {
    const fromUrl = new URL(location.href).searchParams.get("country");
    let stored = "";
    try {
      stored = localStorage.getItem("cp-country") || "";
    } catch (error) {
      stored = "";
    }
    const value = fromUrl || stored || "all";
    const allowed = new Set(["all", "VN", "ID", "TH", "PH"]);
    return allowed.has(value) ? value : "all";
  }

  function applyCountry(value, persist) {
    cards.forEach((card) => {
      const list = card.dataset.countries.split(",");
      card.hidden = !(value === "all" || list.includes("*") || list.includes(value));
    });
    if (countrySelect) countrySelect.value = value;
    if (!persist) return;
    try {
      localStorage.setItem("cp-country", value);
    } catch (error) {
      /* Ignore storage failures. */
    }
    const url = new URL(location.href);
    if (value === "all") url.searchParams.delete("country");
    else url.searchParams.set("country", value);
    history.replaceState(null, "", url.pathname + url.search + url.hash);
    track("country_change", { country: value });
  }

  if (countrySelect) {
    applyCountry(readCountry(), false);
    countrySelect.addEventListener("change", () => applyCountry(countrySelect.value, true));
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

  document.querySelectorAll(".more").forEach((details) => {
    details.addEventListener("toggle", () => {
      if (!details.open) return;
      const card = details.closest("[data-service]");
      track("service_open", { service: card ? card.dataset.service : "" });
    });
  });

  document.querySelectorAll("[data-channel]").forEach((link) => {
    link.addEventListener("click", () => track("contact_channel", { channel: link.dataset.channel }));
  });

  const dialog = document.getElementById("inquiry");
  const intro = document.getElementById("inquiry-intro");
  const serviceLine = document.getElementById("inquiry-service");
  const fields = document.getElementById("inquiry-fields");
  const output = document.getElementById("inquiry-output");
  const copyButton = document.getElementById("inquiry-copy");
  const status = document.getElementById("inquiry-status");
  let lastFocus = null;
  let activeService = "general";

  function profileFor(serviceId) {
    if (serviceId === "general") return { id: "general", profile: config.inquiry.profiles.general, title: "" };
    const service = config.services[serviceId];
    const profileName = service ? service.inquiry : "general";
    return {
      id: serviceId,
      profile: config.inquiry.profiles[profileName] || config.inquiry.profiles.general,
      title: service ? service.title : "",
      status: service ? service.status : "",
    };
  }

  function renderOutput() {
    const current = profileFor(activeService);
    const lines = [
      "CROSSING PROXY",
      `${config.inquiry.language}: ${config.langNative}`,
    ];
    if (current.title) {
      lines.push(`${config.inquiry.service}: ${current.title}`);
      lines.push(`${config.inquiry.status}: ${current.status}`);
    }
    fields.querySelectorAll("input, textarea").forEach((field) => {
      lines.push(`${field.dataset.label}: ${field.value.trim()}`);
    });
    lines.push(config.lineId);
    lines.push(config.inquiry.privacy);
    output.value = lines.join("\n");
  }

  function openInquiry(serviceId) {
    activeService = serviceId;
    const current = profileFor(serviceId);
    intro.textContent = current.profile.intro;
    serviceLine.textContent = current.title ? `${config.inquiry.service}: ${current.title} · ${current.status}` : "";
    fields.replaceChildren();
    current.profile.fields.forEach((field) => {
      const wrap = document.createElement("label");
      wrap.className = "field";
      wrap.textContent = field.label;
      const input = document.createElement("input");
      input.type = "text";
      input.name = field.id;
      input.placeholder = field.placeholder || "";
      input.autocomplete = "off";
      input.dataset.label = field.label;
      input.addEventListener("input", renderOutput);
      wrap.append(input);
      fields.append(wrap);
    });
    status.textContent = "";
    renderOutput();
    lastFocus = document.activeElement;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    const first = fields.querySelector("input");
    if (first) first.focus();
    track(serviceId === "b2b-life" ? "enterprise_inquiry" : "inquiry_open", { service: serviceId });
  }

  document.querySelectorAll("[data-open-inquiry]").forEach((button) => {
    button.addEventListener("click", () => openInquiry(button.dataset.openInquiry));
  });

  dialog.addEventListener("close", () => {
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  });

  copyButton.addEventListener("click", async () => {
    renderOutput();
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
    if (copied) track("inquiry_copy", { service: activeService });
  });

  function track(name, detail) {
    if (!analytics.enabled || !analytics.endpoint) return;
    const payload = {
      event: name,
      lang: config.lang,
      service: detail && detail.service ? detail.service : "",
      country: countrySelect ? countrySelect.value : "",
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
