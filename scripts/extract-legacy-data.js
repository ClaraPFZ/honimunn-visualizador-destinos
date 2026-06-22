#!/usr/bin/env node
/** Extrae datos inline del HTML legacy a JSON en data/ (solo si el HTML contiene los datos) */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const legacyHtml = path.join(root, 'honimunn-catalogo-japon_2.html');
const html = fs.readFileSync(legacyHtml, 'utf8');

if (!html.includes('const COUNTRIES = {')) {
  console.error('El HTML legacy no contiene datos inline. Usa: node scripts/restore-core-data.js');
  process.exit(1);
}

function extractLines(from, to) {
  return lines.slice(from - 1, to).join('\n');
}

const lines = html.split('\n');

const dataBlock = [
  extractLines(786, 1529),
  extractLines(2106, 2130),
].join('\n');

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(dataBlock, sandbox, { filename: 'legacy-data.js' });

const REQUIRED = ['COUNTRIES', 'CITIES', 'BEACHES', 'EXPERIENCE_POOL', 'PIN_PALETTE', 'CONTINENT_COLOR', 'BEACH_CONTINENT', 'JAPAN_MAP', 'JAPAN_COORDS', 'JAPAN_PATH'];
for (const key of REQUIRED) {
  if (sandbox[key] === undefined) {
    console.error(`Extracción incompleta: falta ${key} en el HTML legacy`);
    process.exit(1);
  }
}

const out = (rel, data) => {
  if (data === undefined) {
    console.error(`Refusing to write ${rel}: data is undefined`);
    process.exit(1);
  }
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
  console.log('wrote', rel);
};

out('data/countries.json', sandbox.COUNTRIES);
out('data/japan/cities.json', sandbox.CITIES);
out('data/japan/beaches.json', sandbox.BEACHES);
out('data/experience-pool.json', sandbox.EXPERIENCE_POOL);
out('data/theme.json', {
  pinPalette: sandbox.PIN_PALETTE,
  continentColor: sandbox.CONTINENT_COLOR,
  beachContinent: sandbox.BEACH_CONTINENT,
});
out('data/japan/map.json', {
  map: sandbox.JAPAN_MAP,
  coords: sandbox.JAPAN_COORDS,
  path: sandbox.JAPAN_PATH,
});
