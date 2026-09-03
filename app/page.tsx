"use client";

import BaseMap from "@/components/map/BaseMap";
import { SelectedStationProvider } from "@/hooks/useSelectedStation";

export default function Home() {
  return (
    <SelectedStationProvider>
      <main className="relative w-screen h-screen overflow-hidden bg-slate-900">
        <BaseMap>
          {/* Layer-layer peta (StationLayer, PropertyLayer, IsochroneLayer) akan di-mount di sini */}
        </BaseMap>

        {/* Sidebar Clement akan di-mount di sini (e.g. <Sidebar />) */}
      </main>
    </SelectedStationProvider>
  );
}
