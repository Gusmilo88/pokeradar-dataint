# Expansión de experiencia

Informe de la pasada. El catálogo sigue en 56 (50 de campo y 6 reservadas). `pokeradar.progress.v1` no cambió de forma.

| Fase | Estado | Prueba | Archivos |
| --- | --- | --- | --- |
| 1 Controles | OK | Lint y build. El área de carta mide 44 px en CSS. | `globals.css`, `album.css` |
| 2 Filtros y orden | OK | `verify-dex-query.ts`. Los desconocidos no usan tipo ni estadística oculta. | `dex-query.ts`, `pokedex-view.tsx` |
| 3 Modal de encuentro | OK | El panel lateral queda como índice. La ficha es `EncounterModal`. | `encounter-modal.tsx`, `detail-dock.tsx` |
| 4 Marcador capturado | OK | `verify-markers.ts`. Sprite solo si está capturado; el oculto sigue en `???`. | `pins.ts`, `map-view.tsx` |
| 5 Sonido y gritos | OK | `verify-audio.ts` elige `latest` y cae a `legacy`. El silencio es el de la sesión. | `cries.ts`, `sound-toggle.tsx` |
| 6 Horarios | OK | `verify-schedule.ts` cubre 04:59/05:00, 07:59/08:00, 17:59/18:00, 21:59/22:00, 23:59/00:00 y el cruce de medianoche. | `schedule.ts` |
| 7 Clima | OK | `verify-weather.ts`: lluvia, nieve, sol, neutro, 500, 429, offline, timeout y TTL. Sin especies inventadas. | `weather.ts`, `weather-client.ts` |
| 8 Biomas | OK | El texto usa el hábitat ya publicado. No agrega atributos de PokéAPI. | `biomes.ts`, `region-brief.tsx` |
| 9 Equipo | OK | `verify-team.ts`: tope 6, sin duplicados, solo capturados. El reinicio limpia la clave. | `team.ts`, `team-dock.tsx` |
| 10 Globo | PARCIAL | Estrellas, halo y relleno celeste están en el cliente. GEBCO `GetMap` falló al crear el PNG; el océano nocturno queda como reserva. | `globe.ts`, `star-field.tsx`, `expedition-style.ts` |
| 11 Marcadores por zoom | OK | `verify-markers.ts`: global, regional, detalle y agrupación. | `marker-band.ts`, `map-theme.css` |
| 12 404 | OK | `next build` genera `/_not-found`. En el navegador se vio el título, la Pokébola y «Volver a la expedición». | `not-found.tsx` |
| 13 Auditoría | PARCIAL | Lint, typecheck, build y los verificadores locales quedaron en verde. La matriz de 1920/1440/960/390 y los zooms 125 % y 150 % quedó NOT_VERIFIED. | `docs/qa/expansion.md` |

La reproducción de un OGG real y el cruce visual de una ventana horaria en pantalla quedan cubiertos por las funciones puras, no por una sesión de navegador en esta pasada.
