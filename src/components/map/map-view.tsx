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
import { Maximize2, Minimize2 } from "lucide-react";
import { formatLatitude, formatLongitude } from "@/lib/expedition/format";
import { CoordsReadout } from "@/components/map/coords-readout";
import { ARGENTINA_VIEW } from "@/lib/expedition/argentina";
import { paletteVars } from "@/lib/expedition/enclaves";
import {
  collapsePins,
  INSPECT_ZOOM,
  REGIONAL_ZOOM,
  type FieldPin,
} from "@/lib/expedition/pins";
import { errorMessage } from "@/lib/errors/message";
import {
  MAP_LOCALE,
  MAPLIBRE_WORKER_URL,
  OPENFREEMAP_DARK_STYLE,
} from "@/lib/map/constants";
import { ARGENTINA_LAND_NOTE } from "@/lib/map/argentina-land";
import { ATLAS_FRAMES, type AtlasFrame } from "@/lib/map/atlas-frames";
import { applyExpeditionStyle } from "@/lib/map/expedition-style";
import { applyPlanetPreview } from "@/lib/map/planet-preview";
import { markerBand } from "@/lib/map/marker-band";
import { markerLod, type MarkerLod } from "@/lib/map/marker-lod";
import { StarField } from "@/components/map/star-field";
import {
  applyPlanet,
  ARGENTINA_APPROACH_ZOOM,
  frameFieldMarkers,
  globeHomeZoom,
  readPlanetMode,
  writePlanetMode,
  type PlanetMode,
} from "@/lib/map/globe";
import { ProjectionToggle } from "@/components/map/projection-toggle";
import { RegionNav } from "@/components/map/region-nav";

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
  /** Con true, el zoom pedido reemplaza al actual. Sin él, la cámara solo acerca. */
  exact?: boolean;
}

