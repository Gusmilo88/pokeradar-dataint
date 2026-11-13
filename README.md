# PokéRadar — Expedición Argentina

Radar de exploración sobre el mapa real de Argentina. El terreno es OpenFreeMap y el contorno del país es Natural Earth. Las fichas salen de PokéAPI. Las posiciones son encuentros simulados de Kanto, reproducibles. No son apariciones reales.

La pantalla recorre tres momentos: explorar el terreno, descubrir una criatura y registrar la ficha en la bitácora.

## Qué se puede hacer

La expedición tiene 56 especies de Kanto (Pokédex Nacional 1–151), escritas en el catálogo. Cada ficha tiene tres identidades: el número nacional, el número de expedición (1–56) y un id estable `kanto-025`. Ese id no sale de la posición en el array. Al entrar no se pide ninguna ficha: el catálogo es local. La ficha completa se pide al elegir.

Cincuenta especies están en el mapa. Cada una usa el hábitat que PokéAPI publica para su zona. Las cuotas son 5, 7, 4, 5, 5, 5, 4, 5, 4 y 6. La semilla `pokeradar-kanto-v1` fija la coordenada. Dar vuelta el catálogo no mueve los puntos. Cada punto cae dentro del rectángulo de su zona y al este de una polilínea de la divisoria con Chile. El mar de Puerto Pirámides queda en el Golfo Nuevo. No hay un polígono de costa: un punto dentro del rectángulo puede caer en una laguna chica.

Seis especies quedan reservadas y no se dibujan como encuentros de campo: Articuno, Zapdos, Moltres, Aerodactyl, Mewtwo y Mew. Cinco tienen hábitat `rare`, que no es una zona. Aerodactyl es de montaña, y aun así queda fuera de esos encuentros. El álbum las muestra como `???` hasta descubrirlas. Solo Articuno tiene enclave: el Santuario Glacial. Las otras cinco siguen sin escena.

En el zoom del país se ven diez sellos con el nombre y la cantidad, y un sello alargado «Anomalía», en verdes fríos, cian y violeta, con un halo. Si dos rectángulos se pisan, el sello se corre en pantalla y el ancla no se mueve: así Iguazú y Cataratas se pueden pulsar, y el santuario no tapa a Moreno. Desde zoom 6.5 el mapa cambia a encuentros, agrupados si caen a menos de 36 px. El sello del santuario sigue visible. Pulsar una zona, o el santuario, vuela a zoom 8. Elegir una criatura de campo vuela a zoom 12.2 y pide la ficha. Con movimiento reducido el mismo destino es un salto.

El santuario está en Santa Cruz, latitud -50.7 y longitud -73. Cae dentro del polígono ARG de Natural Earth y al este de la divisoria con Chile, fuera del rectángulo de los cinco encuentros de Perito Moreno. El punto no es un frente de glaciar medido: la escala 1:50.000.000 no alcanza para eso. Antes de entrar, el sello no dice el nombre de la criatura. La bitácora muestra la anomalía y el botón Entrar.

Adentro hay una cámara de hielo propia, en SVG y CSS: muro irregular, columnas facetadas, piso con grietas, cristales, bruma y un altar con anillo. La paleta es cian, azul frío, blanco helado y violeta. Cada enclave futuro lleva la suya. No copia un mapa de un juego y no usa imágenes generadas. El campo `scene: "glacial"` es el lugar donde un bloque posterior puede cambiar ese dibujo por un asset pixel art elegido a mano. Examinar el sello pide la ficha real. Si PokéAPI responde, el sello se abre, hay un destello y el sprite de Black & White se materializa sobre el altar. El estado pasa a visto. La ficha queda debajo de la escena: nombre, visto, tipos y estadísticas, sin el formato de una ficha de campo. Si falla, sigue sin descubrir. Salir no recrea MapLibre: el mapa queda montado debajo, con el mismo tamaño y el mismo zoom. Volver a entrar, ya vista, muestra la criatura presente, sin el destello ni la frase de descubrimiento. Escape sale de la escena. Con movimiento reducido no hay destello, bruma animada ni materialización, y el sprite es el PNG.

Una especie empieza sin descubrir. El sello y el índice dicen `???`. La silueta usa el PNG frontal de Black & White, generación V, con el color apagado: se conserva la forma y no el color. El `alt` queda vacío. Al elegirla aparece «Señal nueva» y se pide la ficha. Si PokéAPI responde, pasa a vista, se guarda y se muestran el nombre, el número nacional, los tipos, las estadísticas y el hábitat. Si falla, sigue sin descubrir y se puede reintentar. Si ya estaba vista, la ficha se abre directo.

