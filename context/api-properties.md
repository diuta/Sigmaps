# app/api/properties/route.ts

Ambil katalog Properti Go yang berada di dalam poligon isokron (10 menit) sebuah kawasan
stasiun, lewat spatial join `ST_Within`. Dipanggil saat user klik satu titik stasiun di peta
(`context/context-mvp.md` §2 Langkah 3b).

## Cara pakai

```
GET /api/properties?station_id=st_tanah_abang
```

Respons sukses (FeatureCollection, bisa kosong — kawasan tanpa properti itu normal):

```json
{
  "data": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": { "type": "Point", "coordinates": [106.8106, -6.1857] },
        "properties": {
          "id": "p_123",
          "kategori_properti": "Ruko",
          "jenis_properti": "Sewa",
          "alamat": "Jl. Contoh No. 1",
          "foto_tampak_depan": "https://...",
          "foto_spanduk": "https://..."
        }
      }
    ]
  }
}
```

Respons gagal:

```json
{ "error": "station_id wajib diisi" }         // 400
{ "error": "Gagal mengambil data properti" }  // 503
```

## Dependency/prasyarat

- [lib/supabase/server.ts](lib-supabase-server.md).
- [lib/property/index.ts](lib-properties.md) — transform baris view ke FeatureCollection (pure).
- View `properti_go_by_station` di `supabase/views.sql` — wajib dijalankan lebih dulu di
  project Supabase (spatial join `ST_Within` + konversi GeoJSON tidak bisa lewat query
  builder PostgREST biasa, jadi dibungkus jadi view lalu difilter `.eq('station_id', ...)`
  seperti tabel biasa).
- Tabel `properti_go` dan `scored_areas` sudah terisi.

## Batasan/gotcha

- **Tidak menampilkan** luas, harga, atau kontak pemilik — Properti Go tidak punya kolom itu.
  Jangan tambahkan field ini "jaga-jaga" (`context/dokumentasi-erd-mvp.md` bagian 5).
- Satu properti **bisa muncul di dua kawasan** kalau isokron dua stasiun berdekatan
  bertumpuk (misal Pesing & Grogol) — ini perilaku benar, bukan duplikat yang perlu disaring.
- `station_id` yang tidak ada di `scored_areas` akan balas FeatureCollection kosong (bukan
  galat) — view-nya cuma `JOIN`, tidak memvalidasi keberadaan stasiun.
- View menghitung join `ST_Within` untuk **seluruh** baris `properti_go` dulu, baru
  difilter `station_id` oleh PostgREST di luar query — bukan filter di dalam database
  seperti RPC dengan parameter. Di skala data MVP ini bukan masalah performa (lihat
  `supabase/views.sql`), tapi kalau `properti_go` membesar ke ratusan ribu baris,
  pertimbangkan pindah ke RPC function.
