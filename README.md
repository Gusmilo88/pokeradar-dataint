# PokéRadar — Expedición Argentina

Radar de exploración sobre el mapa real de Argentina. El terreno es OpenFreeMap y el contorno del país es Natural Earth. Las fichas salen de PokéAPI. Las posiciones son encuentros simulados de Kanto, reproducibles. No son apariciones reales.

La pantalla recorre tres momentos: explorar el terreno, descubrir una criatura y registrar la ficha en la bitácora.

## Qué se puede hacer

La expedición tiene 56 especies de Kanto (Pokédex Nacional 1–151), escritas en el catálogo. Cada ficha tiene tres identidades: el número nacional, el número de expedición (1–56) y un id estable `kanto-025`. Ese id no sale de la posición en el array. Al entrar no se pide ninguna ficha: el catálogo es local. La ficha completa se pide al elegir.

Cincuenta especies están en el mapa. Cada una usa el hábitat que PokéAPI publica para su zona. Las cuotas son 5, 7, 4, 5, 5, 5, 4, 5, 4 y 6. La semilla `pokeradar-kanto-v1` fija la coordenada. Dar vuelta el catálogo no mueve los puntos. Cada punto cae dentro del rectángulo de su zona, al este de una polilínea de la divisoria con Chile y dentro del polígono ARG de Natural Earth. Si un tiro de la semilla cruza ese polígono, se reubica con el mismo id y la misma semilla. El mar de Puerto Pirámides queda en el Golfo Nuevo. No hay un polígono de costa: un punto dentro del rectángulo puede caer en una laguna chica.

Seis especies quedan reservadas y no se dibujan como encuentros de campo: Articuno, Zapdos, Moltres, Aerodactyl, Mewtwo y Mew. Cinco tienen hábitat `rare`, que no es una zona. Aerodactyl es de montaña, y aun así queda fuera de esos encuentros. El álbum las muestra como `???` hasta descubrirlas. Articuno tiene el Santuario Glacial en Tierra del Fuego, junto al Lago Escondido (latitud -54.638, longitud -67.759), Zapdos la Central Eléctrica Abandonada, en Neuquén, Moltres el Santuario Volcánico, en La Payunia (latitud -36.42, longitud -69.2), y Aerodactyl la Caverna Fósil, en Ischigualasto, San Juan (latitud -30.12, longitud -67.85). Mewtwo tiene el Laboratorio Secreto en el monte Usborne, Islas Malvinas (latitud -51.7002, longitud -58.8259). Mew tiene el Refugio Escondido en la isla Georgia del Sur, en el monte Paget (latitud -54.4408, longitud -36.5556). PokéAPI no clasifica a Aerodactyl como legendario ni a Mew como legendario: Mew es mítico. Esos ritos no usan la palabra.

Al entrar, si la sesión no pidió el mapa plano, la misma instancia usa `setProjection({ type: "globe" })`, centrada en Argentina, con un zoom que deja ver el limbo. El cielo es el de MapLibre: espacio azul oscuro y una atmósfera celeste que se apaga al acercarse. El globo pasa solo a Mercator cerca del zoom 11. «Globo / Mapa» cambia la proyección sin recrear el mapa ni mover el zoom. La elección vive en `sessionStorage` (`pokeradar.projection.v1`) y no toca el progreso. Un sello detrás del planeta se oculta. Si el globo no puede activarse, queda el mapa plano. «Ver Argentina» aparece por debajo del zoom 2.4 y vuela al encuadre nacional.

En el zoom del país se ven diez sellos con el nombre y la cantidad, y seis marcadores circulares «?» con el color de cada enclave. El nombre solo aparece al enfocar uno ya descubierto, o en el panel. Si dos rectángulos se pisan, el sello se corre en pantalla y el ancla no se mueve: así Iguazú y Cataratas se pueden pulsar, y el santuario no tapa a Moreno. Desde zoom 6.5 el mapa cambia a encuentros, agrupados si caen a menos de 36 px. El sello del santuario sigue visible. Pulsar una zona, o el santuario, vuela a zoom 8. Elegir una criatura de campo vuela a zoom 12.2 y pide la ficha. Con movimiento reducido el mismo destino es un salto.

El santuario está junto al Lago Escondido, latitud -54.638 y longitud -67.759, en el paraje y fuera del recuadro de agua de OSM way 50342725. Cae en el anillo 1:10.000.000 de la Isla Grande, dentro del polígono ARG de 1:50.000.000 y al este de la divisoria con Chile. El laboratorio está en el monte Usborne, dentro del polígono 1:10.000.000 de Malvinas y fuera del polígono ARG. Los ids `kanto-144` y `kanto-150` no cambian. Antes de descubrirla, el sello no dice el nombre de la criatura.

