/* =========================================================
   DESTINATION PANEL (vertical storytelling scroll)
========================================================= */
const panel = document.getElementById('panel');
const scrim = document.getElementById('scrim');
const rail = document.getElementById('rail');
const panelHero = document.getElementById('panelHero');
const panelStory = document.getElementById('panelStory');

const PLACEHOLDER_GRADIENTS = ['#FF2700','#E718B0','#AD2C1F','#80196E','#6B37B2','#2000FF','#0064F0','#04B148','#0D7240'];

const STORY_TITLE_POOL = [
  'Lo esencial', 'Qué ver y hacer', 'Entorno y paisaje', 'Gastronomía y barrios',
  'Naturaleza salvaje', 'Patrimonio e historia', 'Vida urbana', 'Cultura viva',
  'Aventura y experiencias', 'Playas e islas', 'Gastronomía local', 'Momentos para dos',
  'Dónde dormir', 'Tu estancia Honimunn',
];

function getCityPanels(){
  return window.CITY_PANELS || {};
}

function uniqueItemTitles(items){
  const list = Array.isArray(items) ? items : [];
  const used = new Set();
  return list.map((it, i) => {
    if(it.t && !used.has(it.t)){
      used.add(it.t);
      return it;
    }
    const fallback = STORY_TITLE_POOL[i] || `Detalle ${String(i + 1).padStart(2, '0')}`;
    let title = STORY_TITLE_POOL.find(t => !used.has(t)) || fallback;
    let n = 2;
    while(used.has(title)){
      title = `${fallback} ${n}`;
      n++;
    }
    used.add(title);
    return { ...it, t: title };
  });
}

const JAPAN_CITY_KEYS = {
  'japan:osaka': 'osaka',
  'japan:kyoto': 'kyoto',
  'japan:tokyo': 'tokyo',
  'japan:hiroshima': 'hiroshima',
  'japan:miyajima-island': 'miyajima',
  'japan:miyajima': 'miyajima',
};

