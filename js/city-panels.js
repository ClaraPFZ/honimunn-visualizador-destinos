/**
 * Carga lazy de paneles por país: data/panels/{país}.json
 */
const CityPanels = (() => {
  const cache = {};
  let index = null;
  let loadAllPromise = null;

  function mergeIntoGlobal(data) {
    if (typeof window === 'undefined') return;
    if (!window.CITY_PANELS) window.CITY_PANELS = {};
    Object.assign(window.CITY_PANELS, data);
  }

  async function loadIndex() {
    if (index) return index;
    const res = await fetch('data/panels/index.json');
    if (!res.ok) throw new Error('No se pudo cargar data/panels/index.json');
    index = await res.json();
    return index;
  }

  async function loadCountry(countryKey) {
    if (!countryKey) return {};
    if (cache[countryKey]) return cache[countryKey];

    const res = await fetch(`data/panels/${countryKey}.json`);
    if (!res.ok) return {};
    const data = await res.json();
    cache[countryKey] = data;
    mergeIntoGlobal(data);
    return data;
  }

  async function ensurePanel(cityKey) {
    const countryKey = cityKey.includes(':') ? cityKey.split(':')[0] : cityKey;
    await loadCountry(countryKey);
    return window.CITY_PANELS?.[cityKey] || null;
  }

  async function loadAll() {
    if (loadAllPromise) return loadAllPromise;
    loadAllPromise = (async () => {
      const idx = await loadIndex();
      const countries = Array.isArray(idx.countries) ? idx.countries : [];
      const results = await Promise.allSettled(countries.map(loadCountry));
      results.forEach((r, i) => {
        if (r.status === 'rejected') console.error(`Panel ${countries[i]}:`, r.reason);
      });
      return window.CITY_PANELS || {};
    })();
    return loadAllPromise;
  }

  function getCached(cityKey) {
    return window.CITY_PANELS?.[cityKey] || null;
  }

  return { loadIndex, loadCountry, ensurePanel, loadAll, getCached };
})();

if (typeof window !== 'undefined') {
  window.CityPanels = CityPanels;
  window.CITY_PANELS = window.CITY_PANELS || {};
}
