import MapCanvas from "@/components/map/MapCanvas";
import Sidebar from "@/components/sidebar/Sidebar";
import { SelectedStationProvider } from "@/hooks/useSelectedStation";

export default function Home() {
  return (
    <SelectedStationProvider>
      <main className="flex h-screen overflow-hidden">
        <Sidebar />
        <MapCanvas />
      </main>
    </SelectedStationProvider>
  );
}
