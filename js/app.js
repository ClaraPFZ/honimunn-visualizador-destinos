/* Arranque de la aplicación */
function setupGlobePin() {
  GLOBE_PINS.forEach(p => {
    const pin = document.createElement('div');
    pin.id = p.id;
    pin.className = 'globe-pin';
    const dotStyle = p.color ? ` style="background:${p.color}"` : '';
    pin.innerHTML = `<div class="label">${p.label}</div><div class="dot"${dotStyle}></div>`;
    document.body.appendChild(pin);
    pin.addEventListener('click', p.onClick);
  });
}

function showLoadError(message) {
  const err = document.getElementById('loadingError');
  const dot = document.querySelector('#loadingScreen .dot-load');
  if (err) {
    err.hidden = false;
    err.textContent = message;
  }
  if (dot) dot.style.display = 'none';
}

function hideLoadingScreen() {
  const el = document.getElementById('loadingScreen');
  if (el) el.classList.add('hide');
}

window.addEventListener('load', async () => {
  let dataReady = false;

  try {
    await HonimunnData.load();
    dataReady = true;
  } catch (err) {
    console.error('Error cargando datos:', err);
    showLoadError('No se pudieron cargar los datos del catálogo. Recarga la página o contacta con soporte.');
  }

  if (dataReady) {
    try {
      buildGlobePins();
      initGlobe();
      setupGlobePin();
    } catch (err) {
      console.error('Error iniciando globo:', err);
      showLoadError('No se pudo iniciar el globo interactivo.');
      dataReady = false;
    }
  }

  if (dataReady) {
    try {
      await CountryMap.loadData();
      if (typeof ExtensionMap !== 'undefined' && ExtensionMap.loadLand) {
        ExtensionMap.loadLand().catch(() => {});
      }
    } catch (err) {
      console.error('Error cargando mapas:', err);
    }
  }

  if (dataReady) {
    setTimeout(hideLoadingScreen, 350);
  }
});
