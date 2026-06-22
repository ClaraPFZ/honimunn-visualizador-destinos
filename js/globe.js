/* =========================================================
   THREE.JS GLOBE
========================================================= */

let scene, camera, renderer, globe, group;
let dragging=false, lastX=0, lastY=0, rotY=2.26, rotX=-0.25, velX=0, velY=0;
let raf;
const stageEl = document.getElementById('stage');
const GLOBE_LANDING_Z = 10.2;
const GLOBE_MORPH_Z = 5.2;
const GLOBE_LANDING_OFFSET_Y = -0.55;

const WORLD_MAP_W = 2048;
const WORLD_MAP_H = 1024;
const WORLD_LAND_GEOJSON = 'world-land.geojson';

function lonLatToMapXY(lon, lat){
  return [
    ((lon + 180) / 360) * WORLD_MAP_W,
    ((90 - lat) / 180) * WORLD_MAP_H
  ];
}

function traceGeoRing(ctx, ring){
  ring.forEach((coord, i) => {
    const [x, y] = lonLatToMapXY(coord[0], coord[1]);
    if(i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
}

function fillGeoPolygon(ctx, polygonCoords){
  ctx.beginPath();
  traceGeoRing(ctx, polygonCoords[0]);
  for(let h = 1; h < polygonCoords.length; h++){
    traceGeoRing(ctx, polygonCoords[h]);
  }
  ctx.fill('evenodd');
}

function buildGlobeMaterial(geojson){
  const canvas = document.createElement('canvas');
  canvas.width = WORLD_MAP_W;
  canvas.height = WORLD_MAP_H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = getSeaColor();
  ctx.fillRect(0, 0, WORLD_MAP_W, WORLD_MAP_H);
  ctx.fillStyle = '#f6f2e8';

  geojson.features.forEach(f => {
    const g = f.geometry;
    if(!g) return;
    if(g.type === 'Polygon'){
      fillGeoPolygon(ctx, g.coordinates);
    } else if(g.type === 'MultiPolygon'){
      g.coordinates.forEach(poly => fillGeoPolygon(ctx, poly));
    }
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshPhongMaterial({
    map: tex,
    color: 0xffffff,
    emissive: 0x000000,
    emissiveIntensity: 0,
    shininess: 6,
    specular: 0x1a1d24
  });
}

function addGlobeMesh(geojson){
  const geo = new THREE.SphereGeometry(2.65, 64, 64);
  const mat = buildGlobeMaterial(geojson);
  globe = new THREE.Mesh(geo, mat);
  globe.rotation.y = 0;
  group.add(globe);
}

function initGlobe(){
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 100);
  camera.position.set(0, 0.4, GLOBE_LANDING_Z);
  camera.lookAt(0, 0.05, 0);

  renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  stageEl.appendChild(renderer.domElement);

  group = new THREE.Group();
  group.position.y = GLOBE_LANDING_OFFSET_Y;
  scene.add(group);

  // base sphere - Natural Earth land shapes (grey sea, cream continents)
  fetch(WORLD_LAND_GEOJSON)
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then(data => {
      if (!data?.features) throw new Error('GeoJSON sin features');
      addGlobeMesh(data);
    })
    .catch(err => console.error('Globe map failed', err));

  // graticule lines (lat/long) - cream, subtle
  const linesMat = new THREE.LineBasicMaterial({color:0xf6f2e8, transparent:true, opacity:0.10});
  for(let lat=-60; lat<=60; lat+=30){
    const pts=[];
    const phi = (90-lat)*Math.PI/180;
    for(let lon=0; lon<=360; lon+=4){
      const theta = lon*Math.PI/180;
      pts.push(new THREE.Vector3(
        2.66*Math.sin(phi)*Math.cos(theta),
        2.66*Math.cos(phi),
        2.66*Math.sin(phi)*Math.sin(theta)
      ));
    }
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    group.add(new THREE.Line(g, linesMat));
  }
  for(let lon=0; lon<360; lon+=30){
    const pts=[];
    const theta = lon*Math.PI/180;
    for(let lat=-90; lat<=90; lat+=4){
      const phi=(90-lat)*Math.PI/180;
      pts.push(new THREE.Vector3(
        2.66*Math.sin(phi)*Math.cos(theta),
        2.66*Math.cos(phi),
        2.66*Math.sin(phi)*Math.sin(theta)
      ));
    }
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    group.add(new THREE.Line(g, linesMat));
  }

  const amb = new THREE.AmbientLight(0xffffff, 0.55);
  scene.add(amb);
  const dir = new THREE.DirectionalLight(0xfff3e0, 0.9);
  dir.position.set(5,4,6);
  scene.add(dir);
  const rim = new THREE.DirectionalLight(0xc9482f, 0.5);
  rim.position.set(-5,-2,-4);
  scene.add(rim);

  group.rotation.y = rotY;
  group.rotation.x = rotX;

  window.addEventListener('resize', onResize);
  attachDrag();
  animate();
  updatePinPosition();
}

// Globe pins desde data/countries.json
let GLOBE_PINS = [];

function buildGlobePins() {
  const countries = window.COUNTRIES || {};
  GLOBE_PINS = Object.entries(countries).map(([key, c]) => ({
    id: 'cpin-' + key,
    lat: c.lat,
    lon: c.lon,
    label: c.name,
    color: c.color || getContinentColor(c.continent),
    onClick: () => morphToCountry(key),
  }));
  GLOBE_PINS.forEach(p => { p.localPos = latLonToVector3(p.lat, p.lon, 2.65); });
}

function latLonToVector3(lat, lon, radius){
  const phi = (90-lat)*Math.PI/180;
  const theta = (lon+180)*Math.PI/180;
  return new THREE.Vector3(
    -radius*Math.sin(phi)*Math.cos(theta),
    radius*Math.cos(phi),
    radius*Math.sin(phi)*Math.sin(theta)
  );
}

function updatePinPosition(){
  if(globeMorphed) return;
  group.updateMatrixWorld();

  GLOBE_PINS.forEach(p=>{
    const pin = document.getElementById(p.id);
    if(!pin) return;
    const worldPos = p.localPos.clone().applyMatrix4(group.matrixWorld);
    const projected = worldPos.clone().project(camera);

    const worldNormal = worldPos.clone().sub(group.position).normalize();
    const toCamera = camera.position.clone().sub(worldPos).normalize();
    const facing = worldNormal.dot(toCamera);

    const x = (projected.x*0.5+0.5)*window.innerWidth;
    const y = (-projected.y*0.5+0.5)*window.innerHeight;

    if(facing > 0.05){
      pin.style.opacity = Math.min(1, (facing-0.05)*4);
      pin.style.left = x+'px';
      pin.style.top = y+'px';
      pin.style.pointerEvents = 'auto';
    } else {
      pin.style.opacity = 0;
      pin.style.pointerEvents = 'none';
    }
  });
}

function onResize(){
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function attachDrag(){
  const dom = renderer.domElement;
  dom.style.cursor='grab';
  dom.addEventListener('pointerdown', e=>{
    dragging=true; lastX=e.clientX; lastY=e.clientY; dom.style.cursor='grabbing';
  });
  window.addEventListener('pointerup', ()=>{ dragging=false; dom.style.cursor='grab'; });
  window.addEventListener('pointermove', e=>{
    if(!dragging || globeMorphed) return;
    const dx = e.clientX-lastX, dy = e.clientY-lastY;
    velY = dx*0.005; velX = dy*0.005;
    rotY += velY; rotX += velX;
    rotX = Math.max(-1.1, Math.min(1.1, rotX));
    lastX=e.clientX; lastY=e.clientY;
  });
  // touch handled by pointer events already
}

let autoSpin = 0.0011;
function animate(){
  raf = requestAnimationFrame(animate);
  if(!globeMorphed){
    if(!dragging){
      velY *= 0.94; velX *= 0.94;
      rotY += velY + autoSpin;
      rotX += velX;
      rotX = Math.max(-1.1, Math.min(1.1, rotX));
    }
    group.rotation.y = rotY;
    group.rotation.x = rotX;
    updatePinPosition();
  }
  renderer.render(scene, camera);
}
