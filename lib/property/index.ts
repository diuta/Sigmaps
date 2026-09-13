// Bentuk baris hasil query view properti_go_by_station (lihat supabase/views.sql) — geom
// dan rute sudah dikonversi ke GeoJSON oleh ST_AsGeoJSON di sisi database.
// contact_number sekarang ada di properti_go (lihat supabase/views.sql) — aman disertakan.

// jarak_jalan_m / waktu_jalan_s / rute datang dari LEFT JOIN rute_properti: NULL berarti
// etl/hitung_rute.py belum dijalankan untuk pasangan itu — kondisi normal, diteruskan apa adanya.
export type PropertyRow = {
  id: string
  station_id?: string | null
  kategori_properti: string | null
  jenis_properti: string | null
  alamat: string | null
  foto_tampak_depan: string | null
  foto_spanduk: string | null
  contact_number?: string | null
  geom: GeoJSONGeometry
  jarak_jalan_m: number | null
  waktu_jalan_s: number | null
  rute: GeoJSONLineString | null
}

type GeoJSONGeometry = { type: string; coordinates: unknown }
type GeoJSONLineString = { type: 'LineString'; coordinates: [number, number][] }

export type PropertyFeatureCollection = {
  type: 'FeatureCollection'
  features: Array<{
    type: 'Feature'
    geometry: GeoJSONGeometry
    properties: {
      id: string
      station_id: string | null
      kategori_properti: string | null
      jenis_properti: string | null
      alamat: string | null
      foto_tampak_depan: string | null
      foto_spanduk: string | null
      contact_number: string | null
      jarak_jalan_m: number | null
      waktu_jalan_s: number | null
      rute: GeoJSONLineString | null
    }
  }>
}

export function toPropertiesFeatureCollection(rows: PropertyRow[]): PropertyFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: rows.map((row) => ({
      type: 'Feature',
      geometry: row.geom,
      properties: {
        id: row.id,
        station_id: row.station_id ?? null,
        kategori_properti: row.kategori_properti,
        jenis_properti: row.jenis_properti,
        alamat: row.alamat,
        foto_tampak_depan: row.foto_tampak_depan,
        foto_spanduk: row.foto_spanduk,
        contact_number: row.contact_number ?? null,
        jarak_jalan_m: row.jarak_jalan_m ?? null,
        waktu_jalan_s: row.waktu_jalan_s ?? null,
        rute: row.rute ?? null,
      },
    })),
  }
}
