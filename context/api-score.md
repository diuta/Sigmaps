> ⚠️ **Duplikat kedaluwarsa.** Versi yang berlaku ada di `docs/api-score.md` — berkas ini masih
> menyebut path sebelum refactor (`lib/scoring.ts`, `lib/tipe3.ts`, `lib/stations.ts`) dan
> belum diperbarui untuk perubahan skoring di merge `bb4c280`. Belum dihapus karena
> pembagian `docs/` vs `context/` masih menunggu keputusan tim — lihat `docs/README.md`.

# app/api/score/route.ts

Hitung skor kesesuaian tiap kawasan (WLC deterministik, `lib/scoring.ts`) berdasarkan jenis
usaha dan target harga, urutkan tertinggi ke terendah. Dipanggil setelah
`POST /api/prompt-request` menghasilkan `tipe_3` + `harga_target`
(`context/context-mvp.md` §2 Langkah 2).

## Cara pakai

```
POST /api/score
Content-Type: application/json

{ "tipe_3": "KAFE DAN RESTO", "harga_target": 20000 }
```

Respons sukses:

```json
{
  "data": {
    "areas": [
      {
        "area_id": "st_tanah_abang",
        "station_id": "st_tanah_abang",
        "station_name": "Tanah Abang",
        "skor": 78.3,
        "komponen": { "demand": 0.528, "competitive_headroom": 0.927, "segment_match": 0.75 },
        "bobot": { "wD": 0.25, "wC": 0.5, "wS": 0.25 },
        "n_observations": 28,
        "n_price": 28,
        "is_rankable": true
      }
    ],
    "catatan": { "harga_sumber": "pengguna" }
  }
}
```

Tidak ada kawasan `is_rankable` → **bukan galat**, tetap `200` dengan `areas: []`.

Respons gagal:

```json
{ "error": "Gagal mengambil daftar kategori usaha" } // 503, Supabase/view tipe3_values tidak merespons
{ "error": "Input tidak valid" }        // 400, tipe_3 tak dikenali / harga_target di luar rentang
{ "error": "Gagal mengambil data skor" } // 503, Supabase tidak merespons
```

## Dependency/prasyarat

- [lib/schemas/score.ts](../lib/schemas/score.ts) — `buildScoreRequestSchema(tipe3Values)`.
- [lib/tipe3.ts](lib-tipe3.md) — sumber `tipe_3` yang sah, dibaca dari Supabase.
- [lib/scoring.ts](lib-scoring.md) — mesin WLC.
- [lib/supabase/server.ts](lib-supabase-server.md).
- Tabel `scored_areas` sudah diisi pipeline batch Python (`context/dokumentasi-erd-mvp.md`
  bagian 2) — **belum ada** per saat dokumen ini ditulis, endpoint balas `503` sampai tabel
  tersedia.

## Batasan/gotcha

- **Tidak menerima `weights` dari klien.** Bobot tunggal `0,25/0,50/0,25` ditetapkan di
  server (`lib/scoring.ts`) — layar edit bobot manual dihapus permanen untuk MVP.
- `tipe_3` **harus persis sama** (huruf besar semua) dengan nilai di kolom `competitor_counts`
  tabel `scored_areas`/`katalog_restoran` — kalau ejaannya beda, pencarian selalu bernilai 0
  dan `competitive_headroom` seragam 0,33 di semua kawasan (gagal diam-diam, bukan galat).
  Enum divalidasi dinamis lewat [lib/tipe3.ts](lib-tipe3.md), jadi kelas kesalahan ini
  seharusnya sudah tertutup selama `tipe3_values` sinkron dengan `katalog_restoran`.
- **Query menarik SELURUH baris `is_rankable = true` dalam satu `SELECT`**, tanpa filter
  kategori — normalisasi min-max pada `competitive_headroom` butuh nilai kepadatan terkecil &
  terbesar di antara semua kawasan, jadi skor satu kawasan bergantung pada kawasan lain.
- `harga_sumber` di request bersifat **opsional**, bukan bagian kontrak literal
  `context-mvp.md` §6.8 (yang cuma menyebut `{ tipe_3, harga_target }`) — ditambahkan supaya
  field `catatan.harga_sumber` di respons (yang memang wajib ada di kontrak) bisa diisi dari
  hasil `/api/prompt-request` tanpa server menebak. Default `"pengguna"` kalau tidak dikirim.
  Ini keputusan implementasi, bukan keputusan tim tertulis — tandai kalau perlu didiskusikan.
- Route ini **tidak pernah menulis** ke `scored_areas` — hanya `SELECT`.
