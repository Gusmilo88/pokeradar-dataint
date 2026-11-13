# PokéRadar — Expedición Argentina

Radar de exploración sobre el mapa real de Argentina. El terreno es OpenFreeMap. Las fichas salen de PokéAPI. Las posiciones son encuentros simulados, reproducibles, atados al hábitat de cada zona. No son apariciones reales.

La pantalla recorre tres momentos: explorar el terreno, descubrir una criatura y registrar la ficha en la bitácora.

## Qué se puede hacer

Hay diez zonas ancla. Al entrar se leen los hábitats reales que esas zonas usan (`urban`, `forest`, `waters-edge`, `grassland`, `mountain`, `sea`, `rough-terrain`, `cave`) y se eligen dos especies por zona. La semilla `pokeradar-argentina-v1` fija la especie y la coordenada: dos generaciones seguidas dan el mismo resultado.

En el zoom del país se ven diez sellos de zona, con la cantidad de encuentros. A partir de zoom 12.2 aparecen los encuentros. Elegir una zona o una línea de la bitácora acerca la cámara a 13.2. Ahí los dos sellos de la zona quedan separados y se pueden pulsar. La ficha se pide recién en ese momento.

La ficha muestra el nombre en español cuando PokéAPI lo trae, el número de Pokédex de la especie, los tipos, el artwork oficial o el sprite, las estadísticas base y la zona con su hábitat. Si la especie tiene variedades, la ficha es solo la variedad por defecto. Wormadam es el caso que obliga a esa distinción: `/pokemon/wormadam` responde 404 y la variedad por defecto es `wormadam-plant`.

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

Herramienta: Cursor, con el modelo Grok. Se usó para leer el brief, contrastar PokéAPI y OpenFreeMap, y escribir el bloque B0 y este B1.

Correcciones sobre la salida del modelo:

- El lector de PDF del brief falló (`DOMMatrix is not defined`). El texto se extrajo con otra herramienta.
- `ssr: false` no puede vivir en un Server Component de Next.js 16. El `dynamic` quedó en un Client Component.
- `error.tsx` de esta versión recibe `retry`, no `reset`.
- Un geocoder devolvió «Salinas Grandes» en Corrientes. Ese punto se descartó. Las anclas que están salen de Open-Meteo con `countryCode=AR`.
- `import maplibregl from "maplibre-gl"` no tipa: la v6.18 no tiene export default.
- El primer mapa se quedó en «Sintonizando el terreno» porque el worker no cargaba. La ruta que leía `node_modules` lo resolvió en local y se reemplazó por el archivo público para poder desplegar después.
- Se asumió que el nombre de la especie servía para `/pokemon/{nombre}`. Wormadam demuestra que no. La ficha usa la variedad con `is_default`.
- Repartir encuentros en un radio amplio los dejaba sobre agua o fuera de la zona. Quedaron cuñas cortas, en kilómetros, alrededor de cada ancla. No hay un polígono de tierra: un punto puede caer en una laguna chica o, en el Aconcagua, del lado chileno de la divisoria.
- A zoom de país, veinte marcadores de encuentro se pisan. Por eso el zoom bajo muestra el sello de la zona y los encuentros aparecen desde 12.2.
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

El script pega a PokéAPI. Comprueba Pikachu, rechaza un objeto inválido, recorre los nueve hábitats, exige que Wormadam resuelva a `wormadam-plant` con especie 413, que Pikachu conserve su variedad por defecto, y que dos generaciones de encuentros coincidan, caigan dentro de la cuña y no se solapen por debajo del mínimo de la zona.

En el navegador, sobre `npm run dev`:

- Carga inicial: worker `200`, diez sellos de zona, «20 encuentros», bitácora vacía hasta elegir.
- Fichas reales de Charizard (`#0006`, Fuego / Volador, seis estadísticas), Tauros (`#0128`) y Latias (`#0380`, Dragón / Psíquico).
- Selección rápida: una ficha lenta de Latias no reemplazó a Koffing, que había sido elegida después.
- Fallo de red simulado sobre Tauros: alerta «La ficha no llegó», sin estadísticas. El reintento, con la red de vuelta, mostró la ficha.
- Zoom con el control, de 13.2 a 12.2. Flecha derecha sobre el lienzo, de 57.16° O a 57.14° O.
- Enter sobre el sello de Buenos Aires acercó a 13.2. El lienzo de MapLibre siguió siendo el mismo después de elegir Latias.
- Escritorio emulado 1440×900: mapa y bitácora lado a lado, controles dentro del mapa.
- Teléfono 390×844: bitácora debajo, controles dentro del mapa. Al cerrarla, el mapa crece y el índice deja de ocupar alto.
- Ventana 525×444: el mapa queda en 171 px y la brújula no se sale. Sin scroll de documento.
- `prefers-reduced-motion`: el salto de zoom 3.8 a 13.2 ya estaba en 13.2 a los 126 ms. Framer Motion avisa en consola que el movimiento reducido está activo. Es el aviso de la librería, no un fallo del mapa.

No se probó el zoom del navegador (Ctrl + / Ctrl −) como caso aparte. El fallo de red se simuló rechazando `fetch` hacia PokéAPI, no cortando la red del sistema.

## Qué queda para el bloque siguiente

No hay clima, gritos, equipo ni filtros. El índice muestra el slug de la especie hasta que esa ficha se abrió al menos una vez; después usa el nombre en español. El texto de variedades es largo en especies con formas extra. En 390 px el título se corta al lado del contador. Los avisos de `circle-11` y `wood-pattern` van a seguir mientras el estilo de OpenFreeMap no los publique.

## Decisiones

| Decisión | Por qué | Qué se dejó de lado |
| --- | --- | --- |
| Cuñas cortas y semilla fija | Las posiciones se pueden auditar y no cambian en cada render | Un radio nacional o un polígono de costa como dependencia |
| Sello de zona hasta zoom 12.2 | Dos encuentros por zona se distinguen recién de cerca | Clustering para veinte puntos |
| Variedad `is_default` | El hábitat lista especies, y el slug de la especie puede no existir como Pokémon | Pedir `/pokemon/{especie}` y tragar el 404 |
| Caché en memoria, ficha al elegir | Ocho hábitats al entrar; el resto, bajo demanda | TanStack Query o prefetch de las veinte fichas |
| Worker en `public/` | Vercel sirve el estático sin leer `node_modules` en runtime | Mantener la ruta que hacía `fs.readFile` |
| Sustituto del icono ausente, con `console.warn` | El mapa no se cae y el hueco del sprite queda visible | `hasImage`, que dispara el error, o silenciar la consola |
| No correr `audit fix --force` | El arreglo baja ESLint un major y no toca producción | Actualizar toda la cadena de lint |
