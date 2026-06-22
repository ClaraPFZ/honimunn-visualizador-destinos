/* =========================================================
   MORPH: globe -> map (generic)
========================================================= */
let globeMorphed = false;
let currentStage = null; // country key | 'world' | null
let activeCountryKey = null;
const mapStage = document.getElementById('mapStage');
const worldStage = document.getElementById('worldStage');
const backBtn = document.getElementById('backBtn');
const worldBackBtn = document.getElementById('worldBackBtn');

function setUiTheme(theme){
  document.body.classList.toggle('theme-light', theme === 'light');
  document.body.classList.toggle('theme-dark', theme === 'dark');
}

function morphFromGlobe(stageEl, onDone){
  if (!camera || !group || !renderer) {
    if (stageEl) stageEl.classList.add('active');
    if (onDone) onDone();
    return;
  }
  globeMorphed = true;
  document.body.classList.remove('landing-globe');
  setUiTheme(stageEl === worldStage ? 'dark' : 'light');
  GLOBE_PINS.forEach(p=>{
    const el = document.getElementById(p.id);
    if(el){ el.style.opacity = 0; el.style.pointerEvents = 'none'; }
  });

  let t0 = performance.now();
  const dur = 900;
  let done = false;
  function finish(){
    if(done) return;
    done = true;
    camera.position.z = GLOBE_MORPH_Z;
    group.scale.setScalar(1.6);
    group.position.y = 0;
    renderer.domElement.style.filter = 'blur(14px) brightness(0.6)';
    renderer.domElement.style.opacity = '0';
    stageEl.classList.add('active');
    if(onDone) onDone();
  }
  function step(now){
    if(done) return;
    const p = Math.min(1, (now-t0)/dur);
    const ease = 1 - Math.pow(1-p, 3);
    camera.position.z = GLOBE_LANDING_Z - ease * (GLOBE_LANDING_Z - GLOBE_MORPH_Z);
    group.scale.setScalar(1 + ease * 0.6);
    group.position.y = GLOBE_LANDING_OFFSET_Y * (1 - ease);
    if (globe?.material) globe.material.opacity = 1;
    renderer.domElement.style.filter = `blur(${ease*14}px) brightness(${1-ease*0.4})`;
    renderer.domElement.style.opacity = `${1-ease}`;
    if(p<1){ requestAnimationFrame(step); }
    else{ finish(); }
  }
  requestAnimationFrame(step);
  setTimeout(finish, dur+1500);
}

function morphToGlobeFrom(stageEl, onDone){
  if (!camera || !group || !renderer) {
    if (stageEl) stageEl.classList.remove('active');
    if (onDone) onDone();
    return;
  }
  globeMorphed = false;
  stageEl.classList.remove('active');
  closePanelFn();

  let t0=performance.now();
  const dur=700;
  let done = false;
  function finish(){
    if(done) return;
    done = true;
    camera.position.z = GLOBE_LANDING_Z;
    group.scale.setScalar(1);
    group.position.y = GLOBE_LANDING_OFFSET_Y;
    renderer.domElement.style.filter = 'blur(0px) brightness(1)';
    renderer.domElement.style.opacity = '1';
    document.body.classList.add('landing-globe');
    setUiTheme('light');
    if(onDone) onDone();
  }
  function step(now){
    if(done) return;
    const p = Math.min(1,(now-t0)/dur);
    const ease = 1-Math.pow(1-p,3);
    camera.position.z = GLOBE_MORPH_Z + ease * (GLOBE_LANDING_Z - GLOBE_MORPH_Z);
    group.scale.setScalar(1.6 - ease * 0.6);
    group.position.y = GLOBE_LANDING_OFFSET_Y * ease;
    renderer.domElement.style.filter = `blur(${(1-ease)*9}px) brightness(${0.6+ease*0.4})`;
    renderer.domElement.style.opacity = `${ease}`;
    if(p<1){ requestAnimationFrame(step); }
    else{ finish(); }
  }
  requestAnimationFrame(step);
  setTimeout(finish, dur+1500);
}

