#!/usr/bin/env node
/** Audita encuadre y posición de pins en todos los mapas de país */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const geo = JSON.parse(fs.readFileSync(path.join(root, 'data/countries.geojson'), 'utf8'));
const iso = JSON.parse(fs.readFileSync(path.join(root, 'data/country-iso.json'), 'utf8'));
const cities = JSON.parse(fs.readFileSync(path.join(root, 'data/country-cities.json'), 'utf8'));

const REGION_VIEW = {
  caribe: { minLon: -85, maxLon: -60, minLat: 10, maxLat: 28 },
  hawaii: { minLon: -161.5, maxLon: -154.5, minLat: 18.5, maxLat: 22.8 },
  'estados-unidos': { minLon: -125, maxLon: -66, minLat: 24, maxLat: 49.5 },
  singapur: { minLon: 103.62, maxLon: 104.05, minLat: 1.17, maxLat: 1.48 },
  maldivas: { minLon: 72.6, maxLon: 73.9, minLat: 2.8, maxLat: 4.5 },
  seychelles: { minLon: 55.35, maxLon: 55.78, minLat: -4.85, maxLat: -4.45 },
  mauricio: { minLon: 57.25, maxLon: 57.85, minLat: -20.55, maxLat: -19.95 },
  reunion: { minLon: 55.22, maxLon: 55.85, minLat: -21.38, maxLat: -20.82 },
  'islas-cook': { minLon: -160.2, maxLon: -159.55, minLat: -21.45, maxLat: -18.6 },
  canada: { minLon: -125.5, maxLon: -112.5, minLat: 48.5, maxLat: 54.5 },
  fiyi: { minLon: 177.0, maxLon: 180.5, minLat: -18.5, maxLat: -16.5 },
};

function isGenericCountryCity(countryKey, city) {
  const slug = city.key?.split(':').slice(1).join(':') || '';
  const nameNorm = (city.name || '').toLowerCase();
  const countryNorm = countryKey.replace(/-/g, ' ').toLowerCase();
  if (slug === countryKey || slug === countryKey.replace(/-/g, '')) return true;
  if (nameNorm === countryNorm) return true;
  return false;
}

function filterMapCities(countryKey, list) {
  const filtered = list.filter(c => !isGenericCountryCity(countryKey, c));
  return filtered.length ? filtered : list;
}

function normalizeCityLons(list) {
  const lons = list.map(c => c.lon);
  if (!(lons.some(l => l > 90) && lons.some(l => l < -90))) return list;
  return list.map(c => ({ ...c, lon: c.lon < 0 ? c.lon + 360 : c.lon }));
}

function cityBounds(list, minSpanLon = 0.06, minSpanLat = 0.06) {
  const normalized = normalizeCityLons(list);
  if (!normalized.length) return null;
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
  normalized.forEach(c => {
    minLon = Math.min(minLon, c.lon);
    maxLon = Math.max(maxLon, c.lon);
    minLat = Math.min(minLat, c.lat);
    maxLat = Math.max(maxLat, c.lat);
  });
  const cx = (minLon + maxLon) / 2;
  const cy = (minLat + maxLat) / 2;
  const spanLon = Math.max(maxLon - minLon, minSpanLon);
  const spanLat = Math.max(maxLat - minLat, minSpanLat);
  return {
    minLon: cx - spanLon / 2, maxLon: cx + spanLon / 2,
    minLat: cy - spanLat / 2, maxLat: cy + spanLat / 2,
  };
}

function findFeatureByIso(isoA3) {
  return geo.features.find(f => {
    const p = f.properties;
    return p.ISO_A3 === isoA3 || p.ADM0_A3 === isoA3 || p.SOV_A3 === isoA3;
  });
}

function collectCoords(g, out) {
  if (g.type === 'Polygon') g.coordinates.forEach(r => r.forEach(c => out.push(c)));
  else if (g.type === 'MultiPolygon') g.coordinates.forEach(p => p.forEach(r => r.forEach(c => out.push(c))));
}

function featureBounds(f) {
  const c = [];
  collectCoords(f.geometry, c);
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
  c.forEach(([lon, lat]) => {
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  });
  return { minLon, maxLon, minLat, maxLat };
}

function mergeBounds(a, b) {
  return {
    minLon: Math.min(a.minLon, b.minLon), maxLon: Math.max(a.maxLon, b.maxLon),
    minLat: Math.min(a.minLat, b.minLat), maxLat: Math.max(a.maxLat, b.maxLat),
  };
}

function expandBounds(bounds, ratio) {
  const sLon = bounds.maxLon - bounds.minLon;
  const sLat = bounds.maxLat - bounds.minLat;
  return {
    minLon: bounds.minLon - sLon * ratio, maxLon: bounds.maxLon + sLon * ratio,
    minLat: bounds.minLat - sLat * ratio, maxLat: bounds.maxLat + sLat * ratio,
  };
}

