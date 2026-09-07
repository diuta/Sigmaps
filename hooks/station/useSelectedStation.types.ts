import type { StationLocation } from "@/types/station";

export interface SelectedStationContextValue {
  selectedStation: StationLocation | null;
  setSelectedStation: (station: StationLocation | null) => void;
}
