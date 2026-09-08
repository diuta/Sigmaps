# lib/station/index.ts

Fungsi murni: ubah baris **mentah tabel `stasiun`** (bukan hasil view) jadi GeoJSON
FeatureCollection — cuma menyusun `longitude`/`latitude` jadi geometry `Point`. Nama kolom
`tipe_3` **dipertahankan apa adanya** di output, tidak dialiaskan (keputusan 6 September
2026 — lihat "Batasan/gotcha"). Tidak menyentuh Supabase/HTTP sama sekali — query dilakukan
di [app/api/stations/route.ts](api-stations.md).

## Kenapa ini TIDAK pakai SQL view, beda dari `lib/property/index.ts`

`properti_go_by_station` dan `community_activity_by_station` (dipakai `lib/property/index.ts` dan
`app/api/community-sentiment/route.ts`) wajib lewat view karena dua alasan yang genuinely
tidak bisa dilakukan tanpa SQL:

1. Butuh **spatial join** (`ST_Within` antar dua tabel) — PostgREST tidak expose operasi ini
   lewat query builder biasa.
2. Kolomnya geometry PostGIS asli (binary/WKB) — butuh `ST_AsGeoJSON()` di database untuk
   jadi GeoJSON; tidak ada cara mem-parsing WKB di JS tanpa library tambahan.

Tabel `stasiun` **tidak butuh keduanya**: tidak ada join (satu baris `stasiun` = satu baris
output, tidak bergantung tabel lain), dan koordinatnya sudah berupa dua kolom angka biasa
(`longitude`, `latitude`) — bukan kolom geometry sama sekali. Menyusun `{ type: 'Point',
coordinates: [lng, lat] }` dari dua angka itu tidak butuh PostGIS, jadi dilakukan di sini
(TypeScript), bukan lewat view.

## Cara pakai

```ts
import { toStationsFeatureCollection, type StationRow } from '@/lib/station'

const rows: StationRow[] = [
  {
    station_id: 'st_grogol', nama: 'Grogol', tipe_3: 'COMMUTER',
    kecamatan: 'Grogol Petamburan', kabkot: 'Jakarta Barat',
    longitude: 106.79, latitude: -6.16,
  },
]

const fc = toStationsFeatureCollection(rows)
// { type: 'FeatureCollection', features: [{ type: 'Feature',
//   geometry: { type: 'Point', coordinates: [106.79, -6.16] },
//   properties: { station_id: 'st_grogol', nama: 'Grogol', tipe_3: 'COMMUTER', ... } }] }
```

## Dependency/prasyarat

Tidak ada — hanya transformasi data, bisa dites tanpa server/database.

## Batasan/gotcha

- **`tipe_3` sengaja TIDAK dialiaskan jadi `tipe`** di `properties` output, walau nama ini
  membingungkan (di `katalog_restoran`, `tipe_3` berarti kategori restoran; di sini cuma
  tipe layanan transportasi). Draf sebelumnya sempat mengalias-ulang ke `tipe` supaya cocok
  dokumen lama, tapi itu dicabut 6 September 2026 — bukan perbaikan yang perlu, cuma
  menambah satu terjemahan nama lagi yang harus dijaga sinkron tanpa manfaat nyata. Kalau
  field ini akhirnya bikin bingung di frontend, benahi di level tampilan (label UI), bukan
  di sini.
- Kalau `longitude`/`latitude` `null` (data belum lengkap), `geometry` di feature-nya jadi
  `null` — bukan dibuang dari array — supaya frontend tetap bisa menampilkan baris itu di
  daftar tanpa titik di peta, bukan hilang diam-diam.