function shouldZoomToCities(countryBounds, list) {
  if (!countryBounds || list.length < 2) return false;
  const cb = cityBounds(list);
  const lonFrac = (cb.maxLon - cb.minLon) / Math.max(countryBounds.maxLon - countryBounds.minLon, 1e-6);
  const latFrac = (cb.maxLat - cb.minLat) / Math.max(countryBounds.maxLat - countryBounds.minLat, 1e-6);
  return (countryBounds.maxLon - countryBounds.minLon) > 12 && lonFrac < 0.42 && latFrac < 0.42;
}

function computeBounds(countryKey, features, list) {
  if (REGION_VIEW[countryKey]) return expandBounds(REGION_VIEW[countryKey], 0.14);
  let countryBounds = null;
  if (features.length === 1) {
    const fb = featureBounds(features[0]);
    if (fb.maxLon - fb.minLon > 35 && list.length) return expandBounds(cityBounds(list, 2.2, 1.6), 0.22);
    countryBounds = fb;
  }
  const cb = list.length ? cityBounds(list) : null;
  if (countryBounds && cb && shouldZoomToCities(countryBounds, list)) {
    return expandBounds(cityBounds(list, 2.2, 1.6), 0.24);
  }
  let bounds;
  if (countryBounds && cb) bounds = mergeBounds(countryBounds, cb);
  else if (countryBounds) bounds = countryBounds;
  else if (cb) bounds = cb;
  else return null;
  const spanLon = bounds.maxLon - bounds.minLon;
  const spanLat = bounds.maxLat - bounds.minLat;
  return expandBounds(bounds, spanLon < 1.2 && spanLat < 1.2 ? 0.28 : 0.18);
}

function viewDimensions(bounds) {
  const spanLon = Math.max(bounds.maxLon - bounds.minLon, 1e-6);
  const spanLat = Math.max(bounds.maxLat - bounds.minLat, 1e-6);
  const aspect = spanLon / spanLat;
  const maxDim = 760;
  return aspect >= 1 ? { W: maxDim, H: maxDim / aspect } : { W: maxDim * aspect, H: maxDim };
}

function makeProjection(bounds, W, H, pad = 36) {
  const spanLon = Math.max(bounds.maxLon - bounds.minLon, 1e-6);
  const spanLat = Math.max(bounds.maxLat - bounds.minLat, 1e-6);
  const innerW = W - pad * 2;
  const innerH = H - pad * 2;
  const scale = Math.min(innerW / spanLon, innerH / spanLat);
  const usedW = spanLon * scale;
  const usedH = spanLat * scale;
  const ox = pad + (innerW - usedW) / 2;
  const oy = pad + (innerH - usedH) / 2;
  return (lon, lat) => {
    let xLon = lon;
    if (bounds.maxLon > 180 && lon < 0) xLon = lon + 360;
    return [ox + (xLon - bounds.minLon) * scale, oy + (bounds.maxLat - lat) * scale];
  };
}

const issues = [];
for (const [country, raw] of Object.entries(cities).sort()) {
  if (country === 'japan') continue;
  let list = filterMapCities(country, raw);
  if (country === 'estados-unidos') {
    const b = REGION_VIEW['estados-unidos'];
    list = list.filter(c => c.lon >= b.minLon && c.lon <= b.maxLon && c.lat >= b.minLat && c.lat <= b.maxLat);
  }
  const f = findFeatureByIso(iso[country]);
  const features = f ? [f] : [];
  const bounds = computeBounds(country, features, list);
  if (!bounds) { issues.push({ country, problem: 'no-bounds' }); continue; }
  const { W, H } = viewDimensions(bounds);
  const project = makeProjection(bounds, W, H);
  const pts = list.map(c => {
    const [x, y] = project(c.lon, c.lat);
    return { x, y, name: c.name };
  });
  const out = pts.filter(p => p.x < 0 || p.x > W || p.y < 0 || p.y > H);
  const xs = pts.map(p => p.x);
  const ys = pts.map(p => p.y);
  const clusterFrac = Math.max((Math.max(...xs) - Math.min(...xs)) / W, (Math.max(...ys) - Math.min(...ys)) / H);
  if (out.length) issues.push({ country, problem: 'out-of-view', names: out.map(p => p.name) });
  else if (clusterFrac < 0.06 && list.length >= 3) {
    issues.push({ country, problem: 'over-clustered', clusterFrac: clusterFrac.toFixed(2), n: list.length });
  }
}

console.log('Países auditados:', Object.keys(cities).length - 1);
console.log('Problemas de layout:', issues.length);
issues.forEach(i => console.log(JSON.stringify(i)));
if (!issues.length) console.log('✓ Todos los mapas encuadran correctamente sus pins.');
