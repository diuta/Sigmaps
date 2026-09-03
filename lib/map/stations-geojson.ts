import type {
  StationFeature,
  StationFeatureCollection,
  StationRanking,
} from "@/types/station";

/** Fixture stasiun → FeatureCollection untuk source maplibre. Fungsi murni. */
export function stationsGeoJson(
  stations: readonly StationRanking[],
): StationFeatureCollection {
  return {
    type: "FeatureCollection",
    features: stations.map(
      (station): StationFeature => ({
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
  stations: readonly StationRanking[],
  areaId: string,
): StationRanking | null {
  return stations.find((station) => station.area_id === areaId) ?? null;
}
