// Bentuk baris hasil query view properti_go_by_station (lihat supabase/views.sql) — geom
// sudah dikonversi ke GeoJSON oleh ST_AsGeoJSON di sisi database.
// Kolom sengaja tidak memuat luas/harga/kontak pemilik — Properti Go tidak punya kolom itu
// (CLAUDE.md/context-mvp.md §2 Langkah 4), jangan ditambahkan "jaga-jaga".
export type PropertyRow = {
  id: string
  kategori_properti: string | null
  jenis_properti: string | null
  alamat: string | null
  foto_tampak_depan: string | null
  foto_spanduk: string | null
  geom: GeoJSONGeometry
}

type GeoJSONGeometry = { type: string; coordinates: unknown }

export type PropertyFeatureCollection = {
  type: 'FeatureCollection'
  features: Array<{
    type: 'Feature'
    geometry: GeoJSONGeometry
    properties: {
      id: string
      kategori_properti: string | null
      jenis_properti: string | null
      alamat: string | null
      foto_tampak_depan: string | null
      foto_spanduk: string | null
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
        kategori_properti: row.kategori_properti,
        jenis_properti: row.jenis_properti,
        alamat: row.alamat,
        foto_tampak_depan: row.foto_tampak_depan,
        foto_spanduk: row.foto_spanduk,
      },
    })),
  }
}