Pulsar «Anomalía» no entra al lugar. Abre el instrumento del PokéRadar, «Señal anómala»: hay una energía extraordinaria y la identidad es desconocida. Las acciones son Investigar y Volver al mapa. Escape cierra y el foco vuelve al sello. Si ya fue vista, el aviso dice «Señal registrada» y que esa criatura ya está en la bitácora.

Investigar cierra el aviso y muestra el exterior, `public/images/enclaves/articuno/entrada-santuario-glacial.webp`, con un fundido de unos 0,42 s. Entrar atenúa ese exterior y muestra el interior, `interior-santuario-glacial.webp`. Las dos miden 1672×941. Son ilustraciones originales, estilo anime de aventura de finales de los 90, hechas con IA bajo dirección artística humana. No se modificaron. El mapa no las pide hasta que se abre la visita y sigue montado debajo. En el exterior se precarga el interior. Sobre el exterior hay nieve en CSS, una aurora lenta en verde, cian y violeta, una luz que respira en la boca de la cueva y una bruma baja. El interior deja la ilustración como sala: no se redibujan altar, columnas ni cristales. Encima hay un resplandor en el altar, once estrellas de cuatro puntas sobre cristales, arcos, borde del altar y suelo, motas y bruma. Con la pestaña oculta esas animaciones quedan en pausa. Con movimiento reducido no hay nieve ni movimiento ambiental, el fundido no corre y el sprite es el PNG.

La visita es `position: fixed; inset: 0`. La ilustración, el sprite, los destellos y el pulso del altar viven en el mismo escenario, con proporción 1672:941 y tamaño de cover (`max(100cqw, 100cqh × 1672/941)`). El exterior acerca la boca con `translateX(-66%)` y lo recorta al sobrante del cover, así el fondo no queda al descubierto. En una ventana ancha la boca queda donde la pintó la ilustración. El interior lo centra (`translate(-50%, -50%)`), y el altar queda en el medio. La aurora se disuelve hacia abajo; no termina en un borde recto. No se deforma el WebP. Los pies de Articuno están al 50 % del ancho y al 55 % del alto de ese escenario, en una caja del 16 % del ancho, anclada por el borde inferior. El texto y los controles van encima, abajo, en blanco y con sombra, sin una ficha debajo de la imagen. En ventanas de menos de 360 px de alto la escena puede desplazarse; en las medidas de escritorio y de teléfono de esta pasada no hay scroll.

Antes de descubrir, el altar es un botón. El nombre accesible es «Examinar la señal del altar». El pulso visual es chico y el área táctil mide al menos 48 px. Activarlo pide la ficha. El exterior y el aviso no la piden. Si PokéAPI responde, el altar se enciende, hay un destello y el GIF de Black & White se forma sobre la plataforma. El título pasa a «¡Una presencia legendaria se ha manifestado!» y la línea siguiente dice que esa criatura fue registrada en la Pokédex. Se puede omitir. El estado pasa a visto. Las estadísticas no se abren solas: «Ver ficha» las muestra y «Cerrar ficha» las oculta. Si falla, el texto es «PokéAPI no respondió. La señal sigue sin identificar.» y no aparece el nombre. Una respuesta que llega después de salir del interior no escribe el progreso. Volver a entrar, ya vista, muestra la criatura sin pulso y sin repetir el rito. Salir no recrea MapLibre.

El pulso del altar, el halo, el foco, el destello del rito y el sello de anomalía leen la paleta del enclave (`palette` en `enclaves.ts`, variables CSS). Un enclave nuevo configura esos colores y no copia el CSS del pulso. La central no reutiliza la nevada, y el volcán no reutiliza la lluvia. Las ilustraciones de Moltres están en `public/images/enclaves/moltres/`: la entrada mide 1672×941 y el interior 1671×941. No se modificaron. El exterior acerca el arco con sesgo -80 %. Los pies quedan al 50 % del ancho y al 58 % del alto del escenario. La Caverna Fósil usa `public/images/enclaves/aerodactyl/`: entrada e interior miden 1672×941 y no se modificaron. La escena `fossil` tiene polvo, destellos de cristal y rayos de luz propios. El exterior acerca la boca con sesgo -72 %. Los pies quedan al 50 % del ancho y al 60 % del alto. El Laboratorio Secreto usa `public/images/enclaves/mewtwo/`: entrada e interior miden 1672×941 y no se modificaron. La escena `lab` tiene luces de emergencia, niebla, pantallas y una ceremonia de contención propias. El exterior acerca la puerta con sesgo -75 %. Los pies quedan al 50 % del ancho y al 66 % del alto, sobre la plataforma. El Refugio Escondido usa `public/images/enclaves/mew/`: entrada e interior miden 1672×941 y no se modificaron. La escena `grove` tiene orbes sobre el sendero, pétalos, un rayo y reflejos de agua propios. El exterior acerca el arco con sesgo -76 %. Mew flota al 51 % del ancho y al 52 % del alto, sobre la isla. El punto se valida con el anillo 1:10.000.000 de Georgia del Sur y no entra en el polígono ARG. El encuadre nacional no se aleja: un control «Explorar» vuela a Argentina continental, Tierra del Fuego, Malvinas o Georgias del Sur sin nombrar criaturas.

