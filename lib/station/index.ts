export type StationRow = {
  station_id: string
  nama: string
  tipe_3: string | null
  kecamatan: string | null
  kabkot: string | null
  longitude: number | null
  latitude: number | null

  area_id: string | null
  area_km2: number | null
  is_rankable: boolean | null
  isokron: GeoJSONPolygon | null

  /** Sensus pesaing per kategori di dalam isokron, dari scored_areas. Dipakai
   *  AreaGapBlock lewat lib/scoring.kategoriJarang, bukan untuk skor. */
  competitor_counts: Record<string, number> | null
}

type GeoJSONPoint = { type: 'Point'; coordinates: [number, number] } | null
export type GeoJSONPolygon = { type: 'Polygon'; coordinates: [number, number][][] }

export type StationFeatureCollection = {
  type: 'FeatureCollection'
  features: Array<{
    type: 'Feature'
    geometry: GeoJSONPoint
    properties: {
      station_id: string
      nama: string
      tipe_3: string | null
      kecamatan: string | null
      kabkot: string | null

      is_rankable: boolean | null
      area_km2: number | null

      isokron: GeoJSONPolygon | null
      competitor_counts: Record<string, number> | null
    }
  }>
}

export function toStationsFeatureCollection(rows: StationRow[]): StationFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: rows.map((row) => ({
      type: 'Feature',
      geometry:
        row.longitude !== null && row.latitude !== null
          ? { type: 'Point', coordinates: [row.longitude, row.latitude] }
          : null,
      properties: {
        station_id: row.station_id,
        nama: row.nama,
        tipe_3: row.tipe_3,
        kecamatan: row.kecamatan,
        kabkot: row.kabkot,
        is_rankable: row.is_rankable,
        area_km2: row.area_km2,
        isokron: row.isokron,
        competitor_counts: row.competitor_counts,
      },
    })),
  }
}
