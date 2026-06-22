# Datos del visualizador Honimunn

Estructura pensada para **añadir contenido en bloque** sin tocar el código de la app.

## Flujo de la aplicación

| Paso | Vista | Archivos de datos |
|------|--------|-------------------|
| 1. Globo | Landing / presentación | `countries.json`, `theme.json` |
| 2. Pins por continente | Colores en el globo | `theme.json` → `continentColor` |
| 3. Mapa de país | Ciudades / destinos | `country-cities.json`, `countries.geojson` |
| 4. Panel de destino | Storytelling por ciudad | `data/panels/{país}.json` |
| 5. Extensiones | Mapa playa post-luna de miel | `country-extensions.json` |
| 6. Experiencias | Lista gastronomía, cultura… | `country-experiences.json`, `experience-pool.json` |

## Archivos principales

### `countries.json`
Países visibles en el **globo** (pin + panel genérico si no hay ciudad).

```json
{
  "argentina": {
    "name": "Argentina",
    "lat": -34.6,
    "lon": -58.4,
    "continent": "América",
    "eyebrow": "América",
    "sub": "Descripción corta…",
    "items": [
      { "n": "01", "t": "Título", "d": "Texto", "img": "palabra clave imagen" }
    ]
  }
}
```

### `country-cities.json`
Ciudades por país (pins en el mapa de país).

```json
{
  "argentina": [
    { "key": "argentina:buenos-aires", "name": "Buenos Aires", "lat": -34.6, "lon": -58.38 }
  ]
}
```

### `data/panels/` — paneles por país

Un archivo JSON por país. Solo se carga el país que visitas (rápido al navegar).

**`index.json`** — lista de países disponibles:
```json
{ "version": 1, "countries": ["argentina", "japan", …], "totalPanels": 330 }
```

**`{país}.json`** — paneles de ese país:
```json
{
  "argentina:buenos-aires": {
    "name": "Buenos Aires",
    "eyebrow": "Energía porteña",
    "sub": "Subtítulo",
    "country": "argentina",
    "cover": "https://…",
    "items": [
      { "n": "01", "t": "Bloque", "d": "Descripción", "img": "https://… o keyword" }
    ]
  }
}
```

Para editar un destino: abre `data/panels/italia.json` (por ejemplo) y modifica la ciudad que necesites.

`city-panels.json` (raíz de `data/`) queda como **archivo legacy**; el generador y la app usan `data/panels/`. Para regenerar desde el monolito:
```bash
npm run split:panels
```

### `country-extensions.json`
Extensiones de playa desde un país de origen.

```json
{
  "japan": {
    "label": "Japón",
    "origin": { "lat": 35.68, "lon": 139.65 },
    "cta": { "title": "…", "subtitle": "…" },
    "map": { "eyebrow": "…", "title": "…", "subtitle": "…" },
    "extensions": [
      { "id": "okinawa", "name": "Okinawa", "lat": 26.2, "lon": 127.7, "panelKey": "okinawa", "continent": "Asia" }
    ]
  }
}
```

### `country-experiences.json`
Experiencias **por país** (si falta, se usa `experience-pool.json` como plantilla).

```json
{
  "japan": [
    { "type": "Gastronómica", "title": "…", "desc": "…" }
  ]
}
```

### `theme.json`
Colores de continentes y paleta de pins.

### `japan/`
Datos legacy del mapa SVG de Japón (hasta migrar a GeoJSON como el resto).

- `cities.json` — ciudades con posición en mapa artesanal
- `beaches.json` — paneles de extensiones japonesas
- `map.json` — contorno SVG y coordenadas

## Añadir contenido en bloque

### Nuevo país completo
1. Añadir entrada en `countries.json` (globo)
2. Añadir slug en `country-iso.json` si usa mapa GeoJSON
3. Añadir ciudades en `country-cities.json`
4. Añadir paneles en `data/panels/{país}.json` (misma clave `pais:ciudad`)
5. Opcional: `country-extensions.json`, `country-experiences.json`

### Regenerar desde catálogo externo
```bash
node scripts/build-from-catalog.js
node scripts/build-country-extensions.js
```

### Auditar mapas
```bash
node scripts/audit-country-maps.js
node scripts/audit-map-layout.js
node scripts/audit-map-labels.js
```

## GeoJSON

- `countries.geojson` — siluetas de países (mapas)
- `world-land.geojson` — tierra para globo y mapa de extensiones

## Próximos pasos recomendados

- Migrar Japón a `country-cities.json` + GeoJSON (eliminar `japan/`)
- Servir con `npm run serve` y validar antes de publicar
