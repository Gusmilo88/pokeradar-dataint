"use client";

import { MotionConfig, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DetailDock } from "@/components/expedition/detail-dock";
import { HudBar } from "@/components/expedition/hud-bar";
import { useDossier, type DossierEntry } from "@/components/expedition/use-dossier";
import { MapCanvas } from "@/components/map/map-canvas";
import { EXPEDITION_ZONES } from "@/lib/expedition/argentina";
import { loadEncounterCatalog } from "@/lib/expedition/catalog";
import {
  buildEncounterPins,
  buildZonePins,
  EMPTY_PINS,
  findZone,
  INSPECT_ZOOM,
} from "@/lib/expedition/pins";
import type { Sighting } from "@/lib/expedition/argentina";
import { errorMessage } from "@/lib/errors/message";
import { speciesLabel } from "@/lib/pokeapi/labels";

interface CameraRequest {
  longitude: number;
  latitude: number;
  zoom: number;
  request: number;
}

type CatalogState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; sightings: readonly Sighting[] };

export function ExpeditionScreen() {
  const [catalog, setCatalog] = useState<CatalogState>({ status: "loading" });
  const [catalogAttempt, setCatalogAttempt] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notebookOpen, setNotebookOpen] = useState(true);
  const [camera, setCamera] = useState<CameraRequest | null>(null);
  const [knownNames, setKnownNames] = useState<ReadonlyMap<string, string>>(
    () => new Map(),
  );
  const cameraRequest = useRef(0);

  useEffect(() => {
    let cancelled = false;
    void loadEncounterCatalog().then(
      (sightings) => {
        if (!cancelled) {
          setCatalog({ status: "ready", sightings });
        }
      },
      (error: unknown) => {
        if (!cancelled) {
          setCatalog({
            status: "error",
            message: errorMessage(error, "No se pudieron leer los hábitats."),
          });
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [catalogAttempt]);

  const rememberName = useCallback((entry: DossierEntry) => {
    const label = entry.species.spanishName ?? speciesLabel(entry.species.name);
    setKnownNames((current) => {
      if (current.get(entry.species.name) === label) {
        return current;
      }
      const next = new Map(current);
      next.set(entry.species.name, label);
      return next;
    });
  }, []);

  const sightings = catalog.status === "ready" ? catalog.sightings : EMPTY_SIGHTINGS;
  const selected = sightings.find((sighting) => sighting.id === selectedId) ?? null;
  const dossier = useDossier(selected?.speciesName ?? null, rememberName);

  const zonePins = useMemo(
    () => (catalog.status === "ready" ? buildZonePins(EXPEDITION_ZONES, catalog.sightings) : EMPTY_PINS),
    [catalog],
  );
  const encounterPins = useMemo(
    () =>
      catalog.status === "ready"
        ? buildEncounterPins(EXPEDITION_ZONES, catalog.sightings, knownNames)
        : EMPTY_PINS,
    [catalog, knownNames],
  );

  function focusCamera(longitude: number, latitude: number, zoom: number) {
    cameraRequest.current += 1;
    setCamera({
      longitude,
      latitude,
      zoom,
      request: cameraRequest.current,
    });
  }

  function selectSighting(id: string) {
    const sighting = sightings.find((item) => item.id === id);
    if (!sighting) {
      return;
    }
    setSelectedId(id);
    setNotebookOpen(true);
    focusCamera(sighting.longitude, sighting.latitude, INSPECT_ZOOM);
  }

  function focusZone(zoneId: string) {
    const zone = findZone(zoneId);
    if (!zone) {
      return;
    }
    focusCamera(zone.anchor.longitude, zone.anchor.latitude, 8);
  }

  const zone = selected ? (findZone(selected.zoneId) ?? null) : null;

  return (
    <MotionConfig reducedMotion="user">
      <div
        className={
          notebookOpen
            ? "grid h-dvh min-h-0 grid-cols-1 grid-rows-[auto_minmax(10rem,1fr)_minmax(8.5rem,42dvh)] overflow-hidden lg:grid-cols-[minmax(0,1fr)_22.5rem] lg:grid-rows-[auto_minmax(0,1fr)]"
            : "grid h-dvh min-h-0 grid-cols-1 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden lg:grid-rows-[auto_minmax(0,1fr)]"
        }
      >
        <div className="col-span-full row-start-1">
          <HudBar
            status={
              catalog.status === "ready"
                ? "ready"
                : catalog.status === "error"
                  ? "error"
                  : "loading"
            }
            count={sightings.length}
            notebookOpen={notebookOpen}
            onOpen={() => setNotebookOpen(true)}
          />
          <motion.div
            aria-hidden="true"
            className="h-px origin-left bg-phosphor"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        </div>
        <main
          id="mapa"
          tabIndex={-1}
          className="map-stage relative col-start-1 row-start-2 min-h-0 outline-none"
        >
          <MapCanvas
            zonePins={zonePins}
            encounterPins={encounterPins}
            selectedId={selectedId}
            selectedZoneId={selected?.zoneId ?? null}
            camera={camera}
            onSelectSighting={selectSighting}
            onFocusZone={focusZone}
          />
        </main>
        {notebookOpen ? (
          <div className="relative z-30 col-start-1 row-start-3 h-full min-h-0 border-t border-phosphor/20 bg-abyss lg:col-start-2 lg:row-start-2 lg:border-t-0 lg:border-l">
            <DetailDock
              sightings={sightings}
              selectedId={selectedId}
              zone={zone}
              phase={dossier.phase}
              entry={dossier.entry}
              message={dossier.message}
              speciesName={selected?.speciesName ?? null}
              knownNames={knownNames}
              catalogStatus={catalog.status}
              catalogMessage={catalog.status === "error" ? catalog.message : null}
              onSelect={selectSighting}
              onRetry={dossier.retry}
              onRetryCatalog={() => {
                setSelectedId(null);
                setCatalog({ status: "loading" });
                setCatalogAttempt((value) => value + 1);
              }}
              onClose={() => setNotebookOpen(false)}
            />
          </div>
        ) : (
          <div className="relative z-30 col-start-1 row-start-3 border-t border-phosphor/20 bg-abyss px-4 py-2 lg:hidden">
            <button type="button" className="action-button w-full" onClick={() => setNotebookOpen(true)}>
              {selected ? "Abrir ficha" : "Abrir bitácora"}
            </button>
          </div>
        )}
      </div>
    </MotionConfig>
  );
}

const EMPTY_SIGHTINGS: readonly Sighting[] = [];