Una especie empieza sin descubrir. El sello y el índice dicen `???`. La silueta usa el PNG frontal de Black & White, generación V, con el color apagado: se conserva la forma y no el color. El `alt` queda vacío. Al elegirla aparece «Señal nueva» y se pide la ficha. Si PokéAPI responde, pasa a vista, se guarda y se muestran el nombre, el número nacional, los tipos, las estadísticas y el hábitat. Si falla, sigue sin descubrir y se puede reintentar. Si ya estaba vista, la ficha se abre directo.

El sprite visto prefiere el GIF frontal animado de Black & White (`sprites/pokemon/versions/generation-v/black-white/animated/{id}.gif`). Si esa URL no viene en la ficha, se usa el PNG de la misma generación y, en último caso, `front_default`. Con `prefers-reduced-motion` se pide el PNG, no un GIF detenido con CSS. El pixel art usa `image-rendering: pixelated`. Las URLs se arman con el id nacional para la silueta, así no hace falta bajar las 56 fichas al entrar. Cuando la ficha existe, se usan las URLs que devolvió PokéAPI.

La ficha muestra el nombre en español cuando PokéAPI lo trae. Hasta entonces el nombre visible es el de la especie, con mayúscula. Si hay más de una variedad, aclara que se muestra la variedad por defecto. Wormadam es el caso que obliga a esa distinción: `/pokemon/wormadam` responde 404 y la variedad por defecto es `wormadam-plant`. No está en esta expedición.

Argentina lleva un relleno suave y un contorno celeste, debajo de ríos, calles y etiquetas. Malvinas, Georgias del Sur y Sandwich del Sur usan el mismo trazo, cada una en su feature de Natural Earth 1:10.000.000, sin líneas que las unan por el océano y sin cambiar el borde de los demás países. Sus etiquetas son capas de símbolo: ISLAS MALVINAS, ISLAS GEORGIAS DEL SUR e ISLAS SANDWICH DEL SUR, al norte o al este de la tierra. El mapa base deja de rotular esos nombres en inglés para no duplicarlos. Los nombres de países y de provincias del mapa base bajan de opacidad en el zoom nacional; no se borran. Alrededor de cada ancla hay una mancha de color. Es un acento de la expedición, no un bioma ni un límite provincial. No hay fronteras provinciales dibujadas por este proyecto.

La XP de expedición no se guarda aparte: sale de los ids `caught` y del entero `base_experience` que PokéAPI publicó el 2026-11-14 para esas 56 especies (`src/lib/expedition/trainer-xp-catalog.ts`). Un visto, una ficha abierta o una captura repetida no suman. El nivel 1 es 0 XP y el nivel 10 exige la suma exacta del catálogo, con nueve umbrales `redondeo(T × k(k+1)(2k+1) / 1710)`. Reiniciar vacía `caught` y vuelve al nivel 1. La demostración de medallas usa otro conjunto en memoria y no escribe esta XP. El perfil de la Pokédex muestra el nivel, el rango de campo y los cinco acabados. Base está desde el nivel 1; Bronce, Plata, Oro y Prismático se desbloquean en 3, 5, 8 y 10. Cada especie capturada elige el suyo en `pokeradar.finishes.v1`. Reiniciar también borra esos acabados. No cambian tipo, poder ni estadísticas.

El progreso vive en `localStorage`, clave `pokeradar.progress.v1`, versión 1: listas `seen` y `caught` de ids `kanto-NNN`. Un documento con versión distinta, JSON roto, un id ajeno o un id repetido se descarta entero. Capturado implica visto. Marcar visto no baja un capturado. La primera pintura, incluida la hidratación, sale vacía; el almacenamiento se lee después y no muestra una especie bloqueada como descubierta. Reiniciar pide confirmación. Con la ficha vista, «Atrapar» muestra una dificultad de 1 a 10 calculada al llegar `capture_rate` y las seis estadísticas. La secuencia siempre se registra si se completa o se omite; cancelarla, pulsar Escape o salir no escribe `caught`. Dificultad 1–5 usa 3 movimientos y 6–10 usa 4. La presentación lanza una Pokébola en SVG, absorbe el sprite de Black & White y agita la bola. En un enclave el botón aparece después del rito, sin cerrar la visita ni repetir la ceremonia. El sprite del escenario sigue esa misma fase: visible al lanzar, absorbido hacia la bola y oculto en los movimientos, al omitir y al reingresar ya capturado. El sonido se sintetiza en el navegador y se apaga con «Silencio»; la preferencia vive en `sessionStorage` (`pokeradar.audio.v1`) y no toca el progreso.

