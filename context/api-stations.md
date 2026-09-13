> ⚠️ **Duplikat kedaluwarsa.** Versi yang berlaku ada di `docs/api-stations.md` — berkas ini masih
> menyebut path sebelum refactor (`lib/scoring.ts`, `lib/tipe3.ts`, `lib/stations.ts`) dan
> belum diperbarui untuk perubahan skoring di merge `bb4c280`. Belum dihapus karena
> pembagian `docs/` vs `context/` masih menunggu keputusan tim — lihat `docs/README.md`.

# app/api/stations/route.ts

Baca seluruh baris tabel `stasiun` (termasuk yang belum berskor) dan balas sebagai GeoJSON
FeatureCollection. Dipakai frontend saat halaman dibuka untuk menggambar titik stasiun di
peta (`context/context-mvp.md` §2 Langkah 1).

## Cara pakai

```
GET /api/stations
```

Respons sukses:

```json
{
  "data": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": { "type": "Point", "coordinates": [106.8106, -6.1857] },
        "properties": {
          "station_id": "st_tanah_abang",
          "nama": "Tanah Abang",
          "tipe_3": "COMMUTER",
          "kecamatan": "Tanah Abang",
          "kabkot": "Jakarta Pusat"
        }
      }
    ]
  }
}
```

Respons gagal (Supabase tidak merespons → `503`):

```json
{ "error": "Gagal mengambil data stasiun" }
```

## Dependency/prasyarat

- [lib/supabase/server.ts](lib-supabase-server.md).
- [lib/stations.ts](lib-stations.md) — transform baris tabel mentah ke FeatureCollection (pure).
- Tabel `stasiun` sudah diisi ETL (lihat `context/dokumentasi-erd-mvp.md` bagian 1) dan
  `service_role` sudah punya GRANT `SELECT` (lihat bagian GRANT di `supabase/views.sql`).

## Batasan/gotcha

- **Query langsung ke tabel `stasiun`, BUKAN lewat SQL view** — beda dari
  [api-properties.md](api-properties.md) dan [api-community-sentiment.md](api-community-sentiment.md)
  yang wajib lewat view. `stasiun` menyimpan koordinat sebagai kolom `longitude`/`latitude`
  biasa (bukan geometry PostGIS) dan tidak butuh spatial join apa pun untuk endpoint ini, jadi
  penyusunan GeoJSON-nya cukup di JavaScript (`lib/stations.ts`) — lihat catatan lengkap di
  `docs/lib-stations.md` kenapa kasus ini beda dari dua endpoint lain itu.
- Field `tipe_3` di response ini **memakai nama kolom mentah apa adanya**, sengaja tidak
  dialiaskan — walau namanya membingungkan (di tabel lain, `katalog_restoran`, `tipe_3`
  berarti kategori restoran; di sini cuma tipe layanan transportasi, `COMMUTER`/`KERETA API`,
  lihat `context/dokumentasi-erd-mvp.md` §1). Keputusan 6 September 2026: tidak
  mengalias-ulang nama field ini di kode, supaya tidak ada terjemahan tambahan yang perlu
  dijaga sinkron kalau skema berubah lagi.
- Route ini **tidak** memfilter berdasarkan `is_rankable` — mengembalikan semua stasiun,
  termasuk yang isokronnya belum diproses/belum masuk `scored_areas`. Frontend yang
  menentukan label "data belum cukup" dengan membandingkan terhadap hasil `/api/score`.
- Tidak menerima parameter apa pun.
- Katalog `stasiun` mentah bisa punya baris ganda (koordinat identik, tipe layanan beda) —
  dedup jadi tanggung jawab pipeline batch sebelum data masuk tabel, bukan endpoint ini
  (`context/dokumentasi-erd-mvp.md` bagian "Peringatan deduplikasi").
