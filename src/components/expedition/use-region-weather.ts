"use client";

import { useEffect, useState } from "react";
import { EXPEDITION_ZONES, type ExpeditionZone } from "@/lib/expedition/argentina";
import { readZoneWeather } from "@/lib/expedition/weather-client";
import type { WeatherSnapshot } from "@/lib/expedition/weather";

export type ZoneWeather =
  | { status: "pending" }
  | { status: "ready"; snapshot: WeatherSnapshot }
  | { status: "unavailable" };

export function useRegionWeather(zones: readonly ExpeditionZone[] = EXPEDITION_ZONES): ReadonlyMap<string, ZoneWeather> {
  const [reports, setReports] = useState<ReadonlyMap<string, ZoneWeather>>(() => new Map());

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    const queue = [...zones];
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
          if (cancelled) {
            return;
          }
          setReports((current) => new Map(current).set(zone.id, { status: "ready", snapshot }));
        } catch {
          if (cancelled || controller.signal.aborted) {
            return;
          }
          setReports((current) => new Map(current).set(zone.id, { status: "unavailable" }));
        }
      }
    };
    void Promise.all([worker(), worker()]);
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [zones]);

  return reports;
}
