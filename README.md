# PokéRadar — Expedición Argentina

Radar de exploración sobre el mapa real de Argentina. El terreno es OpenFreeMap y el contorno del país es Natural Earth. Las fichas salen de PokéAPI. Las posiciones son encuentros simulados de Kanto, reproducibles. No son apariciones reales.

La pantalla recorre tres momentos: explorar el terreno, descubrir una criatura y registrar la ficha en la bitácora.

## Qué se puede hacer

La expedición tiene 56 especies de Kanto (Pokédex Nacional 1–151), escritas en el catálogo. Cada ficha tiene tres identidades: el número nacional, el número de expedición (1–56) y un id estable `kanto-025`. Ese id no sale de la posición en el array. Al entrar no se pide ninguna ficha: el catálogo es local. La ficha completa se pide al elegir.

Cincuenta especies están en el mapa. Cada una usa el hábitat que PokéAPI publica para su zona. Las cuotas son 5, 7, 4, 5, 5, 5, 4, 5, 4 y 6. La semilla `pokeradar-kanto-v1` fija la coordenada. Dar vuelta el catálogo no mueve los puntos. Cada punto cae dentro del rectángulo de su zona y al este de una polilínea de la divisoria con Chile. El mar de Puerto Pirámides queda en el Golfo Nuevo. No hay un polígono de costa: un punto dentro del rectángulo puede caer en una laguna chica.

Seis especies quedan reservadas y no se dibujan como encuentros: Articuno, Zapdos, Moltres, Aerodactyl, Mewtwo y Mew. Cinco tienen hábitat `rare`, que no es una zona. Aerodactyl es de montaña, y aun así queda fuera del mapa. No hay escena interior ni revelación.

En el zoom del país se ven diez sellos con el nombre y la cantidad. Si dos rectángulos se pisan, el sello se corre en pantalla y el ancla no se mueve: así Iguazú y Cataratas se pueden pulsar. Desde zoom 6.5 el mapa cambia a encuentros, agrupados si caen a menos de 36 px. Pulsar una zona vuela a zoom 8. Elegir una criatura vuela a zoom 12.2 y pide la ficha. Con movimiento reducido el mismo destino es un salto.

La ficha muestra el nombre en español cuando PokéAPI lo trae, el número nacional, el número de expedición, los tipos, el artwork oficial o el sprite, las estadísticas base y una línea de zona y hábitat. Si la especie tiene más de una variedad, aclara que se muestra la variedad por defecto. Wormadam es el caso que obliga a esa distinción: `/pokemon/wormadam` responde 404 y la variedad por defecto es `wormadam-plant`. No está en esta expedición.

Argentina lleva un relleno suave y un contorno, debajo de ríos, calles y etiquetas. Los nombres de países y de provincias del mapa base bajan de opacidad en el zoom nacional; no se borran. Alrededor de cada ancla hay una mancha de color. Es un acento de la expedición, no un bioma ni un límite provincial. No hay fronteras provinciales dibujadas por este proyecto.

El contrato de progreso distingue `undiscovered`, `seen` y `caught`. No hay almacenamiento ni pantalla de captura.

El índice y la ficha no comparten el panel: con una criatura elegida, Ficha e Índice alternan. Cerrar guarda la selección. En escritorio el mapa ocupa el ancho que deja el panel; un botón Bitácora lo vuelve a abrir. En el teléfono el panel es una hoja inferior, y al cerrarla el mapa crece. El momento (explorar, descubrir, registrar) es un texto de estado, no un botón.

Si la API falla, la bitácora muestra el error y un reintento. No se completan tipos ni estadísticas inventadas. Una respuesta vieja no pisa la criatura que quedó seleccionada después.

## Arquitectura

- Next.js 16 (App Router) y React 19
- TypeScript strict, con `noUncheckedIndexedAccess`
- Tailwind CSS 4
- MapLibre GL JS y el estilo oscuro de OpenFreeMap
- Framer Motion para la línea del marco, la entrada de la ficha y las barras de estadísticas. `MotionConfig` usa `reducedMotion="user"`.

```text
src/
  app/                  layout, página, loading, error, not-found
  components/
    expedition/         marco, bitácora, ficha, índice
    map/                mapa cliente, marcadores y tema de controles
    states/             loading, error y vacío
  lib/
    pokeapi/            tipos, parser, caché y cliente
    expedition/         zonas, semilla, encuentros y sellos
    map/                estilo, worker y textos de controles
    a11y/               reduced motion
    errors/             mensaje a partir de unknown
scripts/
  copy-maplibre-worker.mjs
  verify-pokeapi.ts
```

La página sigue siendo un Server Component. `MapCanvas` carga `MapView` con `next/dynamic` y `ssr: false`. La instancia del mapa se crea una sola vez por intento. La selección cambia la clase del sello y pide un `flyTo` o un `jumpTo`; no vuelve a construir MapLibre.

