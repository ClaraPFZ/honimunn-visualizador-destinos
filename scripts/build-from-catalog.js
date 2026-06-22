#!/usr/bin/env node
/**
 * Genera country-cities.json y city-panels.json desde catalogo_honimunn local.
 * Uso: node scripts/build-from-catalog.js
 */
const fs = require('fs');
const path = require('path');

const CATALOG_ROOT = path.resolve(
  __dirname,
  '../../Documents/Claude/Projects/Performanze Marketing/catalogo_honimunn'
);
const ITINERARIOS = path.join(CATALOG_ROOT, 'data/itinerarios.json');
const GEO_TS = path.join(CATALOG_ROOT, 'src/lib/geo-coordinates.ts');
const OUT_CITIES = path.join(__dirname, '../data/country-cities.json');
const OUT_PANELS_DIR = path.join(__dirname, '../data/panels');

const PAIS_TO_SLUG = {
  Argentina: 'argentina',
  Botsuana: 'botswana',
  Brasil: 'brasil',
  Camboya: 'camboya',
  Canadá: 'canada',
  Chile: 'chile',
  Colombia: 'colombia',
  'Costa Rica': 'costa-rica',
  EEUU: 'estados-unidos',
  Filipinas: 'filipinas',
  Indonesia: 'indonesia',
  Japón: 'japan',
  Kenia: 'kenia',
  Maldivas: 'maldivas',
  Mozambique: 'mozambique',
  Namibia: 'namibia',
  Perú: 'peru',
  'Polinesia Francesa': 'polinesia-francesa',
  Seychelles: 'seychelles',
  'Sri Lanka': 'sri-lanka',
  Sudáfrica: 'sudafrica',
  Tailandia: 'tailandia',
  Tanzania: 'tanzania',
  Uganda: 'uganda',
  Vietnam: 'vietnam',
  Zanzíbar: 'tanzania',
  Croacia: 'croacia',
  España: 'espana',
  Francia: 'francia',
  Grecia: 'grecia',
  Italia: 'italia',
  Jordania: 'jordania',
  Marruecos: 'marruecos',
  Noruega: 'noruega',
  Turquía: 'turquia',
  Finlandia: 'finlandia',
  Islandia: 'islandia',
  India: 'india',
  China: 'china',
  Corea: 'corea',
  Malasia: 'malasia',
  Nepal: 'nepal',
  Bután: 'butan',
  Laos: 'laos',
  México: 'mexico',
  Panamá: 'panama',
  Guatemala: 'guatemala',
  Ecuador: 'ecuador',
  'Puerto Rico': 'puerto-rico',
  Australia: 'australia',
  'Nueva Zelanda': 'nueva-zelanda',
  Fiyi: 'fiyi',
  Mauricio: 'mauricio',
  Reunion: 'reunion',
  Madagascar: 'madagascar',
  Egipto: 'egipto',
  Zambia: 'zambia',
  Zimbabue: 'zimbabue',
  Singapur: 'singapur',
  'Islas Cook': 'islas-cook',
  Hawaii: 'hawaii',
  Caribe: 'caribe',
};

const CENTROIDS = {
  argentina: { lat: -34.6, lon: -58.4 },
  brasil: { lat: -15.8, lon: -47.9 },
  canada: { lat: 56.1, lon: -106.3 },
  chile: { lat: -33.4, lon: -70.6 },
  colombia: { lat: 4.7, lon: -74.1 },
  'costa-rica': { lat: 9.7, lon: -83.8 },
  'estados-unidos': { lat: 39.8, lon: -98.5 },
  peru: { lat: -12.0, lon: -77.0 },
  japan: { lat: 36.2, lon: 138.2 },
  tailandia: { lat: 15.8, lon: 100.9 },
  vietnam: { lat: 16.0, lon: 108.0 },
  indonesia: { lat: -2.5, lon: 118.0 },
  filipinas: { lat: 12.8, lon: 121.7 },
  kenia: { lat: -0.02, lon: 37.9 },
  tanzania: { lat: -6.3, lon: 34.9 },
  botswana: { lat: -22.3, lon: 24.7 },
  namibia: { lat: -22.5, lon: 17.1 },
  sudafrica: { lat: -30.5, lon: 22.9 },
  uganda: { lat: 1.4, lon: 32.3 },
  mozambique: { lat: -18.6, lon: 35.5 },
  maldivas: { lat: 3.2, lon: 73.2 },
  'sri-lanka': { lat: 7.8, lon: 80.7 },
  camboya: { lat: 12.5, lon: 104.9 },
  'polinesia-francesa': { lat: -17.6, lon: -149.4 },
  seychelles: { lat: -4.6, lon: 55.5 },
  hawaii: { lat: 21.3, lon: -157.8 },
  singapur: { lat: 1.35, lon: 103.82 },
  mauricio: { lat: -20.2, lon: 57.55 },
  reunion: { lat: -21.1, lon: 55.55 },
  peru: { lat: -9.2, lon: -75.0 },
  ecuador: { lat: -1.8, lon: -78.2 },
  finlandia: { lat: 64.0, lon: 26.0 },
  laos: { lat: 18.2, lon: 103.9 },
  jordania: { lat: 31.2, lon: 36.8 },
  argentina: { lat: -38.4, lon: -63.6 },
  mexico: { lat: 23.6, lon: -102.5 },
  australia: { lat: -25.3, lon: 133.8 },
  china: { lat: 35.0, lon: 103.0 },
  india: { lat: 22.0, lon: 79.0 },
  nepal: { lat: 28.0, lon: 84.0 },
  butan: { lat: 27.5, lon: 90.5 },
  corea: { lat: 36.5, lon: 127.5 },
  guatemala: { lat: 15.5, lon: -90.5 },
};