El índice y la ficha no comparten el panel: con una criatura elegida, Ficha e Índice alternan. Cerrar guarda la selección. En escritorio el mapa ocupa el ancho que deja el panel; un botón Bitácora lo vuelve a abrir. En el teléfono el panel es una hoja inferior, y al cerrarla el mapa crece. El momento (explorar, descubrir, registrar) es un texto de estado, no un botón.

La Pokédex es un álbum de las 56 entradas, ordenadas por número de registro. Se abre encima del mapa, que sigue montado: el zoom y la selección no se pierden al volver. Una carta se abre centrada sobre la grilla, en escritorio y en teléfono. Un toque en la carta, o el icono inferior, la gira. Escape o un clic fuera la cierra y devuelve el foco; otro Escape cierra el álbum. Una entrada desconocida abre una carta sellada con el número, `???` y la silueta, sin el nombre ni los tipos. El frente revelado usa el artwork oficial de la misma ficha; el reverso guarda estadísticas, dificultad, la captura y, si ya está capturada, el ingreso al equipo. El icono de mapa del reverso elige el encuentro y cierra el álbum. Las seis reservadas dicen que todavía no tienen región de campo.

Si la API falla, la bitácora muestra el error y un reintento. No se completan tipos ni estadísticas inventadas y no se marca la especie como vista. Una respuesta vieja no pisa la criatura que quedó seleccionada después, ni la descubre.

Los controles comparten el mismo relieve: borde cian, brillo superior y `cursor: pointer` solo en lo que se puede accionar. En la carta el giro y el mapa son iconos compactos en el borde inferior; el texto del equipo no gira la carta.

La Pokédex sigue en generación I. Los filtros de estado se combinan con los tipos ya revelados: cualquiera de los elegidos, o todos si se pide la intersección. El orden cubre el número de registro, el nombre, las seis estadísticas y la dificultad existente. Una carta desconocida no entra en un filtro de tipo ni aporta su estadística al orden.

Elegir un marcador abre un encuentro centrado sobre el mapa. La bitácora queda como índice. Un capturado muestra en el marcador el sprite Black & White, con el nombre en el texto accesible. El silencio es uno solo, con icono de parlante, en `sessionStorage` (`pokeradar.audio.v1`). El grito usa `cries.latest` y, si falla, `cries.legacy`.

Cinco especies de Buenos Aires tienen horario propio en `America/Argentina/Buenos_Aires`: Eevee 05:00–08:00, Voltorb 18:00–22:00, Meowth 20:00–05:00, Koffing 21:00–03:00 y Ditto 00:00–04:00. Fuera de esa ventana no hay encuentro salvaje. La carta oculta solo dice la franja (madrugada, mañana, tarde, atardecer o noche), no la hora. El progreso ya guardado permanece. Los seis enclaves no usan horario.

El clima actual sale de Open-Meteo, con las coordenadas de la zona, caché de diez minutos y la observación `current`. Lluvia favorece Agua y Eléctrico, nieve Hielo y sol de día Fuego. Si la consulta falla, el mapa vuelve al encuentro base y la zona dice «Clima no disponible». El hábitat mostrado es el que PokéAPI ya publica para esa zona.

El equipo guarda hasta seis capturados en `pokeradar.team.v1`, aparte de `seen` y `caught`. El orden se cambia arrastrando y se vuelve a guardar. Quitar pide confirmación. Reiniciar la expedición también lo vacía.

El cielo del globo sigue en `setSky`. El campo de estrellas es local, no recibe clics y queda quieto con movimiento reducido. El océano sigue siendo el relleno nocturno: el WMS de GEBCO anuncia batimetría y CORS abierto, pero `GetMap` respondió un error del servidor al escribir el PNG. No se inventó otra fuente. Argentina, Tierra del Fuego y los tres grupos insulares llevan un relleno celeste propio, cada polígono separado, más transparente al acercar. Lejos, el sello de zona es un círculo con la cantidad; el nombre vuelve antes del zoom de encuentro.

Una ruta inexistente muestra «404 — Señal no encontrada», con una Pokébola en el cero y sin MapLibre.

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
  verify-trainer-xp.ts
  verify-finishes.ts
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

Herramienta: Cursor, con el modelo Grok. Se usó para leer el brief, contrastar PokéAPI, OpenFreeMap y Natural Earth, y escribir los bloques B0, B1, B1.5, B2, B3, B4A, B4A.5, B4A.75, B4A.9, B4A.95 y B4A.96.

