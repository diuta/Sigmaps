// Bentuk baris view `stasiun_kawasan` (lihat supabase/views.sql).
//
// Sebelumnya berkas ini membaca tabel `stasiun` langsung tanpa view, dan itu benar selama
// yang dibutuhkan cuma titik — koordinatnya dua kolom angka biasa, tidak ada geometry PostGIS
// dan tidak ada spatial join. Yang berubah: peta sekarang juga butuh POLIGON isokron dan
// penanda `is_rankable`, dan keduanya ada di `scored_areas`. `scored_areas.geom` adalah kolom
// geometry sungguhan, sehingga PostgREST akan mengembalikannya sebagai WKB hex kalau dibaca
// langsung — karena itu butuh `ST_AsGeoJSON` di sisi database, yaitu view.
export type StationRow = {
  station_id: string
  nama: string
  tipe_3: string | null
  kecamatan: string | null
  kabkot: string | null
  longitude: number | null
  latitude: number | null

  // Berasal dari scored_areas lewat LEFT JOIN. NULL kalau pipeline batch belum jalan —
  // kondisi normal, bukan galat. Peta tetap dapat menggambar titik stasiunnya.
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

      // `is_rankable` sengaja dibawa di sini, BUKAN di respons /api/score.
      //
      // Dia sifat kawasan, bukan hasil pencarian — Stasiun Angke kekurangan data entah
      // pengguna mencari sushi atau warteg. Jadi peta dapat meredupkan kawasan miskin data
      // sejak halaman dibuka, sebelum pengguna mengetik apa pun. /api/score juga tidak
      // mungkin jadi sumbernya: endpoint itu sengaja hanya mengirim Top 5.
      //
      // null = pipeline batch belum jalan, berbeda artinya dari false.
      is_rankable: boolean | null
      area_km2: number | null

      // Poligon isokron MAPID asli (foot, 600 detik).
      //
      // Dititipkan di properties, bukan di `geometry`, karena satu Feature GeoJSON hanya
      // boleh punya satu geometry — dan `geometry` sudah dipakai titik penanda stasiun.
      // Konsekuensinya MapLibre tidak bisa memakai ini langsung sebagai sumber;
      // IsochroneLayer merakit FeatureCollection-nya sendiri dari field ini.
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
