(function () {
  const euro = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  });

  const longDate = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const weekdayDate = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const icons = {
    summary:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>',
    map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 01-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 1116 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    budget:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><path d="M16 8h-6a2 2 0 100 4h4a2 2 0 110 4H8"/><path d="M12 17.5v-11"/></svg>',
    spark:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/><path d="M19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z"/></svg>',
    gallery:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>',
    video:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 10l4.55-2.27A1 1 0 0121 8.62v6.76a1 1 0 01-1.45.89L15 14"/><rect x="3" y="6" width="12" height="12" rx="2"/></svg>',
    hotel:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/></svg>',
    itinerary:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 2v4M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg>',
    docs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>',
    terms:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
    calendar:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 14.5A8.5 8.5 0 119.5 3a7 7 0 0011.5 11.5z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 01-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 1116 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    users:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>',
    message:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
    check:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>',
    download:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  };

  const NAV = [
    { id: "summary", label: "Resumen del viaje", icon: "summary" },
    { id: "map", label: "Mapa del viaje", icon: "map" },
    { id: "budget", label: "Presupuesto", icon: "budget" },
    { id: "experiences", label: "Experiencias opcionales", icon: "spark" },
    { id: "gallery", label: "Galería", icon: "gallery" },
    { id: "videos", label: "Vídeos de destino", icon: "video" },
    { id: "hotels", label: "Alojamiento", icon: "hotel" },
    { id: "itinerary", label: "Itinerario día a día", icon: "itinerary" },
    { id: "requirements", label: "Requisitos de viaje", icon: "docs" },
    { id: "terms", label: "Términos y condiciones", icon: "terms" },
    { id: "detailed", label: "Itinerario detallado", icon: "list" },
  ];

  let mapInstance = null;
  let quoteData = null;

  function parseDate(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function formatRange(start, end) {
    return `${longDate.format(parseDate(start))} — ${longDate.format(parseDate(end))}`;
  }

  function shortDayLabel(iso) {
    const raw = weekdayDate.format(parseDate(iso));
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }

  function toast(msg) {
    let el = document.getElementById("quoteToast");
    if (!el) {
      el = document.createElement("div");
      el.id = "quoteToast";
      el.style.cssText =
        "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#0f172a;color:#fff;padding:12px 18px;border-radius:10px;font-size:14px;z-index:100;box-shadow:0 8px 24px rgba(0,0,0,.25);opacity:0;transition:opacity .2s";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = "1";
    clearTimeout(el._t);
    el._t = setTimeout(() => {
      el.style.opacity = "0";
    }, 2200);
  }

  function setActiveSection(id) {
    document.querySelectorAll(".quote-nav button").forEach((btn) => {
      const active = btn.dataset.section === id;
      btn.classList.toggle("is-active", active);
      if (active) btn.setAttribute("aria-current", "true");
      else btn.removeAttribute("aria-current");
    });
    document.querySelectorAll(".quote-section").forEach((sec) => {
      sec.classList.toggle("is-active", sec.id === `section-${id}`);
    });
    if (id === "map") {
      requestAnimationFrame(() => {
        ensureMap();
        setTimeout(() => mapInstance && mapInstance.invalidateSize(), 50);
      });
    }
    history.replaceState(null, "", `#${id}`);
  }

  function ensureMap() {
    if (!quoteData || typeof L === "undefined") return;
    const el = document.getElementById("quoteMap");
    if (!el) return;

    if (mapInstance) {
      mapInstance.invalidateSize();
      return;
    }

    mapInstance = L.map(el, {
      scrollWheelZoom: false,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 18,
    }).addTo(mapInstance);

    const latlngs = quoteData.destinations.map((d) => [d.lat, d.lng]);
    const group = L.featureGroup();

    quoteData.destinations.forEach((d, i) => {
      const icon = L.divIcon({
        className: "",
        html: `<div class="quote-pin">${i + 1}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      L.marker([d.lat, d.lng], { icon })
        .bindPopup(`<strong>${d.city}</strong><br>${d.country}`)
        .addTo(group);
    });

    if (latlngs.length > 1) {
      L.polyline(latlngs, {
        color: "#176b46",
        weight: 2.5,
        opacity: 0.75,
        dashArray: "6 8",
      }).addTo(group);
    }

    group.addTo(mapInstance);
    mapInstance.fitBounds(group.getBounds().pad(0.35));
  }

  function renderNav() {
    const nav = document.getElementById("quoteNav");
    nav.innerHTML = NAV.map(
      (item, i) => `
      <li>
        <button type="button" data-section="${item.id}" class="${i === 0 ? "is-active" : ""}" ${i === 0 ? 'aria-current="true"' : ""}>
          ${icons[item.icon] || ""}
          <span>${item.label}</span>
        </button>
      </li>`
    ).join("");

    nav.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-section]");
      if (!btn) return;
      setActiveSection(btn.dataset.section);
    });
  }

  function renderHero(q) {
    document.getElementById("heroImg").src = q.heroImage;
    document.getElementById("heroImg").alt = q.title;
    document.getElementById("heroTitle").textContent = q.title;
    document.getElementById("heroLead").textContent = q.subtitle;
    document.getElementById("heroDates").innerHTML = `${icons.calendar}<span>${formatRange(q.startDate, q.endDate)}</span>`;
    document.getElementById("heroNights").innerHTML = `${icons.moon}<span>${q.nights} noches</span>`;
    document.title = `${q.title} · Honimunn`;
  }

  function renderSummary(q) {
    const destText = q.destinations.map((d) => `${d.city} · ${d.country}`).join(", ");
    document.getElementById("section-summary").innerHTML = `
      <div class="card">
        <div class="card-head">
          <p class="card-eyebrow">Resumen de tu viaje</p>
        </div>
        <div class="summary-grid">
          <div class="summary-facts">
            <div class="fact">
              <div class="fact-icon">${icons.pin}</div>
              <div class="fact-body">
                <div class="fact-label">Destinos</div>
                <div class="fact-value">${destText}</div>
              </div>
            </div>
            <div class="facts-row">
              <div class="fact">
                <div class="fact-icon">${icons.calendar}</div>
                <div class="fact-body">
                  <div class="fact-label">Salida</div>
                  <div class="fact-value">${longDate.format(parseDate(q.startDate))}</div>
                  <div class="fact-hint">Fecha de inicio</div>
                </div>
              </div>
              <div class="fact">
                <div class="fact-icon">${icons.calendar}</div>
                <div class="fact-body">
                  <div class="fact-label">Llegada</div>
                  <div class="fact-value">${longDate.format(parseDate(q.endDate))}</div>
                  <div class="fact-hint">Fecha de regreso</div>
                </div>
              </div>
            </div>
            <div class="facts-row">
              <div class="fact">
                <div class="fact-icon">${icons.users}</div>
                <div class="fact-body">
                  <div class="fact-label">Viajeros</div>
                  <div class="fact-value">${q.travelers} viajeros</div>
                  <div class="fact-hint">Tarifa por grupo</div>
                </div>
              </div>
              <div class="fact">
                <div class="fact-icon">${icons.moon}</div>
                <div class="fact-body">
                  <div class="fact-label">Duración</div>
                  <div class="fact-value">${q.nights} noches</div>
                  <div class="fact-hint">Estancia prevista</div>
                </div>
              </div>
            </div>
          </div>
          <div class="summary-price">
            <div>
              <div class="price-label">Inversión total</div>
              <div class="price-total">${euro.format(q.total)}</div>
              <div class="price-pp">${euro.format(q.perPerson)} / persona</div>
            </div>
            <div class="deposit-box">
              <div class="fact-label">Depósito para confirmar</div>
              <div class="amount">${euro.format(q.deposit)}</div>
            </div>
          </div>
        </div>
      </div>`;
  }

  function renderMap(q) {
    document.getElementById("section-map").innerHTML = `
      <div class="section-head">${icons.map}<h2>Mapa del viaje</h2></div>
      <p class="section-sub">Recorrido previsto entre destinos.</p>
      <div class="map-frame">
        <div class="map-frame-head">Sri Lanka y Maldivas</div>
        <div id="quoteMap"></div>
        <div class="map-legend">
          ${q.destinations.map((d) => `<span class="map-chip">${d.city}</span>`).join("")}
        </div>
      </div>`;
  }

  function renderBudget(q) {
    const rows = q.budget
      .map(
        (row) => `
      <tr>
        <td class="prov">${row.provider}</td>
        <td><div class="svc">${row.service}</div></td>
        <td class="num">${row.units}</td>
        <td class="num">${euro.format(row.unitPrice)}</td>
        <td class="num"><strong>${euro.format(row.total)}</strong></td>
      </tr>`
      )
      .join("");

    const sum = q.budget.reduce((acc, r) => acc + r.total, 0);

    document.getElementById("section-budget").innerHTML = `
      <div class="section-head">${icons.budget}<h2>Detalle del presupuesto</h2></div>
      <p class="section-sub">Servicios y precios incluidos en tu propuesta.</p>
      <div class="card">
        <div class="table-wrap">
          <table class="budget">
            <thead>
              <tr>
                <th>Proveedor</th>
                <th>Servicio</th>
                <th class="num">Uds.</th>
                <th class="num">PVP unidad</th>
                <th class="num">PVP total</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
            <tfoot>
              <tr>
                <td colspan="4">Total propuesta</td>
                <td class="num">${euro.format(sum)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      <p class="note">Importes en EUR. Los precios son orientativos hasta confirmación con tu asesor.</p>`;
  }

  function renderExperiences(q) {
    document.getElementById("section-experiences").innerHTML = `
      <div class="section-head">${icons.spark}<h2>Experiencias opcionales</h2></div>
      <p class="section-sub">Actividades que puedes añadir a tu viaje. Precios por persona orientativos.</p>
      <div class="stack">
        ${q.experiences
          .map(
            (e) => `
          <article class="exp-card">
            <img src="${e.img}" alt="${e.title}" loading="lazy">
            <div class="exp-body">
              <h3>${e.title}</h3>
              <div class="meta">${e.place} · ${e.duration}</div>
              <p>${e.description}</p>
              <div class="price-tag">+ ${euro.format(e.price)} / persona</div>
            </div>
          </article>`
          )
          .join("")}
      </div>`;
  }

  function renderGallery(q) {
    document.getElementById("section-gallery").innerHTML = `
      <div class="section-head">${icons.gallery}<h2>Galería</h2></div>
      <p class="section-sub">Ambiente de los destinos incluidos en tu propuesta.</p>
      <div class="gallery-grid">
        ${q.gallery
          .map(
            (src, i) => `
          <figure>
            <img src="${src}" alt="Imagen del viaje ${i + 1}" loading="lazy">
          </figure>`
          )
          .join("")}
      </div>`;
  }

  function renderVideos(q) {
    document.getElementById("section-videos").innerHTML = `
      <div class="section-head">${icons.video}<h2>Vídeos de destino</h2></div>
      <p class="section-sub">Una primera mirada a Sri Lanka y Maldivas.</p>
      <div class="video-grid">
        ${q.videos
          .map(
            (v) => `
          <a class="video-card" href="${v.url}" target="_blank" rel="noopener">
            <img src="${v.thumb}" alt="${v.title}" loading="lazy">
            <div class="play"><span>${icons.play}</span></div>
            <div class="caption">
              <strong>${v.title}</strong>
              <span>${v.place}</span>
            </div>
          </a>`
          )
          .join("")}
      </div>`;
  }

  function renderHotels(q) {
    document.getElementById("section-hotels").innerHTML = `
      <div class="section-head">${icons.hotel}<h2>Alojamiento</h2></div>
      <p class="section-sub">Hoteles y lodges seleccionados para este New Munn.</p>
      <div class="stack">
        ${q.hotels
          .map(
            (h) => `
          <article class="hotel-card">
            <img src="${h.img}" alt="${h.name}" loading="lazy">
            <div class="hotel-body">
              <h3>${h.name}</h3>
              <div class="meta">${h.place}</div>
              <div class="hotel-tags">
                <span class="tag">${h.nights} ${h.nights === 1 ? "noche" : "noches"}</span>
                <span class="tag">${h.room}</span>
                <span class="tag">${h.board}</span>
              </div>
            </div>
          </article>`
          )
          .join("")}
      </div>`;
  }

  function renderItinerary(q) {
    document.getElementById("section-itinerary").innerHTML = `
      <div class="section-head">${icons.itinerary}<h2>Itinerario día a día</h2></div>
      <p class="section-sub">Programación de vuelos, alojamientos y servicios.</p>
      <ol class="day-list">
        ${q.itinerary
          .map(
            (day) => `
          <li class="day-item">
            <div class="day-badge">
              <span class="n">Día ${day.day}</span>
              <span class="d">${shortDayLabel(day.date)}</span>
            </div>
            <div class="day-content">
              <h3>${day.title}</h3>
              <ul>
                ${day.items.map((item) => `<li>${item}</li>`).join("")}
              </ul>
            </div>
          </li>`
          )
          .join("")}
      </ol>`;
  }

  function renderRequirements(q) {
    document.getElementById("section-requirements").innerHTML = `
      <div class="section-head">${icons.docs}<h2>Requisitos de viaje</h2></div>
      <p class="section-sub">Consulta qué necesitas según los destinos incluidos.</p>
      <ul class="req-list">
        ${q.requirements
          .map(
            (r) => `
          <li class="req-item">
            <h3>${r.title}</h3>
            <p>${r.detail}</p>
          </li>`
          )
          .join("")}
      </ul>`;
  }

  function renderTerms(q) {
    document.getElementById("section-terms").innerHTML = `
      <div class="section-head">${icons.terms}<h2>Términos y condiciones</h2></div>
      <p class="section-sub">Condiciones aplicables a esta cotización.</p>
      <ul class="terms-list">
        ${q.terms.map((t) => `<li>${t}</li>`).join("")}
      </ul>`;
  }

  function renderDetailed(q) {
    document.getElementById("section-detailed").innerHTML = `
      <div class="section-head">${icons.list}<h2>Itinerario detallado</h2></div>
      <p class="section-sub">Vista ampliada del recorrido con todos los servicios del día.</p>
      <div class="stack">
        ${q.itinerary
          .map(
            (day) => `
          <article class="card" style="padding:18px 20px">
            <div class="meta" style="margin-bottom:6px">DÍA ${day.day} · ${shortDayLabel(day.date)}</div>
            <h3 style="font-size:16px;font-weight:600;margin-bottom:10px">${day.title}</h3>
            <ul style="list-style:none;display:flex;flex-direction:column;gap:6px">
              ${day.items
                .map(
                  (item) =>
                    `<li style="font-size:14px;color:#334155;padding-left:12px;border-left:2px solid #176b46">${item}</li>`
                )
                .join("")}
            </ul>
          </article>`
          )
          .join("")}
      </div>`;
  }

  function bindActions() {
    document.getElementById("btnChanges")?.addEventListener("click", () => {
      toast("Tu solicitud de cambios se enviará a tu asesor Honimunn.");
    });
    document.getElementById("btnAccept")?.addEventListener("click", () => {
      toast("¡Perfecto! Un asesor te contactará para confirmar el depósito.");
    });
    document.getElementById("btnReqs")?.addEventListener("click", () => {
      setActiveSection("requirements");
      document.getElementById("section-requirements")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    document.getElementById("btnPdf")?.addEventListener("click", () => {
      toast("La descarga del PDF estará disponible con tu asesor.");
    });
    document.getElementById("btnCta")?.addEventListener("click", () => {
      toast("Escríbenos a hola@honimunn.com para reservar.");
    });
  }

  async function loadQuote() {
    const root = document.getElementById("quoteApp");
    try {
      const res = await fetch("data/quote-sample.json");
      if (!res.ok) throw new Error("No se pudo cargar la cotización");
      quoteData = await res.json();

      root.innerHTML = `
        <header class="quote-header">
          <div class="quote-header-inner">
            <a class="quote-logo" href="index.html" aria-label="Honimunn">
              <img src="assets/logo-honimunn-dark.png" alt="Honimunn — Hasta la munn y más allá" width="160" height="40">
            </a>
            <div class="quote-actions">
              <button type="button" class="btn btn-outline" id="btnChanges">
                ${icons.message}
                <span class="btn-full">Solicitar cambios</span>
                <span class="btn-short">Cambios</span>
              </button>
              <button type="button" class="btn btn-primary" id="btnAccept">
                ${icons.check}
                <span class="btn-full">Acepto presupuesto</span>
                <span class="btn-short">Acepto</span>
              </button>
            </div>
          </div>
        </header>

        <section class="quote-hero" aria-label="Portada del viaje">
          <img class="quote-hero-img" id="heroImg" src="" alt="">
          <div class="quote-hero-dim"></div>
          <div class="quote-hero-grad"></div>
          <div class="quote-hero-content">
            <h1 id="heroTitle"></h1>
            <p class="lead" id="heroLead"></p>
            <div class="quote-badges">
              <span class="badge" id="heroDates"></span>
              <span class="badge" id="heroNights"></span>
            </div>
          </div>
        </section>

        <main class="quote-main">
          <div class="quote-layout">
            <div class="quote-nav-wrap">
              <nav aria-label="Secciones de la propuesta">
                <ul class="quote-nav" id="quoteNav"></ul>
              </nav>
            </div>
            <div class="quote-panel">
              <div id="section-summary" class="quote-section is-active"></div>
              <div id="section-map" class="quote-section"></div>
              <div id="section-budget" class="quote-section"></div>
              <div id="section-experiences" class="quote-section"></div>
              <div id="section-gallery" class="quote-section"></div>
              <div id="section-videos" class="quote-section"></div>
              <div id="section-hotels" class="quote-section"></div>
              <div id="section-itinerary" class="quote-section"></div>
              <div id="section-requirements" class="quote-section"></div>
              <div id="section-terms" class="quote-section"></div>
              <div id="section-detailed" class="quote-section"></div>

              <div class="below-grid">
                <div class="helper-card">
                  <h3>Visados, vacunas y documentos</h3>
                  <p>Consulta qué necesitas según los destinos incluidos en tu viaje.</p>
                  <button type="button" class="btn btn-outline" id="btnReqs">Ver requisitos del viaje</button>
                </div>
                <div class="helper-card">
                  <h3>Copia de tu propuesta</h3>
                  <p>Servicios, precios e itinerario en un archivo listo para revisar o compartir.</p>
                  <button type="button" class="btn btn-outline" id="btnPdf">${icons.download} Descargar PDF</button>
                </div>
              </div>

              <div class="cta-block">
                <h2>¿Listo para confirmar tu viaje?</h2>
                <p>Contacta con tu asesor y reserva tu viaje.</p>
                <button type="button" class="btn btn-primary" id="btnCta">Hablar con mi asesor</button>
              </div>

              <p class="disclaimer">
                Esta vista es una propuesta de viaje. Los precios son indicativos hasta la confirmación con tu asesor.<br>
                © Honimunn. Esta cotización es informativa y no constituye una reserva en firme.
              </p>
            </div>
          </div>
        </main>`;

      renderNav();
      renderHero(quoteData);
      renderSummary(quoteData);
      renderMap(quoteData);
      renderBudget(quoteData);
      renderExperiences(quoteData);
      renderGallery(quoteData);
      renderVideos(quoteData);
      renderHotels(quoteData);
      renderItinerary(quoteData);
      renderRequirements(quoteData);
      renderTerms(quoteData);
      renderDetailed(quoteData);
      bindActions();

      const hash = location.hash.replace("#", "");
      if (hash && NAV.some((n) => n.id === hash)) {
        setActiveSection(hash);
      }
    } catch (err) {
      console.error(err);
      root.innerHTML = `<div class="quote-error"><p>No se pudo cargar la propuesta.</p><p>${err.message}</p></div>`;
    }
  }

  loadQuote();
})();
