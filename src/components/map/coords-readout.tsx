"use client";

import { formatLatitude, formatLongitude } from "@/lib/expedition/format";

export function CoordsReadout({
  latitude,
  longitude,
  zoom,
}: {
  latitude: number;
  longitude: number;
  zoom: number;
}) {
  return (
    <div className="coords-readout" aria-live="polite">
      <p>LAT {formatLatitude(latitude)}</p>
      <p>LON {formatLongitude(longitude)}</p>
      <p>Z {zoom.toFixed(1)}</p>
    </div>
  );
}