`PokemonSpecies` y `PokemonSummary` no se mezclan con `Sighting`. El encuentro guarda el nombre de la especie y la coordenada. La ficha se arma al seleccionar, pidiendo `/pokemon-species/{nombre}` y después `/pokemon/{variedad por defecto}`.

La caché está en memoria de la pestaña. Una respuesta fallida no queda guardada, así el reintento puede volver a pedirla. La carga inicial no pide hábitats ni fichas: las 56 especies ya están en el catálogo. La ficha se arma al elegir.

## Worker de MapLibre

MapLibre 6 arma la URL del worker con `import.meta.url`. Con Turbopack esa URL se rompe y la consola dice `Worker failed to load`. La ruta que leía `node_modules` en el servidor tampoco sirve para un deploy en Vercel: el trazado de archivos no garantiza ese `node_modules` en runtime.

`predev` y `prebuild` copian `node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs` a `public/maplibre-gl-worker.js`. El archivo está en `.gitignore` y eslint no lo revisa. `setWorkerUrl("/maplibre-gl-worker.js")` apunta a un estático. El bundle del worker no importa otros módulos. En Vercel hay que construir con `npm run build`, que corre `prebuild` antes. `next build` a solas no copia el worker.

## Iconos que el estilo pide y el sprite no tiene

El estilo oscuro de OpenFreeMap usa `circle-11` para localidades. El sprite publica `circle_11` (guion bajo). MapLibre avisa que la imagen no está. También pide `wood-pattern`, que tampoco está en el sprite.

No se llama a `hasImage("circle-11")`: esa consulta dispara el mismo error. `setMissingStyleImageResolver` dibuja un punto para `circle-11` y un relleno neutro para cualquier otro id ausente, y deja un `console.warn` con el nombre. El aviso no se esconde. Esos huecos no tiran abajo el mapa.

## Dependencias y auditoría

No se agregaron dependencias. `npm audit` reporta 8 moderadas. La raíz es GHSA-g3hv-75wg-m249, un ReDoS de `minimatch` en `>=7 <11.0.1`, anidado en `@typescript-eslint/typescript-estree`. La cadena sube por parser, utils, type-utils, eslint-plugin y `typescript-eslint` hasta `eslint-config-next`, que es devDependency directa. El resto son transitivas de desarrollo. `npm audit --omit=dev` devuelve 0. El arreglo que sugiere npm baja `eslint-config-next` a 15.5.29, un major hacia atrás respecto de Next 16. No se aplicó, ni `audit fix --force`.

## Uso de inteligencia artificial

Herramienta: Cursor, con el modelo Grok. Se usó para leer el brief, contrastar PokéAPI, OpenFreeMap y Natural Earth, y escribir los bloques B0, B1, B1.5 y B2.

Correcciones sobre la salida del modelo:

- El lector de PDF del brief falló (`DOMMatrix is not defined`). El texto se extrajo con otra herramienta.
- `ssr: false` no puede vivir en un Server Component de Next.js 16. El `dynamic` quedó en un Client Component.
- `error.tsx` de esta versión recibe `retry`, no `reset`.
- Un geocoder devolvió «Salinas Grandes» en Corrientes. Ese punto se descartó. Las anclas que están salen de Open-Meteo con `countryCode=AR`.
- `import maplibregl from "maplibre-gl"` no tipa: la v6.18 no tiene export default.
- El primer mapa se quedó en «Sintonizando el terreno» porque el worker no cargaba. La ruta que leía `node_modules` lo resolvió en local y se reemplazó por el archivo público para poder desplegar después.
- Se asumió que el nombre de la especie servía para `/pokemon/{nombre}`. Wormadam demuestra que no. La ficha usa la variedad con `is_default`.
- Repartir encuentros en un radio amplio los dejaba sobre agua o fuera de la zona. En B1 quedaron cuñas cortas. En B1.5 pasaron a rectángulos del lado argentino, con un control de longitud contra la divisoria con Chile. El Aconcagua empieza en longitud -69.99, al este de la cumbre. No hay un polígono de tierra: un punto puede caer en una laguna chica.
- A zoom de país, los encuentros se pisan. Por eso el zoom bajo muestra el sello de la zona. Desde 6.5 se ven los encuentros, agrupados si se solapan en pantalla. Iguazú y Cataratas se separan por el tamaño del sello, no moviendo la coordenada.
- Los botones del mapa no respondían: el marcador de MapLibre deja subir el `mousedown` y el arrastre del mapa se queda con el clic. Cada sello corta `pointerdown`, `mousedown`, `touchstart` y `click`, y Enter y Espacio llaman a la misma acción.
- Cerrar la bitácora no hacía nada. El panel usaba `hidden` y `lg:flex`, y `.action-button` fijaba `display`. Aunque la regla estaba en `@layer components`, el CSS servido la dejaba sin capa y ganaba a `hidden`. El `display` salió de esa clase y quedó en utilidades de Tailwind.
- Un polígono dibujado a mano no sirve de contorno. Se extrajo Argentina de Natural Earth 5.1.2, `ne_50m_admin_0_countries`, 1039 vértices, redondeados a 4 decimales. No se simplificó de nuevo. Malvinas (FLK) y Georgias del Sur (SGS) son features aparte; la fuente anota Malvinas como administradas por el Reino Unido y reclamadas por Argentina. El sector antártico no está en el polígono. No se fusionaron.
- El estilo pide `circle-11` y el sprite tiene `circle_11`. También falta `wood-pattern`. Se dibuja un sustituto y el aviso queda en consola.
- Las ocho moderadas de npm son de la cadena de ESLint, no de Next, React, MapLibre ni Framer Motion. No se forzó la actualización.
- ESLint empezó a marcar el worker copiado. Se ignoró ese archivo generado, no el código de la app.
- En una ventana de unos 440 px de alto, la bitácora abierta dejaba el mapa tan bajo que la brújula se salía. El mapa conserva un alto mínimo en móvil.
- La atribución de MapLibre arranca expandida en anchos chicos y tapaba la base del mapa. Al cargar se pliega; el botón de atribución sigue ahí.
- Enter sobre un sello propio no lo activaba solo con el comportamiento nativo bajo el evento de prueba. El sello escucha Enter y Espacio. Las flechas siguen yendo al lienzo de MapLibre.

