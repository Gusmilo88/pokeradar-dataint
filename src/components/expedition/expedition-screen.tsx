"use client";

import { MotionConfig, motion } from "framer-motion";
import { useCallback, useMemo, useRef, useState } from "react";
import { DetailDock } from "@/components/expedition/detail-dock";
import { AnomalyGate } from "@/components/expedition/anomaly-gate";
import { EncounterModal } from "@/components/expedition/encounter-modal";
import { EnclaveInvite } from "@/components/expedition/enclave-invite";
import { GlacialSanctuary } from "@/components/expedition/glacial-sanctuary";
import { HudBar } from "@/components/expedition/hud-bar";
import { PokedexView } from "@/components/expedition/pokedex-view";
import { RegionBrief } from "@/components/expedition/region-brief";
import { TeamDock } from "@/components/expedition/team-dock";
import { useArgentinaNow } from "@/components/expedition/use-clock";
import { useDossier, type DossierEntry } from "@/components/expedition/use-dossier";
import { useFieldTypes } from "@/components/expedition/use-field-types";
import { useProgress } from "@/components/expedition/use-progress";
import { useRegionWeather } from "@/components/expedition/use-region-weather";
import { useTeam } from "@/components/expedition/use-team";
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
import { argentinaClock, isFieldWild } from "@/lib/expedition/schedule";
import { findSighting } from "@/lib/expedition/sightings";
import { activeEncounterIds, moodFromSnapshot } from "@/lib/expedition/weather";
import { TEAM_LIMIT } from "@/lib/expedition/team";
import type { AtlasFrame } from "@/lib/map/atlas-frames";
import { speciesLabel } from "@/lib/pokeapi/labels";

interface CameraRequest {
  longitude: number;
  latitude: number;
  zoom: number;
  request: number;
  exact?: boolean;
}

