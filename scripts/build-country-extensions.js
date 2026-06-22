#!/usr/bin/env node
/**
 * Genera data/country-extensions.json desde catalogo_honimunn.
 * Uso: node scripts/build-country-extensions.js
 */
const fs = require('fs');
const path = require('path');

const CATALOG_ROOT = path.resolve(
  __dirname,
  '../../Documents/Claude/Projects/Performanze Marketing/catalogo_honimunn'
);
const ITINERARIOS = path.join(CATALOG_ROOT, 'data/itinerarios.json');
const GEO_TS = path.join(CATALOG_ROOT, 'src/lib/geo-coordinates.ts');
const OUT = path.join(__dirname, '../data/country-extensions.json');

const PAIS_TO_SLUG = {
  Argentina: 'argentina', Botsuana: 'botswana', Brasil: 'brasil', Camboya: 'camboya',
  Canadá: 'canada', Chile: 'chile', Colombia: 'colombia', 'Costa Rica': 'costa-rica',
  EEUU: 'estados-unidos', Filipinas: 'filipinas', Indonesia: 'indonesia', Japón: 'japan',
  Kenia: 'kenia', Maldivas: 'maldivas', Mozambique: 'mozambique', Namibia: 'namibia',
  Perú: 'peru', 'Polinesia Francesa': 'polinesia-francesa', Seychelles: 'seychelles',
  'Sri Lanka': 'sri-lanka', Sudáfrica: 'sudafrica', Tailandia: 'tailandia',
  Tanzania: 'tanzania', Uganda: 'uganda', Vietnam: 'vietnam', Zanzíbar: 'tanzania',
  Mauricio: 'mauricio', Hawaii: 'hawaii', México: 'mexico', Grecia: 'grecia',
};

const ORIGIN_CENTROIDS = {
  japan: { lat: 35.68, lon: 139.65, label: 'Japón' },
  kenia: { lat: -1.29, lon: 36.82, label: 'Kenia' },
  tanzania: { lat: -6.37, lon: 34.89, label: 'Tanzania' },
  uganda: { lat: 1.37, lon: 32.29, label: 'Uganda' },
  botswana: { lat: -22.33, lon: 24.69, label: 'Botsuana' },
  namibia: { lat: -22.56, lon: 17.08, label: 'Namibia' },
  sudafrica: { lat: -33.92, lon: 18.42, label: 'Sudáfrica' },
  'estados-unidos': { lat: 37.77, lon: -122.42, label: 'EE.UU.' },
  canada: { lat: 43.65, lon: -79.38, label: 'Canadá' },
  camboya: { lat: 11.56, lon: 104.92, label: 'Camboya' },
  indonesia: { lat: -8.34, lon: 115.09, label: 'Indonesia' },
  brasil: { lat: -22.97, lon: -43.18, label: 'Brasil' },
  tailandia: { lat: 13.76, lon: 100.5, label: 'Tailandia' },
  vietnam: { lat: 21.03, lon: 105.85, label: 'Vietnam' },
  'sri-lanka': { lat: 7.87, lon: 80.77, label: 'Sri Lanka' },
};

const KNOWN_EXTENSION_COORDS = {
  'mahe island': { lat: -4.678, lon: 55.448, name: 'Mahé', panelKey: 'seychelles' },
  mahe: { lat: -4.678, lon: 55.448, name: 'Mahé', panelKey: 'seychelles' },
  tahiti: { lat: -17.651, lon: -149.426, panelKey: 'polinesia-francesa' },
  moorea: { lat: -17.539, lon: -149.830, panelKey: 'polinesia-francesa' },
  'bora bora': { lat: -16.500, lon: -151.742, panelKey: 'polinesia-francesa' },
  maui: { lat: 20.798, lon: -156.332, panelKey: 'hawaii' },
  kauai: { lat: 22.096, lon: -159.526, panelKey: 'hawaii' },
  krabi: { lat: 8.086, lon: 98.906, panelKey: 'tailandia' },
  vilankulos: { lat: -22.0, lon: 35.317, name: 'Bazaruto', panelKey: 'mozambique' },
  mozambique: { lat: -25.969, lon: 32.573, name: 'Maputo', panelKey: 'mozambique' },
  'island of hawaii': { lat: 19.593, lon: -155.428, name: 'Big Island', panelKey: 'hawaii' },
  'polinesia francesa': { lat: -17.651, lon: -149.426, panelKey: 'polinesia-francesa' },
  'big island': { lat: 19.593, lon: -155.428, panelKey: 'hawaii' },
  'gili trawangan': { lat: -8.351, lon: 116.039, panelKey: 'indonesia' },
  'nusa dua': { lat: -8.800, lon: 115.233, panelKey: 'indonesia' },
  zanzibar: { lat: -6.166, lon: 39.199, panelKey: 'tanzania:zanzibar' },
  'zanzíbar': { lat: -6.166, lon: 39.199, panelKey: 'tanzania:zanzibar' },
};

