#!/usr/bin/env node
/**
 * Audita coordenadas vs GeoJSON y lista países con posibles problemas.
 * Uso: node scripts/audit-country-maps.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const geo = JSON.parse(fs.readFileSync(path.join(root, 'data/countries.geojson'), 'utf8'));
const iso = JSON.parse(fs.readFileSync(path.join(root, 'data/country-iso.json'), 'utf8'));
const cities = JSON.parse(fs.readFileSync(path.join(root, 'data/country-cities.json'), 'utf8'));

const INLINE = {
  reunion: {
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [55.22, -21.38], [55.52, -21.32], [55.82, -21.05],
        [55.78, -20.88], [55.48, -20.82], [55.22, -20.92], [55.22, -21.38],
      ]],
    },
  },
};

function findFeatureByIso(isoA3) {
  return geo.features.find(f => {
    const p = f.properties;
    return p.ISO_A3 === isoA3 || p.ADM0_A3 === isoA3 || p.SOV_A3 === isoA3;
  });
}

function findFeatures(countryKey, isoA3) {
  if (INLINE[countryKey]) return [INLINE[countryKey]];
  const f = findFeatureByIso(isoA3);
  return f ? [f] : [];
}

function outerRings(g) {
  if (g.type === 'Polygon') return [g.coordinates[0]];
  if (g.type === 'MultiPolygon') return g.coordinates.map(p => p[0]);
  return [];
}

function pointInRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

function nearestOnRing(lon, lat, ring) {
  let bestDist = Infinity;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x1, y1] = ring[j];
    const [x2, y2] = ring[i];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    let t = len2 ? ((lon - x1) * dx + (lat - y1) * dy) / len2 : 0;
    t = Math.max(0, Math.min(1, t));
    const d = Math.hypot(x1 + t * dx - lon, y1 + t * dy - lat);
    if (d < bestDist) bestDist = d;
  }
  return bestDist;
}

function classifyCity(lon, lat, features) {
  if (!features.length) return 'no-land';
  const rings = features.flatMap(f => outerRings(f.geometry));
  if (rings.some(r => pointInRing(lon, lat, r))) return 'ok';
  let nearest = Infinity;
  rings.forEach(r => { nearest = Math.min(nearest, nearestOnRing(lon, lat, r)); });
  if (nearest < 0.45) return 'near-coast';
  return 'offshore';
}

const summary = { ok: 0, 'near-coast': 0, offshore: 0, 'no-land': 0 };
const byCountry = {};

for (const [country, list] of Object.entries(cities)) {
  const features = findFeatures(country, iso[country]);
  const issues = [];
  for (const c of list) {
    const status = classifyCity(c.lon, c.lat, features);
    summary[status]++;
    if (status !== 'ok') issues.push({ name: c.name, status });
  }
  if (issues.length) byCountry[country] = issues;
}

console.log('Ciudades auditadas:', Object.values(summary).reduce((a, b) => a + b, 0));
console.log('Por estado:', summary);
console.log('\nPaíses con ciudades fuera del polígono admin:');
Object.entries(byCountry)
  .sort((a, b) => b[1].length - a[1].length)
  .forEach(([country, issues]) => {
    console.log(`\n${country} (${issues.length})`);
    issues.forEach(i => console.log(`  ${i.name}: ${i.status}`));
  });
