# Honimunn — Visualizador de destinos

Aplicación estática en 6 capas:

1. **Globo** (`js/globe.js`) — landing de presentación
2. **Países** (`data/countries.json` + `js/globe.js`) — pins por continente
3. **Mapa país** (`js/country-map.js`) — destinos principales
4. **Panel destino** (`js/panel.js` + `js/city-panels.js` + `data/panels/`)
5. **Extensiones** (`js/extension-map.js` + `data/country-extensions.json`)
6. **Experiencias** (`js/experiences.js` + `data/country-experiences.json`)

## Estructura

```
├── index.html              # App principal
├── css/main.css            # Estilos
├── js/
│   ├── app.js              # Arranque
│   ├── config.js           # Colores / utilidades
│   ├── data-store.js       # Carga de JSON
│   ├── city-panels.js      # Paneles por país (lazy load)
│   ├── globe.js            # (1) Globo 3D
│   ├── navigation.js       # Transiciones entre vistas
│   ├── country-map.js      # (3) Mapas país
│   ├── extension-map.js    # (5) Mapa extensiones
│   ├── panel.js            # (4) Panel storytelling
│   ├── experiences.js      # (6) Lista experiencias
│   └── japan-map.js        # Mapa SVG Japón (legacy)
├── data/                   # Ver data/README.md
│   └── panels/             # Un JSON por país (paneles de ciudad)
├── scripts/                # Build y auditoría
└── assets/                 # Logos
```

## Desarrollo

```bash
npm run serve
# Abrir http://localhost:8080
```

## Añadir datos

Ver **[data/README.md](data/README.md)** para el esquema de cada JSON y cómo ampliar países, ciudades, paneles y experiencias.

## Archivo legacy

`honimunn-catalogo-japon_2.html` — versión monolítica anterior (referencia). La app activa es `index.html`.
