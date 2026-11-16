# PokéRadar — Expedición Argentina

![Vista actual de la expedición](preview-captures/expedicion-actual-1440.png)

Radar de exploración Pokémon sobre el mapa real de Argentina. Las fichas salen de [PokéAPI](https://pokeapi.co/). Las posiciones son encuentros simulados de Kanto por hábitat; no son apariciones reales.

**Producción:** https://pokeradar-dataint-ten.vercel.app/

## Cómo ejecutarlo

Node.js 20+ y npm. No requiere autenticación.

```bash
npm ci
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

```bash
npm run build
npm start
```

`predev` / `prebuild` copian el worker de MapLibre a `public/`.

**Cómo probarlo:** al entrar hay una intro omitible (Saltar / Escape). Desde la cabecera están Pokédex, Medallas, sonido y Bitácora. En la Pokédex, **Probar expedición completa** y en Medallas **Probar demostración** simulan logros en memoria sin tocar el progreso real. **Reiniciar expedición** borra el progreso local tras confirmación.

**Calidad:** `npm run lint`, `npm run typecheck`, `npm run build` y los verificadores en `scripts/` (PokéAPI, progreso, captura, clima, equipo, mapa, enclaves y demos).

---

## 1. Concepto y narrativa

PokéRadar invita a recorrer Argentina en un globo, acercar regiones y descubrir criaturas de Kanto como señales de un radar. Elegimos el país por su geografía diversa (ciudad, bosque, montaña, costa, hielo, islas) y porque el brief pedía un escenario local navegable.

**Qué incluye la experiencia**

- 56 especies de Kanto: 50 en el campo y 6 en enclaves reservados.
- Diez zonas con hábitats de PokéAPI, sellos a zoom amplio y encuentros al acercar.
- Horarios en Buenos Aires, clima vía Open-Meteo, captura, Pokédex y equipo de seis.
- XP, niveles, acabados de carta, medallas, sonido opcional, branding e introducción.

La narrativa diferencia exploración geográfica y descubrimiento gradual (de `???` a la ficha completa), sin pretender avistamientos reales.

---

## 2. Arquitectura y stack

| Tecnología | Uso |
| --- | --- |
| Next.js 16 (App Router) + React 19 | App y UI |
| TypeScript estricto | Tipado (`noUncheckedIndexedAccess`) |
| Tailwind CSS 4 | Estilos |
| MapLibre GL + OpenFreeMap dark | Mapa y globo |
| Framer Motion | Línea del marco y barras de estadísticas; el resto es CSS |
| PokéAPI / Open-Meteo | Fichas y clima |

`src/app` concentra rutas; `components/expedition` la UI del juego; `components/map` el mapa cliente; `lib/` catálogo, progreso, PokéAPI y estilo geográfico.

**MapLibre sin SSR:** `MapCanvas` es Client Component y carga `MapView` con `dynamic(..., { ssr: false })`. Así el bundle de MapLibre no se evalúa en el servidor y se evita `window is not defined`. El mapa se crea en `useEffect` y se destruye al desmontar.

Persistencia en `localStorage` (progreso, equipo, medallas, acabados) y `sessionStorage` (proyección, audio, intro). Estados de carga y error en mapa, fichas, clima y límites de ruta. Accesibilidad: Escape, foco al cerrar, reduced motion y layout adaptable a móvil.

**Atribuciones:** OpenFreeMap / MapLibre; contornos Natural Earth 5.1.2; datos y sprites PokéAPI; clima Open-Meteo; relieve del preview de desarrollo Terrain Tiles (Mapzen, CC BY 4.0). Ilustraciones de enclaves: originales con IA bajo dirección humana. Pokémon pertenece a sus titulares; este proyecto es una simulación demostrativa.

---

## 3. Uso de inteligencia artificial. ¿Qué herramientas usaste (Cursor, Claude, v0, etc.)? ¿Para qué tareas te apoyaste en ellas? 

El desarrollo fue AI-native con Cursor y GPT: implementación, contraste de APIs y borradores de verificadores. Las propuestas del modelo se validaron siempre con mapa, consola, scripts o capturas; no se aceptaron a ciegas.
Me apoyé para iniciar el roadmap, y desde ahí empezar a desarrollar las diferentes etapas. 

Trabajo de la siguiente manera casi siempre (salvo que sea una landing o una web institucional, que son cosas simples; ahí me manejo solo con Cursor).

Acepto el proyecto, lo analizo con GPT para armar el roadmap y qué tecnologías vamos a usar. 
Lo divido en X cantidad de etapas. Cada etapa tiene un % (aprox.) que representa el avance del total del desarrollo. De esta manera tengo una aproximación de cuánto puedo avanzar en un día, estimar cuánto me falta para terminar una funcionalidad o cuánto para poder terminar y tener todo listo para el deploy en mi VPS.
Una vez definido esto, le pido a GPT que me arme el primer prompt para Cursor. Lo leo, si tengo que corregir algo lo hago y, una vez que doy el ok, se lo pego a Cursor, este ejecuta lo pedido, lo leo y se lo pego a GPT pidiéndole un checklist de cosas a verificar por mi cuenta. Por ejemplo:

Que la animación de la pokébola funcione.
Que el número de Pokémon sea el que pedí.
Que se vea bien en mobile.
Que el botón lleve a donde debe llevar, etc., etc.

Si un check o más no pasan la prueba, trabajamos sobre esos errores hasta que estén ok. Una vez que todos estén ok, continuamos con la siguiente etapa.

Por lo general se me van ocurriendo nuevas ideas durante el desarrollo, por eso el % va variando, pero me gusta tener el control yo, y saber si fue un día en donde avancé poco, avancé bien o avancé mucho.
Siempre me gusta estar avanzado en el desarrollo, por si surge un bug que me lleve más tiempo, siempre tener esa ventaja temporal.

## Punto clave: ¿En qué momentos la IA se equivocó o alucinó, y cómo interveniste vos para corregirla?

Hubo varios casos donde la IA alucinó o "se fue de rumbo".

1. Inconsistencia en los datos. Pedía usar una API diferente para las cartas que tenían otros ataques, otra vida, etc. Le pedí que no vuelva a querer trabajar con una API sin consultarme primero, y que todos los datos deben ser usados de la API proporcionada para el desafío.

2. En la creación de imágenes para los santuarios y las medallas. Le pedí que siga un mismo camino y estilo, que sean diferentes pero sin perder la esencia entre las mismas imágenes. Empezó a crearlas y no tenía nada que ver el estilo con el desarrollo. Simplemente le pedí que vayamos una por una, que espere que yo la apruebe y después continuar con las demás (esto con GPT, aprovechando el tiempo cuando Cursor trabajaba en algún prompt).

3. La IA alucinó, o mejor dicho quería dar por terminada una tarea y continuar con otras cuando aún yo no había dado el ok. Más precisamente la parte del descubrimiento de Pokémon legendarios. Quería continuar cuando había algunas fallas visuales (imágenes que no ocupaban todo el viewport, textos de una manera que no le había pedido, etc.) y yo quería pulir y terminar bien el estilo hasta dar con lo que yo había visualizado en mi cabeza, para después replicar esto en los otros 5 Pokémon legendarios. Solución: le dije que primero íbamos a pulir bien en detalle el primer Pokémon legendario y, una vez que yo lo dé como aprobado, ahí íbamos a replicar los otros 5 y continuar con el roadmap que habíamos planificado antes.

Básicamente, cuando la IA se va para un lado o quiere hacer algo que no le pedí, lo que hago es parar, aclarar qué es lo que quiero que haga, cómo quiero que lo haga y que no tome decisiones por mí. Que sin mi aprobación no se sigue al siguiente paso. Que sí puede darme opiniones para mejorar mis ideas, pero soy yo al final quien decide qué se hace.

## 4. Próximos pasos. Si tuvieras 1 semana más, ¿qué mejoras técnicas o de producto agregarías?

1. Tutorial.
2. Mejorar la jugabilidad, que sea un RPG por turnos más fiel a Pokémon real o a los viejos Final Fantasy.
3. Mejoras visuales en cartas y animaciones en las capturas.
4. Mejora visual en el planeta (nubes) y animación del universo al rotar el planeta.
5. Que los Pokémon que no están en santuarios aparezcan en diferentes partes del mapa (respetando biomas) que no sean estáticos. 
6. Agregar los 151 Pokémon de la primera temporada y que sea mundial, no solo de Argentina.
7. Poder personalizar el perfil del jugador con más mejoras, incluso un personaje modificable con skins que se van ganando al completar diferentes retos.
8. Mejorar los santuarios: en vez de imágenes de fondo, que sean videos.

