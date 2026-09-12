"use client";

import BaseMap from "@/components/map/BaseMap";
import StationLayer from "@/components/map/layers/StationLayer";
import IsochroneLayer from "@/components/map/layers/IsochroneLayer";
import PropertyLayer from "@/components/map/layers/PropertyLayer";
import RouteLayer from "@/components/map/layers/RouteLayer";
import Sidebar from "@/components/sidebar/Sidebar";
import { SelectedStationProvider } from "@/hooks/station/useSelectedStation";
import { BriefResultProvider } from "@/hooks/brief/useBriefResult";
import { SelectedPropertyProvider } from "@/hooks/property/useSelectedProperty";
import { PropertyFilterProvider } from "@/hooks/property/usePropertyFilter";
import { SidebarOpenProvider } from "@/hooks/sidebar/useSidebarOpen";

export default function Home() {
  return (
    <SidebarOpenProvider>
    <SelectedStationProvider>
      <SelectedPropertyProvider>
      <PropertyFilterProvider>
      {/* Hasil brief (intent + skor) dibutuhkan sidebar (ScoredPanel) MAUPUN peta
          (StationLayer, untuk gambar rank di pin) — makanya providernya di sini,
          di atas keduanya, bukan di dalam Sidebar saja. */}
      <BriefResultProvider>
        <main className="flex h-screen w-screen overflow-hidden bg-slate-900">
          <Sidebar />

          <div className="relative flex-1 overflow-hidden z-0 isolate">
            <BaseMap>
              {/* 1. Poligon Isokron 10 Menit (muncul saat stasiun aktif) */}
              <IsochroneLayer />

              {/* 1b. Garis rute jalan kaki properti terpilih -> stasiun (di atas isokron,
                  di bawah marker properti yang berupa DOM) */}
              <RouteLayer />

              {/* 2. Titik-titik properti dalam isokron stasiun aktif */}
              <PropertyLayer />

              {/* 3. Layer stasiun KRL dengan 3 state interaktif (Idle, Hover, Active) */}
              <StationLayer />
            </BaseMap>
          </div>
        </main>
      </BriefResultProvider>
      </PropertyFilterProvider>
      </SelectedPropertyProvider>
    </SelectedStationProvider>
    </SidebarOpenProvider>
  );
}
