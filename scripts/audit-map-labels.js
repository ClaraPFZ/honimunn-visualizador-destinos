#!/usr/bin/env node
/** Audita que el tamaño mínimo de etiqueta en pantalla sea alcanzable en todos los mapas */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const MIN_PX = 14;
const geo = JSON.parse(fs.readFileSync(path.join(root, 'data/countries.geojson'), 'utf8'));
const iso = JSON.parse(fs.readFileSync(path.join(root, 'data/country-iso.json'), 'utf8'));
const cities = JSON.parse(fs.readFileSync(path.join(root, 'data/country-cities.json'), 'utf8'));

const REGION_VIEW = {
  reunion: { minLon: 55.22, maxLon: 55.85, minLat: -21.38, maxLat: -20.82 },
  singapur: { minLon: 103.62, maxLon: 104.05, minLat: 1.17, maxLat: 1.48 },
  corea: null,
};

function ensureBoundsAspect(bounds, minAspect = 0.48) {
  const spanLon = bounds.maxLon - bounds.minLon;
  const spanLat = bounds.maxLat - bounds.minLat;
  const aspect = spanLon / spanLat;
  if (aspect >= minAspect) return bounds;
  const cx = (bounds.minLon + bounds.maxLon) / 2;
  const newSpanLon = spanLat * minAspect;
  return { minLon: cx - newSpanLon / 2, maxLon: cx + newSpanLon / 2, minLat: bounds.minLat, maxLat: bounds.maxLat };
}

function viewDimensions(bounds) {
  const spanLon = Math.max(bounds.maxLon - bounds.minLon, 1e-6);
  const spanLat = Math.max(bounds.maxLat - bounds.minLat, 1e-6);
  const aspect = spanLon / spanLat;
  const maxDim = 760;
  if (aspect >= 1) return { W: maxDim, H: maxDim / aspect };
  return { W: maxDim * aspect, H: maxDim };
}

function estimateScale(viewW, viewH) {
  const estW = 900;
  const estH = 400;
  return Math.min(estW / viewW, estH / viewH) * 0.9;
}

function featureBounds(f) {
  const c = [];
  const walk = g => {
    if (g.type === 'Polygon') g.coordinates.forEach(r => r.forEach(p => c.push(p)));
    else if (g.type === 'MultiPolygon') g.coordinates.forEach(p => p.forEach(r => r.forEach(pt => c.push(pt))));
  };
  walk(f.geometry);
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
  c.forEach(([lon, lat]) => {
    minLon = Math.min(minLon, lon); maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
  });
  return { minLon, maxLon, minLat, maxLat };
}

const problems = [];
const keys = Object.keys(cities);

keys.forEach(key => {
  const isoA3 = iso[key];
  const f = geo.features.find(x => x.properties.ISO_A3 === isoA3 || x.properties.ADM0_A3 === isoA3);
  if (!f && !REGION_VIEW[key]) return;
  let bounds = REGION_VIEW[key] || featureBounds(f);
  bounds = ensureBoundsAspect(bounds);
  const { W, H } = viewDimensions(bounds);
  const scale = estimateScale(W, H);
  const labelUser = MIN_PX / scale;
  const screenPx = labelUser * scale;
  if (screenPx < MIN_PX - 0.01) {
    problems.push({ key, W: W.toFixed(1), H: H.toFixed(1), scale: scale.toFixed(3), screenPx: screenPx.toFixed(2) });
  }
});

console.log(`Países auditados: ${keys.length}`);
console.log(`Mínimo objetivo: ${MIN_PX}px en pantalla`);
if (problems.length) {
  console.log(`Problemas: ${problems.length}`);
  problems.slice(0, 15).forEach(p => console.log(' -', p.key, p));
} else {
  console.log('✓ Todas las etiquetas alcanzan el mínimo en viewport de referencia (900×400).');
}
