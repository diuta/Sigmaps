import type { StationFeatureCollection } from "@/lib/station";

export interface UseStationsResult {
  stations: StationFeatureCollection | null;
  loading: boolean;
  error: string | null;
}