Los fondos del Santuario Glacial los generó un modelo de imagen, con dirección artística humana, y se guardaron como WebP de 1672×941. Esos archivos no se vuelven a generar ni se editan. En el teléfono la vista recorta los lados con CSS; el archivo sigue entero. La decisión de dónde pisa Articuno, qué anima y qué texto se muestra es humana.

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
- Un polígono dibujado a mano no sirve de contorno. Se extrajo Argentina de Natural Earth 5.1.2, `ne_50m_admin_0_countries`, 1039 vértices, redondeados a 4 decimales. No se simplificó de nuevo. El sector antártico no está en el polígono.
- Malvinas, Georgias del Sur y Sandwich del Sur salen de `ne_10m_admin_0_countries` (FLK completo; SGS partido en longitud -34). Quedan en features distintos, redondeados a 4 decimales, sin unirlos al ARG ni entre sí. El anillo 1:10.000.000 de la Isla Grande solo valida el santuario; el trazo visible de Argentina sigue siendo el de 1:50.000.000.
- El estilo pide `circle-11` y el sprite tiene `circle_11`. También falta `wood-pattern`. Se dibuja un sustituto y el aviso queda en consola.
- Las ocho moderadas de npm son de la cadena de ESLint, no de Next, React, MapLibre ni Framer Motion. No se forzó la actualización.
- ESLint empezó a marcar el worker copiado. Se ignoró ese archivo generado, no el código de la app.
- En una ventana de unos 440 px de alto, la bitácora abierta dejaba el mapa tan bajo que la brújula se salía. El mapa conserva un alto mínimo en móvil.
- La atribución de MapLibre arranca expandida en anchos chicos y tapaba la base del mapa. Al cargar se pliega; el botón de atribución sigue ahí.
- Enter sobre un sello propio no lo activaba solo con el comportamiento nativo bajo el evento de prueba. El sello escucha Enter y Espacio. Las flechas siguen yendo al lienzo de MapLibre.
- En B3 el CSS de desarrollo no incorporó `.pixel-sprite` ni `.creature-silhouette` aunque el archivo fuente sí las tiene. El sprite lleva el mismo recorte de color y `image-rendering: pixelated` en el atributo `style`, que es lo que se midió en el navegador.
- La automatización del navegador manda teclas con `isTrusted: false`. Tab no mueve el foco. Escape sí cerró la Pokédex y el santuario, porque el cierre está en un listener propio. Enter y Espacio de un usuario real los resuelven los botones nativos; esa pulsación de confianza no se pudo reproducir con la herramienta.
- El primer dibujo del santuario, con `slice` y columnas altas, se leía como franjas. El segundo, con `meet` en un teléfono vertical, dejaba la escena en una banda chica. En B4A.5 ese SVG salió: la sala pasó a CSS. En B4A.9 las dos ilustraciones reemplazan esa sala. El sprite no usa un margen fijo de escritorio: comparte el marco del arte y los pies quedan al 50 % y 55 %.
- `System.Drawing` no pudo abrir los WebP (`Memoria insuficiente`). El tamaño y el altar se midieron con Pillow.
- En caliente, el CSS del dev server siguió sirviendo `max-height: 42vh` en la ficha después de quitarlo. Recargar con el archivo ya compilado aplicó `flex-shrink: 0`. En una ventana de 500 px de alto los botones quedaban cortados; después del recorte, «Volver al mapa» termina en y 484.
- Un `setState` al cambiar de exterior a interior lo marcó `react-hooks/set-state-in-effect`. El fallo de la imagen y la omisión del rito se derivan de la etapa, sin ese efecto.
- En B4A.9 el marco se achicaba para caber en el alto y dejaba franjas negras a los lados. En B4A.95 el marco usa todo el ancho y la ficha queda debajo, así que una ventana baja desplaza la página. En B4A.96 la visita tapa el viewport y la narración va encima. Un sesgo vertical (`translateY(-55%)` y `-46%`) con el alto ya igual al viewport dejaba una franja: el escenario se corre solo en horizontal y el vertical queda en `-50%`.
- Los fondos del teléfono se recortan con CSS. El archivo WebP no se recorta ni se vuelve a generar.

## Verificación

