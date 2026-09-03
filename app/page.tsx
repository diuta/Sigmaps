"use client";

import BaseMap from "@/components/map/BaseMap";
import StationLayer from "@/components/map/layers/StationLayer";
import { SelectedStationProvider } from "@/hooks/useSelectedStation";

export default function Home() {
  return (
    <SelectedStationProvider>
      <main className="relative w-screen h-screen overflow-hidden bg-slate-900">
        <BaseMap>
          {/* Layer stasiun KRL dengan 3 state interaktif (Idle, Hover, Active) */}
          <StationLayer />

          {/* Layer-layer berikutnya (PropertyLayer, IsochroneLayer) */}
        </BaseMap>

        {/* Sidebar Clement akan di-mount di sini (e.g. <Sidebar />) */}
      </main>
    </SelectedStationProvider>
  );
}
