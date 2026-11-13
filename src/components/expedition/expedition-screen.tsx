"use client";

import { MotionConfig, motion } from "framer-motion";
import { useCallback, useMemo, useRef, useState } from "react";
import { DetailDock } from "@/components/expedition/detail-dock";
import { EnclaveInvite } from "@/components/expedition/enclave-invite";
import { GlacialSanctuary } from "@/components/expedition/glacial-sanctuary";
import { HudBar } from "@/components/expedition/hud-bar";
import { PokedexView } from "@/components/expedition/pokedex-view";
import { useDossier, type DossierEntry } from "@/components/expedition/use-dossier";
import { useProgress } from "@/components/expedition/use-progress";
import { MapCanvas } from "@/components/map/map-canvas";
import { EXPEDITION_ZONES } from "@/lib/expedition/argentina";
import { loadFieldSightings } from "@/lib/expedition/catalog";
import { ENCLAVES, findEnclave, findEnclaveByEncounter } from "@/lib/expedition/enclaves";
import { KANTO_CATALOG } from "@/lib/expedition/kanto";
import {
  buildEncounterPins,
  buildEnclavePins,
  buildZonePins,
  findZone,
  INSPECT_ZOOM,
} from "@/lib/expedition/pins";
import { discoveryState, tally } from "@/lib/expedition/progress";
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
  const [dexOpen, setDexOpen] = useState(false);
  const [enclaveId, setEnclaveId] = useState<string | null>(null);
  const [inside, setInside] = useState(false);
  const [examining, setExamining] = useState(false);
  const [ceremony, setCeremony] = useState(false);
  const [knownNames, setKnownNames] = useState<ReadonlyMap<string, string>>(
    () => new Map(),
  );
  const cameraRequest = useRef(0);
  const { progress, hydrated, markSeen, reset } = useProgress();

  const rememberName = useCallback((entry: DossierEntry) => {
    const label = entry.species.spanishName ?? speciesLabel(entry.species.name);
    const sighting = sightings.find((item) => item.speciesName === entry.species.name);
    if (sighting) {
      markSeen(sighting.id);
    }
    setKnownNames((current) => {
      if (current.get(entry.species.name) === label) {
        return current;
      }
      const next = new Map(current);
      next.set(entry.species.name, label);
      return next;
    });
  }, [markSeen, sightings]);

  const selected = findSighting(sightings, selectedId);
  const dossier = useDossier(selected?.speciesName ?? null, rememberName);
  const enclave = findEnclave(enclaveId);
  const enclaveCard = enclave
    ? (KANTO_CATALOG.find(
        (entry) => entry.encounterId === enclave.encounterId && entry.role === "reserved",
      ) ?? null)
    : null;
  const enclaveSeen = enclave ? progress.seen.has(enclave.encounterId) : false;
  const revealSpecies =
    inside && enclaveCard && (enclaveSeen || examining) ? enclaveCard.speciesName : null;

  const acceptEnclave = useCallback((entry: DossierEntry) => {
    const current = findEnclave(enclaveId);
    const card = current
      ? KANTO_CATALOG.find(
          (item) => item.encounterId === current.encounterId && item.role === "reserved",
        )
      : null;
    if (!current || !card || card.speciesName !== entry.species.name) {
      return;
    }
    markSeen(current.encounterId);
    const label = entry.species.spanishName ?? speciesLabel(entry.species.name);
    setKnownNames((names) => {
      if (names.get(entry.species.name) === label) {
        return names;
      }
      const next = new Map(names);
      next.set(entry.species.name, label);
      return next;
    });
  }, [enclaveId, markSeen]);

  const enclaveDossier = useDossier(revealSpecies, acceptEnclave);

  const zonePins = useMemo(
    () => buildZonePins(EXPEDITION_ZONES, sightings),
    [sightings],
  );
  const encounterPins = useMemo(
    () => buildEncounterPins(EXPEDITION_ZONES, sightings, knownNames, progress.seen),
    [knownNames, progress.seen, sightings],
  );
  const enclavePins = useMemo(
    () => buildEnclavePins(ENCLAVES, progress.seen, knownNames),
    [knownNames, progress.seen],
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
    setEnclaveId(null);
    setInside(false);
    setExamining(false);
    setSelectedId(id);
    setNotebookOpen(true);
    focusCamera(sighting.longitude, sighting.latitude, INSPECT_ZOOM);
  }

  function selectEnclave(id: string) {
    const next = findEnclave(id);
    if (!next) {
      return;
    }
    setSelectedId(null);
    setInside(false);
    setExamining(false);
    setEnclaveId(id);
    setNotebookOpen(true);
    focusCamera(next.point.longitude, next.point.latitude, 8);
  }

  function leaveEnclave() {
    setInside(false);
    setExamining(false);
    setCeremony(false);
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
            ? "relative grid h-dvh min-h-0 grid-cols-1 grid-rows-[auto_minmax(10rem,1fr)_minmax(8.5rem,42dvh)] overflow-hidden lg:grid-cols-[minmax(0,1fr)_22.5rem] lg:grid-rows-[auto_minmax(0,1fr)]"
            : "relative grid h-dvh min-h-0 grid-cols-1 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden lg:grid-rows-[auto_minmax(0,1fr)]"
        }
      >
        <div className="col-span-full row-start-1">
          <HudBar
            seen={hydrated ? tally(progress).seen : null}
            notebookOpen={notebookOpen}
            onOpen={() => setNotebookOpen(true)}
            onDex={() => setDexOpen(true)}
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
            enclavePins={enclavePins}
            selectedId={selectedId}
            selectedZoneId={selected?.zoneId ?? null}
            selectedEnclaveId={enclaveId}
            camera={camera}
            onSelectSighting={selectSighting}
            onFocusZone={focusZone}
            onSelectEnclave={selectEnclave}
          />
        </main>
        {notebookOpen ? (
          <div className="relative z-30 col-start-1 row-start-3 h-full min-h-0 border-t border-phosphor/20 bg-abyss lg:col-start-2 lg:row-start-2 lg:border-t-0 lg:border-l">
            {enclave ? (
              <EnclaveInvite
                enclave={enclave}
                revealedName={
                  enclaveSeen && enclaveCard
                    ? (knownNames.get(enclaveCard.speciesName) ?? speciesLabel(enclaveCard.speciesName))
                    : null
                }
                onEnter={() => {
                  setDexOpen(false);
                  setInside(true);
                }}
                onIndex={() => {
                  setEnclaveId(null);
                  setInside(false);
                  setExamining(false);
                }}
                onClose={() => setNotebookOpen(false)}
              />
            ) : (
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
              revealedIds={progress.seen}
              status={selected && discoveryState(progress, selected.id) === "caught" ? "caught" : "seen"}
              onSelect={selectSighting}
              onRetry={dossier.retry}
              onClose={() => setNotebookOpen(false)}
            />
            )}
          </div>
        ) : (
          <div className="relative z-30 col-start-1 row-start-3 border-t border-phosphor/20 bg-abyss px-4 py-2 lg:hidden">
            <button type="button" className="action-button inline-flex w-full items-center justify-center" onClick={() => setNotebookOpen(true)}>
              {enclave ? "Abrir anomalía" : selected ? "Abrir ficha" : "Abrir bitácora"}
            </button>
          </div>
        )}
        {dexOpen ? (
          <PokedexView
            progress={progress}
            onClose={() => setDexOpen(false)}
            onSeek={(encounterId) => {
              setDexOpen(false);
              const linked = findEnclaveByEncounter(encounterId);
              if (linked) {
                selectEnclave(linked.id);
                return;
              }
              selectSighting(encounterId);
            }}
            onReset={() => {
              reset();
              setSelectedId(null);
              setEnclaveId(null);
              setInside(false);
              setExamining(false);
            }}
          />
        ) : null}
        {inside && enclave?.scene === "glacial" ? (
          <GlacialSanctuary
            enclave={enclave}
            phase={enclaveDossier.phase}
            discovered={enclaveSeen || enclaveDossier.phase === "ready"}
            ceremony={ceremony}
            entry={enclaveDossier.entry}
            spriteId={
              enclaveSeen || enclaveDossier.phase === "ready"
                ? (enclaveDossier.entry?.species.id ?? enclaveCard?.nationalId ?? null)
                : null
            }
            label={
              enclaveSeen || enclaveDossier.phase === "ready"
                ? (enclaveDossier.entry?.species.spanishName ??
                  (enclaveCard ? speciesLabel(enclaveCard.speciesName) : null))
                : null
            }
            onExamine={() => {
              setCeremony(!enclaveSeen);
              setExamining(true);
            }}
            onRetry={enclaveDossier.retry}
            onLeave={leaveEnclave}
          />
        ) : null}
      </div>
    </MotionConfig>
  );
}