export interface MapViewProps {
  zonePins: readonly FieldPin[];
  encounterPins: readonly FieldPin[];
  enclavePins: readonly FieldPin[];
  selectedId: string | null;
  selectedZoneId: string | null;
  selectedEnclaveId: string | null;
  camera: MapCamera | null;
  onSelectSighting: (id: string) => void;
  onFocusZone: (zoneId: string) => void;
  onSelectEnclave: (id: string) => void;
  onExplore: (frame: AtlasFrame) => void;
  immersive?: boolean;
  onImmersiveChange?: (value: boolean) => void;
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
  enclavePins,
  selectedId,
  selectedZoneId,
  selectedEnclaveId,
  camera,
  onSelectSighting,
  onFocusZone,
  onSelectEnclave,
  onExplore,
  immersive = false,
  onImmersiveChange,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const selectRef = useRef(onSelectSighting);
  const zoneRef = useRef(onFocusZone);
  const enclaveRef = useRef(onSelectEnclave);
  const [attempt, setAttempt] = useState(0);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [detail, setDetail] = useState<string | null>(null);
  const [readout, setReadout] = useState<MapReadout>(initialReadout);
  const [layoutTick, setLayoutTick] = useState(0);
  const [projection, setProjection] = useState<PlanetMode>(readPlanetMode);
  const [narrowHud, setNarrowHud] = useState(false);
  const projectionRef = useRef(projection);
  const markersRef = useRef<Marker[]>([]);
  const detailLodRef = useRef<MarkerLod | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const sync = () => setNarrowHud(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    projectionRef.current = projection;
  }, [projection]);

  useEffect(() => {
    selectRef.current = onSelectSighting;
    zoneRef.current = onFocusZone;
    enclaveRef.current = onSelectEnclave;
  }, [onFocusZone, onSelectEnclave, onSelectSighting]);

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
    const planet = projectionRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    try {
      map = new MapLibreMap({
        container,
        style: OPENFREEMAP_DARK_STYLE,
        center: ARGENTINA_VIEW.center,
        zoom: planet === "globe" ? globeHomeZoom(width, height) : ARGENTINA_VIEW.zoom,
        minZoom: 0,
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

    const homeZoom = globeHomeZoom(width, height);
    let placedHome = false;

    const paintPlanet = () => {
      const wantHome = !placedHome && projectionRef.current === "globe";
      const applied = applyPlanet(activeMap, projectionRef.current);
      if (wantHome && applied === "globe") {
        activeMap.jumpTo({ center: ARGENTINA_VIEW.center, zoom: homeZoom });
        placedHome = true;
      }
      if (applied === projectionRef.current) {
        return;
      }
      projectionRef.current = applied;
      writePlanetMode(applied);
      if (!cancelled) {
        setProjection(applied);
      }
    };

    const onStyleLoad = () => {
      styleLoaded = true;
      if (!cancelled) {
        applyExpeditionStyle(activeMap);
        paintPlanet();
        applyPlanetPreview(activeMap);
      }
    };

    const onLoad = () => {
      if (cancelled) {
        return;
      }
      applyExpeditionStyle(activeMap);
      paintPlanet();
      applyPlanetPreview(activeMap);
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
      const lod = markerLod(activeMap.getZoom());
      frameFieldMarkers(activeMap, markersRef.current);
      if (lod === "near" || lod !== detailLodRef.current) {
        detailLodRef.current = lod;
        setLayoutTick((value) => value + 1);
      }
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

    const onMove = () => {
      frameFieldMarkers(activeMap, markersRef.current);
    };

    activeMap.on("style.load", onStyleLoad);
    activeMap.on("load", onLoad);
    activeMap.on("move", onMove);
    activeMap.on("moveend", onMoveEnd);
    activeMap.on("resize", onResize);
    activeMap.on("error", onError);

    return () => {
      cancelled = true;
      mapRef.current = null;
      activeMap.setMissingStyleImageResolver(null);
      activeMap.off("style.load", onStyleLoad);
      activeMap.off("load", onLoad);
      activeMap.off("move", onMove);
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
    const lod = markerLod(zoom);
    detailLodRef.current = lod;
    const showEncounters = lod === "near";
    const labeled = zoom >= INSPECT_ZOOM - 0.4;
    const band = markerBand(zoom);
    const project = (pin: FieldPin) => {
      const point = map.project([pin.longitude, pin.latitude]);
      return { x: point.x, y: point.y };
    };
    const pins = showEncounters
      ? [...collapsePins(encounterPins, project), ...enclavePins]
      : [...zonePins, ...enclavePins];
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
      const face = document.createElement("span");
      face.className = "field-pin-face";
      const dot = pin.kind === "encounter" && !labeled;
      const compact = band === "global" && (pin.kind === "zone" || pin.kind === "enclave");
      button.className =
        pin.kind === "enclave"
          ? `field-pin field-pin-enclave field-pin-lod-${lod}${compact ? " field-pin-compact" : ""}${pin.presence === "caught" ? " field-pin-enclave-caught" : ""}`
          : pin.kind === "zone"
            ? `field-pin field-pin-zone field-pin-lod-${lod}${compact ? " field-pin-compact" : ""}`
            : pin.kind === "stack"
              ? `field-pin field-pin-stack field-pin-lod-${lod}`
              : pin.presence === "caught"
                ? `field-pin field-pin-caught field-pin-lod-${lod}`
                : dot
                  ? `field-pin field-pin-dot field-pin-lod-${lod}`
                  : `field-pin field-pin-encounter field-pin-lod-${lod}`;
      if (pin.presence === "caught" && pin.spriteStill) {
        const img = document.createElement("img");
        img.alt = "";
        img.draggable = false;
        const still = pin.spriteStill;
        const animated = prefersReducedMotion() ? still : (pin.spriteAnimated ?? still);
        img.src = animated;
        img.addEventListener("error", () => {
          img.src = still;
        });
        face.append(img);
      } else if (pin.kind === "zone" && pin.complete) {
        button.classList.add("field-pin-complete");
        if (!compact) {
          const stamp = document.createElement("span");
          stamp.textContent = pin.shortLabel.split("\n")[0] ?? "";
          face.append(stamp);
        }
        const star = document.createElement("span");
        star.className = "field-pin-star";
        star.setAttribute("aria-hidden", "true");
        star.textContent = "★";
        face.append(star);
      } else if (pin.kind === "enclave" && pin.presence !== "caught") {
        const mark = document.createElement("span");
        mark.className = "field-pin-mark";
        mark.setAttribute("aria-hidden", "true");
        mark.textContent = "?";
        face.append(mark);
      } else if (!dot && pin.kind !== "enclave") {
        face.textContent = compact ? String(pin.count ?? "") : pin.shortLabel;
      }
      button.append(face);
      button.setAttribute("aria-label", pin.label);
      button.dataset.pinId = pin.id;
      if (pin.focusName) {
        button.dataset.known = pin.focusName;
      }
      button.style.setProperty("--zone-accent", pin.accent);
      if (pin.palette) {
        const vars = paletteVars(pin.palette);
        for (const [name, value] of Object.entries(vars)) {
          if (typeof value === "string") {
            button.style.setProperty(name, value);
          }
        }
      }
      const stop = (event: Event) => {
        event.stopPropagation();
      };
      const onClick = (event: Event) => {
        event.stopPropagation();
        if (pin.kind === "zone") {
          zoneRef.current(pin.zoneId);
        } else if (pin.kind === "enclave") {
          enclaveRef.current(pin.id);
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
      const marker = new Marker({
        element: button,
        anchor: "center",
        offset: [0, 0],
        opacityWhenCovered: "0",
      })
        .setLngLat([pin.longitude, pin.latitude])
        .addTo(map);
      markers.push(marker);
    }

    markersRef.current = markers;
    frameFieldMarkers(map, markers);

    return () => {
      markersRef.current = [];
      for (const marker of markers) {
        marker.remove();
      }
    };
  }, [attempt, enclavePins, encounterPins, layoutTick, phase, zonePins]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    const showEncounters = map.getZoom() >= REGIONAL_ZOOM;
    const buttons = map.getContainer().querySelectorAll<HTMLButtonElement>(".field-pin");
    buttons.forEach((button) => {
      const id = button.dataset.pinId ?? "";
      const selected =
        id === selectedEnclaveId ||
        (showEncounters ? id === selectedId : id === `zone:${selectedZoneId ?? ""}`);
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
      button.style.zIndex = selected ? "2" : "1";
    });
  }, [enclavePins, encounterPins, layoutTick, phase, selectedEnclaveId, selectedId, selectedZoneId, zonePins]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !camera || phase !== "ready") {
      return;
    }
    const zoom = camera.exact ? camera.zoom : Math.max(map.getZoom(), camera.zoom);
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

  useEffect(() => {
    const map = mapRef.current;
    if (!map || phase !== "ready") {
      return;
    }
    map.resize();
  }, [immersive, phase]);

  function chooseProjection(next: PlanetMode) {
    const map = mapRef.current;
    if (!map || next === projection) {
      return;
    }
    const applied = applyPlanet(map, next);
    projectionRef.current = applied;
    writePlanetMode(applied);
    applyPlanetPreview(map);
    setProjection(applied);
    setLayoutTick((value) => value + 1);
  }

  const liveMessage =
    phase === "ready"
      ? `${projection === "globe" ? "Globo" : "Mapa"} listo. Latitud ${formatLatitude(readout.latitude)}, longitud ${formatLongitude(readout.longitude)}.`
      : phase === "error"
        ? `Error del mapa. ${detail ?? "No se pudo cargar el estilo."}`
        : "Cargando el mapa de Argentina.";

  return (
    <div className="map-canvas-shell relative h-full min-h-0 w-full">
      <div
        ref={containerRef}
        className="h-full w-full"
        role="application"
        aria-label="Mapa interactivo de Argentina"
      />
      {projection === "globe" && readout.zoom < 4 ? <StarField /> : null}
      <p className="sr-only" aria-live="polite">
        {liveMessage}
      </p>
      {phase === "ready" ? (
        <>
          <div className="map-tools">
            <ProjectionToggle mode={projection} onMode={chooseProjection} />
            <div className="map-tools-row">
              {narrowHud && readout.zoom < ARGENTINA_APPROACH_ZOOM ? (
                <button
                  type="button"
                  className="planet-approach"
                  onClick={() => {
                    const frame = ATLAS_FRAMES[0];
                    if (frame) {
                      onExplore(frame);
                    }
                  }}
                >
                  Ver Argentina
                </button>
              ) : null}
              <RegionNav onSelect={onExplore} />
            </div>
          </div>
          {onImmersiveChange ? (
            <button
              type="button"
              className="map-immersive"
              aria-label={immersive ? "Salir de pantalla completa" : "Pantalla completa"}
              title={immersive ? "Salir" : "Pantalla completa"}
              aria-pressed={immersive}
              onClick={() => onImmersiveChange(!immersive)}
            >
              {immersive ? (
                <Minimize2 aria-hidden="true" strokeWidth={1.75} />
              ) : (
                <Maximize2 aria-hidden="true" strokeWidth={1.75} />
              )}
            </button>
          ) : null}
          {!narrowHud && readout.zoom < ARGENTINA_APPROACH_ZOOM ? (
            <button
              type="button"
              className="planet-approach"
              onClick={() => {
                const frame = ATLAS_FRAMES[0];
                if (frame) {
                  onExplore(frame);
                }
              }}
            >
              Ver Argentina
            </button>
          ) : null}
        </>
      ) : null}
      <div className="coords-anchor">
        <CoordsReadout
          latitude={readout.latitude}
          longitude={readout.longitude}
          zoom={readout.zoom}
        />
      </div>
      {phase === "loading" ? (
        <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-void/55 px-6">
          <StatusPanel tone="loading" title="Sintonizando el terreno" />
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
