/** Baris view `stasiun_kawasan` (supabase/views.sql). */
export type StationRow = {
  station_id: string
  nama: string
  tipe_3: string | null
  kecamatan: string | null
  kabkot: string | null
  longitude: number | null
  latitude: number | null

  // Dari scored_areas lewat LEFT JOIN. null = pipeline batch belum jalan.
  area_id: string | null
  area_km2: number | null
  is_rankable: boolean | null
  isokron: GeoJSONPolygon | null
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

      /** Sifat kawasan, bukan hasil pencarian. null != false. */
      is_rankable: boolean | null
      area_km2: number | null

      // Poligon MAPID (foot, 600 detik). Dititipkan di properties karena
      // `geometry` sudah dipakai titik stasiun — MapLibre tidak bisa memakainya
      // langsung sebagai sumber, IsochroneLayer merakit sendiri.
      isokron: GeoJSONPolygon | null
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
      },
    })),
  }
}