function formatCityName(slug){
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function makePlaceholderCityPanel(name, countryKey){
  const country = window.COUNTRIES[countryKey];
  return {
    name,
    eyebrow: country?.continent || 'Destino Honimunn',
    sub: `Explorad ${name} con un itinerario diseñado a medida por Honimunn.`,
    country: countryKey,
    items: [
      { n:'01', t:'Lo esencial', d:`${name} concentra cultura, paisaje y momentos para recordar en pareja.`, img:'' },
      { n:'02', t:'Qué ver y hacer', d:'Barrios, miradores y experiencias locales sin prisas ni grupos.', img:'' },
      { n:'03', t:'Entorno y paisaje', d:'Naturaleza y paisajes que complementan vuestra luna de miel.', img:'' },
      { n:'04', t:'Gastronomía y barrios', d:'Sabores locales y calles con vida propia donde perderos juntos.', img:'' },
      { n:'05', t:'Tu estancia Honimunn', d:'Itinerario privado a medida con alojamientos seleccionados por vuestro planner.', img:'' },
    ],
  };
}

async function openCityPanel(cityKey, countryKey, cityName){
  if(window.CityPanels) await window.CityPanels.loadCountry(countryKey);

  const panels = getCityPanels();
  if(panels[cityKey]) return openPanel(cityKey);

  const japanKey = JAPAN_CITY_KEYS[cityKey];
  if(japanKey && window.CITIES[japanKey]) return openPanel(japanKey);

  const localKey = cityKey.includes(':') ? cityKey.split(':').pop() : cityKey;
  if(window.CITIES[localKey]) return openPanel(localKey);

  const name = cityName || formatCityName(localKey);
  openPanel(cityKey, makePlaceholderCityPanel(name, countryKey));
}

function buildStoryImage(query, color, idx){
  if(query && /^https?:\/\//i.test(String(query))){
    return `<div class="story-img"><img src="${query}" alt="" loading="lazy"></div>`;
  }
  const c = PLACEHOLDER_GRADIENTS[idx % PLACEHOLDER_GRADIENTS.length] || color;
  return `<div class="story-img" style="background:linear-gradient(135deg, ${c}33, ${c}aa);display:flex;align-items:center;justify-content:center;">
    <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.6" opacity="0.85"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>
  </div>`;
}

function resolveDestinationColor(key, c){
  const pin = GLOBE_PINS.find(p => p.id === 'cpin-' + key);
  if(pin) return pin.color;
  if(window.BEACH_CONTINENT?.[key]) return getContinentColor(window.BEACH_CONTINENT[key]);
  if(window.CITIES[key]) return getContinentColor('Asia');
  const panelCountry = c.country || getCityPanels()[key]?.country;
  if(panelCountry && window.COUNTRIES[panelCountry]) return getContinentColor(window.COUNTRIES[panelCountry].continent);
  if(c.continent) return getContinentColor(c.continent);
  return c.color;
}

function openPanel(key, panelOverride){
  const panels = getCityPanels();
  let c = panelOverride || window.CITIES[key] || window.BEACHES[key] || panels[key] || window.COUNTRIES[key];
  if(!c) return;
  const items = uniqueItemTitles(c.items);
  const pinColor = resolveDestinationColor(key, c);
  const cover = c.cover && /^https?:\/\//i.test(String(c.cover))
    ? `<div class="panel-cover"><img src="${c.cover}" alt="" loading="lazy"></div>`
    : '';

  panelHero.innerHTML = `
    ${cover}
    <div class="eyebrow">${c.eyebrow}</div>
    <h2>${c.name}</h2>
    <div class="sub">${c.sub}</div>
  `;

  panelStory.innerHTML = '';
  items.forEach((it, idx)=>{
    const block = document.createElement('div');
    block.className='story-block';
    block.dataset.idx = idx;
    block.innerHTML = `
      ${buildStoryImage(it.img, pinColor, idx)}
      <div class="story-num">${it.n}</div>
      <h3>${it.t}</h3>
      <p>${it.d}</p>
    `;
    panelStory.appendChild(block);
    if(idx < items.length-1){
      const div = document.createElement('div');
      div.className='story-divider';
      panelStory.appendChild(div);
    }
  });

  const cta = document.createElement('div');
  cta.className='panel-cta';
  cta.innerHTML = `<p>¿Listos para descubrir ${c.name} en vuestra luna de miel? Vuestro Honimunn Planner os prepara un itinerario a medida.</p>
  <button type="button">Hablar con mi planner</button>`;
  panelStory.appendChild(cta);

  // rail dots
  rail.innerHTML='';
  items.forEach((_,i)=>{
    const seg = document.createElement('div');
    seg.className='seg';
    seg.dataset.idx=i;
    rail.appendChild(seg);
  });

  panel.classList.add('open');
  scrim.classList.add('show');
  rail.classList.add('show');
  panel.scrollTop = 0;

  requestAnimationFrame(()=>{
    document.querySelectorAll('.story-block').forEach((b,i)=>{
      setTimeout(()=> b.classList.add('visible'), 80*i);
    });
  });

  setupScrollObserver();
}

function setupScrollObserver(){
  const blocks = panelStory.querySelectorAll('.story-block');
  const segs = rail.querySelectorAll('.seg');
  panel.onscroll = ()=>{
    let activeIdx = 0;
    blocks.forEach((b,i)=>{
      const r = b.getBoundingClientRect();
      if(r.top < window.innerHeight*0.5) activeIdx = i;
    });
    segs.forEach((s,i)=> s.classList.toggle('active', i===activeIdx));
  };
}

function closePanelFn(){
  panel?.classList.remove('open');
  scrim?.classList.remove('show');
  rail?.classList.remove('show');
}
const closePanelBtn = document.getElementById('closePanel');
if (closePanelBtn) closePanelBtn.addEventListener('click', closePanelFn);
if (scrim) scrim.addEventListener('click', closePanelFn);