function updateMapHeading(key){
  const c = window.COUNTRIES?.[key];
  if (!mapStage) return;
  mapStage.dataset.country = key;
  const eyebrow = document.getElementById('mapEyebrow');
  const title = document.getElementById('mapTitle');
  const subtitle = document.getElementById('mapSubtitle');
  if (!eyebrow || !title || !subtitle) return;
  if(key === 'japan'){
    eyebrow.textContent = 'Destino';
    title.textContent = 'Japón';
    subtitle.textContent = 'Tu luna de miel empieza aquí — elige una ciudad';
  } else if(c){
    eyebrow.textContent = c.eyebrow || c.continent || 'Destino';
    title.textContent = c.name;
    subtitle.textContent = 'Explora las ciudades imprescindibles';
  }
  updateExtensionCta(key);
}

function getCountryExtensions(){
  return window.COUNTRY_EXTENSIONS || {};
}

function updateExtensionCta(countryKey){
  const cfg = getCountryExtensions()[countryKey];
  const cta = document.getElementById('beachCta');
  if(!cta) return;
  if(cfg?.extensions?.length >= 2){
    mapStage.classList.add('has-extensions');
    const titleEl = cta.querySelector('.txt b');
    const subEl = cta.querySelector('.txt span');
    if (titleEl) titleEl.textContent = cfg.cta?.title || 'Extiende tu luna de miel';
    if (subEl) subEl.textContent = cfg.cta?.subtitle || 'Añade unos días de playa';
  } else {
    mapStage.classList.remove('has-extensions');
  }
}

async function morphToCountry(key){
  activeCountryKey = key;
  currentStage = key;
  updateMapHeading(key);
  closePanelFn();
  morphFromGlobe(mapStage, async ()=>{
    backBtn?.classList.add('show');
    try {
      await CountryMap.build(key, document.getElementById('countrySvgWrap'));
    } catch (err) {
      console.error('Error construyendo mapa:', err);
      const wrap = document.getElementById('countrySvgWrap');
      if (wrap) wrap.innerHTML = '<div class="map-fallback"><p>No se pudo cargar el mapa.</p></div>';
    }
  });
}

function morphBackToGlobe(){
  currentStage = null;
  activeCountryKey = null;
  backBtn.classList.remove('show');
  morphToGlobeFrom(mapStage);
}

let extensionOriginCountry = null;

async function morphToExtensionsMap(){
  const cfg = getCountryExtensions()[activeCountryKey];
  if(!cfg) return;
  extensionOriginCountry = activeCountryKey;
  currentStage = 'world';
  setUiTheme('dark');
  updateWorldBackLabel();
  updateWorldHeading(cfg);
  mapStage.classList.remove('active');
  backBtn.classList.remove('show');
  closePanelFn();
  await new Promise(r => setTimeout(r, 360));
  worldStage?.classList.add('active');
  worldBackBtn?.classList.add('show');
  const wrap = document.getElementById('worldSvgWrap');
  try {
    await ExtensionMap.build(cfg, wrap, null, getSeaColor());
  } catch (err) {
    console.error('Error construyendo mapa de extensiones:', err);
    if (wrap) wrap.innerHTML = '<div class="map-fallback"><p>No se pudo cargar el mapa.</p></div>';
  }
}

function morphWorldBackToCountry(){
  if(!extensionOriginCountry) return morphWorldBackToGlobe();
  const key = extensionOriginCountry;
  currentStage = key;
  activeCountryKey = key;
  setUiTheme('light');
  worldStage.classList.remove('active');
  worldBackBtn.classList.remove('show');
  closePanelFn();
  updateMapHeading(key);
  setTimeout(async ()=>{
    mapStage?.classList.add('active');
    backBtn?.classList.add('show');
    try {
      await CountryMap.build(key, document.getElementById('countrySvgWrap'));
    } catch (err) {
      console.error('Error construyendo mapa:', err);
    }
  }, 350);
}

