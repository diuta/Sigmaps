export type PropertyRow = {
  id: string
  kategori_properti: string | null
  jenis_properti: string | null
  alamat: string | null
  foto_tampak_depan: string | null
  foto_spanduk: string | null
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
      kategori_properti: string | null
      jenis_properti: string | null
      alamat: string | null
      foto_tampak_depan: string | null
      foto_spanduk: string | null
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
        kategori_properti: row.kategori_properti,
        jenis_properti: row.jenis_properti,
        alamat: row.alamat,
        foto_tampak_depan: row.foto_tampak_depan,
        foto_spanduk: row.foto_spanduk,
        jarak_jalan_m: row.jarak_jalan_m ?? null,
        waktu_jalan_s: row.waktu_jalan_s ?? null,
        rute: row.rute ?? null,
      },
    })),
  }
}
