#!/usr/bin/env node
/**
 * Valida coherencia entre archivos de datos.
 * Uso: node scripts/validate-data-integrity.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
let errors = 0;
let warnings = 0;

function fail(msg) {
  console.error('ERROR:', msg);
  errors++;
}

function warn(msg) {
  console.warn('WARN:', msg);
  warnings++;
}

function loadJson(rel) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) {
    fail(`Falta archivo ${rel}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    fail(`${rel}: JSON inválido (${e.message})`);
    return null;
  }
}

function main() {
  const theme = loadJson('data/theme.json');
  const countries = loadJson('data/countries.json');
  const cities = loadJson('data/country-cities.json');
  const index = loadJson('data/panels/index.json');
  const japanMap = loadJson('data/japan/map.json');
  const pool = loadJson('data/experience-pool.json');

  if (theme) {
    if (!Array.isArray(theme.pinPalette) || !theme.pinPalette.length) fail('theme.json: pinPalette vacío');
    if (!theme.continentColor || typeof theme.continentColor !== 'object') fail('theme.json: continentColor inválido');
  }

  if (countries && cities) {
    const countrySlugs = Object.keys(countries);
    const citySlugs = Object.keys(cities);
    for (const slug of countrySlugs) {
      if (!citySlugs.includes(slug)) warn(`countries.json tiene "${slug}" sin ciudades en country-cities.json`);
    }
    for (const slug of citySlugs) {
      if (!countrySlugs.includes(slug)) warn(`country-cities.json tiene "${slug}" sin entrada en countries.json`);
    }
  }

  if (cities && index) {
    const panelDir = path.join(root, 'data/panels');
    for (const [country, list] of Object.entries(cities)) {
      if (!Array.isArray(list)) {
        fail(`country-cities.json: "${country}" no es un array`);
        continue;
      }
      const panelPath = path.join(panelDir, `${country}.json`);
      if (!fs.existsSync(panelPath)) {
        fail(`Falta data/panels/${country}.json`);
        continue;
      }
      let panels;
      try {
        panels = JSON.parse(fs.readFileSync(panelPath, 'utf8'));
      } catch (e) {
        fail(`data/panels/${country}.json: JSON inválido`);
        continue;
      }
      for (const city of list) {
        if (!city.key) {
          fail(`${country}: ciudad sin key`);
          continue;
        }
        if (!city.key.startsWith(`${country}:`)) {
          fail(`Key "${city.key}" no pertenece al país "${country}"`);
        }
        if (!panels[city.key]) {
          fail(`Sin panel para ${city.key} (esperado en data/panels/${country}.json)`);
        }
      }
    }

    if (Array.isArray(index.countries)) {
      for (const c of index.countries) {
        if (!fs.existsSync(path.join(panelDir, `${c}.json`))) {
          fail(`index.json lista "${c}" pero falta el archivo`);
        }
      }
    } else {
      fail('data/panels/index.json: countries no es un array');
    }
  }

  if (japanMap) {
    if (!japanMap.map?.bounds) fail('japan/map.json: falta map.bounds');
    if (typeof japanMap.path !== 'string' || japanMap.path.length < 100) fail('japan/map.json: path ausente o demasiado corto');
    if (japanMap.path.includes('new_string')) fail('japan/map.json: path corrupto');
  }

  if (pool && !pool.length) fail('experience-pool.json está vacío');

  const beaches = loadJson('data/japan/beaches.json');
  if (beaches && theme?.beachContinent) {
    for (const key of Object.keys(theme.beachContinent)) {
      if (!beaches[key]) warn(`beaches.json sin entrada para "${key}" (se usará panel dinámico)`);
    }
  }

  console.log(`\nValidación: ${errors} error(es), ${warnings} aviso(s)`);
  if (errors) process.exit(1);
}

main();
