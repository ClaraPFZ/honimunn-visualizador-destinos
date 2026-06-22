/* Country map builder — GeoJSON silhouette + city pins */
const CountryMap = (() => {
  /* Only multi-location regions that span several countries/islands */
  const REGION_VIEW = {
    caribe: { minLon: -85, maxLon: -60, minLat: 10, maxLat: 28 },
    hawaii: { minLon: -161.5, maxLon: -154.5, minLat: 18.5, maxLat: 22.8 },
    /* USA GeoJSON incluye Alaska, Hawái y territorios en el Pacífico → encuadre continental */
    'estados-unidos': { minLon: -125, maxLon: -66, minLat: 24, maxLat: 49.5 },
    /* Microestados e islas: encuadre fijo para evitar distorsión del GeoJSON simplificado */
    singapur: { minLon: 103.62, maxLon: 104.05, minLat: 1.17, maxLat: 1.48 },
    maldivas: { minLon: 72.6, maxLon: 73.9, minLat: 2.8, maxLat: 4.5 },
    seychelles: { minLon: 55.35, maxLon: 55.78, minLat: -4.85, maxLat: -4.45 },
    mauricio: { minLon: 57.25, maxLon: 57.85, minLat: -20.55, maxLat: -19.95 },
    reunion: { minLon: 55.22, maxLon: 55.85, minLat: -21.38, maxLat: -20.82 },
    'islas-cook': { minLon: -160.2, maxLon: -159.55, minLat: -21.45, maxLat: -18.6 },
    /* Países enormes con ciudades concentradas en una región del catálogo */
    canada: { minLon: -125.5, maxLon: -112.5, minLat: 48.5, maxLat: 54.5 },
    fiyi: { minLon: 177.0, maxLon: 180.5, minLat: -18.5, maxLat: -16.5 },
  };

  /* Territorios ausentes o incompletos en Natural Earth 50m */
  const INLINE_FEATURES = {
    reunion: {
      type: 'Feature',
      properties: { NAME: 'Réunion' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [55.22, -21.38], [55.52, -21.32], [55.82, -21.05],
          [55.78, -20.88], [55.48, -20.82], [55.22, -20.92], [55.22, -21.38],
        ]],
      },
    },
  };

  let geoCountries = null;
  let countryIso = null;
  let countryCities = null;
  let loadPromise = null;

  async function loadData(){
    if(geoCountries && countryCities) return;
    if(!loadPromise){
      loadPromise = (async () => {
        const [geoRes, isoRes, citiesRes] = await Promise.all([
          fetch('data/countries.geojson'),
          fetch('data/country-iso.json'),
          fetch('data/country-cities.json'),
        ]);
        if(!geoRes.ok || !isoRes.ok || !citiesRes.ok){
          throw new Error('No se pudieron cargar los datos del mapa');
        }
        geoCountries = await geoRes.json();
        countryIso = await isoRes.json();
        countryCities = await citiesRes.json();
      })();
    }
    return loadPromise;
  }

  async function loadPanelsForCountry(countryKey){
    if(typeof window !== 'undefined' && window.CityPanels){
      return window.CityPanels.loadCountry(countryKey);
    }
    return {};
  }

  /* Multi-country regions: draw several admin-0 features inside the view box */
  const COMPOSITE_REGIONS = {
    caribe: ['CUB', 'JAM', 'DOM', 'HTI', 'PRI', 'BRB', 'BHS', 'TTO', 'GRD', 'LCA', 'VCT', 'ATG', 'KNA'],
    hawaii: ['USA'],
  };

  function findFeatureByIso(isoA3){
    if (!geoCountries?.features) return undefined;
    return geoCountries.features.find(f => {
      const p = f.properties;
      return p.ISO_A3 === isoA3 || p.ADM0_A3 === isoA3 || p.SOV_A3 === isoA3;
    });
  }

  function findFeatures(countryKey, iso){
    if(INLINE_FEATURES[countryKey]) return [INLINE_FEATURES[countryKey]];
    if(COMPOSITE_REGIONS[countryKey]){
      return COMPOSITE_REGIONS[countryKey].map(findFeatureByIso).filter(Boolean);
    }
    const f = findFeatureByIso(iso);
    return f ? [f] : [];
  }

  function collectCoords(geometry, out){
    if(!geometry) return;
    if(geometry.type === 'Polygon'){
      geometry.coordinates.forEach(ring => ring.forEach(c => out.push(c)));
    } else if(geometry.type === 'MultiPolygon'){
      geometry.coordinates.forEach(poly => poly.forEach(ring => ring.forEach(c => out.push(c))));
    }
  }

  function polygonCentroid(ring){
    if(!ring.length) return [0, 0];
    let lon = 0, lat = 0;
    ring.forEach(c => { lon += c[0]; lat += c[1]; });
    return [lon / ring.length, lat / ring.length];
  }

  function mainlandPolygons(geometry, cities){
    if(!cities.length) return allPolygons(geometry);
    const cb = cityBounds(cities, 1.5, 1.2);
    if(!cb) return allPolygons(geometry);
    const cx = (cb.minLon + cb.maxLon) / 2;
    const cy = (cb.minLat + cb.maxLat) / 2;
    const reach = Math.max(
      cb.maxLon - cb.minLon,
      cb.maxLat - cb.minLat,
      4,
    ) * 1.35 + 5;

    return allPolygons(geometry).filter(ring => {
      const [lon, lat] = polygonCentroid(ring);
      return Math.hypot(lon - cx, lat - cy) <= reach;
    });
  }

  function allPolygons(geometry){
    if(geometry.type === 'Polygon') return [geometry.coordinates[0]];
    if(geometry.type === 'MultiPolygon') return geometry.coordinates.map(p => p[0]);
    return [];
  }

  function boundsFromRings(rings){
    let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
    rings.forEach(ring => {
      ring.forEach(([lon, lat]) => {
        if(lon < minLon) minLon = lon;
        if(lon > maxLon) maxLon = lon;
        if(lat < minLat) minLat = lat;
        if(lat > maxLat) maxLat = lat;
      });
    });
    if(!rings.length) return null;
    return { minLon, maxLon, minLat, maxLat };
  }

  function featureBoundsMainland(feature, cities){
    const rings = mainlandPolygons(feature.geometry, cities);
    return boundsFromRings(rings) || featureBounds(feature);
  }

  function ensureBoundsAspect(bounds, minAspect = 0.48, maxAspect = 2.35){
    const spanLon = Math.max(bounds.maxLon - bounds.minLon, 1e-6);
    const spanLat = Math.max(bounds.maxLat - bounds.minLat, 1e-6);
    const aspect = spanLon / spanLat;
    const cx = (bounds.minLon + bounds.maxLon) / 2;
    const cy = (bounds.minLat + bounds.maxLat) / 2;

    if(aspect < minAspect){
      const newSpanLon = spanLat * minAspect;
      return {
        minLon: cx - newSpanLon / 2,
        maxLon: cx + newSpanLon / 2,
        minLat: bounds.minLat,
        maxLat: bounds.maxLat,
      };
    }
    if(aspect > maxAspect){
      const newSpanLat = spanLon / maxAspect;
      return {
        minLon: bounds.minLon,
        maxLon: bounds.maxLon,
        minLat: cy - newSpanLat / 2,
        maxLat: cy + newSpanLat / 2,
      };
    }
    return bounds;
  }


  function mergeBounds(a, b){
    return {
      minLon: Math.min(a.minLon, b.minLon),
      maxLon: Math.max(a.maxLon, b.maxLon),
      minLat: Math.min(a.minLat, b.minLat),
      maxLat: Math.max(a.maxLat, b.maxLat),
    };
  }

  function expandBounds(bounds, ratio){
    const spanLon = bounds.maxLon - bounds.minLon;
    const spanLat = bounds.maxLat - bounds.minLat;
    return {
      minLon: bounds.minLon - spanLon * ratio,
      maxLon: bounds.maxLon + spanLon * ratio,
      minLat: bounds.minLat - spanLat * ratio,
      maxLat: bounds.maxLat + spanLat * ratio,
    };
  }

  /* Ciudades genéricas (nombre = país) que son centroides y distorsionan el encuadre */
  function isGenericCountryCity(countryKey, city){
    const slug = city.key?.split(':').slice(1).join(':') || '';
    const nameNorm = (city.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const countryNorm = countryKey.replace(/-/g, ' ').toLowerCase();
    if (slug === countryKey || slug === countryKey.replace(/-/g, '')) return true;
    if (nameNorm === countryNorm) return true;
    return false;
  }

  function filterMapCities(countryKey, cities){
    const list = cities.filter(c => !isGenericCountryCity(countryKey, c));
    return list.length ? list : cities;
  }

  /* Fiji y archipiélagos: unificar longitudes cerca del antimeridiano */
  function normalizeCityLons(cities){
    const lons = cities.map(c => c.lon);
    const hasEast = lons.some(l => l > 90);
    const hasWest = lons.some(l => l < -90);
    if(!hasEast || !hasWest) return cities;
    return cities.map(c => ({
      ...c,
      lon: c.lon < 0 ? c.lon + 360 : c.lon,
    }));
  }

  function cityBoundsFromList(cities, minSpanLon = 0.06, minSpanLat = 0.06){
    const normalized = normalizeCityLons(cities);
    if(!normalized.length) return null;
    let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
    normalized.forEach(c => {
      if(c.lon < minLon) minLon = c.lon;
      if(c.lon > maxLon) maxLon = c.lon;
      if(c.lat < minLat) minLat = c.lat;
      if(c.lat > maxLat) maxLat = c.lat;
    });
    const cx = (minLon + maxLon) / 2;
    const cy = (minLat + maxLat) / 2;
    const spanLon = Math.max(maxLon - minLon, minSpanLon);
    const spanLat = Math.max(maxLat - minLat, minSpanLat);
    return {
      minLon: cx - spanLon / 2,
      maxLon: cx + spanLon / 2,
      minLat: cy - spanLat / 2,
      maxLat: cy + spanLat / 2,
    };
  }

  /* Tight bounds from cities; enforces minimum span so micro-states fill the view */
  function cityBounds(cities, minSpanLon = 0.06, minSpanLat = 0.06){
    return cityBoundsFromList(cities, minSpanLon, minSpanLat);
  }

  /* Archipelagos y países grandes: zoom si las ciudades ocupan poca fracción en algún eje */
  function shouldZoomToCities(countryBounds, cities){
    if(!countryBounds || cities.length < 2) return false;
    const cb = cityBounds(cities);
    if(!cb) return false;
    const cSpanLon = cb.maxLon - cb.minLon;
    const cSpanLat = cb.maxLat - cb.minLat;
    const coSpanLon = countryBounds.maxLon - countryBounds.minLon;
    const coSpanLat = countryBounds.maxLat - countryBounds.minLat;
    const lonFrac = cSpanLon / Math.max(coSpanLon, 1e-6);
    const latFrac = cSpanLat / Math.max(coSpanLat, 1e-6);
    const isLargeTerritory = coSpanLon > 12 || coSpanLat > 8;
    return isLargeTerritory && (lonFrac < 0.55 || latFrac < 0.55);
  }

  function focusedCityBounds(cities){
    return cityBounds(cities, 3.5, 2.4);
  }

  function computeBounds(countryKey, features, cities){
    if(REGION_VIEW[countryKey]){
      return expandBounds(REGION_VIEW[countryKey], 0.14);
    }

    let countryBounds = null;
    if(features.length === 1){
      const fb = cities.length
        ? featureBoundsMainland(features[0], cities)
        : featureBounds(features[0]);
      const spanLon = fb.maxLon - fb.minLon;
      /* Territorios muy dispersos (EE.UU., Canadá, Rusia en GeoJSON, etc.) */
      if(spanLon > 35 && cities.length){
        return expandBounds(ensureBoundsAspect(focusedCityBounds(cities)), 0.22);
      }
      countryBounds = fb;
    } else if(features.length > 1){
      countryBounds = cities.length
        ? featureBoundsMainland(features[0], cities)
        : featureBounds(features[0]);
      features.slice(1).forEach(f => {
        const fb = cities.length ? featureBoundsMainland(f, cities) : featureBounds(f);
        countryBounds = mergeBounds(countryBounds, fb);
      });
    }

    const cb = cities.length ? cityBounds(cities) : null;

    if(countryBounds && cb && shouldZoomToCities(countryBounds, cities)){
      return expandBounds(ensureBoundsAspect(focusedCityBounds(cities)), 0.24);
    }

    let bounds;
    if(countryBounds && cb) bounds = mergeBounds(countryBounds, cb);
    else if(countryBounds) bounds = countryBounds;
    else if(cb) bounds = cb;
    else return null;

    bounds = ensureBoundsAspect(bounds);
    const spanLon = bounds.maxLon - bounds.minLon;
    const spanLat = bounds.maxLat - bounds.minLat;
    const pad = (spanLon < 1.2 && spanLat < 1.2) ? 0.28 : 0.18;
    return expandBounds(bounds, pad);
  }

  function featureBounds(feature){
    const coords = [];
    collectCoords(feature.geometry, coords);
    let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
    coords.forEach(([lon, lat]) => {
      if(lon < minLon) minLon = lon;
      if(lon > maxLon) maxLon = lon;
      if(lat < minLat) minLat = lat;
      if(lat > maxLat) maxLat = lat;
    });
    return { minLon, maxLon, minLat, maxLat };
  }

  function viewDimensions(bounds){
    const spanLon = Math.max(bounds.maxLon - bounds.minLon, 1e-6);
    const spanLat = Math.max(bounds.maxLat - bounds.minLat, 1e-6);
    const aspect = spanLon / spanLat;
    const maxDim = 760;
    if(aspect >= 1) return { W: maxDim, H: maxDim / aspect, PAD: 36 };
    return { W: maxDim * aspect, H: maxDim, PAD: 36 };
  }

  function makeProjection(bounds, W, H, pad){
    const spanLon = Math.max(bounds.maxLon - bounds.minLon, 1e-6);
    const spanLat = Math.max(bounds.maxLat - bounds.minLat, 1e-6);
    const innerW = W - pad * 2;
    const innerH = H - pad * 2;
    const scale = Math.min(innerW / spanLon, innerH / spanLat);
    const usedW = spanLon * scale;
    const usedH = spanLat * scale;
    const ox = pad + (innerW - usedW) / 2;
    const oy = pad + (innerH - usedH) / 2;

    function project(lon, lat){
      let xLon = lon;
      if(bounds.maxLon > 180 && lon < 0) xLon = lon + 360;
      return [
        ox + (xLon - bounds.minLon) * scale,
        oy + (bounds.maxLat - lat) * scale,
      ];
    }
    return { project };
  }

  function pointInRing(lon, lat, ring){
    let inside = false;
    for(let i = 0, j = ring.length - 1; i < ring.length; j = i++){
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      if(((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
  }

  function outerRings(geometry){
    if(geometry.type === 'Polygon') return [geometry.coordinates[0]];
    if(geometry.type === 'MultiPolygon') return geometry.coordinates.map(p => p[0]);
    return [];
  }

  function nearestOnRing(lon, lat, ring){
    let bestDist = Infinity, best = [lon, lat];
    for(let i = 0, j = ring.length - 1; i < ring.length; j = i++){
      const [x1, y1] = ring[j], [x2, y2] = ring[i];
      const dx = x2 - x1, dy = y2 - y1;
      const len2 = dx * dx + dy * dy;
      let t = len2 ? ((lon - x1) * dx + (lat - y1) * dy) / len2 : 0;
      t = Math.max(0, Math.min(1, t));
      const px = x1 + t * dx, py = y1 + t * dy;
      const d = Math.hypot(px - lon, py - lat);
      if(d < bestDist){ bestDist = d; best = [px, py]; }
    }
    return { point: best, distance: bestDist };
  }

  function placeCity(lon, lat, features){
    if(!features.length) return { lon, lat, island: false };

    const rings = features.flatMap(f => outerRings(f.geometry));
    if(rings.some(r => pointInRing(lon, lat, r))) return { lon, lat, island: false };

    let nearest = { distance: Infinity };
    rings.forEach(r => {
      const n = nearestOnRing(lon, lat, r);
      if(n.distance < nearest.distance) nearest = n;
    });

    /* Mantener coordenadas reales: el GeoJSON simplificado deja fuera barrios costeros,
       islas satélite (Sentosa) y atolones (Maldivas). No proyectar pins al borde del polígono. */
    if(nearest.distance < 0.45) return { lon, lat, island: false };
    return { lon, lat, island: true };
  }

  function ringToPath(ring, project){
    const pts = ring.map(c => project(c[0], c[1]));
    if(!pts.length) return '';
    return 'M' + pts.map(p => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' L') + 'Z';
  }

  function geometryToPaths(geometry, project, bounds, cities){
    const paths = [];
    const margin = 0.5;
    const inView = ring => {
      for(const [lon, lat] of ring){
        if(lon >= bounds.minLon - margin && lon <= bounds.maxLon + margin &&
           lat >= bounds.minLat - margin && lat <= bounds.maxLat + margin) return true;
      }
      return false;
    };

    const rings = cities?.length
      ? mainlandPolygons(geometry, cities)
      : allPolygons(geometry);

    rings.forEach(ring => {
      if(!inView(ring)) return;
      const d = ringToPath(ring, project);
      if(d) paths.push(d);
    });
    return paths;
  }

  const MIN_SVG_LABEL_PX = 14;
  const MIN_SVG_PIN_PX = 10;
  const typographyObservers = new WeakMap();

  function svgUserScale(svgEl){
    const m = svgEl?.getScreenCTM?.();
    if(m){
      const sx = Math.hypot(m.a, m.b);
      const sy = Math.hypot(m.c, m.d);
      if(sx > 1e-6 && sy > 1e-6) return Math.min(sx, sy);
    }
    const viewBox = svgEl?.viewBox?.baseVal;
    if(!viewBox?.width || !viewBox?.height) return null;
    const box = svgEl.getBoundingClientRect();
    if(box.width < 1 || box.height < 1) return null;
    return Math.min(box.width / viewBox.width, box.height / viewBox.height);
  }

  function svgDisplayScale(svgEl, viewW, viewH){
    if(!svgEl) return null;
    const measured = svgUserScale(svgEl);
    if(measured) return measured;
    if(!viewW || !viewH) return null;
    const box = svgEl.getBoundingClientRect();
    if(box.width < 1 || box.height < 1) return null;
    return Math.min(box.width / viewW, box.height / viewH);
  }

  function estimateMapWrapSize(wrapEl){
    if(wrapEl?.clientWidth > 1 && wrapEl.clientHeight > 1){
      return { w: wrapEl.clientWidth, h: wrapEl.clientHeight };
    }

    const stage = wrapEl?.closest?.('#mapStage, #worldStage')
      || (typeof document !== 'undefined' ? document.getElementById('mapStage') : null);
    if(stage?.clientWidth > 1 && stage.clientHeight > 1){
      const root = typeof document !== 'undefined' ? document.documentElement : null;
      const cs = root ? getComputedStyle(root) : null;
      const num = (name, fallback) => {
        const raw = cs?.getPropertyValue(name)?.trim();
        const n = raw ? parseFloat(raw) : NaN;
        return Number.isFinite(n) ? n : fallback;
      };
      const safeTop = num('--safe-top', 118);
      const headGap = num('--map-head-gap', 40);
      const footGap = num('--map-foot-gap', 28);
      const headingSpace = num('--map-heading-space', 148);
      const actionsReserve = stage.id === 'mapStage' ? 76 : 0;
      const padX = 40;
      return {
        w: Math.min(Math.max(stage.clientWidth - padX, 240), 1280),
        h: Math.max(stage.clientHeight - safeTop - headGap - headingSpace - actionsReserve - footGap, 200),
      };
    }

    const winW = typeof window !== 'undefined' ? window.innerWidth : 720;
    const winH = typeof window !== 'undefined' ? window.innerHeight : 800;
    return {
      w: Math.min(Math.max(winW - 40, 240), 1280),
      h: Math.max(winH - 118 - 40 - 148 - 76 - 28, 200),
    };
  }

  function svgRenderScale(viewW, viewH, wrapEl){
    const svg = wrapEl?.querySelector?.('svg');
    const measured = svg ? svgDisplayScale(svg, viewW, viewH) : null;
    if(measured) return measured;
    const { w, h } = estimateMapWrapSize(wrapEl);
    return Math.min(w / viewW, h / viewH) * 0.9;
  }

  function svgLabelFontSize(viewW, viewH, wrapEl, minPx = MIN_SVG_LABEL_PX){
    const scale = Math.max(svgRenderScale(viewW, viewH, wrapEl), 0.05);
    return minPx / scale;
  }

  function svgPinSizes(viewW, viewH, wrapEl, minCorePx = MIN_SVG_PIN_PX){
    const scale = Math.max(svgRenderScale(viewW, viewH, wrapEl), 0.05);
    const coreR = minCorePx / scale;
    return {
      coreR,
      ringR: coreR * (14 / 5.5),
      strokeW: Math.max(1.4, coreR * (1.5 / 5.5)),
      islandR: coreR * (5 / 5.5),
      originCoreR: coreR * (4 / 5.5),
      originPulseR: coreR * (5 / 5.5),
    };
  }

  function applySvgTypography(wrapEl, viewW, viewH, opts = {}){
    const svg = wrapEl?.querySelector?.('svg');
    if(!svg) return false;

    const scale = svgDisplayScale(svg, viewW, viewH);
    if(!scale) return false;

    const minPx = opts.minPx ?? MIN_SVG_LABEL_PX;
    const pinMinPx = opts.pinMinPx ?? MIN_SVG_PIN_PX;
    const labelSize = minPx / scale;
    const labelStroke = Math.max(2.2, labelSize * 0.28);
    const labelScale = Math.max(labelSize / minPx, 1);
    const pin = svgPinSizes(viewW, viewH, wrapEl, pinMinPx);

    wrapEl.querySelectorAll('.city-label, .beach-label, .origin-label').forEach(el => {
      el.style.fontSize = '';
      el.setAttribute('font-size', labelSize.toFixed(2));
      el.setAttribute('stroke-width', labelStroke.toFixed(2));
      const baseDx = el.dataset.baseDx;
      const baseDy = el.dataset.baseDy;
      if(baseDx != null && baseDy != null){
        el.setAttribute('x', (parseFloat(baseDx) * labelScale).toFixed(1));
        el.setAttribute('y', (parseFloat(baseDy) * labelScale).toFixed(1));
      }
    });

    wrapEl.querySelectorAll('.beach-dist').forEach(el => {
      const distSize = minPx / scale;
      const distOffset = Math.max(13, labelSize * 1.05);
      el.style.fontSize = '';
      el.setAttribute('font-size', distSize.toFixed(2));
      el.setAttribute('stroke-width', Math.max(2, distSize * 0.28).toFixed(2));
      const baseDx = el.dataset.baseDx;
      const baseDy = el.dataset.baseDy;
      if(baseDx != null && baseDy != null){
        el.setAttribute('x', (parseFloat(baseDx) * labelScale).toFixed(1));
        el.setAttribute('y', (parseFloat(baseDy) * labelScale + distOffset).toFixed(1));
      }
    });

    wrapEl.querySelectorAll('.city-pin .core, .beach-pin .core').forEach(el => {
      el.setAttribute('r', pin.coreR.toFixed(2));
      el.setAttribute('stroke-width', pin.strokeW.toFixed(2));
    });
    wrapEl.querySelectorAll('.city-pin .ring, .beach-pin .ring').forEach(el => {
      el.setAttribute('r', pin.ringR.toFixed(2));
      el.setAttribute('stroke-width', pin.strokeW.toFixed(2));
    });
    wrapEl.querySelectorAll('.island-mark').forEach(el => {
      el.setAttribute('r', pin.islandR.toFixed(2));
    });
    wrapEl.querySelectorAll('.origin-pin .core').forEach(el => {
      el.setAttribute('r', pin.originCoreR.toFixed(2));
    });
    wrapEl.querySelectorAll('.origin-pin .pulse').forEach(el => {
      el.setAttribute('r', pin.originPulseR.toFixed(2));
    });

    if(opts.pinColor){
      wrapEl.querySelectorAll('.city-pin .core, .beach-pin .core').forEach(el => {
        el.setAttribute('fill', opts.pinColor);
      });
      wrapEl.querySelectorAll('.city-pin .ring, .beach-pin .ring').forEach(el => {
        el.setAttribute('stroke', opts.pinColor);
      });
    }

    return true;
  }

  function scheduleSvgTypographyRefresh(wrapEl, viewW, viewH, opts = {}){
    if(!wrapEl) return;
    let attempts = 0;
    const refresh = () => {
      const ok = applySvgTypography(wrapEl, viewW, viewH, opts);
      if(!ok && attempts++ < 12) requestAnimationFrame(refresh);
    };
    requestAnimationFrame(() => requestAnimationFrame(refresh));
    setTimeout(refresh, 120);
    setTimeout(refresh, 450);
    if(!typographyObservers.has(wrapEl)){
      const ro = new ResizeObserver(() => refresh());
      ro.observe(wrapEl);
      const stage = wrapEl.closest?.('#mapStage, #worldStage');
      if(stage) ro.observe(stage);
      typographyObservers.set(wrapEl, ro);
    }
  }

  if(typeof window !== 'undefined'){
    window.MIN_SVG_LABEL_PX = MIN_SVG_LABEL_PX;
    window.MIN_SVG_PIN_PX = MIN_SVG_PIN_PX;
    window.svgLabelFontSize = svgLabelFontSize;
    window.svgPinSizes = svgPinSizes;
    window.svgDisplayScale = svgDisplayScale;
    window.applySvgTypography = applySvgTypography;
    window.scheduleSvgTypographyRefresh = scheduleSvgTypographyRefresh;
  }

  function labelOffsetForPin(x, y, W, H, i, total, fontSize){
    const ref = typeof window !== 'undefined' && window.MIN_SVG_LABEL_PX ? window.MIN_SVG_LABEL_PX : MIN_SVG_LABEL_PX;
    const scale = Math.max(fontSize / ref, 1);
    const [baseDx, baseDy, anchor] = labelOffsetBase(x, y, W, H, i);
    return [baseDx * scale, baseDy * scale, anchor, baseDx, baseDy];
  }

  function labelOffsetBase(x, y, W, H, i){
    const presets = [
      [12, -9, 'start'], [-12, -9, 'end'],
      [12, 14, 'start'], [-12, 14, 'end'],
      [0, -17, 'middle'], [0, 20, 'middle'],
      [16, 2, 'start'], [-16, 2, 'end'],
    ];
    let pick;
    if(x > W * 0.62) pick = presets[1 + (i % 2) * 2];
    else if(x < W * 0.38) pick = presets[i % 2];
    else pick = presets[i % presets.length];
    return pick;
  }

  async function build(countryKey, wrapEl){
    if (!wrapEl) return;
    await loadData();
    await loadPanelsForCountry(countryKey);
    const iso = countryIso[countryKey];
    let cities = countryCities[countryKey] || [];
    cities = filterMapCities(countryKey, cities);
    if(countryKey === 'estados-unidos' && REGION_VIEW['estados-unidos']){
      const b = REGION_VIEW['estados-unidos'];
      cities = cities.filter(c => c.lon >= b.minLon && c.lon <= b.maxLon && c.lat >= b.minLat && c.lat <= b.maxLat);
    }
    const pinColor = typeof getContinentColor === 'function'
      ? getContinentColor(window.COUNTRIES[countryKey]?.continent || 'Asia')
      : '#E718B0';

    if(countryKey === 'japan' && typeof buildJapanSVG === 'function'){
      buildJapanSVG();
      return;
    }

    const features = findFeatures(countryKey, iso);
    const bounds = computeBounds(countryKey, features, cities);

    if(!bounds){
      wrapEl.innerHTML = `<div class="map-fallback"><p>Mapa no disponible para este destino.</p></div>`;
      return;
    }

    const { W, H, PAD } = viewDimensions(bounds);
    const { project } = makeProjection(bounds, W, H, PAD);
    const labelSize = svgLabelFontSize(W, H, wrapEl);
    const labelStroke = Math.max(2.2, labelSize * 0.28);
    const pin = svgPinSizes(W, H, wrapEl);

    let landPaths = '';
    features.forEach(f => {
      const paths = geometryToPaths(f.geometry, project, bounds, cities);
      landPaths += paths.map(d => `<path class="country-landmass" d="${d}"></path>`).join('');
    });

    let pinsHTML = '';
    const pinLayout = cities.map((city, i) => {
      const placed = placeCity(city.lon, city.lat, features);
      const [x, y] = project(placed.lon, placed.lat);
      return { city, placed, x, y, i };
    });

    pinLayout.forEach(({ city, placed, x, y, i }) => {
      const [dx, dy, anchor, baseDx, baseDy] = labelOffsetForPin(x, y, W, H, i, pinLayout.length, labelSize);
      const cityKey = city.key || `${countryKey}:${city.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      const islandMark = placed.island
        ? `<circle class="island-mark" r="${pin.islandR.toFixed(2)}" cx="0" cy="0"></circle>`
        : '';
      pinsHTML += `
      <g class="city-pin" data-city-key="${cityKey}" data-city-name="${city.name.replace(/"/g, '&quot;')}" transform="translate(${x.toFixed(1)},${y.toFixed(1)})">
        ${islandMark}
        <circle class="ring" r="${pin.ringR.toFixed(2)}" stroke="${pinColor}"></circle>
        <circle class="core" r="${pin.coreR.toFixed(2)}" fill="${pinColor}" stroke="#f6f2e8" stroke-width="${pin.strokeW.toFixed(2)}"></circle>
        <text class="city-label" data-base-dx="${baseDx}" data-base-dy="${baseDy}" font-size="${labelSize.toFixed(2)}" stroke-width="${labelStroke.toFixed(2)}" x="${dx.toFixed(1)}" y="${dy.toFixed(1)}" text-anchor="${anchor}">${city.name}</text>
      </g>`;
    });

    wrapEl.innerHTML = `
    <svg viewBox="0 0 ${W.toFixed(1)} ${H.toFixed(1)}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
      ${landPaths}
      ${pinsHTML}
    </svg>`;

    scheduleSvgTypographyRefresh(wrapEl, W, H, { pinColor });

    wrapEl.querySelectorAll('.city-pin').forEach(el => {
      el.addEventListener('click', () => {
        const cityKey = el.dataset.cityKey;
        if(cityKey && typeof openCityPanel === 'function'){
          openCityPanel(cityKey, countryKey, el.dataset.cityName);
        } else {
          openPanel(countryKey);
        }
      });
    });
  }

  return { loadData, build, loadPanelsForCountry };
})();
