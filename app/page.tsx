"use client";

import BaseMap from "@/components/map/BaseMap";
import StationLayer from "@/components/map/layers/StationLayer";
import IsochroneLayer from "@/components/map/layers/IsochroneLayer";
import PropertyLayer from "@/components/map/layers/PropertyLayer";
import DevToolsOverlay from "@/components/map/dev/DevToolsOverlay";
import { SelectedStationProvider } from "@/hooks/useSelectedStation";
import { IsochroneConfigProvider } from "@/hooks/useIsochroneConfig";
import { PropertyPopupConfigProvider } from "@/hooks/usePropertyPopupConfig";

export default function Home() {
  return (
    <SelectedStationProvider>
      <IsochroneConfigProvider>
        <PropertyPopupConfigProvider>
          <main className="relative w-screen h-screen overflow-hidden bg-slate-900">
            <BaseMap>
              {/* 1. Poligon Isokron 10 Menit (muncul saat stasiun aktif) */}
              <IsochroneLayer />

              {/* 2. Titik-titik properti dalam isokron stasiun aktif */}
              <PropertyLayer />

              {/* 3. Layer stasiun KRL dengan 3 state interaktif (Idle, Hover, Active) */}
              <StationLayer />
            </BaseMap>

            {/* 🟡 UNIFIED DEV TOOLS OVERLAY (Tunggal di bottom-center, mudah dihapus) */}
            <DevToolsOverlay />

            {/* Sidebar Clement akan di-mount di sini (e.g. <Sidebar />) */}
          </main>
        </PropertyPopupConfigProvider>
      </IsochroneConfigProvider>
    </SelectedStationProvider>
  );
}
