/* Mapa SVG de Japón — datos en data/japan/map.json (cargados por HonimunnData) */

function projectJapanCity(lon, lat){
  const { bounds, W, H, PAD } = window.JAPAN_MAP;
  return [
    PAD + ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * (W - PAD * 2),
    PAD + ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * (H - PAD * 2),
  ];
}

function buildJapanSVG(){
  const wrap = document.getElementById('countrySvgWrap');
  if (!wrap || !window.JAPAN_MAP || !window.CITIES) {
    if (wrap) wrap.innerHTML = '<div class="map-fallback"><p>Mapa de Japón no disponible.</p></div>';
    return;
  }
  const { W, H } = window.JAPAN_MAP;
  const minLabelPx = window.MIN_SVG_LABEL_PX || 14;
  const labelSize = typeof window.svgLabelFontSize === 'function'
    ? window.svgLabelFontSize(W, H, wrap)
    : minLabelPx;
  const labelStroke = Math.max(2.2, labelSize * 0.28);
  const labelScale = Math.max(labelSize / minLabelPx, 1);
  const pin = typeof window.svgPinSizes === 'function'
    ? window.svgPinSizes(W, H, wrap)
    : { coreR: 12, ringR: 30.5, strokeW: 3.3 };
  // manual label offsets [dx,dy,anchor] to avoid overlap in the dense Kansai cluster
  const LABEL_OFFSET = {
    tokyo:     [-12, 4, 'end'],
    kyoto:     [12, 4, 'start'],
    osaka:     [12, -8, 'start'],
    hiroshima: [12, -8, 'start'],
    miyajima:  [12, -8, 'start'],
    kanazawa:  [12, 10, 'start'],
    takayama:  [-12, 10, 'end'],
    koya:      [12, -8, 'start'],
  };

  const asiaColor = getContinentColor('Asia');
  let pinsHTML='';
  Object.entries(window.CITIES).forEach(([key,c])=>{
    const geo = window.JAPAN_COORDS[key];
    const [x, y] = geo ? projectJapanCity(geo.lon, geo.lat) : [c.x ?? 0, c.y ?? 0];
    const [odx, ody, anchor] = LABEL_OFFSET[key] || [12,4,'start'];
    const dx = odx * labelScale;
    const dy = ody * labelScale;
    pinsHTML += `
    <g class="city-pin" data-city="${key}" transform="translate(${x.toFixed(1)},${y.toFixed(1)})">
      <circle class="ring" r="${pin.ringR.toFixed(2)}" stroke="${asiaColor}"></circle>
      <circle class="core" r="${pin.coreR.toFixed(2)}" fill="${asiaColor}" stroke="#f6f2e8" stroke-width="${pin.strokeW.toFixed(2)}"></circle>
      <text class="city-label" data-base-dx="${odx}" data-base-dy="${ody}" font-size="${labelSize.toFixed(2)}" stroke-width="${labelStroke.toFixed(2)}" x="${dx.toFixed(1)}" y="${dy.toFixed(1)}" text-anchor="${anchor}">${c.name}</text>
    </g>`;
  });

  wrap.innerHTML = `
  <svg viewBox="0 0 400 460" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
    <path class="jp-island" d="${window.JAPAN_PATH}"></path>
    ${pinsHTML}
  </svg>`;

  if(typeof window.scheduleSvgTypographyRefresh === 'function'){
    window.scheduleSvgTypographyRefresh(wrap, 400, 460, { pinColor: asiaColor });
  }

  wrap.querySelectorAll('.city-pin').forEach(el=>{
    el.addEventListener('click', ()=> openPanel(el.dataset.city));
  });
}