const BEACH_KEYWORDS = [
  'maldivas', 'zanzibar', 'zanzíbar', 'gili', 'seychelles', 'mauricio', 'mauritius',
  'hawaii', 'maui', 'kauai', 'polinesia', 'bora bora', 'tahiti', 'moorea', 'mozambique',
  'langkawi', 'krabi', 'phuket', 'phi phi', 'nusa', 'buzios', 'copacabana', 'okinawa',
  'panglao', 'boracay', 'vilankulos', 'playa', 'beach', 'isla', 'island', 'atoll',
];

const PLAYA_TIPOS = new Set([
  'safari_playa', 'cultural_playa', 'aventura_playa', 'playa_relax', 'playa', 'combinado',
]);

/** Destinos playa frecuentes para safaris africanos (catálogo Honimunn) */
const SAFARI_BEACH_PRESETS = [
  { id: 'zanzibar', name: 'Zanzíbar', lat: -6.166, lon: 39.199, panelKey: 'tanzania:zanzibar', continent: 'África' },
  { id: 'seychelles', name: 'Seychelles', lat: -4.62, lon: 55.45, panelKey: 'seychelles', continent: 'África' },
  { id: 'maldivas', name: 'Maldivas', lat: 3.20, lon: 73.22, panelKey: 'maldivas', continent: 'Asia' },
  { id: 'mauricio', name: 'Mauricio', lat: -20.35, lon: 57.55, panelKey: 'mauricio', continent: 'África' },
  { id: 'mozambique', name: 'Bazaruto', lat: -22.0, lon: 35.317, panelKey: 'mozambique', continent: 'África' },
];

const SAFARI_ORIGINS = new Set(['kenia', 'tanzania', 'uganda', 'botswana', 'namibia', 'sudafrica']);

/** Extensiones manuales Japón (referencia visual original) */
const JAPAN_EXTENSIONS = [
  { id: 'okinawa', name: 'Okinawa', lat: 26.21, lon: 127.68, panelKey: 'okinawa', continent: 'Asia' },
  { id: 'thailand', name: 'Tailandia', lat: 8.09, lon: 98.91, panelKey: 'thailand', continent: 'Asia' },
  { id: 'philippines', name: 'Filipinas', lat: 11.0, lon: 125.0, panelKey: 'philippines', continent: 'Asia' },
  { id: 'maldives', name: 'Maldivas', lat: 3.20, lon: 73.22, panelKey: 'maldives', continent: 'Asia' },
  { id: 'hawaii', name: 'Hawái', lat: 21.31, lon: -157.86, panelKey: 'hawaii', continent: 'América' },
  { id: 'fiji', name: 'Fiyi', lat: -17.71, lon: 178.07, panelKey: 'fiji', continent: 'Oceanía' },
  { id: 'polynesia', name: 'Polinesia Francesa', lat: -17.65, lon: -149.43, panelKey: 'polynesia', continent: 'Oceanía' },
];