/* Rough bounding boxes — used to assign multi-country destinations by coordinates */
const COUNTRY_BBOX = {
  camboya: { minLat: 10, maxLat: 15.5, minLon: 102.3, maxLon: 107.6 },
  tailandia: { minLat: 5.5, maxLat: 20.5, minLon: 97.3, maxLon: 105.6 },
  vietnam: { minLat: 8.5, maxLat: 23.5, minLon: 102.1, maxLon: 109.5 },
  kenia: { minLat: -4.7, maxLat: 5.5, minLon: 33.9, maxLon: 41.9 },
  tanzania: { minLat: -11.7, maxLat: -0.9, minLon: 29.3, maxLon: 40.5 },
  botswana: { minLat: -27, maxLat: -17.5, minLon: 19.9, maxLon: 25.4 },
  sudafrica: { minLat: -34.8, maxLat: -22.1, minLon: 16.4, maxLon: 32.9 },
  zimbabue: { minLat: -22.5, maxLat: -15.6, minLon: 25.2, maxLon: 33.0 },
  zambia: { minLat: -18.1, maxLat: -8.2, minLon: 21.9, maxLon: 33.7 },
  namibia: { minLat: -28, maxLat: -16.9, minLon: 11.4, maxLon: 25.3 },
  canada: { minLat: 41.7, maxLat: 83.1, minLon: -141, maxLon: -52.6 },
  croacia: { minLat: 42.3, maxLat: 46.6, minLon: 13.4, maxLon: 19.5 },
  italia: { minLat: 36.6, maxLat: 47.1, minLon: 6.6, maxLon: 18.5 },
  indonesia: { minLat: -11, maxLat: 6.2, minLon: 94.9, maxLon: 141.0 },
  filipinas: { minLat: 4.5, maxLat: 21.2, minLon: 116.9, maxLon: 126.6 },
  malasia: { minLat: 0.8, maxLat: 7.5, minLon: 99.6, maxLon: 119.3 },
  singapur: { minLat: 1.15, maxLat: 1.48, minLon: 103.6, maxLon: 104.1 },
  turquia: { minLat: 35.8, maxLat: 42.1, minLon: 26.0, maxLon: 44.8 },
  grecia: { minLat: 34.8, maxLat: 41.8, minLon: 19.3, maxLon: 29.7 },
  brasil: { minLat: -33.8, maxLat: 5.3, minLon: -73.9, maxLon: -34.8 },
  colombia: { minLat: -4.2, maxLat: 12.5, minLon: -79.0, maxLon: -66.9 },
  'costa-rica': { minLat: 8.0, maxLat: 11.2, minLon: -85.9, maxLon: -82.5 },
  panama: { minLat: 7.2, maxLat: 9.7, minLon: -82.0, maxLon: -77.2 },
  chile: { minLat: -55.9, maxLat: -17.5, minLon: -75.6, maxLon: -66.4 },
  noruega: { minLat: 57.9, maxLat: 71.2, minLon: 4.5, maxLon: 31.2 },
  islandia: { minLat: 63.3, maxLat: 66.6, minLon: -24.5, maxLon: -13.5 },
  'nueva-zelanda': { minLat: -47.3, maxLat: -34.4, minLon: 166.4, maxLon: 178.6 },
  fiyi: { minLat: -20.7, maxLat: -12.5, minLon: 177.0, maxLon: -178.1 },
  mauricio: { minLat: -20.5, maxLat: -19.9, minLon: 57.3, maxLon: 57.8 },
  seychelles: { minLat: -4.85, maxLat: -4.45, minLon: 55.35, maxLon: 55.78 },
  maldivas: { minLat: -0.7, maxLat: 7.1, minLon: 72.6, maxLon: 73.9 },
  uganda: { minLat: -1.5, maxLat: 4.2, minLon: 29.5, maxLon: 35.0 },
  egipto: { minLat: 22.0, maxLat: 31.7, minLon: 24.7, maxLon: 36.9 },
  'sri-lanka': { minLat: 5.9, maxLat: 9.8, minLon: 79.7, maxLon: 81.9 },
  'polinesia-francesa': { minLat: -28, maxLat: -8, minLon: -154.5, maxLon: -134.5 },
  'islas-cook': { minLat: -21.95, maxLat: -8.9, minLon: -165.9, maxLon: -157.3 },
  reunion: { minLat: -21.4, maxLat: -20.82, minLon: 55.22, maxLon: 55.85 },
  'puerto-rico': { minLat: 17.9, maxLat: 18.5, minLon: -67.3, maxLon: -65.2 },
  'estados-unidos': { minLat: 24, maxLat: 49.5, minLon: -125, maxLon: -66 },
  peru: { minLat: -18.4, maxLat: -0.0, minLon: -81.4, maxLon: -68.7 },
  ecuador: { minLat: -5.0, maxLat: 1.7, minLon: -81.1, maxLon: -75.2 },
  finlandia: { minLat: 59.5, maxLat: 70.1, minLon: 20.6, maxLon: 31.6 },
  laos: { minLat: 13.9, maxLat: 22.5, minLon: 100.1, maxLon: 107.7 },
  jordania: { minLat: 29.2, maxLat: 33.4, minLon: 34.9, maxLon: 39.3 },
  argentina: { minLat: -55.1, maxLat: -21.8, minLon: -73.6, maxLon: -53.6 },
  mexico: { minLat: 14.5, maxLat: 32.7, minLon: -118.4, maxLon: -86.7 },
  australia: { minLat: -43.6, maxLat: -10.7, minLon: 113.3, maxLon: 153.6 },
  china: { minLat: 18.2, maxLat: 53.6, minLon: 73.5, maxLon: 134.8 },
  corea: { minLat: 33.1, maxLat: 38.6, minLon: 124.6, maxLon: 131.9 },
  india: { minLat: 6.7, maxLat: 35.5, minLon: 68.2, maxLon: 97.4 },
  marruecos: { minLat: 27.7, maxLat: 35.9, minLon: -13.2, maxLon: -1.0 },
  espana: { minLat: 27.6, maxLat: 43.8, minLon: -18.2, maxLon: 4.3 },
  francia: { minLat: 41.3, maxLat: 51.1, minLon: -5.1, maxLon: 9.6 },
  nepal: { minLat: 26.3, maxLat: 30.4, minLon: 80.0, maxLon: 88.2 },
  butan: { minLat: 26.7, maxLat: 28.3, minLon: 88.7, maxLon: 92.1 },
  corea: { minLat: 33.0, maxLat: 38.6, minLon: 124.6, maxLon: 131.9 },
  guatemala: { minLat: 13.7, maxLat: 17.8, minLon: -92.3, maxLon: -88.2 },
};

