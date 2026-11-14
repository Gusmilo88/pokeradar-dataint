import type { WeatherSnapshot } from "@/lib/expedition/weather";

export const WEATHER_TTL_MS = 10 * 60 * 1000;
export const WEATHER_TIMEOUT_MS = 8000;

export class WeatherError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "WeatherError";
    this.status = status;
  }
}

interface CacheEntry {
  at: number;
  value: WeatherSnapshot;
}

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<WeatherSnapshot>>();

function cacheKey(latitude: number, longitude: number): string {
  return `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseCurrentWeather(payload: unknown): WeatherSnapshot {
  if (!isRecord(payload) || !isRecord(payload.current)) {
    throw new WeatherError("Open-Meteo no trajo una observación actual.");
  }
  const current = payload.current;
  const weatherCode = current.weather_code;
  const temperatureC = current.temperature_2m;
  const precipitationMm = current.precipitation;
  const snowfallCm = current.snowfall;
  const isDay = current.is_day;
  const observedAt = current.time;
  if (
    typeof weatherCode !== "number" ||
    typeof temperatureC !== "number" ||
    typeof precipitationMm !== "number" ||
    typeof snowfallCm !== "number" ||
    (isDay !== 0 && isDay !== 1) ||
    typeof observedAt !== "string" ||
    observedAt.length === 0
  ) {
    throw new WeatherError("La observación actual llegó incompleta.");
  }
  return {
    weatherCode,
    temperatureC,
    precipitationMm,
    snowfallCm,
    isDay: isDay === 1,
    observedAt,
  };
}

export function weatherUrl(latitude: number, longitude: number): string {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "weather_code,temperature_2m,precipitation,snowfall,is_day",
    timezone: "America/Argentina/Buenos_Aires",
  });
  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

export interface WeatherRequest {
  fetchImpl?: typeof fetch;
  now?: () => number;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export function clearWeatherCache(): void {
  cache.clear();
  inflight.clear();
}

export async function readZoneWeather(
  latitude: number,
  longitude: number,
  request: WeatherRequest = {},
): Promise<WeatherSnapshot> {
  const key = cacheKey(latitude, longitude);
  const now = request.now ?? Date.now;
  const hit = cache.get(key);
  if (hit && now() - hit.at < WEATHER_TTL_MS) {
    return hit.value;
  }
  const pending = inflight.get(key);
  if (pending) {
    return pending;
  }
  const job = fetchSnapshot(latitude, longitude, request)
    .then((value) => {
      cache.set(key, { at: now(), value });
      inflight.delete(key);
      return value;
    })
    .catch((error: unknown) => {
      inflight.delete(key);
      throw error;
    });
  inflight.set(key, job);
  return job;
}

async function fetchSnapshot(
  latitude: number,
  longitude: number,
  request: WeatherRequest,
): Promise<WeatherSnapshot> {
  const fetchImpl = request.fetchImpl ?? fetch;
  const timeoutMs = request.timeoutMs ?? WEATHER_TIMEOUT_MS;
  const parent = request.signal;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onParent = () => controller.abort();
  parent?.addEventListener("abort", onParent);
  if (parent?.aborted) {
    controller.abort();
  }
  let response: Response;
  try {
    response = await fetchImpl(weatherUrl(latitude, longitude), { signal: controller.signal });
  } catch (error) {
    if (parent?.aborted) {
      throw new WeatherError("La consulta de clima se canceló.");
    }
    if (error instanceof WeatherError) {
      throw error;
    }
    throw new WeatherError("Open-Meteo no respondió.");
  } finally {
    clearTimeout(timer);
    parent?.removeEventListener("abort", onParent);
  }
  if (!response.ok) {
    throw new WeatherError(`Open-Meteo respondió ${response.status}.`, response.status);
  }
  return parseCurrentWeather(await response.json());
}
