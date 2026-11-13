"use client";

import { useEffect, useRef, useState } from "react";
import {
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  ScaleControl,
  setWorkerUrl,
  type ErrorEvent,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./map-theme.css";
import { StatusPanel } from "@/components/states/status-panel";
import { prefersReducedMotion } from "@/lib/a11y/motion";
import { formatLatitude, formatLongitude } from "@/lib/expedition/format";
import { ARGENTINA_VIEW } from "@/lib/expedition/argentina";
import {
  collapsePins,
  INSPECT_ZOOM,
  REGIONAL_ZOOM,
  separateZoneOffsets,
  type FieldPin,
} from "@/lib/expedition/pins";
import { errorMessage } from "@/lib/errors/message";
import {
  MAP_LOCALE,
  MAPLIBRE_WORKER_URL,
  OPENFREEMAP_DARK_STYLE,
} from "@/lib/map/constants";
import { ARGENTINA_LAND_NOTE } from "@/lib/map/argentina-land";
import { applyExpeditionStyle } from "@/lib/map/expedition-style";

setWorkerUrl(MAPLIBRE_WORKER_URL);

interface MapReadout {
  longitude: number;
  latitude: number;
  zoom: number;
}

export interface MapCamera {
  longitude: number;
  latitude: number;
  zoom: number;
  request: number;
}

export interface MapViewProps {
  zonePins: readonly FieldPin[];
  encounterPins: readonly FieldPin[];
  selectedId: string | null;
  selectedZoneId: string | null;
  camera: MapCamera | null;
  onSelectSighting: (id: string) => void;
  onFocusZone: (zoneId: string) => void;
}

const initialReadout: MapReadout = {
  longitude: ARGENTINA_VIEW.center[0],
  latitude: ARGENTINA_VIEW.center[1],
  zoom: ARGENTINA_VIEW.zoom,
};

function solidImage(red: number, green: number, blue: number): ImageData {
  const size = 8;
  const data = new Uint8ClampedArray(size * size * 4);
  for (let index = 0; index < size * size; index += 1) {
    data.set([red, green, blue, 255], index * 4);
  }
  return new ImageData(data, size, size);
}

function townDot(): ImageData {
  const size = 22;
  const data = new Uint8ClampedArray(size * size * 4);
  const center = 11;
  const radius = 5;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = x - center;
      const dy = y - center;
      if (dx * dx + dy * dy > radius * radius) {
        continue;
      }
      data.set([197, 208, 216, 255], (y * size + x) * 4);
    }
  }
  return new ImageData(data, size, size);
}