const COORD_OVERRIDES = {
  'canada:clearwater': { lat: 51.6514, lon: -120.2361 },
  'maldivas:maldives': { lat: 4.1755, lon: 73.5093 },
  'seychelles:seychelles': { lat: -4.6191, lon: 55.4513 },
  'seychelles:mahe-island': { lat: -4.6796, lon: 55.4520 },
  'singapur:sentosa': { lat: 1.2494, lon: 103.8303 },
  'singapur:gardens-by-the-bay': { lat: 1.2816, lon: 103.8636 },
  'singapur:marina-bay': { lat: 1.2834, lon: 103.8607 },
  'singapur:chinatown': { lat: 1.2832, lon: 103.8438 },
  'singapur:orchard-road': { lat: 1.3048, lon: 103.8318 },
  'fiyi:taveuni': { lat: -16.8333, lon: 179.9833 },
};

function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalize(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function loadCoords() {
  const src = fs.readFileSync(GEO_TS, 'utf8');
  const block = src.match(/const COORDS[^=]*=\s*(\{[\s\S]*?\n\});/);
  if (!block) throw new Error('No se pudo leer geo-coordinates.ts');
  const raw = block[1].replace(/\blng\b/g, 'lon');
  // eslint-disable-next-line no-eval
  return eval('(' + raw + ')');
}

function lookupCoords(name, COORDS, countrySlug) {
  const destSlug = slugify(name);
  const overrideKey = countrySlug ? `${countrySlug}:${destSlug}` : null;
  if (overrideKey && COORD_OVERRIDES[overrideKey]) return COORD_OVERRIDES[overrideKey];

  const key = normalize(name);
  if (COORDS[key]) return { lat: COORDS[key].lat, lon: COORDS[key].lon ?? COORDS[key].lng };

  for (const [k, v] of Object.entries(COORDS)) {
    if (key.includes(k) || k.includes(key)) {
      return { lat: v.lat, lon: v.lon ?? v.lng };
    }
  }

  const aliases = {
    kyoto: 'kyoto',
    kioto: 'kyoto',
    'miyajima island': 'miyajima island',
    miyajima: 'miyajima island',
    copacabana: 'copacabana',
    'rio de janeiro': 'copacabana',
    'puerto iguazu': 'puerto iguazu',
    'san pedro de atacama': 'san pedro de atacama',
    'santa monica': 'santa monica',
    'carmel-by-the-sea': 'carmel-by-the-sea',
    'san luis obispo': 'san luis obispo',
    'las vegas': 'las vegas',
    'los angeles': 'los angeles',
    'san francisco': 'san francisco',
    makati: 'makati',
    'panglao island': 'panglao island',
    'el nido': 'el nido',
    boracay: 'boracay',
    zanzibar: 'zanzibar',
    'cape town': 'cape town',
    'victoria falls (zimbabwe)': 'victoria falls (zimbabwe)',
    santorini: 'santorini',
    mykonos: 'mykonos',
    atenas: 'athens',
    athens: 'athens',
    meteora: 'meteora',
    creta: 'crete',
    crete: 'crete',
    dubrovnik: 'dubrovnik',
    split: 'split',
    hvar: 'hvar',
    venecia: 'venice',
    venice: 'venice',
    florencia: 'florence',
    florence: 'florence',
    roma: 'rome',
    rome: 'rome',
    amalfi: 'amalfi',
    milan: 'milan',
    milan: 'milan',
    barcelona: 'barcelona',
    madrid: 'madrid',
    sevilla: 'seville',
    seville: 'seville',
    granada: 'granada',
    ibiza: 'ibiza',
    marrakech: 'marrakech',
    fes: 'fes',
    casablanca: 'casablanca',
    petra: 'petra',
    amman: 'amman',
    'wadi rum': 'wadi rum',
    istanbul: 'istanbul',
    estambul: 'istanbul',
    cappadocia: 'cappadocia',
    capadocia: 'cappadocia',
    reykjavik: 'reykjavik',
    oslo: 'oslo',
    bergen: 'bergen',
    tromso: 'tromso',
    helsinki: 'helsinki',
    rovaniemi: 'rovaniemi',
    singapur: 'singapore',
    singapore: 'singapore',
    'kuala lumpur': 'kuala lumpur',
    langkawi: 'langkawi',
    'kota kinabalu': 'kota kinabalu',
    bali: 'bali',
    ubud: 'ubud',
    jakarta: 'jakarta',
    yogyakarta: 'yogyakarta',
    sydney: 'sydney',
    melbourne: 'melbourne',
    cairns: 'cairns',
    uluru: 'uluru',
    perth: 'perth',
    queenstown: 'queenstown',
    auckland: 'auckland',
    'milford sound': 'milford sound',
    'bora bora': 'bora bora',
    tahiti: 'tahiti',
    moorea: 'moorea',
    maui: 'maui',
    kauai: 'kauai',
    honolulu: 'honolulu',
    male: 'maldives',
    mahe: 'mahe island',
    praslin: 'praslin',
    'la digue': 'la digue',
  };

  for (const [alias, target] of Object.entries(aliases)) {
    if (key.includes(alias) || alias.includes(key)) {
      const v = COORDS[target];
      if (v) return { lat: v.lat, lon: v.lon ?? v.lng };
    }
  }
  return null;
}

function firstSentence(text) {
  if (!text) return '';
  const m = text.match(/^[^.!?]+[.!?]/);
  return m ? m[0].trim() : text.slice(0, 160).trim() + '…';
}

function pickBestCountry(slugs, coords) {
  let best = slugs[0];
  let bestD = Infinity;
  for (const slug of slugs) {
    const c = CENTROIDS[slug];
    if (!c) continue;
    const d = Math.hypot(coords.lat - c.lat, coords.lon - c.lon);
    if (d < bestD) { bestD = d; best = slug; }
  }
  return bestD < Infinity ? best : slugs[0];
}

function isGenericCountryCity(country, city) {
  const slug = city.key?.split(':').slice(1).join(':') || slugify(city.name);
  const nameNorm = normalize(city.name || '');
  const countryNorm = country.replace(/-/g, ' ');
  if (slug === country || slug === country.replace(/-/g, '')) return true;
  if (nameNorm === normalize(countryNorm)) return true;
  return false;
}

function dropGenericCentroids(countryCities) {
  const out = {};
  for (const [country, list] of Object.entries(countryCities)) {
    const filtered = list.filter(c => !isGenericCountryCity(country, c));
    out[country] = filtered.length ? filtered : list;
  }
  return out;
}

function relocateMisplacedCities(countryCities) {
  const out = {};
  for (const [country, cities] of Object.entries(countryCities)) {
    for (const city of cities) {
      let target = country;
      const coords = { lat: city.lat, lon: city.lon };
      const containing = Object.keys(COUNTRY_BBOX).filter(s => countryContainsCoords(s, coords));

      if (COUNTRY_BBOX[country] && !countryContainsCoords(country, coords) && containing.length) {
        target = pickBestCountry(containing, coords);
      } else if (containing.length > 1 && CENTROIDS[country]) {
        const best = pickBestCountry(containing, coords);
        const dCurrent = Math.hypot(coords.lat - CENTROIDS[country].lat, coords.lon - CENTROIDS[country].lon);
        const dBest = Math.hypot(coords.lat - CENTROIDS[best].lat, coords.lon - CENTROIDS[best].lon);
        if (best !== country && dBest < dCurrent * 0.55) target = best;
      }

      if (!out[target]) out[target] = [];
      const key = `${target}:${city.key.split(':').slice(1).join(':')}`;
      if (out[target].some(c => c.key === key)) continue;
      out[target].push({ key, name: city.name, lat: city.lat, lon: city.lon });
    }
  }
  return out;
}

function refineCountry(country, coords) {
  if (!coords) return country;
  const hawaii = { minLon: -161.5, maxLon: -154.5, minLat: 18.5, maxLat: 22.8 };
  if (country === 'estados-unidos' &&
      coords.lon >= hawaii.minLon && coords.lon <= hawaii.maxLon &&
      coords.lat >= hawaii.minLat && coords.lat <= hawaii.maxLat) {
    return 'hawaii';
  }
  return country;
}

function countryContainsCoords(slug, coords) {
  const b = COUNTRY_BBOX[slug];
  if (!b) return false;
  return coords.lat >= b.minLat && coords.lat <= b.maxLat &&
    coords.lon >= b.minLon && coords.lon <= b.maxLon;
}

function assignCountry(destino, paises, COORDS) {
  const slugs = paises.map(p => PAIS_TO_SLUG[p]).filter(Boolean);
  const coords = lookupCoords(destino.nombre, COORDS, slugs.length === 1 ? slugs[0] : null);

  if (slugs.length === 1) {
    const slug = slugs[0];
    if (coords && COUNTRY_BBOX[slug] && !countryContainsCoords(slug, coords)) {
      const actual = Object.entries(COUNTRY_BBOX).find(([s]) =>
        s !== slug && countryContainsCoords(s, coords));
      if (actual) return refineCountry(actual[0], coords);
    }
    return refineCountry(slug, coords);
  }
  if (!slugs.length) return null;

  if (coords) {
    const containing = slugs.filter(s => countryContainsCoords(s, coords));
    if (containing.length === 1) return refineCountry(containing[0], coords);
    const pool = containing.length ? containing : slugs;
    let best = pool[0], bestD = Infinity;
    for (const slug of pool) {
      const c = CENTROIDS[slug];
      if (!c) continue;
      const d = Math.hypot(coords.lat - c.lat, coords.lon - c.lon);
      if (d < bestD) { bestD = d; best = slug; }
    }
    return refineCountry(best, coords);
  }

  return slugs[0];
}

function splitSentences(text) {
  if (!text) return [];
  return text
    .replace(/\n+/g, ' ')
    .match(/[^.!?]+[.!?]+/g)
    ?.map(s => s.trim())
    .filter(s => s.length > 35) || [];
}

function inferTitle(sentence, fallback) {
  const s = sentence.toLowerCase();
  const rules = [
    [/playa|costa|mar\b|océano|ocean|bahía|isla/i, 'Playas e islas'],
    [/templo|iglesia|catedral|patrimonio|unesco|históri|colonial|monumento|museo|palacio|fortaleza|castillo/i, 'Patrimonio e historia'],
    [/montañ|volcán|glaciar|desierto|selva|parque nacional|safari|fauna|flora|naturaleza|paisaje|cascada|cañón/i, 'Naturaleza salvaje'],
    [/gastronom|comida|cocina|restaurante|mercado|sabor|vino|café|bar\b|gourmet/i, 'Gastronomía local'],
    [/barrio|ciudad|capital|urbano|noche|mercado nocturno|calles|arquitectura/i, 'Vida urbana'],
    [/hotel|alojamiento|resort|spa\b|hospedaje/i, 'Dónde dormir'],
    [/aventura|trek|senderismo|buceo|snorkel|kayak|excursi|crucero|safari/i, 'Aventura y experiencias'],
    [/cultura|tradici|ceremonia|festival|arte|artesan/i, 'Cultura viva'],
    [/relax|descanso|luna de miel|romántic|atardecer/i, 'Momentos para dos'],
  ];
  for (const [re, title] of rules) {
    if (re.test(s)) return title;
  }
  return fallback;
}

const TITLE_POOL = [
  'Lo esencial', 'Qué ver y hacer', 'Entorno y paisaje', 'Gastronomía y barrios',
  'Naturaleza salvaje', 'Patrimonio e historia', 'Vida urbana', 'Cultura viva',
  'Aventura y experiencias', 'Playas e islas', 'Gastronomía local', 'Momentos para dos',
  'Dónde dormir', 'Tu estancia Honimunn',
];

function pickUniqueTitle(sentence, fallback, used) {
  const candidates = [inferTitle(sentence, fallback), fallback];
  for (const title of candidates) {
    if (title && !used.has(title)) {
      used.add(title);
      return title;
    }
  }
  for (const title of TITLE_POOL) {
    if (!used.has(title)) {
      used.add(title);
      return title;
    }
  }
  let n = 2;
  while (used.has(`${fallback} ${n}`)) n++;
  const unique = `${fallback} ${n}`;
  used.add(unique);
  return unique;
}

function inferEyebrow(destino, acc) {
  if (destino.dias) return destino.dias.replace(/^Días\s*/i, '').trim() || destino.dias;
  if (acc?.tipo_propiedad) return acc.tipo_propiedad;
  return 'Destino Honimunn';
}

function collectImages(destino, trip) {
  const imgs = [...(destino.imagenes || [])];
  const acc = (trip?.alojamiento || []).find(a => {
    if (a.es_alternativo) return false;
    const dc = normalize(a.ciudad || '');
    const dn = normalize(destino.nombre);
    return dc === dn || dn.includes(dc) || dc.includes(dn);
  });
  if (acc?.imagenes?.length) {
    acc.imagenes.forEach(u => {
      const large = u.replace(/c1160x432/i, 'c1200x800');
      if (!imgs.includes(large)) imgs.push(large);
    });
  }
  if (trip?.imagen_cover && !imgs.includes(trip.imagen_cover)) imgs.push(trip.imagen_cover);
  return imgs.filter(Boolean);
}

function buildPanel(destino, countrySlug, trip) {
  const desc = destino.descripcion || '';
  const imgs = collectImages(destino, trip);
  const acc = (trip?.alojamiento || []).find(a => !a.es_alternativo &&
    normalize(a.ciudad || '') === normalize(destino.nombre));
  const sentences = splitSentences(desc);
  const defaultTitles = ['Lo esencial', 'Qué ver y hacer', 'Entorno y paisaje', 'Gastronomía y barrios', 'Tu estancia Honimunn'];
  const displayName = destino.nombre
    .replace(/\s*Island\s*$/i, '')
    .replace(/^Kyoto$/i, 'Kioto')
    .replace(/^Tokyo$/i, 'Tokio');

  const items = [];
  const usedTitles = new Set();
  sentences.slice(0, 4).forEach((s, i) => {
    items.push({
      n: String(i + 1).padStart(2, '0'),
      t: pickUniqueTitle(s, defaultTitles[i], usedTitles),
      d: s,
      img: imgs[i % imgs.length] || imgs[0] || '',
    });
  });

  /* Bloque alojamiento concreto */
  const hotelImg = acc?.imagenes?.[0]?.replace(/c1160x432/i, 'c1200x800') || imgs[items.length % imgs.length] || imgs[0] || '';
  const hotelTitle = usedTitles.has('Dónde dormir') ? pickUniqueTitle('', 'Tu alojamiento', usedTitles) : 'Dónde dormir';
  usedTitles.add(hotelTitle);
  items.push({
    n: String(items.length + 1).padStart(2, '0'),
    t: hotelTitle,
    d: acc?.descripcion
      ? firstSentence(acc.descripcion)
      : destino.alojamiento
        ? `Alojamiento seleccionado: ${destino.alojamiento}. Hoteles elegidos por Honimunn por su ubicación y carácter.`
        : 'Hoteles boutique y propiedades con encanto, elegidos por nuestros planners.',
    img: hotelImg,
  });

  /* Completar hasta 5 bloques como Japón */
  while (items.length < 5) {
    const i = items.length;
    items.push({
      n: String(i + 1).padStart(2, '0'),
      t: pickUniqueTitle('', defaultTitles[i] || 'Con Honimunn', usedTitles),
      d: i === 4
        ? 'Itinerario privado diseñado a medida por vuestro Honimunn Planner, sin prisas ni grupos aglomerados.'
        : `Descubrid ${displayName} con calma, en profundidad y con tiempo para disfrutarlo en pareja.`,
      img: imgs[i % imgs.length] || imgs[0] || '',
    });
  }

  return {
    name: displayName,
    eyebrow: inferEyebrow(destino, acc),
    sub: firstSentence(desc) || `Explorad ${displayName} con un itinerario Honimunn diseñado a medida.`,
    continent: null,
    country: countrySlug,
    items: items.slice(0, 5),
    cover: imgs[0] || '',
  };
}

function wikiThumb(searchTerm) {
  try {
    const https = require('https');
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`;
    return new Promise((resolve) => {
      https.get(url, { headers: { 'User-Agent': 'HonimunnVisualizador/1.0' } }, (res) => {
        let data = '';
        res.on('data', c => { data += c; });
        res.on('end', () => {
          try {
            const j = JSON.parse(data);
            resolve(j.thumbnail?.source?.replace(/\/(\d+)px-/, '/1200px-') || '');
          } catch { resolve(''); }
        });
      }).on('error', () => resolve(''));
    });
  } catch { return Promise.resolve(''); }
}

const WIKI_SEARCH = {
  atenas: 'Athens', santorini: 'Santorini', mykonos: 'Mykonos', creta: 'Crete',
  meteora: 'Meteora', dubrovnik: 'Dubrovnik', split: 'Split', hvar: 'Hvar',
  venecia: 'Venice', florencia: 'Florence', roma: 'Rome', amalfi: 'Amalfi',
  milan: 'Milan', barcelona: 'Barcelona', madrid: 'Madrid', sevilla: 'Seville',
  granada: 'Granada', ibiza: 'Ibiza', marrakech: 'Marrakesh', fes: 'Fes',
  casablanca: 'Casablanca', estambul: 'Istanbul', capadocia: 'Cappadocia',
  petra: 'Petra', amman: 'Amman', reykjavik: 'Reykjavik', oslo: 'Oslo',
  bergen: 'Bergen', helsinki: 'Helsinki', singapur: 'Singapore',
};

const STOCK_IMAGES = {
  'grecia:atenas': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Acropolis_of_Athens_%2816427166881%29.jpg/1200px-Acropolis_of_Athens_%2816427166881%29.jpg',
  'grecia:santorini': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Santorini_%28officially_Thira%29_%28cropped%29.jpg/1200px-Santorini_%28officially_Thira%29_%28cropped%29.jpg',
  'grecia:mykonos': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Mykonos_windmills.jpg/1200px-Mykonos_windmills.jpg',
  'grecia:creta': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Knossos_-_North_Portico_02.jpg/1200px-Knossos_-_North_Portico_02.jpg',
  'grecia:meteora': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Meteora%27s_monastery_2.jpg/1200px-Meteora%27s_monastery_2.jpg',
  'croacia:dubrovnik': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Dubrovnik_Croatia.jpg/1200px-Dubrovnik_Croatia.jpg',
  'italia:venecia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Grand_Canal%2C_Venice%2C_Italy_-_September_2022.jpg/1200px-Grand_Canal%2C_Venice%2C_Italy_-_September_2022.jpg',
  'italia:roma': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Colosseum_in_Rome%2C_Italy_-_April_2007.jpg/1200px-Colosseum_in_Rome%2C_Italy_-_April_2007.jpg',
  'espana:barcelona': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Sagrada_Familia_01.jpg/1200px-Sagrada_Familia_01.jpg',
  'marruecos:marrakech': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Marrakech_%28Morocco%29_%282%29.jpg/1200px-Marrakech_%28Morocco%29_%282%29.jpg',
  'turquia:estambul': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Hagia_Sophia_Mars_2013.jpg/1200px-Hagia_Sophia_Mars_2013.jpg',
  'singapur:singapur': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Marina_Bay_Sands_%28Singapore%29_%28cropped%29.jpg/1200px-Marina_Bay_Sands_%28Singapore%29_%28cropped%29.jpg',
};

async function fallbackImages(city, country) {
  const key = `${country}:${slugify(city.name)}`;
  if (STOCK_IMAGES[key]) {
    const u = STOCK_IMAGES[key];
    return [u, u, u, u, u];
  }
  const slug = slugify(city.name);
  const wiki = WIKI_SEARCH[slug] || city.name;
  const primary = await wikiThumb(wiki);
  if (primary) return [primary, primary, primary, primary, primary];
  return [];
}
async function buildFallbackPanel(city, country, destinoPool, trips) {
  const dn = normalize(city.name);
  const match = destinoPool.find(d => normalize(d.nombre) === dn || dn.includes(normalize(d.nombre)));
  if (match) {
    const trip = trips.find(t => (t.destinos || []).includes(match)) ||
      trips.find(t => (t.destinos || []).some(d => d.nombre === match.nombre));
    return buildPanel(match, country, trip || {});
  }

  let imgs = await fallbackImages(city, country);
  if (!imgs.length) {
    const cover = trips.find(t => {
      const slug = PAIS_TO_SLUG[(t.paises || [])[0]];
      return slug === country;
    })?.imagen_cover || '';
    if (cover) imgs = [cover, cover, cover, cover, cover];
  }

  return {
    name: city.name,
    eyebrow: 'Destino Honimunn',
    sub: `${city.name} es una parada clave en nuestros viajes por la región.`,
    country,
    items: [
      { n: '01', t: 'Lo esencial', d: `${city.name} concentra lo mejor del destino: cultura, paisaje y momentos para recordar.`, img: imgs[0] || '' },
      { n: '02', t: 'Qué ver y hacer', d: 'Explorad sus barrios, miradores y experiencias locales con tiempo para disfrutarlos sin prisas.', img: imgs[1] || imgs[0] || '' },
      { n: '03', t: 'Entorno y paisaje', d: 'Naturaleza, costa o montaña a poca distancia — el complemento perfecto para vuestra luna de miel.', img: imgs[2] || imgs[0] || '' },
      { n: '04', t: 'Gastronomía y barrios', d: 'Mercados, restaurantes y calles con vida propia donde saborear el destino.', img: imgs[3] || imgs[0] || '' },
      { n: '05', t: 'Tu estancia Honimunn', d: 'Itinerario privado a medida con alojamientos seleccionados por vuestro Honimunn Planner.', img: imgs[4] || imgs[0] || '' },
    ],
    cover: imgs[0] || '',
  };
}

async function main() {
  if (!fs.existsSync(ITINERARIOS)) {
    console.error('No se encontró catalogo_honimunn en:', CATALOG_ROOT);
    process.exit(1);
  }

  const COORDS = loadCoords();
  const trips = JSON.parse(fs.readFileSync(ITINERARIOS, 'utf8'));
  const existing = fs.existsSync(OUT_CITIES)
    ? JSON.parse(fs.readFileSync(OUT_CITIES, 'utf8'))
    : {};

  const byCountry = {};
  const panels = {};
  const freq = {};

  const destinoPool = [];
  for (const trip of trips) {
    for (const d of trip.destinos || []) destinoPool.push(d);
  }

  for (const trip of trips) {
    const paises = trip.paises || [];
    for (const destino of trip.destinos || []) {
      if (!destino.nombre || /viaje nocturno/i.test(destino.nombre)) continue;
      const country = assignCountry(destino, paises, COORDS);
      if (!country) continue;

      const coords = lookupCoords(destino.nombre, COORDS, country);
      if (!coords) continue;

      const citySlug = slugify(destino.nombre);
      const key = `${country}:${citySlug}`;
      freq[key] = (freq[key] || 0) + 1;

      const prev = byCountry[country]?.[key];
      const prevLen = prev?._descLen || 0;
      const descLen = (destino.descripcion || '').length;

      if (!prev || freq[key] >= (prev._freq || 0) || descLen > prevLen) {
        if (!byCountry[country]) byCountry[country] = {};
        byCountry[country][key] = {
          key,
          name: destino.nombre.replace(/\s*Island\s*$/i, '').trim(),
          lat: coords.lat,
          lon: coords.lon,
          _freq: freq[key],
          _descLen: descLen,
        };
        panels[key] = buildPanel(destino, country, trip);
      }
    }
  }

  const countryCities = { ...existing };
  for (const [country, citiesMap] of Object.entries(byCountry)) {
    const sorted = Object.values(citiesMap)
      .sort((a, b) => b._freq - a._freq)
      .slice(0, 8)
      .map(({ key, name, lat, lon }) => ({ key, name, lat, lon }));
    if (sorted.length) countryCities[country] = sorted;
  }

  /* Países fuera del catálogo: conservar ciudades con keys y paneles genéricos */
  for (const [country, cities] of Object.entries(existing)) {
    if (byCountry[country]) continue;
    countryCities[country] = [];
    for (const city of cities) {
      const key = city.key || `${country}:${slugify(city.name)}`;
      if (!panels[key]) {
        panels[key] = await buildFallbackPanel(city, country, destinoPool, trips);
      }
      countryCities[country].push({ key, name: city.name, lat: city.lat, lon: city.lon });
    }
  }

  fs.writeFileSync(OUT_CITIES, JSON.stringify(relocateMisplacedCities(dropGenericCentroids(countryCities)), null, 2) + '\n');

  fs.mkdirSync(OUT_PANELS_DIR, { recursive: true });
  const panelsByCountry = {};
  for (const [key, panel] of Object.entries(panels)) {
    const country = key.split(':')[0] || panel.country || 'unknown';
    if (!panelsByCountry[country]) panelsByCountry[country] = {};
    panelsByCountry[country][key] = panel;
  }
  const countries = Object.keys(panelsByCountry).sort();
  for (const country of countries) {
    fs.writeFileSync(
      path.join(OUT_PANELS_DIR, `${country}.json`),
      JSON.stringify(panelsByCountry[country], null, 2) + '\n'
    );
  }
  fs.writeFileSync(
    path.join(OUT_PANELS_DIR, 'index.json'),
    JSON.stringify({
      version: 1,
      generatedFrom: 'build-from-catalog.js',
      countries,
      totalPanels: Object.keys(panels).length,
    }, null, 2) + '\n'
  );

  console.log('Países actualizados desde catálogo:', Object.keys(byCountry).length);
  console.log('Ciudades totales:', Object.values(byCountry).reduce((s, m) => s + Object.keys(m).length, 0));
  console.log('Paneles generados:', Object.keys(panels).length);
  console.log('Escrito:', OUT_CITIES, OUT_PANELS_DIR);
}

main().catch(err => { console.error(err); process.exit(1); });
