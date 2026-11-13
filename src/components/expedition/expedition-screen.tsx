"use client";

import { MotionConfig, motion } from "framer-motion";
import { useCallback, useMemo, useRef, useState } from "react";
import { DetailDock } from "@/components/expedition/detail-dock";
import { HudBar } from "@/components/expedition/hud-bar";
import { useDossier, type DossierEntry } from "@/components/expedition/use-dossier";
import { MapCanvas } from "@/components/map/map-canvas";
import { EXPEDITION_ZONES } from "@/lib/expedition/argentina";
import { loadFieldSightings } from "@/lib/expedition/catalog";
import {
  buildEncounterPins,
  buildZonePins,
  findZone,
  INSPECT_ZOOM,
} from "@/lib/expedition/pins";
import { findSighting } from "@/lib/expedition/sightings";
import { speciesLabel } from "@/lib/pokeapi/labels";

interface CameraRequest {
  longitude: number;
  latitude: number;
  zoom: number;
  request: number;
}

export function ExpeditionScreen() {
  const sightings = useMemo(() => loadFieldSightings(), []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notebookOpen, setNotebookOpen] = useState(true);
  const [camera, setCamera] = useState<CameraRequest | null>(null);
  const [knownNames, setKnownNames] = useState<ReadonlyMap<string, string>>(
    () => new Map(),
  );
  const cameraRequest = useRef(0);

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

  const selected = findSighting(sightings, selectedId);
  const dossier = useDossier(selected?.speciesName ?? null, rememberName);

  const zonePins = useMemo(
    () => buildZonePins(EXPEDITION_ZONES, sightings),
    [sightings],
  );
  const encounterPins = useMemo(
    () => buildEncounterPins(EXPEDITION_ZONES, sightings, knownNames),
    [knownNames, sightings],
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
    const sighting = findSighting(sightings, id);
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
              expeditionNumber={selected?.expeditionNumber ?? null}
              onSelect={selectSighting}
              onRetry={dossier.retry}
              onClose={() => setNotebookOpen(false)}
            />
          </div>
        ) : (
          <div className="relative z-30 col-start-1 row-start-3 border-t border-phosphor/20 bg-abyss px-4 py-2 lg:hidden">
            <button type="button" className="action-button inline-flex w-full items-center justify-center" onClick={() => setNotebookOpen(true)}>
              {selected ? "Abrir ficha" : "Abrir bitácora"}
            </button>
          </div>
        )}
      </div>
    </MotionConfig>
  );
}

