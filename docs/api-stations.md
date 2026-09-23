# app/api/stations/route.ts

Baca seluruh kawasan stasiun (termasuk yang belum berskor) dan balas sebagai GeoJSON
FeatureCollection: titik stasiun, polygon isokron, penanda `is_rankable`, dan sensus pesaing per
kategori. Dipakai frontend saat halaman dibuka untuk menggambar titik stasiun di peta
(`context/context-mvp.md` §2 Langkah 1), dan oleh `AreaGapBlock` untuk menghitung kelompok kuliner
yang jarang di suatu kawasan.

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
          "kabkot": "Jakarta Pusat",
          "is_rankable": true,
          "area_km2": 0.97,
          "isokron": { "type": "Polygon", "coordinates": [[[106.81, -6.18]]] },
          "competitor_counts": { "CEPAT SAJI": 8, "MIE DAN BAKSO": 3 }
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

- [lib/supabase/server.ts](../context/lib-supabase-server.md).
- [lib/station/index.ts](../context/lib-stations.md) — transform baris tabel mentah ke FeatureCollection (pure).
- Tabel `stasiun` sudah diisi ETL (lihat `context/dokumentasi-erd-mvp.md` bagian 1) dan
  `service_role` sudah punya GRANT `SELECT` (lihat bagian GRANT di `supabase/views.sql`).
- View `stasiun_kawasan` dan tabel `scored_areas` sudah ada, dan `etl/pipeline_scoring.py` sudah
  jalan minimal sekali — sebelum itu `isokron`, `area_km2`, `is_rankable`, dan
  `competitor_counts` semuanya `null`, yang merupakan kondisi normal, bukan galat.

## Batasan/gotcha

- **Dua query, digabung di JavaScript.** Yang pertama ke view `stasiun_kawasan` (titik stasiun +
  `isokron` + `area_km2` + `is_rankable`) — butuh view karena `isokron` berasal dari
  `scored_areas.geom` dan PostgREST membalas kolom geometry sebagai WKB hex. Yang kedua langsung
  ke tabel `scored_areas` untuk `competitor_counts`, kolom yang sengaja tidak ikut di view itu,
  digabung per `station_id`. Keduanya dijalankan paralel (`Promise.all`).
  Catatan: dokumen ini sebelumnya menyatakan route mengambil langsung dari tabel `stasiun` tanpa
  view — itu sudah tidak benar sejak `isokron` masuk respons.
- **Kegagalan query kedua tidak fatal.** `competitor_counts` hanya bahan `AreaGapBlock`; kalau
  query itu gagal, errornya dicatat ke `console.error`, `competitor_counts` bernilai `null`, blok
  tersebut tidak dirender, dan peta beserta isokron tetap jalan. Hanya kegagalan query stasiun
  yang membalas `503`.
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