El sprite visto prefiere el GIF frontal animado de Black & White (`sprites/pokemon/versions/generation-v/black-white/animated/{id}.gif`). Si esa URL no viene en la ficha, se usa el PNG de la misma generación y, en último caso, `front_default`. Con `prefers-reduced-motion` se pide el PNG, no un GIF detenido con CSS. El pixel art usa `image-rendering: pixelated`. Las URLs se arman con el id nacional para la silueta, así no hace falta bajar las 56 fichas al entrar. Cuando la ficha existe, se usan las URLs que devolvió PokéAPI.

La ficha muestra el nombre en español cuando PokéAPI lo trae. Hasta entonces el nombre visible es el de la especie, con mayúscula. Si hay más de una variedad, aclara que se muestra la variedad por defecto. Wormadam es el caso que obliga a esa distinción: `/pokemon/wormadam` responde 404 y la variedad por defecto es `wormadam-plant`. No está en esta expedición.

Argentina lleva un relleno suave y un contorno, debajo de ríos, calles y etiquetas. Los nombres de países y de provincias del mapa base bajan de opacidad en el zoom nacional; no se borran. Alrededor de cada ancla hay una mancha de color. Es un acento de la expedición, no un bioma ni un límite provincial. No hay fronteras provinciales dibujadas por este proyecto.

El progreso vive en `localStorage`, clave `pokeradar.progress.v1`, versión 1: listas `seen` y `caught` de ids `kanto-NNN`. Un documento con versión distinta, JSON roto, un id ajeno o un id repetido se descarta entero. Capturado implica visto. Marcar visto no baja un capturado. La primera pintura, incluida la hidratación, sale vacía; el almacenamiento se lee después y no muestra una especie bloqueada como descubierta. Reiniciar pide confirmación. No hay botón de captura: el estado capturado está dibujado para el bloque siguiente y se puede leer si el documento ya lo trae.

El índice y la ficha no comparten el panel: con una criatura elegida, Ficha e Índice alternan. Cerrar guarda la selección. En escritorio el mapa ocupa el ancho que deja el panel; un botón Bitácora lo vuelve a abrir. En el teléfono el panel es una hoja inferior, y al cerrarla el mapa crece. El momento (explorar, descubrir, registrar) es un texto de estado, no un botón.

La Pokédex es un álbum de las 56 entradas, ordenadas por número de expedición. Se abre encima del mapa, que sigue montado: el zoom y la selección no se pierden al volver. En el teléfono el álbum o la ficha ocupan la pantalla, no los dos a la vez. Escape cierra el álbum. Una entrada desconocida muestra el número, `???`, la silueta y una pista del hábitat o de la región, sin el nombre ni los tipos. Las seis reservadas dicen que todavía no tienen región de campo. «Buscar en el mapa» elige el encuentro de campo y cierra el álbum.

Si la API falla, la bitácora muestra el error y un reintento. No se completan tipos ni estadísticas inventadas y no se marca la especie como vista. Una respuesta vieja no pisa la criatura que quedó seleccionada después, ni la descubre.

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
    expedition/         marco, bitácora, ficha, índice, Pokédex, sprite y progreso
    map/                mapa cliente, marcadores y tema de controles
    states/             loading, error y vacío
  lib/
    pokeapi/            tipos, parser, caché y cliente
    expedition/         zonas, semilla, encuentros, sellos, pistas y progreso
    map/                estilo, worker y textos de controles
    a11y/               reduced motion
    errors/             mensaje a partir de unknown
scripts/
  copy-maplibre-worker.mjs
  verify-pokeapi.ts
  verify-progress.ts
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

