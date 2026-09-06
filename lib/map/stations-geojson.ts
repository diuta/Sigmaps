import type { StationLocation } from "@/types/station";

interface StationPinFeature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: {
    area_id: string;
    station_name: string;
    is_rankable: boolean;
  };
}

interface StationPinFeatureCollection {
  type: "FeatureCollection";
  features: StationPinFeature[];
}

/** Fixture stasiun → FeatureCollection untuk source maplibre. Fungsi murni. */
export function stationsGeoJson(
  stations: readonly StationLocation[],
): StationPinFeatureCollection {
  return {
    type: "FeatureCollection",
    features: stations.map(
      (station): StationPinFeature => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [station.lng, station.lat] },
        properties: {
          area_id: station.area_id,
          station_name: station.station_name,
          is_rankable: station.is_rankable,
        },
      }),
    ),
  };
}

/** Cari stasiun berdasarkan area_id — dipakai saat pin diklik. */
export function findStation(
  stations: readonly StationLocation[],
  areaId: string,
): StationLocation | null {
  return stations.find((station) => station.area_id === areaId) ?? null;
}
