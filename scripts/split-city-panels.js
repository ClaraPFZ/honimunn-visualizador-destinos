#!/usr/bin/env node
/** Divide data/city-panels.json en data/panels/{país}.json + index.json */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = path.join(root, 'data/city-panels.json');
const outDir = path.join(root, 'data/panels');

const panels = JSON.parse(fs.readFileSync(src, 'utf8'));
const byCountry = {};

for (const [key, panel] of Object.entries(panels)) {
  const country = key.split(':')[0] || panel.country || 'unknown';
  if (!byCountry[country]) byCountry[country] = {};
  byCountry[country][key] = panel;
}

fs.mkdirSync(outDir, { recursive: true });

const countries = Object.keys(byCountry).sort();
for (const country of countries) {
  const file = path.join(outDir, `${country}.json`);
  fs.writeFileSync(file, JSON.stringify(byCountry[country], null, 2) + '\n');
}

const index = {
  version: 1,
  generatedFrom: 'city-panels.json',
  countries,
  totalPanels: Object.keys(panels).length,
};

fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(index, null, 2) + '\n');

console.log(`Dividido en ${countries.length} archivos en data/panels/`);
console.log(`Total paneles: ${index.totalPanels}`);