## Verificación

```bash
npm run typecheck
npm run lint
npm run build
npx tsx scripts/verify-pokeapi.ts
```

El script pega a PokéAPI. Comprueba Pikachu, rechaza un objeto inválido, recorre los nueve hábitats y exige que Wormadam resuelva a `wormadam-plant`. Para Kanto exige 56 especies, ids nacionales 1–151, sin duplicados, los seis reservados fuera del mapa, coordenadas iguales si se invierte el catálogo, puntos dentro de la zona y al este de la divisoria, cero `fetch` al colocar, y el estado inicial `undiscovered`. Después contrasta cada ficha con `/pokemon-species/{id}`: nombre, generación I y hábitat.

En el navegador, sobre `npm run dev`, en B2:

- El índice lista las 50 de campo, de Meowth a Dragonite, y nombra a las seis reservadas sin convertirlas en botones. Al cargar no hubo pedidos a PokéAPI.
- Iguazú y Cataratas, en 1440×900, no comparten área: el centro de cada sello recibe el clic. Pulsar Iguazú pasó el zoom de 3.8 a 8.0 y aparecieron encuentros agrupados.
- Pikachu abrió `#0025 · Exp. 06 · IG`, tipo Eléctrico, con las seis estadísticas de la API. Ese pedido fueron dos recursos, no cincuenta y seis.
- Cerrar en 1440×900 llevó el mapa de 1080 a 1440 px. Bitácora lo devolvió con Pikachu todavía seleccionado.
- Teléfono 390×844: el título no se corta, no hay scroll, el mapa mide 420 px con la hoja abierta y 700 px cerrada. El botón Bitácora del encabezado queda en `display: none`. El control de abajo dice «Abrir bitácora».
- La atribución, plegada, incluye la nota de Natural Earth 5.1.2.

No se repitió en este bloque la prueba de movimiento reducido, la de respuestas fuera de orden ni la de fallo de red. Esas rutas no se reescribieron. No se usó un teléfono táctil real. No se volvió a medir la ventana de 525×444 ni el zoom de navegador al 150 %.

## Qué queda para el bloque siguiente

No hay clima, gritos, equipo, filtros, Pokédex visual ni captura. El índice muestra el slug hasta que esa ficha se abrió. Los avisos de `circle-11` y `wood-pattern` siguen. El contorno 1:50.000.000 no alcanza para un límite legal, y Malvinas no están dibujadas dentro de Argentina. Los acentos de color no son biomas. Clefable figura en montaña porque así lo publica PokéAPI, no porque describa el glaciar.

## Decisiones

| Decisión | Por qué | Qué se dejó de lado |
| --- | --- | --- |
| Catálogo fijo de Kanto y semilla `pokeradar-kanto-v1` | Las especies no cambian al recargar y cada encuentro tiene id propio | Elegir al azar entre el hábitat en cada visita |
| Contorno Natural Earth 5.1.2, sin fusionar Malvinas | El límite es una fuente pública y la disputa queda documentada | Dibujar un polígono a mano o incorporar el reclamo |
| Manchas de color, no biomas | El proyecto no tiene polígonos de ecorregión | Pintar las provincias o un hábitat científico |
| Seis reservados fuera del mapa | No son encuentros comunes y la escena interior es otro bloque | Ponerlos en una zona con el resto |
| Caché en memoria, ficha al elegir | Cero fichas al entrar; el detalle, bajo demanda | Prefetch de las 56 fichas |
| Worker en `public/` | Vercel sirve el estático sin leer `node_modules` en runtime | Mantener la ruta que hacía `fs.readFile` |
| Sustituto del icono ausente, con `console.warn` | El mapa no se cae y el hueco del sprite queda visible | `hasImage`, que dispara el error, o silenciar la consola |
| No correr `audit fix --force` | El arreglo baja ESLint un major y no toca producción | Actualizar toda la cadena de lint |