function updateWorldHeading(cfg){
  const map = cfg?.map || {};
  const heading = document.querySelector('#worldStage .world-heading');
  if (!heading) return;
  const eyebrow = heading.querySelector('.eyebrow');
  const title = heading.querySelector('h2');
  const subtitle = heading.querySelector('p');
  if (eyebrow) eyebrow.textContent = map.eyebrow || 'Extensión';
  if (title) title.textContent = map.title || 'Combinaciones posibles';
  if (subtitle) subtitle.textContent = map.subtitle || '';
}

function updateWorldBackLabel(){
  const label = extensionOriginCountry
    ? `Volver a ${window.COUNTRIES?.[extensionOriginCountry]?.name || getCountryExtensions()[extensionOriginCountry]?.label || 'destino'}`
    : 'Volver al globo';
  const backLabel = worldBackBtn?.querySelector('.back-label');
  if (backLabel) backLabel.textContent = label;
}

function findExtensionByPanelKey(panelKey) {
  const exts = getCountryExtensions();
  for (const cfg of Object.values(exts)) {
    const hit = cfg.extensions?.find(e => e.panelKey === panelKey || e.id === panelKey);
    if (hit) return hit;
  }
  return null;
}

function makeBeachPanel(ext) {
  const name = ext.name || ext.id;
  const continent = ext.continent || window.BEACH_CONTINENT?.[ext.panelKey || ext.id] || 'Asia';
  return {
    name,
    continent,
    eyebrow: 'Extensión de playa',
    sub: `Unos días en ${name} para cerrar la luna de miel frente al mar.`,
    items: [
      { n: '01', t: 'Playas y calma', d: `${name} ofrece aguas cristalinas y un ritmo pausado tras el itinerario principal.`, img: '' },
      { n: '02', t: 'Alojamientos frente al mar', d: 'Resorts y villas seleccionados por Honimunn, lejos del turismo masivo.', img: '' },
      { n: '03', t: 'Experiencias en pareja', d: 'Snorkel, atardeceres privados o spa: el broche perfecto del viaje.', img: '' },
      { n: '04', t: 'Logística sin fricción', d: 'Vuelos, traslados y conexiones coordinados con el resto del itinerario.', img: '' },
      { n: '05', t: 'Tu extensión Honimunn', d: 'Diseñada a medida para encajar con vuestras fechas y preferencias.', img: '' },
    ],
  };
}

function openExtensionPanel(key){
  if(window.BEACHES?.[key]) return openPanel(key);
  if(window.COUNTRIES?.[key]) return openPanel(key);
  if(window.CITY_PANELS?.[key]) return openPanel(key);
  if(key.includes(':')) return openCityPanel(key, key.split(':')[0]);
  const ext = findExtensionByPanelKey(key);
  if (ext) return openPanel(key, makeBeachPanel(ext));
  openPanel(key);
}

function morphWorldBackToGlobe(){
  extensionOriginCountry = null;
  currentStage = null;
  worldBackBtn?.classList.remove('show');
  morphToGlobeFrom(worldStage);
}

if (backBtn) backBtn.addEventListener('click', morphBackToGlobe);
if (worldBackBtn) {
  worldBackBtn.addEventListener('click', ()=>{
    if(extensionOriginCountry) morphWorldBackToCountry();
    else morphWorldBackToGlobe();
  });
}
const beachCta = document.getElementById('beachCta');
const experiencesCta = document.getElementById('experiencesCta');
if (beachCta) beachCta.addEventListener('click', morphToExtensionsMap);
if (experiencesCta) {
  experiencesCta.addEventListener('click', ()=>{
    if(activeCountryKey) openExperiencesPanel(activeCountryKey);
  });
}

