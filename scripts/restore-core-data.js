#!/usr/bin/env node
/**
 * Restaura data/theme.json, countries.json, japan/* y experience-pool.json
 * cuando se corrompen (p. ej. extract-legacy-data sobre el HTML redirect).
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

const THEME = {
  pinPalette: ['#FF2700', '#E718B0', '#AD2C1F', '#80196E', '#6B37B2', '#2000FF', '#0064F0', '#04B148', '#0D7240'],
  continentColor: {
    'América': '#04B148',
    'Europa': '#6B37B2',
    'Oceanía': '#0064F0',
    'Asia': '#E718B0',
    'África': '#FF2700',
  },
  beachContinent: {
    okinawa: 'Asia', thailand: 'Asia', philippines: 'Asia', maldives: 'Asia',
    hawaii: 'América', fiji: 'Oceanía', polynesia: 'Oceanía',
  },
};

const EXPERIENCE_POOL = [
  { type: 'Gastronómica', title: 'Mercado local con guía privado', desc: 'Recorrido por productores y degustación de especialidades de la región, fuera de las rutas turísticas.' },
  { type: 'Gastronómica', title: 'Cena íntima con chef local', desc: 'Menú de autor en un espacio reservado para dos, con maridaje de vinos o sake de la zona.' },
  { type: 'Cultural', title: 'Visita privada a patrimonio UNESCO', desc: 'Acceso sin prisas a templos, museos o barrios históricos con un guía experto Honimunn.' },
  { type: 'Cultural', title: 'Encuentro con artesanos locales', desc: 'Taller breve y conversación con maestros de cerámica, tejido o gastronomía tradicional.' },
  { type: 'Naturaleza', title: 'Amanecer en un entorno salvaje', desc: 'Salida temprano a un mirador, playa o bosque con picnic preparado para la ocasión.' },
  { type: 'Naturaleza', title: 'Paseo sensorial en la naturaleza', desc: 'Senderismo suave, baños termales o baño de bosque adaptado al ritmo de la pareja.' },
  { type: 'Bienestar', title: 'Ritual spa para dos', desc: 'Circuito de aguas, masaje en pareja o tratamiento inspirado en tradiciones locales.' },
  { type: 'Aventura', title: 'Experiencia exclusiva al aire libre', desc: 'Kayak, snorkel, safari o vuelo en globo según destino — siempre en formato privado.' },
  { type: 'Romántica', title: 'Atardecer diseñado a medida', desc: 'Cena o cóctel en un lugar secreto con las mejores vistas del destino.' },
  { type: 'Cultural', title: 'Espectáculo y tradición viva', desc: 'Teatro, danza, música o ceremonia local con localidades reservadas y contexto previo.' },
];

const CONTINENT = {
  argentina: 'América', brasil: 'América', canada: 'América', chile: 'América', colombia: 'América',
  'costa-rica': 'América', ecuador: 'América', guatemala: 'América', mexico: 'América', panama: 'América',
  'puerto-rico': 'América', caribe: 'América', 'estados-unidos': 'América', hawaii: 'América', peru: 'América',
  espana: 'Europa', francia: 'Europa', grecia: 'Europa', croacia: 'Europa', italia: 'Europa',
  noruega: 'Europa', finlandia: 'Europa', islandia: 'Europa', turquia: 'Europa',
  jordania: 'Asia', india: 'Asia', china: 'Asia', corea: 'Asia', camboya: 'Asia', vietnam: 'Asia',
  tailandia: 'Asia', indonesia: 'Asia', filipinas: 'Asia', maldivas: 'Asia', singapur: 'Asia',
  'sri-lanka': 'Asia', nepal: 'Asia', butan: 'Asia', laos: 'Asia', japan: 'Asia',
  'polinesia-francesa': 'Oceanía', australia: 'Oceanía', 'nueva-zelanda': 'Oceanía', fiyi: 'Oceanía',
  'islas-cook': 'Oceanía',
  marruecos: 'África', egipto: 'África', sudafrica: 'África', kenia: 'África', tanzania: 'África',
  botswana: 'África', namibia: 'África', mozambique: 'África', madagascar: 'África', mauricio: 'África',
  reunion: 'África', seychelles: 'África', uganda: 'África', zambia: 'África', zimbabue: 'África',
};

const COUNTRY_NAMES = {
  japan: 'Japón', brasil: 'Brasil', espana: 'España', 'estados-unidos': 'Estados Unidos',
  'costa-rica': 'Costa Rica', 'puerto-rico': 'Puerto Rico', 'nueva-zelanda': 'Nueva Zelanda',
  'polinesia-francesa': 'Polinesia Francesa', 'islas-cook': 'Islas Cook', corea: 'Corea',
  peru: 'Perú', mexico: 'México', panama: 'Panamá', marruecos: 'Marruecos', egipto: 'Egipto',
  sudafrica: 'Sudáfrica', turquia: 'Turquía', butan: 'Bután', reunion: 'Reunión', fiyi: 'Fiyi',
  canada: 'Canadá', jordania: 'Jordania', singapur: 'Singapur', maldivas: 'Maldivas',
};

function countryName(slug) {
  if (COUNTRY_NAMES[slug]) return COUNTRY_NAMES[slug];
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function loadJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

function buildJapanPathFromGeojson() {
  const bounds = { minLon: 128, maxLon: 145.5, minLat: 30.5, maxLat: 46 };
  const W = 400, H = 460, PAD = 20;
  const project = (lon, lat) => [
    PAD + ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * (W - PAD * 2),
    PAD + ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * (H - PAD * 2),
  ];
  const ringToPath = (ring, simplify = 0.12) => {
    const pts = ring.map(([lon, lat]) => project(lon, lat));
    const out = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const [x, y] = pts[i];
      const [lx, ly] = out[out.length - 1];
      if (Math.hypot(x - lx, y - ly) >= simplify) out.push(pts[i]);
    }
    let d = `M${out[0][0].toFixed(1)},${out[0][1].toFixed(1)}`;
    for (let i = 1; i < out.length; i++) d += `L${out[i][0].toFixed(1)},${out[i][1].toFixed(1)}`;
    return d + 'Z';
  };
  const ringArea = (ring) => {
    let a = 0;
    for (let i = 0; i < ring.length - 1; i++) a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
    return Math.abs(a);
  };

  const geo = loadJson('data/countries.geojson');
  const japan = geo.features.find(f => f.properties?.ISO_A3 === 'JPN');
  if (!japan) return '';
  const polys = japan.geometry.type === 'MultiPolygon' ? japan.geometry.coordinates : [japan.geometry.coordinates];
  const rings = [];
  for (const poly of polys) {
    for (const ring of poly) {
      const lons = ring.map(c => c[0]);
      const lats = ring.map(c => c[1]);
      const cx = lons.reduce((s, v) => s + v, 0) / lons.length;
      const cy = lats.reduce((s, v) => s + v, 0) / lats.length;
      if (cx >= bounds.minLon && cx <= bounds.maxLon && cy >= bounds.minLat && cy <= bounds.maxLat) {
        rings.push({ ring, area: ringArea(ring) });
      }
    }
  }
  return rings.filter(r => r.area > 0.5).sort((a, b) => b.area - a.area).map(r => ringToPath(r.ring)).join(' ');
}


function main() {
  const cities = loadJson('data/country-cities.json');
  const panels = loadJson('data/city-panels.json');
  const countries = {};

  for (const slug of Object.keys(cities)) {
    const list = cities[slug];
    const lat = list.reduce((s, c) => s + c.lat, 0) / list.length;
    const lon = list.reduce((s, c) => s + c.lon, 0) / list.length;
    const continent = CONTINENT[slug] || 'Asia';
    const firstKey = Object.keys(panels).find(k => k.startsWith(`${slug}:`));
    const firstPanel = firstKey ? panels[firstKey] : null;
    const name = countryName(slug);
    const sub = firstPanel?.sub?.slice(0, 180) || `Descubre ${name} con un itinerario Honimunn a medida.`;
    countries[slug] = {
      name,
      color: THEME.continentColor[continent],
      lat,
      lon,
      continent,
      eyebrow: continent,
      sub,
      items: [
        { n: '01', t: `Descubre ${name}`, d: sub, img: `${slug} landscape` },
        { n: '02', t: 'Itinerario a medida', d: 'Tu Honimunn Planner diseña cada etapa del viaje, sin plantillas ni prisas.', img: `${slug} travel` },
        { n: '03', t: 'Alojamientos seleccionados', d: 'Hoteles boutique y propiedades que no aparecen en las guías.', img: `${slug} hotel` },
      ],
    };
  }

  const JAPAN_PANEL = (key) => panels[key]?.items || [];
  const japanCities = {
    tokyo: { name: 'Tokyo', color: '#FF2700', x: 245, y: 232, eyebrow: 'Energía urbana', sub: 'Modernidad vibrante, neones y tradición conviviendo en cada esquina.', items: JAPAN_PANEL('japan:tokyo') },
    kyoto: { name: 'Kyoto', color: '#E718B0', x: 157, y: 272, eyebrow: 'Corazón imperial', sub: 'La capital imperial donde el Japón más tradicional se conserva intacto.', items: JAPAN_PANEL('japan:kyoto') },
    osaka: { name: 'Osaka', color: '#AD2C1F', x: 151, y: 334, eyebrow: 'Capital gastronómica', sub: 'La cocina de Japón: street food auténtico y energía sin descanso.', items: JAPAN_PANEL('japan:osaka') },
    hiroshima: { name: 'Hiroshima', color: '#80196E', x: 95, y: 360, eyebrow: 'Memoria y renacimiento', sub: 'Historia, paz y la isla de Miyajima a un paso.', items: JAPAN_PANEL('japan:hiroshima') },
    miyajima: { name: 'Miyajima', color: '#6B37B2', x: 88, y: 375, eyebrow: 'Isla sagrada', sub: 'El torii flotante y senderos entre bosques y templos.', items: JAPAN_PANEL('japan:miyajima') },
    kanazawa: { name: 'Kanazawa', color: '#2000FF', x: 120, y: 248, eyebrow: 'Jardines y artesanía', sub: 'Ciudad samurái junto al mar del Japón.', items: JAPAN_PANEL('japan:kanazawa') },
    takayama: { name: 'Takayama', color: '#0064F0', x: 175, y: 290, eyebrow: 'Alpes japoneses', sub: 'Calles de madera, sake y montañas de postal.', items: JAPAN_PANEL('japan:takayama') },
    koya: { name: 'Koyasan', color: '#04B148', x: 130, y: 318, eyebrow: 'Espiritualidad', sub: 'Monasterios budistas en la cima de la montaña sagrada.', items: JAPAN_PANEL('japan:koyasan') },
  };

  let japanPath = '';
  const existingMap = path.join(root, 'data/japan/map.json');
  if (fs.existsSync(existingMap)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(existingMap, 'utf8'));
      if (parsed.path && parsed.path.length > 500 && !parsed.path.includes('new_string')) japanPath = parsed.path;
    } catch (_) {}
  }
  if (!japanPath) japanPath = buildJapanPathFromGeojson();

  const japanMap = {
    map: { bounds: { minLon: 128, maxLon: 145.5, minLat: 30.5, maxLat: 46 }, W: 400, H: 460, PAD: 20 },
    coords: {
      tokyo: { lat: 35.6762, lon: 139.6503 }, kyoto: { lat: 35.0116, lon: 135.7681 },
      osaka: { lat: 34.6937, lon: 135.5023 }, hiroshima: { lat: 34.3853, lon: 132.4553 },
      miyajima: { lat: 34.2961, lon: 132.3196 }, kanazawa: { lat: 36.5613, lon: 136.6562 },
      takayama: { lat: 36.1460, lon: 137.2520 }, koya: { lat: 34.2139, lon: 135.5865 },
    },
    path: japanPath,
  };

  const out = (rel, data) => fs.writeFileSync(path.join(root, rel), JSON.stringify(data, null, 2) + '\n');
  out('data/theme.json', THEME);
  out('data/countries.json', countries);
  out('data/experience-pool.json', EXPERIENCE_POOL);
  out('data/japan/cities.json', japanCities);
  out('data/japan/beaches.json', {});
  out('data/japan/map.json', japanMap);
  console.log(`Restaurados ${Object.keys(countries).length} países en data/`);
}

main();
