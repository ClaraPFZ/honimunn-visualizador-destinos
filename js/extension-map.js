/* Dynamic extension / combination map — GeoJSON land + aligned lat/lon projection */
const ExtensionMap = (() => {
  const MAX_DIM = 760;
  const PAD = 36;

  let worldLand = null;
  let loadPromise = null;

  async function loadLand(){
    if(worldLand) return worldLand;
    if(!loadPromise){
      loadPromise = fetch('world-land.geojson')
        .then(r => { if(!r.ok) throw new Error('No se pudo cargar world-land.geojson'); return r.json(); })
        .then(d => { worldLand = d; return d; });
    }
    return loadPromise;
  }

  function haversineKm(lat1, lon1, lat2, lon2){
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2
      + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  function formatDist(km, originLabel){
    if(km >= 1000) return `${Math.round(km / 100) * 100} km desde ${originLabel}`;
    return `${km} km desde ${originLabel}`;
  }

  function normalizeLonAround(lon, refLon){
    let d = lon - refLon;
    while(d > 180) d -= 360;
    while(d < -180) d += 360;
    return refLon + d;
  }

  function computeBounds(origin, extensions){
    const refLon = origin.lon;
    const normLons = [
      normalizeLonAround(origin.lon, refLon),
      ...extensions.map(e => normalizeLonAround(e.lon, refLon)),
    ];
    const lats = [origin.lat, ...extensions.map(e => e.lat)];
    const minLon = Math.min(...normLons);
    const maxLon = Math.max(...normLons);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const cx = (minLon + maxLon) / 2;
    const cy = (minLat + maxLat) / 2;
    let spanLon = Math.max(maxLon - minLon, 14);
    let spanLat = Math.max(maxLat - minLat, 10);
    const MAX_ASPECT = 2.15;
    if(spanLon / spanLat > MAX_ASPECT) spanLat = spanLon / MAX_ASPECT;
    else if(spanLat / spanLon > MAX_ASPECT) spanLon = spanLat / MAX_ASPECT;
    const pad = spanLat > 40 ? 0.1 : 0.16;
    return {
      refLon,
      minLon: cx - spanLon * (0.5 + pad),
      maxLon: cx + spanLon * (0.5 + pad),
      minLat: cy - spanLat * (0.5 + pad),
      maxLat: cy + spanLat * (0.5 + pad),
    };
  }

  function viewDimensions(bounds){
    const spanLon = Math.max(bounds.maxLon - bounds.minLon, 1e-6);
    const spanLat = Math.max(bounds.maxLat - bounds.minLat, 1e-6);
    const aspect = spanLon / spanLat;
    const MIN_H = 520;
    let W, H;
    if(aspect >= 1){
      W = MAX_DIM;
      H = MAX_DIM / aspect;
    } else {
      H = MAX_DIM;
      W = MAX_DIM * aspect;
    }
    if(H < MIN_H){
      const scale = MIN_H / H;
      H = MIN_H;
      W = Math.min(W * scale, 920);
    }
    return { W, H };
  }

  function makeProjection(bounds, W, H, pad){
    const refLon = bounds.refLon;
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
      const nlon = normalizeLonAround(lon, refLon);
      return [
        ox + (nlon - bounds.minLon) * scale,
        oy + (bounds.maxLat - lat) * scale,
      ];
    };
  }

  function ringToPath(ring, project){
    const pts = ring.map(c => project(c[0], c[1]));
    if(!pts.length) return '';
    return 'M' + pts.map(p => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' L') + 'Z';
  }

  function geometryToPaths(geometry, project, bounds, refLon){
    const paths = [];
    const margin = 0.6;
    const inView = ring => {
      for(const [lon, lat] of ring){
        const nlon = normalizeLonAround(lon, refLon);
        if(nlon >= bounds.minLon - margin && nlon <= bounds.maxLon + margin &&
           lat >= bounds.minLat - margin && lat <= bounds.maxLat + margin) return true;
      }
      return false;
    };

    if(geometry.type === 'Polygon'){
      const ring = geometry.coordinates[0];
      if(inView(ring)){
        const d = ringToPath(ring, project);
        if(d) paths.push(d);
      }
    } else if(geometry.type === 'MultiPolygon'){
      geometry.coordinates.forEach(poly => {
        const ring = poly[0];
        if(!inView(ring)) return;
        const d = ringToPath(ring, project);
        if(d) paths.push(d);
      });
    }
    return paths;
  }

  function buildLandPaths(geo, project, bounds){
    if(!geo?.features) return '';
    const refLon = bounds.refLon;
    let html = '';
    geo.features.forEach(f => {
      const paths = geometryToPaths(f.geometry, project, bounds, refLon);
      html += paths.map(d => `<path class="world-landmass" d="${d}"></path>`).join('');
    });
    return html;
  }

  function resolvePinColor(ext, fallback){
    if(typeof getContinentColor !== 'function') return fallback || '#E718B0';
    const c = ext.continent || (ext.panelKey && BEACH_CONTINENT?.[ext.panelKey.split(':').pop()]);
    if(c && typeof c === 'string' && CONTINENT_COLOR?.[c]) return getContinentColor(c);
    if(ext.panelKey && BEACH_CONTINENT?.[ext.panelKey]) return getContinentColor(BEACH_CONTINENT[ext.panelKey]);
    if(ext.panelKey && window.COUNTRIES?.[ext.panelKey]) return getContinentColor(window.COUNTRIES[ext.panelKey].continent);
    return fallback || '#E718B0';
  }

  function labelOffsetForPin(x, y, W, i, fontSize){
    const ref = (typeof window !== 'undefined' && window.MIN_SVG_LABEL_PX) || 14;
    const scale = Math.max(fontSize / ref, 1);
    let pick;
    if(x > W * 0.58) pick = [-12, -9, 'end'];
    else if(x < W * 0.42) pick = [12, -9, 'start'];
    else {
      const presets = [[12, -9, 'start'], [-12, -9, 'end'], [12, 14, 'start'], [-12, 14, 'end']];
      pick = presets[i % presets.length];
    }
    return [pick[0] * scale, pick[1] * scale, pick[2], pick[0], pick[1]];
  }

  function svgLabelFontSize(viewW, viewH, wrapEl, minPx){
    const min = minPx ?? ((typeof window !== 'undefined' && window.MIN_SVG_LABEL_PX) || 14);
    if(typeof window !== 'undefined' && window.svgLabelFontSize){
      return window.svgLabelFontSize(viewW, viewH, wrapEl, min);
    }
    const estW = wrapEl?.clientWidth > 1 ? wrapEl.clientWidth : 720;
    const estH = wrapEl?.clientHeight > 1 ? wrapEl.clientHeight : 560;
    const scale = Math.max(Math.min(estW / viewW, estH / viewH) * 0.9, 0.05);
    return min / scale;
  }

  function svgPinSizes(viewW, viewH, wrapEl, minCorePx){
    const min = minCorePx ?? ((typeof window !== 'undefined' && window.MIN_SVG_PIN_PX) || 10);
    if(typeof window !== 'undefined' && window.svgPinSizes){
      return window.svgPinSizes(viewW, viewH, wrapEl, min);
    }
    return { coreR: min, ringR: min * (14 / 5.5), strokeW: 3.3, islandR: min * (5 / 5.5), originCoreR: min * (4 / 5.5), originPulseR: min * (5 / 5.5) };
  }

  async function build(config, wrapEl, _legacyWorldPath, seaColor){
    if(!config || !wrapEl || !config.extensions?.length) return;

    const { label, origin, extensions } = config;
    const geo = await loadLand().catch(() => null);

    const bounds = computeBounds(origin, extensions);
    const { W, H } = viewDimensions(bounds);
    const project = makeProjection(bounds, W, H, PAD);
    const [ox, oy] = project(origin.lon, origin.lat);
    const minPx = (typeof window !== 'undefined' && window.MIN_SVG_LABEL_PX) || 14;
    const labelSize = svgLabelFontSize(W, H, wrapEl, minPx);
    const labelStroke = Math.max(2.2, labelSize * 0.28);
    const distSize = labelSize * 0.88;
    const distOffset = Math.max(13, labelSize * 1.05);
    const pin = svgPinSizes(W, H, wrapEl);

    const landHTML = geo ? buildLandPaths(geo, project, bounds) : '';

    let arcsHTML = '';
    let pinsHTML = '';

    extensions.forEach((ext, i) => {
      const [x, y] = project(ext.lon, ext.lat);
      const pinColor = resolvePinColor(ext, PIN_PALETTE?.[i % (PIN_PALETTE?.length || 9)]);
      const mx = (ox + x) / 2;
      const my = (oy + y) / 2 - Math.abs(x - ox) * 0.07 - 14;
      arcsHTML += `<path class="route-arc" stroke="${pinColor}" d="M${ox.toFixed(1)},${oy.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}"></path>`;

      const km = ext.distKm ?? haversineKm(origin.lat, origin.lon, ext.lat, ext.lon);
      const distLabel = formatDist(km, label);
      const [dx, dy, anchor, baseDx, baseDy] = labelOffsetForPin(x, y, W, i, labelSize);

      pinsHTML += `
      <g class="beach-pin" data-panel-key="${ext.panelKey || ext.id}" transform="translate(${x.toFixed(1)},${y.toFixed(1)})">
        <circle class="ring" r="${pin.ringR.toFixed(2)}" stroke="${pinColor}"></circle>
        <circle class="core" r="${pin.coreR.toFixed(2)}" fill="${pinColor}" stroke="#f6f2e8" stroke-width="${pin.strokeW.toFixed(2)}"></circle>
        <text class="beach-label" data-base-dx="${baseDx}" data-base-dy="${baseDy}" font-size="${labelSize.toFixed(2)}" stroke-width="${labelStroke.toFixed(2)}" x="${dx.toFixed(1)}" y="${dy.toFixed(1)}" text-anchor="${anchor}">${ext.name}</text>
        <text class="beach-dist" data-base-dx="${baseDx}" data-base-dy="${baseDy}" font-size="${distSize.toFixed(2)}" stroke-width="${Math.max(2, distSize * 0.28).toFixed(2)}" x="${dx.toFixed(1)}" y="${(dy + distOffset).toFixed(1)}" text-anchor="${anchor}">${distLabel}</text>
      </g>`;
    });

    wrapEl.innerHTML = `
    <svg viewBox="0 0 ${W.toFixed(1)} ${H.toFixed(1)}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
      ${landHTML}
      ${arcsHTML}
      <g class="origin-pin" transform="translate(${ox.toFixed(1)},${oy.toFixed(1)})">
        <circle class="pulse" r="${pin.originPulseR.toFixed(2)}"></circle>
        <circle class="core" r="${pin.originCoreR.toFixed(2)}"></circle>
        <text class="origin-label" data-base-dx="10" data-base-dy="-6" font-size="${labelSize.toFixed(2)}" stroke-width="${labelStroke.toFixed(2)}" x="10" y="-6">${label}</text>
      </g>
      ${pinsHTML}
    </svg>`;

    if(typeof window.scheduleSvgTypographyRefresh === 'function'){
      requestAnimationFrame(() => {
        window.scheduleSvgTypographyRefresh(wrapEl, W, H);
      });
    }

    wrapEl.querySelectorAll('.beach-pin').forEach(el => {
      el.addEventListener('click', () => {
        const key = el.dataset.panelKey;
        if(!key) return;
        if(typeof openExtensionPanel === 'function') openExtensionPanel(key);
        else if(typeof openPanel === 'function') openPanel(key);
      });
    });
  }

  return { build, loadLand };
})();
