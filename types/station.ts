/** Kontrak stasiun — ARCHITECTURE.md §4.1. */

export interface StationRanking {
  area_id: string;
  station_name: string;
  lng: number;
  lat: number;
  /** false → digambar dengan label "data belum cukup", tidak ikut diperingkat. */
  is_rankable: boolean;
}

export interface StationFeature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: {
    area_id: string;
    station_name: string;
    is_rankable: boolean;
  };
}

export interface StationFeatureCollection {
  type: "FeatureCollection";
  features: StationFeature[];
}