Herramienta: Cursor, con el modelo Grok. Se usó para leer el brief, contrastar PokéAPI, OpenFreeMap y Natural Earth, y escribir los bloques B0, B1, B1.5, B2, B3, B4A, B4A.5 y B4A.75.

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
- En B3 el CSS de desarrollo no incorporó `.pixel-sprite` ni `.creature-silhouette` aunque el archivo fuente sí las tiene. El sprite lleva el mismo recorte de color y `image-rendering: pixelated` en el atributo `style`, que es lo que se midió en el navegador.
- La automatización del navegador manda teclas con `isTrusted: false`. Tab no mueve el foco. Escape sí cerró la Pokédex y el santuario, porque el cierre está en un listener propio. Enter y Espacio de un usuario real los resuelven los botones nativos; esa pulsación de confianza no se pudo reproducir con la herramienta.
- El primer dibujo del santuario, con `slice` y columnas altas, se leía como franjas. El segundo, con `meet` en un teléfono vertical, dejaba la escena en una banda chica. En B4A.5 ese SVG salió: la sala es CSS, con el piso recortado para que la perspectiva no se aplaste en una línea. Sigue sin ser el pixel art definitivo.

## Verificación

```bash
npm run typecheck
npm run lint
npm run build
npx tsx scripts/verify-pokeapi.ts
npx tsx scripts/verify-progress.ts
npx tsx scripts/verify-enclave.ts
```

El script pega a PokéAPI. Comprueba Pikachu, rechaza un objeto inválido, recorre los nueve hábitats y exige que Wormadam resuelva a `wormadam-plant`. Para Kanto exige 56 especies, ids nacionales 1–151, sin duplicados, los seis reservados fuera del mapa, coordenadas iguales si se invierte el catálogo, puntos dentro de la zona y al este de la divisoria, cero `fetch` al colocar, y el estado inicial `undiscovered`. Después contrasta cada ficha con `/pokemon-species/{id}`: nombre, generación I y hábitat.

En el navegador, sobre `npm run dev`, en B2:

- El índice lista las 50 de campo, de Meowth a Dragonite, y nombra a las seis reservadas sin convertirlas en botones. Al cargar no hubo pedidos a PokéAPI.
- Iguazú y Cataratas, en 1440×900, no comparten área: el centro de cada sello recibe el clic. Pulsar Iguazú pasó el zoom de 3.8 a 8.0 y aparecieron encuentros agrupados.
- Pikachu abrió `#0025 · Exp. 06 · IG`, tipo Eléctrico, con las seis estadísticas de la API. Ese pedido fueron dos recursos, no cincuenta y seis.
- Cerrar en 1440×900 llevó el mapa de 1080 a 1440 px. Bitácora lo devolvió con Pikachu todavía seleccionado.
- Teléfono 390×844: el título no se corta, no hay scroll, el mapa mide 420 px con la hoja abierta y 700 px cerrada. El botón Bitácora del encabezado queda en `display: none`. El control de abajo dice «Abrir bitácora».
- La atribución, plegada, incluye la nota de Natural Earth 5.1.2.

`scripts/verify-progress.ts` no usa red. Comprueba el arranque en cero, la revelación idempotente, que visto no baja un capturado, el viaje de ida y vuelta del esquema, el rechazo de versión, JSON, id ajeno e id repetido, las seis reservadas sin zona y sin su nombre en la pista, y las URLs de Black & White para el id 25.

En el navegador, sobre `npm run dev`, en B3, con `localStorage` vacío al empezar:

- El índice mostró 50 botones `01 · ???` y siguientes, cero nombres de especie y cero pedidos de ficha. El contador decía 0 vistas.
- Elegir la expedición 01 mostró «Señal nueva» y después `#0052`, Meowth, tipo Normal y las seis estadísticas. El almacenamiento quedó `seen: ["kanto-052"]`.
- Al recargar, la primera pintura seguía en `???` y el contador en `…`. Después pasó a `01 · Meowth` y 1 vista. Abrirla de nuevo no repitió «Señal nueva». El zoom de esa selección era 12.2.
- La Pokédex listó 56 entradas. Las reservadas 51–56 decían identidad desconocida y no mostraban nombre. La ficha 06, sin descubrir, decía `???`, la pista de bosque y «Nombre, tipos y estadísticas bloqueados». Volver al mapa dejó el zoom en 12.2 y la ficha abierta.
- Un `fetch` que respondía 503 para Eevee dejó la señal sin identificar y no escribió `kanto-133`. Reintentar con la red real la reveló.
- Se demoró la ficha de Ditto y se eligió Voltorb antes de soltarla. Quedó `kanto-100` y no `kanto-132`.
- Con `prefers-reduced-motion: reduce`, el sprite de Voltorb visto fue el PNG `black-white/100.png`, no el GIF.
- En 390×844 el título no se corta, Bitácora del encabezado queda en `display: none` y el mapa cerrado mide 700 px. El álbum ocupa 390×844, con fichas de 173 px. En 1440×900 el álbum y la ficha comparten la grilla (1056 px y 384 px).
- Un documento con Meowth en `caught` mostró «Capturado», `#0052` y «1 vistas · 1 capturadas». Cancelar el reinicio lo conservó. Confirmar lo vació y cerró la ficha. No hay un botón que capture.
- `{roto` en `localStorage` se descartó: la clave desapareció, el contador volvió a 0 vistas y la expedición 01 a `???`.
- Escape cerró la Pokédex. Las teclas de la herramienta no son de confianza, así que Tab no se pudo usar para recorrer el álbum.