```bash
npm run typecheck
npm run lint
npm run build
npx tsx scripts/verify-pokeapi.ts
npx tsx scripts/verify-progress.ts
npx tsx scripts/verify-trainer-xp.ts
npx tsx scripts/verify-finishes.ts
npx tsx scripts/verify-enclave.ts
npx tsx scripts/verify-capture.ts
npx tsx scripts/verify-schedule.ts
npx tsx scripts/verify-weather.ts
npx tsx scripts/verify-team.ts
npx tsx scripts/verify-dex-query.ts
npx tsx scripts/verify-audio.ts
npx tsx scripts/verify-markers.ts
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

`scripts/verify-capture.ts` tampoco usa red. Comprueba la dificultad en los extremos de tasa y estadísticas, que el poder no invierta la tasa, los 3 o 4 movimientos, la cancelación, la omisión, la idempotencia, un progreso anterior y el rechazo de `capture_rate` ausente o fuera de 0–255.

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

`scripts/verify-enclave.ts` no usa red. Exige seis enclaves reservados, el catálogo en 56 y 50 de campo, Zapdos, Moltres y Aerodactyl en sus coordenadas anteriores, el santuario en -54.638, -67.759 sobre la Isla Grande y fuera del lago, el laboratorio en -51.7002, -58.8259 dentro de Malvinas y fuera del polígono ARG, el refugio en el monte Paget dentro de Georgia del Sur, los tres grupos insulares separados, las tres etiquetas fuera del agua, el navegador de cuatro regiones sin nombres de criaturas y sin alejar el encuadre nacional, y que el texto previo no nombre a las seis reservadas.

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

En el navegador, sobre `npm run dev`, en B4A.9, con almacenamiento vacío:

- En 1440×900 el sello decía «Anomalía». Pulsarlo abrió «Señal extraordinaria», con el texto del PokéRadar y sin el nombre. El foco inicial fue Investigar. Volver al mapa cerró el aviso y devolvió el foco al sello. No hubo pedidos a PokéAPI.
- Investigar mostró `entrada-santuario-glacial.webp` a 1672×941, 12 copos con `snow-fall` en marcha, la aurora y la luz de la boca. El texto no nombraba a la criatura. Entrar mostró `interior-santuario-glacial.webp`, sin sprite y sin pedido a PokéAPI.
- Examinar escribió `seen: ["kanto-144"]`, `caught` vacío, «Presencia legendaria descubierta», Articuno, Hielo y Volador, PS 90, Ataque 85, Defensa 100, Ataque esp. 95, Defensa esp. 125, Velocidad 85, y el GIF `animated/144.gif`. Los pies del sprite quedaron al 50 % del ancho y al 55 % del alto del marco. Omitir apagó el rito y dejó el visto.
- Un rechazo de PokéAPI mostró «PokéAPI no respondió. La señal sigue sin identificar.», sin el nombre y sin escribir `kanto-144`. Reintentar completó el descubrimiento.
- Se retuvo la ficha, se volvió al exterior y después se soltaron `/pokemon-species/articuno` y `/pokemon/articuno`, ambas en 200. El almacenamiento siguió vacío y el sello siguió diciendo «Anomalía».
- Salir y volver a entrar dejó `data-rite="false"`, sin la frase, con el GIF presente. El aviso, ya vista, dice que Articuno está en la bitácora. Escape cerró y devolvió el foco al sello. La Pokédex listó 51 Articuno como Visto. El canvas siguió en 1080×827, un solo lienzo, zoom 8.0.
- Con `prefers-reduced-motion: reduce`, la nieve quedó en `display: none` y `animation-name: none`, la aurora también, y el sprite fue `black-white/144.png`.
- En 1920×1080 el marco midió 1578×888, proporción 1.777, sin scroll horizontal, botones de 44 px dentro de la ventana. En 1440×500 los botones terminan en y 484 y el altar sigue visible. En 960×600, el equivalente de 1440×900 al 150 %, el marco midió 725×408 y los botones terminan en y 584. En 390×844 el marco midió 390×220, el sprite 62 px centrado al 55 %, sin scroll horizontal, y los botones de 44 px dentro de la ventana.
- Forzar `error` en la imagen mostró «La ilustración no cargó. La señal sigue en el lugar.»

No se usó un teléfono ni una tablet reales. No se ocultó la pestaña para medir `document.hidden`: la pausa está atada a `visibilitychange` y a `animation-play-state`, y no se verificó con la pestaña en segundo plano. Tab de la herramienta sigue sin ser de confianza.

En el navegador, sobre `npm run dev`, en B4A.95, con almacenamiento vacío:

- El aviso decía «PokéRadar · Señal anómala», «Energía extraordinaria» y «¿Querés investigar la señal?». El barrido era `radar-sweep`. No nombraba a Articuno. El foco inicial fue Investigar. Volver al mapa devolvió el foco al sello.
- En 1440×900 el exterior ocupó x 0 y 1425×802, proporción 1.777, sin franja lateral. La diferencia hasta 1440 es la barra de desplazamiento. Entrar dejó el altar vacío, con «Examinar la señal» y 11 destellos en las coordenadas del arte.
- Examinar escribió `seen: ["kanto-144"]`, `caught` vacío, el GIF `animated/144.gif` y los pies al 50 % / 55 %. No hubo `console.error` de la app en esa pasada.
- Salir y volver a entrar dejó `data-rite="false"` y el GIF presente, sin «Examinar». Tras recargar, el sello decía Articuno, el almacenamiento seguía en `kanto-144` y el interior mostró el GIF sin examinar.
- Con el aviso ya visto, el instrumento dice «Señal registrada» y que Articuno está en la bitácora.
- Un rechazo de PokéAPI mostró el texto fijo, sin el nombre y sin guardar el visto. Se retuvo el reintento, se volvió al exterior y se soltaron las dos respuestas en 200. El almacenamiento siguió vacío y el sello siguió en «Anomalía».
- Con movimiento reducido, los destellos quedaron en `animation-name: none` y opacidad 0.4, la nieve en `display: none` y el sprite en `144.png`.
- En 1920×1080 el marco midió 1905×1072. En 960×600, 945×532. En 1440×500 el marco mide 1425×802 y el área visible desplaza (262 de 802); los botones terminan en y 484. En 390×844 la ventana mide 390×490, el arte mide 870×490 corrido para centrar el altar, la proporción sigue 1.777, el altar queda a la vista y los botones terminan en y 828. El exterior en ese ancho centra la boca: el foco medido fue 0.66.

No se usó un teléfono real. No se volvió a abrir la Pokédex en esta pasada: el visto quedó en `localStorage` y en el sello. No se ocultó la pestaña.

En el navegador, sobre `npm run dev`, en B4A.96, con almacenamiento vacío:

- El aviso siguió igual: «PokéRadar · Señal anómala», «Energía extraordinaria», sin el nombre. Investigar mostró el exterior en `position: fixed`, 1440×900, sin ficha debajo. El documento medía 900 px de alto. El texto era «Santa Cruz · Patagonia», «Santuario Glacial» y «Una luz desconocida emerge desde las profundidades del hielo. Algo parece aguardar en su interior.»
- El escenario del exterior midió 1599×900, proporción 1.777, con el borde izquierdo en −335, así la boca (66 %) cae en el centro de la ventana. El interior midió lo mismo, centrado, sin sprite. El pulso era un botón de 112 px, al 50 % / 51 % del escenario, con el nombre «Examinar la señal del altar». No había un botón «Examinar la señal». El lienzo del mapa seguía siendo uno.
- Activar el pulso escribió `seen: ["kanto-144"]`, `caught` vacío, el GIF `animated/144.gif` y los pies al 50 % / 55 % del escenario. El título fue «¡Una presencia legendaria se ha manifestado!» y la línea «Articuno ha sido registrado en la Pokédex.» «Ver ficha» mostró Hielo, Volador y las seis estadísticas (90, 85, 100, 95, 125, 85). «Cerrar ficha» las ocultó. La ficha no estaba abierta al manifestarse.
- Volver afuera dejó el texto de bitácora y el escenario a ras (y 0, alto 900). Volver al mapa devolvió el foco al sello. Reingresar dejó `data-rite="false"`, el GIF y sin pulso. Tras recargar, el sello decía Articuno, el aviso «Señal registrada» y el interior el GIF sin examinar.
- Un rechazo de PokéAPI mostró el texto fijo, sin el nombre, sin sprite y sin guardar. Se retuvo el reintento, se volvió al exterior y se soltaron `/pokemon-species/articuno` y `/pokemon/articuno`, ambas en 200. El almacenamiento siguió vacío y el sello siguió en «Anomalía».
- Con `prefers-reduced-motion: reduce`, la visita y el anillo del pulso quedaron en `animation-name: none`, no había nieve en el DOM y, ya vista, el sprite fue `black-white/144.png` con `data-rite="false"`.
- Sin scroll del documento ni overflow horizontal: 1920×1080 (escenario 1920×1081, botones en y 1066), 960×600 (botones en y 586), 1440×500 (`overflow: hidden`, documento 500, pájaro entre y 60 y 291, botones en y 486), 390×844 (escenario 1500×844 corrido a −555, pájaro y 224–464, último botón en y 830), 375×667 (último botón en y 654) y 360×640 (último botón en y 626). La proporción del escenario fue 1.777 en todas.

No se usó un teléfono real. No se abrió la Pokédex en esta pasada. No se ocultó la pestaña. No se movió el zoom del navegador: se usaron la ventana baja y los anchos de teléfono. Tab de la herramienta sigue sin ser de confianza, así que el foco visible del pulso se comprobó en el CSS (`:focus-visible` muestra el nombre) y no con una pulsación de Tab. El fallback de scroll bajo 360 px de alto no se abrió: las ventanas medidas quedan por encima.

## Qué queda para el bloque siguiente

No hay clima, gritos de especie ni equipo. El foil de las raras es un velo estático que en escritorio sigue el puntero; no hay un bucle holográfico. Cada enclave pide su exterior, su interior, su paleta y su propia revelación; la central eléctrica no recolorea la nevada, el volcán no recolorea la lluvia, la caverna no recolorea el fuego ni el hielo, el laboratorio no recolorea esas ceremonias y el refugio no recolorea el altar. Los avisos de `circle-11` y `wood-pattern` siguen. El contorno 1:50.000.000 no alcanza para un límite legal. Las islas del Atlántico Sur se dibujan aparte y el encuadre nacional no las mete alejando el zoom. Los acentos de color no son biomas. Clefable figura en montaña porque así lo publica PokéAPI, no porque describa el glaciar. El nombre en español del álbum, antes de abrir la ficha, es el nombre de especie con mayúscula.

## Decisiones

| Decisión | Por qué | Qué se dejó de lado |
| --- | --- | --- |
| Catálogo fijo de Kanto y semilla `pokeradar-kanto-v1` | Las especies no cambian al recargar y cada encuentro tiene id propio | Elegir al azar entre el hábitat en cada visita |
| Globo nativo de MapLibre, con cielo y atmósfera | Una sola instancia, sin Three.js ni teselas satelitales, y Mercator al acercarse | Una segunda vista o una esfera que gire sola |
| Contornos insulares 1:10.000.000, aparte del ARG 1:50.000.000 | El mismo trazo celeste sin líneas sobre el océano ni un zoom nacional más lejano | Fundir FLK y SGS en el polígono continental o dibujar conectores |
| Manchas de color, no biomas | El proyecto no tiene polígonos de ecorregión | Pintar las provincias o un hábitat científico |
| Seis reservados fuera de los encuentros de campo | No son avistamientos comunes | Ponerlos en una zona con los otros cincuenta |
| Seis enclaves, `glacial`, `storm`, `ember`, `fossil`, `lab` y `grove`, encima del mapa | Las seis reservadas se descubren en su lugar sin recrear MapLibre | Seis pantallas genéricas o una ruta nueva |
| Georgia del Sur aparte del polígono ARG | El refugio cae en tierra insular de Natural Earth sin fingir el continente | Fusionar SGS al contorno o mover el punto a Santa Cruz |
| Paleta del enclave en variables CSS | El pulso y el sello cambian de color sin copiar reglas por especie | Una hoja de pulso para cada criatura |
| Caché en memoria, ficha al elegir | Cero fichas al entrar; el detalle, bajo demanda | Prefetch de las 56 fichas |
| Álbum sobre la Pokédex existente | Las cartas leen el mismo progreso y piden la ficha solo al abrir una revelada | Una tabla nueva o precargar las 56 fichas |
| Carta centrada, no panel lateral | El PS, los tipos y la dificultad salen de la misma ficha y de la misma fórmula | Una segunda fuente de datos o un panel fijo a la derecha |
| Frente y reverso en la misma ficha | El artwork es `official-artwork` de PokéAPI y el giro es CSS; la captura queda en el reverso | TCGdex, una segunda ficha o una biblioteca 3D |
| Velo fijo del modal | El fondo cubre el viewport y solo se desplaza la carta | Un scrim dentro del contenedor que hace scroll |
| Worker en `public/` | Vercel sirve el estático sin leer `node_modules` en runtime | Mantener la ruta que hacía `fs.readFile` |
| Sustituto del icono ausente, con `console.warn` | El mapa no se cae y el hueco del sprite queda visible | `hasImage`, que dispara el error, o silenciar la consola |
| No correr `audit fix --force` | El arreglo baja ESLint un major y no toca producción | Actualizar toda la cadena de lint |
| Progreso en `localStorage`, esquema v1 | Sobrevive al refresco y un documento inválido vuelve a cero | Un backend o guardar el nombre en español |
| Dificultad `1 + 9 × (0.82 × (1 − tasa/255) + 0.18 × suma/1530)` | La tasa pesa más que las estadísticas y el techo es el del recurso, no una tabla por especie | Usar la probabilidad real de captura o asignar un número a cada Pokémon |
| Pokébola en SVG y tonos con Web Audio | PokéAPI no publica el lanzamiento ni el movimiento de la bola; el grito es la voz de la especie | Samples comerciales o usar el cry como efecto de captura |
| El sprite del enclave sigue la fase de la Pokébola | El del altar no es el de la superposición; se oculta con la misma fase y viaja a la bola al absorber | Un segundo temporizador o un motor distinto para los seis |
| Silueta del PNG de Black & White | La forma es la del sprite real y el color no se revela | Generar una imagen o mostrar el GIF oculto |
| GIF de Black & White al descubrir; PNG si el movimiento está reducido | El recurso es del repositorio PokeAPI/sprites y el GIF no sigue animado cuando se pidió calma | Un `prefers-reduced-motion` que solo pause por CSS |
| Santuario en -54.638, -67.759 y laboratorio en -51.7002, -58.8259 | Tierra firme junto al Lago Escondido y en el monte Usborne, con los ids de progreso intactos | Dejar Articuno en Santa Cruz o exigir Malvinas dentro del polígono ARG |
| Aviso antes de la ilustración, y la ficha solo al examinar | El jugador descubre el lugar antes que el nombre, y salir a tiempo no marca visto | Entrar directo al interior o pedir Articuno al abrir el mapa |
| Marco 1672:941 y pies al 50 % / 55 % | El sprite sigue al altar en escritorio, teléfono y ventana baja | Un `top` en píxeles de una sola resolución |
| Escena fija a pantalla, cover 1672:941 y narración encima | El alto de la ilustración ya no desplaza la página, y el sprite, el pulso y los destellos comparten el recorte del arte | Una ficha debajo de la imagen, o posicionar el pájaro con porcentajes del viewport |
| Pulso en el altar en lugar del botón «Examinar la señal» | La acción está en el lugar de la ilustración y sigue siendo un botón con nombre | Hacer clic en toda la pantalla, o abrir las estadísticas al manifestarse |
