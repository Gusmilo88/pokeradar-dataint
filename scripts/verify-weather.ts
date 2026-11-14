import { activeEncounterIds, moodFromSnapshot, type WeatherSnapshot } from "../src/lib/expedition/weather";
import { clearWeatherCache, parseCurrentWeather, readZoneWeather, WeatherError } from "../src/lib/expedition/weather-client";

function snap(partial: Partial<WeatherSnapshot>): WeatherSnapshot {
  return {
    weatherCode: 0,
    temperatureC: 20,
    precipitationMm: 0,
    snowfallCm: 0,
    isDay: true,
    observedAt: "2026-11-14T12:00",
    ...partial,
  };
}

if (moodFromSnapshot(snap({ weatherCode: 61 })) !== "rain") throw new Error("lluvia");
if (moodFromSnapshot(snap({ weatherCode: 71 })) !== "snow") throw new Error("nieve");
if (moodFromSnapshot(snap({ weatherCode: 0, isDay: true })) !== "sun") throw new Error("sol");
if (moodFromSnapshot(snap({ weatherCode: 3, isDay: true })) !== "neutral") throw new Error("neutro");
if (moodFromSnapshot(snap({ weatherCode: 0, isDay: false })) !== "neutral") throw new Error("noche");

const types = new Map<string, readonly string[]>([
  ["a", ["water"]],
  ["b", ["fire"]],
  ["c", ["normal"]],
]);
const rain = activeEncounterIds(["a", "b", "c"], (id) => types.get(id) ?? null, "rain", 0);
const sun = activeEncounterIds(["a", "b", "c"], (id) => types.get(id) ?? null, "sun", 0);
if (!rain.includes("a") || !sun.includes("b") || rain.join(",") === sun.join(",")) {
  throw new Error(`clima lluvia=${rain.join(",")} sol=${sun.join(",")}`);
}
const nextDay = activeEncounterIds(["a", "b", "c"], (id) => types.get(id) ?? null, "sun", 1);
if (nextDay.join(",") === sun.join(",")) throw new Error("el día siguiente no rotó el resto");
const missing = activeEncounterIds(["a", "b"], (id) => (id === "a" ? ["water"] : null), "rain", 0);
if (missing.length !== 2) throw new Error("sin tipo no se recorta");
const neutral = activeEncounterIds(["a", "b"], (id) => types.get(id) ?? null, "neutral", 0);
if (neutral.length !== 2) throw new Error("neutro conserva el pool");

const parsed = parseCurrentWeather({
  current: {
    weather_code: 61,
    temperature_2m: 14.2,
    precipitation: 1.4,
    snowfall: 0,
    is_day: 1,
    time: "2026-11-14T15:00",
  },
});
if (parsed.temperatureC !== 14.2 || parsed.weatherCode !== 61) throw new Error("parse");
let rejected = false;
try {
  parseCurrentWeather({ current: { weather_code: 1 } });
} catch (error) {
  rejected = error instanceof WeatherError;
}
if (!rejected) throw new Error("observación incompleta");

async function main(): Promise<void> {
clearWeatherCache();
let calls = 0;
const fetchImpl: typeof fetch = async () => {
  calls += 1;
  if (calls === 1) {
    return new Response("no", { status: 500 });
  }
  return new Response("rate", { status: 429 });
};
let status = 0;
try {
  await readZoneWeather(-34.6, -58.4, { fetchImpl, now: () => 1 });
} catch (error) {
  status = error instanceof WeatherError ? (error.status ?? 0) : 0;
}
if (status !== 500) throw new Error(`500 -> ${status}`);
try {
  await readZoneWeather(-34.6, -58.4, { fetchImpl, now: () => 2 });
} catch (error) {
  status = error instanceof WeatherError ? (error.status ?? 0) : 0;
}
if (status !== 429) throw new Error(`429 -> ${status}`);

clearWeatherCache();
const offline: typeof fetch = async () => {
  throw new TypeError("offline");
};
let offlineHit = false;
try {
  await readZoneWeather(-34.6, -58.4, { fetchImpl: offline, now: () => 3 });
} catch (error) {
  offlineHit = error instanceof WeatherError && error.status === null;
}
if (!offlineHit) throw new Error("offline");

clearWeatherCache();
const hang: typeof fetch = (_url, init) =>
  new Promise((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () => {
      reject(new DOMException("The operation was aborted.", "AbortError"));
    });
  });
let timedOut = false;
try {
  await readZoneWeather(1, 2, { fetchImpl: hang, timeoutMs: 30, now: () => 40 });
} catch (error) {
  timedOut = error instanceof WeatherError;
}
if (!timedOut) throw new Error("timeout");

clearWeatherCache();
const ok: typeof fetch = async () =>
  new Response(JSON.stringify({
    current: {
      weather_code: 0,
      temperature_2m: 22,
      precipitation: 0,
      snowfall: 0,
      is_day: 1,
      time: "2026-11-14T12:00",
    },
  }));
await readZoneWeather(-34.6, -58.4, { fetchImpl: ok, now: () => 10 });
calls = 0;
const counting: typeof fetch = async () => {
  calls += 1;
  return ok("" as never);
};
await readZoneWeather(-34.6, -58.4, { fetchImpl: counting, now: () => 11 });
if (calls !== 0) throw new Error("el TTL no evitó la segunda consulta");

console.log("OK weather rain snow sun neutral http cache");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
