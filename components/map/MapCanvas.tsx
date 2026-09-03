"use client";

import { useState } from "react";
import type maplibregl from "maplibre-gl";
import BaseMap from "@/components/map/BaseMap";
import LayerPanel from "@/components/map/LayerPanel";
import { MapInstanceContext } from "@/hooks/useMapInstance";
import { DEFAULT_BASEMAP_ID } from "@/lib/fixtures/layers";

/** Pembungkus peta: menahan instance maplibre supaya panel layer bisa mengaturnya. */
export default function MapCanvas() {
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [styleId, setStyleId] = useState(DEFAULT_BASEMAP_ID);

  return (
    <MapInstanceContext.Provider value={{ map }}>
      <div className="relative h-screen flex-1 bg-[var(--color-surface-muted)]">
        <BaseMap styleId={styleId} onMapReady={setMap} />
        <LayerPanel styleId={styleId} onStyleChange={setStyleId} />
      </div>
    </MapInstanceContext.Provider>
  );
}
