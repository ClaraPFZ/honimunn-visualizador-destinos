/* Colores y utilidades compartidas (theme cargado desde data/theme.json) */
function getContinentColor(continent) {
  return (window.CONTINENT_COLOR || {})[continent] || (window.PIN_PALETTE || ['#E718B0'])[0];
}

function getSeaColor() {
  return getComputedStyle(document.documentElement).getPropertyValue('--sea').trim() || '#060932';
}
