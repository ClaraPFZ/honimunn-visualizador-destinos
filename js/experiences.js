/* =========================================================
   EXPERIENCES (placeholder list per country)
========================================================= */
function getExperiencePool() {
  return window.EXPERIENCE_POOL || [];
}


function hashString(str){
  let h = 0;
  for(let i = 0; i < str.length; i++) h = ((h << 5) - h) + str.charCodeAt(i) | 0;
  return Math.abs(h);
}

function getExperiencesForCountry(countryKey){
  const custom = window.COUNTRY_EXPERIENCES?.[countryKey];
  if(Array.isArray(custom) && custom.length) return custom;

  const h = hashString(countryKey);
  const count = 3 + (h % 8); /* 3–10 experiencias */
  const pool = [...getExperiencePool()];
  if (!pool.length) return [];
  const picked = [];
  for(let i = 0; i < count; i++){
    const idx = (h + i * 7) % pool.length;
    picked.push({ ...pool[idx], title: pool[idx].title, desc: pool[idx].desc });
  }
  return picked;
}

function openExperiencesPanel(countryKey){
  const countryName = window.COUNTRIES[countryKey]?.name
    || countryKey.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const experiences = getExperiencesForCountry(countryKey);

  panelHero.innerHTML = `
    <div class="eyebrow">Experiencias</div>
    <h2>${countryName}</h2>
    <div class="sub">Selección de momentos gastronómicos, culturales y de bienestar para enriquecer vuestro viaje.</div>
  `;

  panelStory.innerHTML = '<div class="experiences-list"></div>';
  const list = panelStory.querySelector('.experiences-list');

  experiences.forEach((exp, idx) => {
    if(idx > 0){
      const div = document.createElement('div');
      div.className = 'experience-divider';
      list.appendChild(div);
    }
    const item = document.createElement('article');
    item.className = 'experience-item';
    item.innerHTML = `
      <span class="experience-type">${exp.type}</span>
      <h3>${exp.title}</h3>
      <p>${exp.desc}</p>
    `;
    list.appendChild(item);
  });

  const cta = document.createElement('div');
  cta.className = 'panel-cta';
  cta.innerHTML = `<p>Estas experiencias son orientativas — vuestro Honimunn Planner las adapta a vuestro ritmo e intereses.</p>
  <button type="button">Hablar con mi planner</button>`;
  panelStory.appendChild(cta);

  rail.innerHTML = '';
  experiences.forEach((_, i) => {
    const seg = document.createElement('div');
    seg.className = 'seg';
    seg.dataset.idx = i;
    rail.appendChild(seg);
  });

  panel.classList.add('open');
  scrim.classList.add('show');
  rail.classList.add('show');
  panel.scrollTop = 0;

  requestAnimationFrame(() => {
    panelStory.querySelectorAll('.experience-item').forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), 60 * i);
    });
  });

  setupExperiencesScrollObserver();
}

function setupExperiencesScrollObserver(){
  const items = panelStory.querySelectorAll('.experience-item');
  const segs = rail.querySelectorAll('.seg');
  panel.onscroll = () => {
    let activeIdx = 0;
    items.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      if(r.top < window.innerHeight * 0.55) activeIdx = i;
    });
    segs.forEach((s, i) => s.classList.toggle('active', i === activeIdx));
  };
}

