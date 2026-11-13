# PokéRadar — Expedición Argentina

Radar de exploración sobre el mapa real de Argentina. El terreno es OpenFreeMap. Las fichas salen de PokéAPI. Las posiciones son encuentros simulados, reproducibles, atados al hábitat de cada zona. No son apariciones reales.

La pantalla recorre tres momentos: explorar el terreno, descubrir una criatura y registrar la ficha en la bitácora.

## Qué se puede hacer

Hay diez zonas ancla. Al entrar se leen los hábitats reales que esas zonas usan (`urban`, `forest`, `waters-edge`, `grassland`, `mountain`, `sea`, `rough-terrain`, `cave`) y se eligen 56 especies, sin repetir una especie entre zonas cuando el hábitat alcanza. Las cuotas son 6, 8, 4, 6, 6, 5, 5, 6, 4 y 6. La semilla `pokeradar-argentina-v2` fija la especie y la coordenada: dos generaciones seguidas dan el mismo resultado. Cada punto cae dentro del rectángulo de su zona y al este de una polilínea de la divisoria con Chile. El mar de Puerto Pirámides queda en el Golfo Nuevo, no en el Atlántico abierto. No hay un polígono de costa: un punto dentro del rectángulo puede caer en una laguna chica.

En el zoom del país se ven diez sellos, con el código de zona y la cantidad. Desde zoom 6.5 el mapa cambia a encuentros: puntos si todavía están lejos, y un sello agrupado si dos caen a menos de 36 px. Pulsar una zona vuela a zoom 8, donde ya se pueden descubrir criaturas. Pulsar un grupo acerca un paso más. Elegir una criatura, en el mapa o en la bitácora, vuela a zoom 12.2 y pide la ficha. Con movimiento reducido el mismo destino es un salto, no un vuelo. La ficha no se pide para las 56 al entrar.

La ficha muestra el nombre en español cuando PokéAPI lo trae, el número de Pokédex de la especie, los tipos, el artwork oficial o el sprite, las estadísticas base y una línea de zona y hábitat. Si la especie tiene más de una variedad, aclara que se muestra la variedad por defecto. Wormadam es el caso que obliga a esa distinción: `/pokemon/wormadam` responde 404 y la variedad por defecto es `wormadam-plant`.

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

La caché está en memoria de la pestaña. Una respuesta fallida no queda guardada, así el reintento puede volver a pedirla. Los marcadores no disparan una ficha por especie: en la carga inicial solo salen los hábitats (ocho, porque el hábitat `rare` no se usa).

## Worker de MapLibre

MapLibre 6 arma la URL del worker con `import.meta.url`. Con Turbopack esa URL se rompe y la consola dice `Worker failed to load`. La ruta que leía `node_modules` en el servidor tampoco sirve para un deploy en Vercel: el trazado de archivos no garantiza ese `node_modules` en runtime.

`predev` y `prebuild` copian `node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs` a `public/maplibre-gl-worker.js`. El archivo está en `.gitignore` y eslint no lo revisa. `setWorkerUrl("/maplibre-gl-worker.js")` apunta a un estático. El bundle del worker no importa otros módulos. En Vercel hay que construir con `npm run build`, que corre `prebuild` antes. `next build` a solas no copia el worker.

## Iconos que el estilo pide y el sprite no tiene

El estilo oscuro de OpenFreeMap usa `circle-11` para localidades. El sprite publica `circle_11` (guion bajo). MapLibre avisa que la imagen no está. También pide `wood-pattern`, que tampoco está en el sprite.

No se llama a `hasImage("circle-11")`: esa consulta dispara el mismo error. `setMissingStyleImageResolver` dibuja un punto para `circle-11` y un relleno neutro para cualquier otro id ausente, y deja un `console.warn` con el nombre. El aviso no se esconde. Esos huecos no tiran abajo el mapa.

## Dependencias y auditoría

No se agregaron dependencias. `npm audit` reporta 8 moderadas. La raíz es GHSA-g3hv-75wg-m249, un ReDoS de `minimatch` en `>=7 <11.0.1`, anidado en `@typescript-eslint/typescript-estree`. La cadena sube por parser, utils, type-utils, eslint-plugin y `typescript-eslint` hasta `eslint-config-next`, que es devDependency directa. El resto son transitivas de desarrollo. `npm audit --omit=dev` devuelve 0. El arreglo que sugiere npm baja `eslint-config-next` a 15.5.29, un major hacia atrás respecto de Next 16. No se aplicó, ni `audit fix --force`.

## Uso de inteligencia artificial

Herramienta: Cursor, con el modelo Grok. Se usó para leer el brief, contrastar PokéAPI y OpenFreeMap, y escribir los bloques B0, B1 y B1.5.

Correcciones sobre la salida del modelo:

