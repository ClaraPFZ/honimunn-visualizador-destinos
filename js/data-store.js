/**
 * Carga centralizada de datos JSON.
 * Añadir nuevos bloques de contenido aquí y en data/README.md
 */
const HonimunnData = (function () {
  async function fetchJson(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`No se pudo cargar ${path} (${res.status})`);
    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error(`${path} no contiene JSON válido`);
    }
    return data;
  }

  function assertObject(data, label) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error(`${label}: se esperaba un objeto`);
    }
    return data;
  }

  function assertArray(data, label) {
    if (!Array.isArray(data)) throw new Error(`${label}: se esperaba un array`);
    return data;
  }

  function validateTheme(theme) {
    assertObject(theme, 'data/theme.json');
    assertArray(theme.pinPalette, 'theme.pinPalette');
    assertObject(theme.continentColor, 'theme.continentColor');
    return theme;
  }

  function validateCountries(countries) {
    assertObject(countries, 'data/countries.json');
    return countries;
  }

  function validateJapanMap(japanMap) {
    assertObject(japanMap, 'data/japan/map.json');
    if (!japanMap.map?.bounds) throw new Error('japan/map.json: falta map.bounds');
    if (!japanMap.coords || typeof japanMap.coords !== 'object') {
      throw new Error('japan/map.json: falta coords');
    }
    if (typeof japanMap.path !== 'string') throw new Error('japan/map.json: falta path');
    return japanMap;
  }

  async function load() {
    const [
      theme,
      countries,
      japanCities,
      japanBeaches,
      japanMap,
      experiencePool,
      extensions,
      experiences,
    ] = await Promise.all([
      fetchJson('data/theme.json').then(validateTheme),
      fetchJson('data/countries.json').then(validateCountries),
      fetchJson('data/japan/cities.json').then(d => assertObject(d, 'data/japan/cities.json')),
      fetchJson('data/japan/beaches.json').then(d => assertObject(d, 'data/japan/beaches.json')),
      fetchJson('data/japan/map.json').then(validateJapanMap),
      fetchJson('data/experience-pool.json').then(d => assertArray(d, 'data/experience-pool.json')),
      fetchJson('data/country-extensions.json').catch(() => ({})),
      fetchJson('data/country-experiences.json').catch(() => ({})),
    ]);

    window.PIN_PALETTE = theme.pinPalette;
    window.CONTINENT_COLOR = theme.continentColor;
    window.BEACH_CONTINENT = theme.beachContinent;

    window.COUNTRIES = countries;
    window.CITIES = japanCities;
    window.BEACHES = japanBeaches;

    window.JAPAN_MAP = japanMap.map;
    window.JAPAN_COORDS = japanMap.coords;
    window.JAPAN_PATH = japanMap.path;

    window.EXPERIENCE_POOL = experiencePool;
    window.COUNTRY_EXTENSIONS = extensions;
    window.COUNTRY_EXPERIENCES = experiences;

    return {
      theme,
      countries,
      japanCities,
      japanBeaches,
      japanMap,
      experiencePool,
      extensions,
      experiences,
    };
  }

  return { load };
})();
