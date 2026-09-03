"use client";

import BaseMap from "@/components/map/BaseMap";
import StationLayer from "@/components/map/layers/StationLayer";
import IsochroneLayer from "@/components/map/layers/IsochroneLayer";
import IsochroneDevTool from "@/components/map/dev/IsochroneDevTool";
import { SelectedStationProvider } from "@/hooks/useSelectedStation";
import { IsochroneConfigProvider } from "@/hooks/useIsochroneConfig";

export default function Home() {
  return (
    <SelectedStationProvider>
      <IsochroneConfigProvider>
        <main className="relative w-screen h-screen overflow-hidden bg-slate-900">
          <BaseMap>
            {/* Poligon Isokron 10 Menit (muncul saat stasiun aktif) */}
            <IsochroneLayer />

            {/* Layer stasiun KRL dengan 3 state interaktif (Idle, Hover, Active) */}
            <StationLayer />
          </BaseMap>

          {/* 🟡 DEV ONLY: Floating tool untuk simulasi isochrone parameters */}
          <IsochroneDevTool />

          {/* Sidebar Clement akan di-mount di sini (e.g. <Sidebar />) */}
        </main>
      </IsochroneConfigProvider>
    </SelectedStationProvider>
  );
}