function loadCoords() {
  const src = fs.readFileSync(GEO_TS, 'utf8');
  const coords = {};
  const re = /['"]?([^'":\s]+)['"]?\s*:\s*\{\s*lat:\s*(-?\d+\.?\d*),\s*lng:\s*(-?\d+\.?\d*)/g;
  let m;
  while ((m = re.exec(src))) {
    coords[m[1].toLowerCase()] = { lat: +m[2], lon: +m[3] };
  }
  return coords;
}

function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalize(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function lookupCoords(name, COORDS) {
  const n = normalize(name);
  if (KNOWN_EXTENSION_COORDS[n]) {
    const k = KNOWN_EXTENSION_COORDS[n];
    return { lat: k.lat, lon: k.lon, panelKey: k.panelKey, displayName: k.name };
  }
  for (const [key, k] of Object.entries(KNOWN_EXTENSION_COORDS)) {
    if (n.includes(key) || key.includes(n)) {
      return { lat: k.lat, lon: k.lon, panelKey: k.panelKey, displayName: k.name };
    }
  }
  if (COORDS[n]) return { lat: COORDS[n].lat, lon: COORDS[n].lon };
  for (const [k, v] of Object.entries(COORDS)) {
    if (n.includes(k) || k.includes(n)) return { lat: v.lat, lon: v.lon };
  }
  return null;
}

function paisToSlug(pais) {
  return PAIS_TO_SLUG[pais] || slugify(pais);
}

function isBeachName(name) {
  const n = normalize(name);
  return BEACH_KEYWORDS.some(kw => n.includes(normalize(kw)));
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function extKey(origin, ext) {
  return `${origin}:${ext.id}`;
}

function isPlausibleCoord(ext) {
  const n = normalize(ext.name || ext.id || '');
  if (/polinesia|tahiti|moorea|bora/i.test(n) && ext.lon > -50) return false;
  if (/hawaii|maui|kauai|honolulu/i.test(n) && ext.lon > -100) return false;
  if (/maldivas|maldives/i.test(n) && (ext.lat < -5 || ext.lon < 60)) return false;
  if (/seychelles|mahe/i.test(n) && (ext.lat > 5 || ext.lon < 45)) return false;
  if (/zanzibar|zanzibar/i.test(n) && (ext.lat > 0 || ext.lon < 35)) return false;
  return Number.isFinite(ext.lat) && Number.isFinite(ext.lon);
}

function dedupeExtensions(exts) {
  const out = [];
  for (const e of exts) {
    if (!isPlausibleCoord(e)) continue;
    if (out.some(o => o.id === e.id)) continue;
    if (out.some(o => Math.hypot(o.lat - e.lat, (o.lon - e.lon) * Math.cos(o.lat * Math.PI / 180)) < 0.35)) continue;
    out.push(e);
  }
  return out;
}

function addExtension(map, origin, ext, freq = 1) {
  if (!origin || !ext?.id || !ext.lat || !ext.lon) return;
  if (origin === ext.id) return;
  const k = extKey(origin, ext);
  if (!map[origin]) map[origin] = {};
  const prev = map[origin][ext.id];
  map[origin][ext.id] = {
    ...ext,
    _freq: (prev?._freq || 0) + freq,
  };
}

function buildPanelKey(name, countrySlug) {
  const id = slugify(name);
  const beachKeys = {
    okinawa: 'okinawa', thailand: 'thailand', tailandia: 'thailand',
    philippines: 'philippines', filipinas: 'philippines',
    maldivas: 'maldives', maldives: 'maldives',
    hawaii: 'hawaii', fiji: 'fiji', fiyi: 'fiji',
    'polinesia-francesa': 'polynesia', polynesia: 'polynesia',
    zanzibar: 'tanzania:zanzibar', 'zanzíbar': 'tanzania:zanzibar',
  };
  if (beachKeys[id]) return beachKeys[id];
  if (countrySlug) return `${countrySlug}:${id}`;
  return id;
}

function main() {
  if (!fs.existsSync(ITINERARIOS)) {
    console.error('No se encontró catalogo:', ITINERARIOS);
    process.exit(1);
  }
  const COORDS = loadCoords();
  const trips = JSON.parse(fs.readFileSync(ITINERARIOS, 'utf8'));
  const extMap = {};

  /* Japón fijo */
  for (const ext of JAPAN_EXTENSIONS) {
    addExtension(extMap, 'japan', ext, 10);
  }

  for (const trip of trips) {
    const paises = (trip.paises || []).map(paisToSlug).filter(Boolean);
    if (!paises.length) continue;

    const tipo = trip.tipo_viaje || '';
    const tags = trip.tags || [];
    const hasPlaya = PLAYA_TIPOS.has(tipo) || tags.includes('playa');
    const hasExtensiones = /extension/i.test(trip.slug || '') || /extension/i.test(trip.titulo || '');

    const origin = paises[0];

    /* Destinos playa dentro del viaje → extensión del país principal */
    if (origin !== 'japan' && (hasPlaya || hasExtensiones)) {
      for (const dest of trip.destinos || []) {
        if (!dest.nombre || !isBeachName(dest.nombre)) continue;
        const coords = lookupCoords(dest.nombre, COORDS);
        if (!coords) continue;
        const km = haversineKm(
          ORIGIN_CENTROIDS[origin]?.lat ?? 0,
          ORIGIN_CENTROIDS[origin]?.lon ?? 0,
          coords.lat,
          coords.lon
        );
        if (km < 250) continue;
        addExtension(extMap, origin, {
          id: slugify(dest.nombre),
          name: coords.displayName || dest.nombre.replace(/\s*Island\s*$/i, '').trim(),
          lat: coords.lat,
          lon: coords.lon,
          panelKey: coords.panelKey || buildPanelKey(dest.nombre, null),
          continent: null,
        });
      }
    }

    /* Multi-país: el segundo país suele ser la extensión playa */
    if (paises.length >= 2 && (hasPlaya || hasExtensiones)) {
      const BEACH_COUNTRY_SLUGS = new Set([
        'maldivas', 'seychelles', 'mauricio', 'mozambique', 'hawaii', 'polinesia-francesa',
        'fiyi', 'tailandia', 'filipinas', 'indonesia', 'vietnam', 'sri-lanka', 'caribe',
      ]);
      for (let i = 1; i < paises.length; i++) {
        const extSlug = paises[i];
        if (!BEACH_COUNTRY_SLUGS.has(extSlug)) continue;
        const centroid = ORIGIN_CENTROIDS[extSlug];
        const coords = centroid || lookupCoords(extSlug, COORDS);
        if (!coords) continue;
        addExtension(extMap, origin, {
          id: extSlug,
          name: centroid?.label || extSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          lat: coords.lat,
          lon: coords.lon,
          panelKey: extSlug,
          continent: null,
        }, 2);
      }
    }

    /* Safaris: presets de playa del catálogo Honimunn */
    if (SAFARI_ORIGINS.has(origin) && (hasPlaya || hasExtensiones || tipo === 'safari')) {
      for (const preset of SAFARI_BEACH_PRESETS) {
        addExtension(extMap, origin, preset, hasExtensiones ? 3 : 1);
      }
    }
  }

  /* Presets safari+playa del catálogo para todos los orígenes de safari */
  for (const origin of SAFARI_ORIGINS) {
    for (const preset of SAFARI_BEACH_PRESETS) {
      addExtension(extMap, origin, preset, 2);
    }
  }

  /* Hawái como extensión de EEUU y Canadá (viajes combinados en catálogo) */
  for (const origin of ['estados-unidos', 'canada']) {
    addExtension(extMap, origin, {
      id: 'hawaii',
      name: 'Hawái',
      lat: 21.31,
      lon: -157.86,
      panelKey: 'hawaii',
      continent: 'América',
    }, 2);
  }

  const output = {};
  for (const [origin, exts] of Object.entries(extMap)) {
    const meta = ORIGIN_CENTROIDS[origin];
    if (!meta) continue;
    const sorted = dedupeExtensions(Object.values(exts)
      .sort((a, b) => b._freq - a._freq)
      .map(({ _freq, ...e }) => ({
        ...e,
        distKm: haversineKm(meta.lat, meta.lon, e.lat, e.lon),
      }))
      .filter(e => e.distKm >= 250 && !SAFARI_ORIGINS.has(e.id)))
      .slice(0, 8);
    if (sorted.length < 2) continue;
    output[origin] = {
      label: meta.label,
      origin: { lat: meta.lat, lon: meta.lon },
      cta: {
        title: 'Extiende tu luna de miel',
        subtitle: origin === 'japan' ? 'Añade unos días de playa' : 'Combina con días de descanso',
      },
      map: {
        eyebrow: 'Extensión',
        title: origin === 'japan' ? 'Extensiones de playa' : 'Combinaciones posibles',
        subtitle: origin === 'japan'
          ? 'Cierra tu luna de miel con unos días frente al mar'
          : 'Destinos del catálogo Honimunn para alargar vuestro viaje',
      },
      extensions: sorted,
    };
  }

  fs.writeFileSync(OUT, JSON.stringify(output, null, 2));
  console.log('Países con extensiones:', Object.keys(output).length);
  console.log('Escrito:', OUT);
}

main();