export function MapView({
  zonePins,
  encounterPins,
  selectedId,
  selectedZoneId,
  camera,
  onSelectSighting,
  onFocusZone,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const selectRef = useRef(onSelectSighting);
  const zoneRef = useRef(onFocusZone);
  const [attempt, setAttempt] = useState(0);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [detail, setDetail] = useState<string | null>(null);
  const [readout, setReadout] = useState<MapReadout>(initialReadout);
  const [layoutTick, setLayoutTick] = useState(0);

  useEffect(() => {
    selectRef.current = onSelectSighting;
    zoneRef.current = onFocusZone;
  }, [onFocusZone, onSelectSighting]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let map: MapLibreMap | null = null;
    let cancelled = false;
    let styleLoaded = false;
    const replacedImages = new Set<string>();
    const warnedImages = new Set<string>();
    const reduceMotion = prefersReducedMotion();

    try {
      map = new MapLibreMap({
        container,
        style: OPENFREEMAP_DARK_STYLE,
        center: ARGENTINA_VIEW.center,
        zoom: ARGENTINA_VIEW.zoom,
        minZoom: 3,
        maxZoom: 16,
        attributionControl: { compact: true, customAttribution: ARGENTINA_LAND_NOTE },
        locale: MAP_LOCALE,
        fadeDuration: reduceMotion ? 0 : 300,
        reduceMotion,
      });
    } catch (error) {
      const message = errorMessage(error, "No se pudo crear el mapa.");
      queueMicrotask(() => {
        if (!cancelled) {
          setPhase("error");
          setDetail(message);
        }
      });
      return () => {
        cancelled = true;
      };
    }

    if (map === null) {
      return () => {
        cancelled = true;
      };
    }

    const activeMap = map;
    mapRef.current = activeMap;

    const navigation = new NavigationControl({
      visualizePitch: true,
      showCompass: true,
    });
    const scale = new ScaleControl({ maxWidth: 110, unit: "metric" });
    activeMap.addControl(navigation, "top-right");
    activeMap.addControl(scale, "bottom-left");

    const publishReadout = () => {
      if (cancelled) {
        return;
      }
      const center = activeMap.getCenter();
      setReadout({
        longitude: center.lng,
        latitude: center.lat,
        zoom: activeMap.getZoom(),
      });
    };

    const onStyleLoad = () => {
      styleLoaded = true;
    };

    const onLoad = () => {
      if (cancelled) {
        return;
      }
      applyExpeditionStyle(activeMap);
      setPhase("ready");
      setDetail(null);
      publishReadout();
      setLayoutTick((value) => value + 1);
      const attribution = activeMap.getContainer().querySelector(".maplibregl-ctrl-attrib");
      if (attribution?.classList.contains("maplibregl-compact-show")) {
        attribution.querySelector<HTMLElement>(".maplibregl-ctrl-attrib-button")?.click();
      }
    };

    const onMoveEnd = () => {
      publishReadout();
      setLayoutTick((value) => value + 1);
    };

    const onError = (event: ErrorEvent) => {
      const message = event.error.message;
      const missingImage = message.match(/Image "([^"]+)" could not be loaded/);
      const missingId = missingImage?.[1];
      if (missingId) {
        if (!replacedImages.has(missingId) && !warnedImages.has(missingId)) {
          warnedImages.add(missingId);
          console.warn(`El estilo pidió ${missingId} y no quedó registrado.`, message);
        }
        return;
      }
      if (cancelled || activeMap.loaded()) {
        return;
      }
      const workerFailed = message.includes("Worker failed to load");
      if (styleLoaded && !workerFailed) {
        return;
      }
      setPhase("error");
      setDetail(message);
    };

    activeMap.setMissingStyleImageResolver((id) => {
      if (replacedImages.has(id)) {
        return;
      }
      const image = id === "circle-11" ? townDot() : solidImage(138, 134, 128);
      try {
        activeMap.addImage(id, image, { pixelRatio: 2 });
        replacedImages.add(id);
      } catch (error) {
        console.warn(`No se pudo registrar el icono ausente ${id}.`, error);
        return;
      }
      console.warn(
        id === "circle-11"
          ? "OpenFreeMap dark referencia circle-11, que no está en el sprite (existe circle_11). Se dibuja un punto para las localidades."
          : `OpenFreeMap dark pide ${id} y el sprite no lo incluye. Se usa un relleno neutro.`,
      );
    });

    const onResize = () => {
      setLayoutTick((value) => value + 1);
    };

    activeMap.on("style.load", onStyleLoad);
    activeMap.on("load", onLoad);
    activeMap.on("moveend", onMoveEnd);
    activeMap.on("resize", onResize);
    activeMap.on("error", onError);

    return () => {
      cancelled = true;
      mapRef.current = null;
      activeMap.setMissingStyleImageResolver(null);
      activeMap.off("style.load", onStyleLoad);
      activeMap.off("load", onLoad);
      activeMap.off("moveend", onMoveEnd);
      activeMap.off("resize", onResize);
      activeMap.off("error", onError);
      activeMap.remove();
    };
  }, [attempt]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || phase !== "ready") {
      return;
    }

    const zoom = map.getZoom();
    const showEncounters = zoom >= REGIONAL_ZOOM;
    const labeled = zoom >= INSPECT_ZOOM - 0.4;
    const project = (pin: FieldPin) => {
      const point = map.project([pin.longitude, pin.latitude]);
      return { x: point.x, y: point.y };
    };
    const pins = showEncounters ? collapsePins(encounterPins, project) : zonePins;
    const markers: Marker[] = [];

    const approach = (pin: FieldPin) => {
      const nextZoom = Math.min(14, Math.max(map.getZoom() + 2, REGIONAL_ZOOM + 1.5));
      const target = {
        center: [pin.longitude, pin.latitude] as [number, number],
        zoom: nextZoom,
      };
      if (prefersReducedMotion()) {
        map.jumpTo(target);
      } else {
        map.flyTo({ ...target, duration: 700, essential: true });
      }
    };

    for (const pin of pins) {
      const button = document.createElement("button");
      button.type = "button";
      const dot = pin.kind === "encounter" && !labeled;
      button.className =
        pin.kind === "zone"
          ? "field-pin field-pin-zone"
          : pin.kind === "stack"
            ? "field-pin field-pin-stack"
            : dot
              ? "field-pin field-pin-dot"
              : "field-pin field-pin-encounter";
      button.textContent = dot ? "" : pin.shortLabel;
      button.setAttribute("aria-label", pin.label);
      button.dataset.pinId = pin.id;
      button.style.setProperty("--zone-accent", pin.accent);
      const stop = (event: Event) => {
        event.stopPropagation();
      };
      const onClick = (event: Event) => {
        event.stopPropagation();
        if (pin.kind === "zone") {
          zoneRef.current(pin.zoneId);
        } else if (pin.kind === "stack") {
          approach(pin);
        } else {
          selectRef.current(pin.id);
        }
      };
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key !== "Enter" && event.key !== " ") {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        onClick(event);
      };
      button.addEventListener("pointerdown", stop);
      button.addEventListener("mousedown", stop);
      button.addEventListener("touchstart", stop, { passive: true });
      button.addEventListener("click", onClick);
      button.addEventListener("keydown", onKeyDown);
      const marker = new Marker({ element: button, anchor: "center" })
        .setLngLat([pin.longitude, pin.latitude])
        .addTo(map);
      markers.push(marker);
    }

    if (!showEncounters) {
      const measured = pins.map((pin, index) => {
        const button = markers[index]?.getElement();
        const box = button?.getBoundingClientRect();
        return {
          id: pin.id,
          x: box ? box.x + box.width / 2 : 0,
          y: box ? box.y + box.height / 2 : 0,
          w: box?.width ?? 0,
          h: box?.height ?? 0,
        };
      });
      const zoneOffsets = separateZoneOffsets(measured);
      markers.forEach((marker, index) => {
        const id = pins[index]?.id;
        if (!id) {
          return;
        }
        marker.setOffset(zoneOffsets.get(id) ?? [0, 0]);
      });
    }

    return () => {
      for (const marker of markers) {
        marker.remove();
      }
    };
  }, [attempt, encounterPins, layoutTick, phase, zonePins]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    const showEncounters = map.getZoom() >= REGIONAL_ZOOM;
    const buttons = map.getContainer().querySelectorAll<HTMLButtonElement>(".field-pin");
    buttons.forEach((button) => {
      const id = button.dataset.pinId ?? "";
      const selected = showEncounters
        ? id === selectedId
        : id === `zone:${selectedZoneId ?? ""}`;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
      button.style.zIndex = selected ? "2" : "1";
    });
  }, [encounterPins, layoutTick, phase, selectedId, selectedZoneId, zonePins]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !camera || phase !== "ready") {
      return;
    }
    const zoom = Math.max(map.getZoom(), camera.zoom);
    const target = {
      center: [camera.longitude, camera.latitude] as [number, number],
      zoom,
    };
    if (prefersReducedMotion()) {
      map.jumpTo(target);
    } else {
      map.flyTo({ ...target, duration: 900, essential: true });
    }
  }, [camera, phase]);

  const liveMessage =
    phase === "ready"
      ? `Mapa listo. Latitud ${formatLatitude(readout.latitude)}, longitud ${formatLongitude(readout.longitude)}.`
      : phase === "error"
        ? `Error del mapa. ${detail ?? "No se pudo cargar el estilo."}`
        : "Cargando el mapa de Argentina.";

  return (
    <div className="relative h-full min-h-0 w-full">
      <div
        ref={containerRef}
        className="h-full w-full"
        role="application"
        aria-label="Mapa interactivo de Argentina"
      />
      <p className="sr-only" aria-live="polite">
        {liveMessage}
      </p>
      <div className="pointer-events-none absolute top-3 left-3 z-10 rounded-md border border-phosphor/30 bg-void px-3 py-2 font-mono text-[11px] leading-5 text-phosphor-strong">
        <p>LAT {formatLatitude(readout.latitude)}</p>
        <p>LON {formatLongitude(readout.longitude)}</p>
        <p>Z {readout.zoom.toFixed(1)}</p>
      </div>
      {phase === "loading" ? (
        <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-void/55 px-6">
          <StatusPanel
            tone="loading"
            title="Sintonizando el terreno"
            description="OpenFreeMap está trayendo el estilo oscuro centrado en Argentina."
          />
        </div>
      ) : null}
      {phase === "error" ? (
        <div className="absolute inset-0 z-20 grid place-items-center bg-void/80 px-6">
          <StatusPanel
            tone="error"
            title="El mapa no respondió"
            description={detail ?? "Falló la carga del estilo antes de mostrarse."}
            action={
              <button
                type="button"
                className="action-button inline-flex items-center justify-center"
                onClick={() => {
                  setPhase("loading");
                  setDetail(null);
                  setAttempt((value) => value + 1);
                }}
              >
                Reintentar
              </button>
            }
          />
        </div>
      ) : null}
    </div>
  );
}
