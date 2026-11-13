"use client";

import dynamic from "next/dynamic";
import { StatusPanel } from "@/components/states/status-panel";
import type { MapViewProps } from "@/components/map/map-view";

const MapView = dynamic(
  () => import("@/components/map/map-view").then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full min-h-[16rem] place-items-center bg-void/80 px-6">
        <StatusPanel
          tone="loading"
          title="Cargando mapa interactivo"
          description="MapLibre arranca en el navegador. El servidor no toca window."
        />
      </div>
    ),
  },
);

export function MapCanvas(props: MapViewProps) {
  return <MapView {...props} />;
}