No se usó un teléfono táctil real. No se volvió a medir la ventana de 525×444 ni el zoom de navegador al 150 %. Al abrir el álbum el navegador pidió las siluetas visibles (unas 40 de 56), no las 56 fichas: en esa sesión hubo 2 pedidos a `pokeapi.co`.

`scripts/verify-enclave.ts` no usa red. Exige un solo enclave, Articuno reservado, el catálogo en 56 y 50 de campo, el punto dentro de Argentina y fuera del rectángulo de Perito Moreno, y que el texto previo no nombre a las seis reservadas.

En el navegador, sobre `npm run dev`, en B4A, con almacenamiento vacío:

- En 1440×900 y zoom 3.8, «Hielo» y «Moreno» se podían pulsar por separado. El sello no decía Articuno y no hubo pedidos a PokéAPI.
- Entrar mostró el santuario y «Examinar la señal», sin el nombre. El mapa seguía en 1080×827.
- Un 503 durante el examen no escribió `kanto-144` ni mostró el nombre. Reintentar mostró Articuno, tipos Hielo y Volador, el GIF `black-white/animated/144.gif` y `seen: ["kanto-144"]`, con `caught` vacío.
- Volver al mapa dejó el mismo tamaño de canvas y el zoom en 8.0. Reingresar mostró la criatura sin el botón de examinar.
- La Pokédex abrió `#0144 · Exp. 51`, Visto, y «1 vistas · 0 capturadas». Tras recargar, el sello decía Articuno. Los 50 encuentros de campo seguían en el índice.
- Se demoró la ficha, se salió del santuario y después se soltó la respuesta. El progreso siguió en cero.
- Con movimiento reducido, el haz tenía `animation-name: none` y el sprite fue `black-white/144.png`.
- En 1440×480 el botón «Volver al mapa» quedó dentro de la ventana. En 390×844 el título no se cortó, el sello estaba sobre el mapa y el botón de salida también. Escape cerró la escena.
- Después, el encuentro 36 de la Puna siguió abriendo «Señal nueva».
- La consola repitió el aviso conocido de `circle-11`. Con el movimiento reducido emulado, Framer avisó que las animaciones pueden no verse. No apareció un error nuevo de la app.

No se usó un teléfono táctil real. Tab sigue sin poder recorrer la escena con la herramienta, porque sus teclas no son de confianza.

En el navegador, sobre `npm run dev`, en B4A.5, partiendo de almacenamiento vacío:

- En 1440×900 el sello decía «Anomalía», con degradado aurora y animación `enclave-pulse`. El texto accesible seguía siendo «Anomalía sin identificar. Señal glacial en Santa Cruz.» No decía Articuno. Moreno y el sello no compartían área.
- Entrar mostró el altar, el piso y «Examinar la señal», sin el nombre. Examinar escribió `seen: ["kanto-144"]`, `caught` vacío, tipos Hielo y Volador, estadísticas PS 90, Ataque 85, Defensa 100, Ataque esp. 95, Defensa esp. 125 y Velocidad 85, y el GIF `black-white/animated/144.gif`. El sello del altar desapareció.
- Volver al mapa dejó el canvas en 1080×827 y el zoom en 8.0. El sello pasó a decir Articuno. Reingresar mostró la criatura con `data-ceremony="false"`, sin «Examinar la señal». Escape cerró la escena.
- La Pokédex listó 51 Articuno como Visto, 1 vista y 0 capturadas. Las entradas 50 y 52–56 seguían bloqueadas.
- Con `prefers-reduced-motion: reduce`, el haz y las partículas quedaron en `animation-name: none`, el sello del mapa también, y el sprite fue `black-white/144.png`.
- En 390×844 la escena ocupaba 390×567, sin scroll horizontal. El altar quedaba dentro de la sala y «Volver al mapa» dentro de la ventana (y 788–832).