- El lector de PDF del brief falló (`DOMMatrix is not defined`). El texto se extrajo con otra herramienta.
- `ssr: false` no puede vivir en un Server Component de Next.js 16. El `dynamic` quedó en un Client Component.
- `error.tsx` de esta versión recibe `retry`, no `reset`.
- Un geocoder devolvió «Salinas Grandes» en Corrientes. Ese punto se descartó. Las anclas que están salen de Open-Meteo con `countryCode=AR`.
- `import maplibregl from "maplibre-gl"` no tipa: la v6.18 no tiene export default.
- El primer mapa se quedó en «Sintonizando el terreno» porque el worker no cargaba. La ruta que leía `node_modules` lo resolvió en local y se reemplazó por el archivo público para poder desplegar después.
- Se asumió que el nombre de la especie servía para `/pokemon/{nombre}`. Wormadam demuestra que no. La ficha usa la variedad con `is_default`.
- Repartir encuentros en un radio amplio los dejaba sobre agua o fuera de la zona. En B1 quedaron cuñas cortas. En B1.5 pasaron a rectángulos del lado argentino, con un control de longitud contra la divisoria con Chile. El Aconcagua empieza en longitud -69.99, al este de la cumbre. No hay un polígono de tierra: un punto puede caer en una laguna chica.
- A zoom de país, los encuentros se pisan. Por eso el zoom bajo muestra el sello de la zona. Desde 6.5 se ven los encuentros, agrupados si se solapan en pantalla. Los sellos de Puerto Iguazú y Cataratas siguen muy cerca entre sí en la vista nacional.
- Los botones del mapa no respondían: el marcador de MapLibre deja subir el `mousedown` y el arrastre del mapa se queda con el clic. Cada sello corta `pointerdown`, `mousedown`, `touchstart` y `click`, y Enter y Espacio llaman a la misma acción.
- Cerrar la bitácora no hacía nada. El panel usaba `hidden` y `lg:flex`, así que en escritorio seguía visible, y las dos grillas reservaban la columna. Además `.action-button { display: inline-flex }` estaba fuera de una capa de CSS y ganaba a `lg:hidden` de Tailwind. El botón pasó a `@layer components` y el panel cerrado deja de ocupar columna.
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

El script pega a PokéAPI. Comprueba Pikachu, rechaza un objeto inválido, recorre los nueve hábitats, exige que Wormadam resuelva a `wormadam-plant` con especie 413, que Pikachu conserve su variedad por defecto, y que dos generaciones de 56 encuentros coincidan, no repitan especie, respeten la cuota de cada zona y caigan dentro del rectángulo y al este de la divisoria.

En el navegador, sobre `npm run dev`, en este bloque:

- Carga y recarga: «56 encuentros» y las mismas 56 especies en el índice, de Blissey a Dragonair.
- El sello de Buenos Aires recibe el clic: el `mousedown` no sube al documento y el zoom pasa de 3.8 a 8. En ese zoom hay sellos agrupados, no 56 puntos sueltos. Al elegir una criatura el zoom llega a 12.2 y los seis de Buenos Aires quedan separados.
- Cerrar en 1440×900 saca el panel (el mapa pasa de 1080 a 1440 px) y Bitácora lo devuelve con la ficha de Blissey intacta.
- Teléfono 390×844: el título «PokéRadar» no se corta. Con la hoja abierta el mapa mide 420 px; cerrada, 700. El control visible es «Abrir ficha» si hay selección.
- Ventana 525×444 con la hoja abierta: mapa 188 px, panel 186 px, controles dentro del mapa, sin pie de página y sin scroll de documento.
- Viewport de layout 960×600, el que deja un zoom de navegador al 150 % sobre 1440×900: sin scroll, título entero, y el centro de Cerrar es el botón.
- Enter sobre el sello de Buenos Aires, con `prefers-reduced-motion`, llevó el zoom de 3.8 a 8.0 en menos de 81 ms. Flecha derecha sobre el lienzo movió la longitud. Framer Motion avisa en consola que el movimiento reducido está activo. Es el aviso de la librería.
- Una ficha lenta de Gyarados no reemplazó a Snorlax, elegida después. Milotic, con `fetch` hacia PokéAPI rechazado, mostró «La ficha no llegó» y ninguna estadística. El reintento mostró `#0350`, tipo Agua, y las seis estadísticas.

El fallo de red se simuló rechazando `fetch` hacia PokéAPI, no cortando la red del sistema. No se usó un dispositivo táctil real: los sellos también escuchan `touchstart` para que el arrastre no se quede el toque. `documentElement.style.zoom` no equivale al zoom del navegador: en una ventana de 444 px produjo una barra de scroll porque `100dvh` se escala por encima del viewport.

## Qué queda para el bloque siguiente

No hay clima, gritos, equipo ni filtros. El índice muestra el slug de la especie hasta que esa ficha se abrió al menos una vez. Los sellos de Puerto Iguazú y Cataratas se solapan en la vista nacional. Los avisos de `circle-11` y `wood-pattern` van a seguir mientras el estilo de OpenFreeMap no los publique. La atribución de datos quedó en el control de MapLibre; el pie de una línea se quitó para no tapar el mapa.

## Decisiones

| Decisión | Por qué | Qué se dejó de lado |
| --- | --- | --- |
| Rectángulos por zona y semilla fija | Las 56 posiciones se pueden auditar, quedan al este de Chile y no cambian en cada render | Un polígono de costa como dependencia |
| Tres bandas de zoom y agrupado en pantalla | El país muestra regiones; desde 6.5 ya hay criaturas; de cerca se leen los nombres | Pintar los 56 puntos en el zoom nacional |
| Variedad `is_default` | El hábitat lista especies, y el slug de la especie puede no existir como Pokémon | Pedir `/pokemon/{especie}` y tragar el 404 |
| Caché en memoria, ficha al elegir | Ocho hábitats al entrar; el resto, bajo demanda | TanStack Query o prefetch de las 56 fichas |
| Worker en `public/` | Vercel sirve el estático sin leer `node_modules` en runtime | Mantener la ruta que hacía `fs.readFile` |
| Sustituto del icono ausente, con `console.warn` | El mapa no se cae y el hueco del sprite queda visible | `hasImage`, que dispara el error, o silenciar la consola |
| No correr `audit fix --force` | El arreglo baja ESLint un major y no toca producción | Actualizar toda la cadena de lint |
