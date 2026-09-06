// Bentuk baris mentah tabel `stasiun` (bukan view — lihat docs/lib-stations.md untuk
// kenapa kasus ini TIDAK butuh SQL view, beda dari properti_go_by_station/
// community_activity_by_station yang benar-benar butuh view untuk spatial join).
export type StationRow = {
  station_id: string
  nama: string
  tipe_3: string | null
  kecamatan: string | null
  kabkot: string | null
  longitude: number | null
  latitude: number | null
}

type GeoJSONPoint = { type: 'Point'; coordinates: [number, number] } | null

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
      },
    })),
  }
}