En esta pasada no se repitió el 503 ni la respuesta tardía: esa lógica no se tocó. Salir ahora también apaga la ceremonia, para que la entrada no se repita.

En el navegador, sobre `npm run dev`, en B4A.75, con almacenamiento vacío:

- Entrar mostró «Santuario Glacial», el sello del altar y «Examinar la señal», sin el nombre.
- Examinar escribió `seen: ["kanto-144"]` y `caught` vacío. La escena quedó con `data-ceremony="true"`, la frase «La señal toma forma.», el destello, el halo y la animación `sanctuary-form`. El sprite fue `animated/144.gif` y el título pasó a Articuno.
- Salir y volver a entrar dejó `data-ceremony="false"`, sin frase, sin destello y sin sello. Articuno seguía presente. Escape cerró la escena. El sello del mapa decía Articuno.
- La Pokédex mostró 51 Articuno como Visto. El almacenamiento seguía en `kanto-144`.
- Con movimiento reducido, el haz, la bruma y las partículas quedaron en `animation-name: none`, el sprite fue `144.png`, y la clase de la materialización tampoco animaba.
- En 390×844 la sala midió 390×567, sin scroll horizontal. El altar quedaba dentro de la sala y «Volver al mapa» en y 788–832.

## Qué queda para el bloque siguiente

No hay clima, gritos, equipo, filtros ni captura. El estado capturado se dibuja y no se obtiene desde la interfaz. No hay cartas holográficas. Faltan cinco enclaves. Los avisos de `circle-11` y `wood-pattern` siguen. El contorno 1:50.000.000 no alcanza para un límite legal, y Malvinas no están dibujadas dentro de Argentina. Los acentos de color no son biomas. Clefable figura en montaña porque así lo publica PokéAPI, no porque describa el glaciar. El nombre en español del álbum, antes de abrir la ficha, es el nombre de especie con mayúscula. La sala del santuario es CSS original. El pixel art definitivo entra cuando haya un asset elegido a mano, en el campo `scene` de ese enclave.

## Decisiones

| Decisión | Por qué | Qué se dejó de lado |
| --- | --- | --- |
| Catálogo fijo de Kanto y semilla `pokeradar-kanto-v1` | Las especies no cambian al recargar y cada encuentro tiene id propio | Elegir al azar entre el hábitat en cada visita |
| Contorno Natural Earth 5.1.2, sin fusionar Malvinas | El límite es una fuente pública y la disputa queda documentada | Dibujar un polígono a mano o incorporar el reclamo |
| Manchas de color, no biomas | El proyecto no tiene polígonos de ecorregión | Pintar las provincias o un hábitat científico |
| Seis reservados fuera de los encuentros de campo | No son avistamientos comunes | Ponerlos en una zona con los otros cincuenta |
| Un enclave, escena `glacial`, encima del mapa | Articuno se descubre en un lugar distinto sin recrear MapLibre | Seis pantallas genéricas o una ruta nueva |
| Caché en memoria, ficha al elegir | Cero fichas al entrar; el detalle, bajo demanda | Prefetch de las 56 fichas |
| Worker en `public/` | Vercel sirve el estático sin leer `node_modules` en runtime | Mantener la ruta que hacía `fs.readFile` |
| Sustituto del icono ausente, con `console.warn` | El mapa no se cae y el hueco del sprite queda visible | `hasImage`, que dispara el error, o silenciar la consola |
| No correr `audit fix --force` | El arreglo baja ESLint un major y no toca producción | Actualizar toda la cadena de lint |
| Progreso en `localStorage`, esquema v1 | Sobrevive al refresco y un documento inválido vuelve a cero | Un backend o guardar el nombre en español |
| Silueta del PNG de Black & White | La forma es la del sprite real y el color no se revela | Generar una imagen o mostrar el GIF oculto |
| GIF de Black & White al descubrir; PNG si el movimiento está reducido | El recurso es del repositorio PokeAPI/sprites y el GIF no sigue animado cuando se pidió calma | Un `prefers-reduced-motion` que solo pause por CSS |
| Santuario en -50.7, -73, validado con Natural Earth | Está en Santa Cruz, dentro del polígono y separado de los encuentros | Usar el ancla de Moreno y tapar esos cinco puntos |