export function ExpeditionScreen() {
  const sightings = useMemo(() => loadFieldSightings(), []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notebookOpen, setNotebookOpen] = useState(false);
  const [probeId, setProbeId] = useState<string | null>(null);
  const [catchLock, setCatchLock] = useState<string | null>(null);
  const [focusedZoneId, setFocusedZoneId] = useState<string | null>(null);
  const now = useArgentinaNow();
  const weather = useRegionWeather();
  const fieldTypes = useFieldTypes();
  const [camera, setCamera] = useState<CameraRequest | null>(null);
  const [dexOpen, setDexOpen] = useState(false);
  const [enclaveId, setEnclaveId] = useState<string | null>(null);
  const [visit, setVisit] = useState<"gate" | "exterior" | "interior" | null>(null);
  const [examining, setExamining] = useState(false);
  const [ceremony, setCeremony] = useState(false);
  const [knownNames, setKnownNames] = useState<ReadonlyMap<string, string>>(
    () => new Map(),
  );
  const cameraRequest = useRef(0);
  const dexOpener = useRef<HTMLElement | null>(null);
  const { progress, hydrated, markSeen, markCaught, reset } = useProgress();
  const team = useTeam(progress.caught, hydrated);

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
  const dossier = useDossier(
    selected && (progress.seen.has(selected.id) || probeId === selected.id) ? selected.speciesName : null,
    rememberName,
  );
  const enclave = findEnclave(enclaveId);
  const enclaveCard = enclave
    ? (KANTO_CATALOG.find(
        (entry) => entry.encounterId === enclave.encounterId && entry.role === "reserved",
      ) ?? null)
    : null;
  const enclaveSeen = enclave ? progress.seen.has(enclave.encounterId) : false;
  const revealSpecies =
    visit === "interior" && enclaveCard && (enclaveSeen || examining)
      ? enclaveCard.speciesName
      : null;

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

  const activeSightings = useMemo(() => {
    const byZone = new Map<string, typeof sightings>();
    for (const sighting of sightings) {
      if (!isFieldWild(sighting.id, now) && catchLock !== sighting.id) {
        continue;
      }
      const list = byZone.get(sighting.zoneId) ?? [];
      list.push(sighting);
      byZone.set(sighting.zoneId, list);
    }
    const kept = new Set<string>();
    for (const [zoneId, list] of byZone) {
      const report = weather.get(zoneId);
      const scheduled = list.map((item) => item.id);
      if (!report || report.status !== "ready") {
        for (const id of scheduled) {
          kept.add(id);
        }
        continue;
      }
      const ids = activeEncounterIds(
        scheduled,
        (id) => fieldTypes.get(id) ?? null,
        moodFromSnapshot(report.snapshot),
        argentinaClock(now).dayIndex,
      );
      for (const id of ids) {
        kept.add(id);
      }
      if (catchLock && scheduled.includes(catchLock)) {
        kept.add(catchLock);
      }
    }
    return sightings.filter((sighting) => kept.has(sighting.id));
  }, [catchLock, fieldTypes, now, sightings, weather]);
  const zonePins = useMemo(
    () => buildZonePins(EXPEDITION_ZONES, activeSightings),
    [activeSightings],
  );
  const encounterPins = useMemo(
    () => buildEncounterPins(EXPEDITION_ZONES, activeSightings, knownNames, progress.seen, progress.caught),
    [activeSightings, knownNames, progress.caught, progress.seen],
  );
  const enclavePins = useMemo(
    () => buildEnclavePins(ENCLAVES, progress.seen, knownNames),
    [knownNames, progress.seen],
  );

  function focusCamera(longitude: number, latitude: number, zoom: number, exact = false) {
    cameraRequest.current += 1;
    setCamera({
      longitude,
      latitude,
      zoom,
      request: cameraRequest.current,
      exact,
    });
  }

  function exploreRegion(frame: AtlasFrame) {
    focusCamera(frame.longitude, frame.latitude, frame.zoom, true);
  }

  function selectSighting(id: string) {
    const sighting = findSighting(sightings, id);
    if (!sighting) {
      return;
    }
    if (!activeSightings.some((item) => item.id === id) && catchLock !== id) {
      return;
    }
    setEnclaveId(null);
    setVisit(null);
    setExamining(false);
    setProbeId(progress.seen.has(id) ? id : null);
    setSelectedId(id);
    focusCamera(sighting.longitude, sighting.latitude, INSPECT_ZOOM);
  }

  function selectEnclave(id: string) {
    const next = findEnclave(id);
    if (!next) {
      return;
    }
    setSelectedId(null);
    setVisit("gate");
    setExamining(false);
    setCeremony(false);
    setEnclaveId(id);
    focusCamera(next.point.longitude, next.point.latitude, 8);
  }

  function leaveEnclave() {
    const id = enclaveId;
    setVisit(null);
    setExamining(false);
    setCeremony(false);
    window.setTimeout(() => {
      if (!id) {
        return;
      }
      document.querySelector<HTMLButtonElement>(`button[data-pin-id="${CSS.escape(id)}"]`)?.focus();
    }, 0);
  }

  function focusZone(zoneId: string) {
    const zone = findZone(zoneId);
    if (!zone) {
      return;
    }
    setFocusedZoneId(zoneId);
    focusCamera(zone.anchor.longitude, zone.anchor.latitude, 8);
  }

  const zone = selected ? (findZone(selected.zoneId) ?? null) : null;
  const focusedZone = findZone(focusedZoneId ?? "") ?? null;

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
            caught={hydrated ? tally(progress).caught : null}
            notebookOpen={notebookOpen}
            onOpen={() => setNotebookOpen(true)}
            onDex={() => {
              dexOpener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
              setDexOpen(true);
            }}
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
            onExplore={exploreRegion}
          />
          {hydrated ? (
            <TeamDock
              members={team.members}
              names={knownNames}
              onRemove={team.remove}
              onMove={team.move}
            />
          ) : null}
          {focusedZone ? (
            <RegionBrief
              zone={focusedZone}
              weather={weather.get(focusedZone.id)}
              activeCount={activeSightings.filter((item) => item.zoneId === focusedZone.id).length}
              onClose={() => setFocusedZoneId(null)}
            />
          ) : null}
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
                  setVisit("gate");
                }}
                onIndex={() => {
                  setEnclaveId(null);
                  setVisit(null);
                  setExamining(false);
                }}
                onClose={() => setNotebookOpen(false)}
              />
            ) : (
            <DetailDock
              sightings={activeSightings}
              selectedId={selectedId}
              knownNames={knownNames}
              revealedIds={progress.seen}
              onSelect={selectSighting}
              onClose={() => setNotebookOpen(false)}
            />
            )}
          </div>
        ) : (
          <div className="relative z-30 col-start-1 row-start-3 border-t border-phosphor/20 bg-abyss px-4 py-2 lg:hidden">
            <button
              type="button"
              className="action-button inline-flex w-full items-center justify-center"
              onClick={() => {
                if (enclave) {
                  setVisit("gate");
                  return;
                }
                setNotebookOpen(true);
              }}
            >
              {enclave ? "Abrir anomalía" : "Abrir bitácora"}
            </button>
          </div>
        )}
        {dexOpen ? (
          <PokedexView
            progress={progress}
            onClose={() => {
              setDexOpen(false);
              const opener = dexOpener.current;
              window.setTimeout(() => opener?.focus(), 0);
            }}
            onSeek={(encounterId) => {
              setDexOpen(false);
              const linked = findEnclaveByEncounter(encounterId);
              if (linked) {
                selectEnclave(linked.id);
                return;
              }
              selectSighting(encounterId);
            }}
            onCaptured={markCaught}
            onReset={() => {
              reset();
              setSelectedId(null);
              setProbeId(null);
              setCatchLock(null);
              setEnclaveId(null);
              setVisit(null);
              setExamining(false);
            }}
            now={now}
            teamMembers={team.members}
            onTeam={team.add}
          />
        ) : null}
        {selected && zone ? (
          <EncounterModal
            sighting={selected}
            zone={zone}
            phase={dossier.phase}
            entry={dossier.entry}
            message={dossier.message}
            state={discoveryState(progress, selected.id)}
            wild={isFieldWild(selected.id, now)}
            now={now}
            probing={probeId === selected.id || catchLock === selected.id}
            onInvestigate={() => setProbeId(selected.id)}
            onRetry={dossier.retry}
            onClose={() => {
              const id = selected.id;
              setSelectedId(null);
              setProbeId(null);
              window.setTimeout(() => {
                document.querySelector<HTMLButtonElement>(`button[data-pin-id="${CSS.escape(id)}"]`)?.focus();
              }, 0);
            }}
            onCaptured={markCaught}
            onEngage={() => setCatchLock(selected.id)}
            onRelease={() => setCatchLock(null)}
            inTeam={team.members.includes(selected.id)}
            teamFull={team.members.length >= TEAM_LIMIT}
            onTeam={() => team.add(selected.id)}
          />
        ) : null}
        {visit === "gate" && enclave ? (
          <AnomalyGate
            knownName={
              enclaveSeen && enclaveCard
                ? (knownNames.get(enclaveCard.speciesName) ?? speciesLabel(enclaveCard.speciesName))
                : null
            }
            remains={enclave.remains}
            onInvestigate={() => setVisit("exterior")}
            onClose={leaveEnclave}
          />
        ) : null}
        {(visit === "exterior" || visit === "interior") && enclave ? (
          <GlacialSanctuary
            stage={visit}
            enclave={enclave}
            phase={enclaveDossier.phase}
            discovered={enclaveSeen || enclaveDossier.phase === "ready"}
            ceremony={ceremony}
            entry={enclaveDossier.entry}
            spriteId={
              visit === "interior" && (enclaveSeen || enclaveDossier.phase === "ready")
                ? (enclaveDossier.entry?.species.id ?? enclaveCard?.nationalId ?? null)
                : null
            }
            label={
              enclaveSeen || (visit === "interior" && enclaveDossier.phase === "ready")
                ? (enclaveDossier.entry?.species.spanishName ??
                  (enclaveCard ? knownNames.get(enclaveCard.speciesName) ?? speciesLabel(enclaveCard.speciesName) : null))
                : null
            }
            onExamine={() => {
              setCeremony(!enclaveSeen);
              setExamining(true);
            }}
            onRetry={enclaveDossier.retry}
            onEnter={() => setVisit("interior")}
            onExterior={() => {
              setVisit("exterior");
              setExamining(false);
              setCeremony(false);
            }}
            onLeave={leaveEnclave}
            caught={progress.caught.has(enclave.encounterId)}
            onCaptured={markCaught}
          />
        ) : null}
      </div>
    </MotionConfig>
  );
}

