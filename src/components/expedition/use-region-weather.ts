"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EXPEDITION_ZONES, type ExpeditionZone } from "@/lib/expedition/argentina";
import { readZoneWeather, WeatherError } from "@/lib/expedition/weather-client";
import type { WeatherSnapshot } from "@/lib/expedition/weather";

export type ZoneWeather =
  | { status: "pending" }
  | { status: "ready"; snapshot: WeatherSnapshot; stale: boolean }
  | { status: "unavailable"; message: string };

function pendingMap(zones: readonly ExpeditionZone[]): Map<string, ZoneWeather> {
  return new Map(zones.map((zone) => [zone.id, { status: "pending" }]));
}

function failureMessage(error: unknown): string {
  if (error instanceof WeatherError && error.message !== "La consulta de clima se canceló.") {
    return error.message;
  }
  return "Open-Meteo no respondió.";
}

export function useRegionWeather(zones: readonly ExpeditionZone[] = EXPEDITION_ZONES): {
  reports: ReadonlyMap<string, ZoneWeather>;
  retry: (zoneId: string) => void;
} {
  const [reports, setReports] = useState<ReadonlyMap<string, ZoneWeather>>(() => pendingMap(zones));
  const [pulse, setPulse] = useState(0);
  const remembered = useRef(new Map<string, WeatherSnapshot>());
  const retryTarget = useRef<string | null>(null);

  const retry = useCallback((zoneId: string) => {
    retryTarget.current = zoneId;
    setReports((current) => new Map(current).set(zoneId, { status: "pending" }));
    setPulse((value) => value + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    const only = retryTarget.current;
    retryTarget.current = null;
    const queue = only ? zones.filter((zone) => zone.id === only) : [...zones];
    if (!only) {
      setReports(pendingMap(zones));
    }

    const worker = async () => {
      while (!controller.signal.aborted) {
        const zone = queue.shift();
        if (!zone) {
          return;
        }
        try {
          const snapshot = await readZoneWeather(zone.anchor.latitude, zone.anchor.longitude, {
            signal: controller.signal,
          });
          if (cancelled || controller.signal.aborted) {
            return;
          }
          remembered.current.set(zone.id, snapshot);
          setReports((current) => new Map(current).set(zone.id, { status: "ready", snapshot, stale: false }));
        } catch (error) {
          if (cancelled || controller.signal.aborted) {
            return;
          }
          const previous = remembered.current.get(zone.id);
          if (previous) {
            setReports((current) => new Map(current).set(zone.id, { status: "ready", snapshot: previous, stale: true }));
            continue;
          }
          setReports((current) => new Map(current).set(zone.id, { status: "unavailable", message: failureMessage(error) }));
        }
      }
    };

    void Promise.all([worker(), worker()]);
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [pulse, zones]);

  return { reports, retry };
}
