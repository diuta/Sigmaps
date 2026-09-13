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
import { ComparisonProvider } from "@/hooks/comparison/useComparison";
import ComparisonPanel from "@/components/comparison/ComparisonPanel";

export default function Home() {
  return (
    <SidebarOpenProvider>
    <ComparisonProvider>
    <SelectedStationProvider>
      <SelectedPropertyProvider>
      <PropertyFilterProvider>
      <BriefResultProvider>
        <main className="flex h-screen w-screen overflow-hidden bg-slate-900">
          <Sidebar />
          <ComparisonPanel />

          <div className="relative flex-1 overflow-hidden z-0 isolate">
            <BaseMap>
              <IsochroneLayer />

              <RouteLayer />

              <PropertyLayer />

              <StationLayer />
            </BaseMap>
          </div>
        </main>
      </BriefResultProvider>
      </PropertyFilterProvider>
      </SelectedPropertyProvider>
    </SelectedStationProvider>
    </ComparisonProvider>
    </SidebarOpenProvider>
  );
}
