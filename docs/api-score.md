# app/api/score/route.ts

Hitung skor kesesuaian tiap kawasan (WLC deterministik, `lib/scoring/index.ts`) berdasarkan jenis
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

`areas` **berisi maksimal 5 kawasan** — pemotongan Top 5 dilakukan di server
(`route.ts`), bukan di frontend. Semuanya `is_rankable: true` **dan** `skor`/`komponen`-nya
tidak pernah `null` — dijamin `isRankedArea()` (`lib/schemas/score.ts`), lihat gotcha di bawah.

Respons gagal:

```json
{ "error": "Gagal mengambil daftar kategori usaha" } // 503, Supabase/view tipe3_values tidak merespons
{ "error": "Input tidak valid" }        // 400, tipe_3 tak dikenali / harga_target di luar rentang
{ "error": "Gagal mengambil data skor" } // 503, Supabase tidak merespons
```

## Dependency/prasyarat

- [lib/schemas/score.ts](../lib/schemas/score.ts) — `buildScoreRequestSchema(tipe3Values)`, tipe
  respons `ScoreResponse`/`RankedArea`, dan penjaga `isRankedArea()`. `types/scoring/index.ts`
  (dipakai klien) hanya mengalias tipe dari sini — jangan definisikan ulang bentuknya di sana.
- [lib/tipe3/index.ts](../context/lib-tipe3.md) — sumber `tipe_3` yang sah, dibaca dari Supabase.
- [lib/scoring/index.ts](lib-scoring.md) — mesin WLC.
- [lib/supabase/server.ts](../context/lib-supabase-server.md).
- Tabel `scored_areas` sudah diisi pipeline batch Python (`context/dokumentasi-erd-mvp.md`
  bagian 2). Kalau tabelnya belum ada/kosong, endpoint balas `503` (tabel tidak ada) atau `200`
  dengan `areas: []` (tabel ada tapi tidak ada baris `is_rankable = true`) — dua kondisi berbeda,
  jangan disamakan saat men-debug sidebar yang tampak kosong.

## Batasan/gotcha

- **Tidak menerima `weights` dari klien.** Bobot tunggal `0,25/0,50/0,25` ditetapkan di
  server (`lib/scoring/index.ts`) — layar edit bobot manual dihapus permanen untuk MVP.
- `tipe_3` **harus persis sama** (huruf besar semua) dengan nilai di kolom `competitor_counts`
  tabel `scored_areas`/`katalog_restoran` — kalau ejaannya beda, pencarian selalu bernilai 0
  dan `competitive_headroom` seragam 0,33 di semua kawasan (gagal diam-diam, bukan galat).
  Enum divalidasi dinamis lewat [lib/tipe3/index.ts](../context/lib-tipe3.md), jadi kelas kesalahan ini
  seharusnya sudah tertutup selama `tipe3_values` sinkron dengan `katalog_restoran`.
- **Query menarik SELURUH baris `scored_areas` dalam satu `SELECT`, SENGAJA tanpa
  `.eq('is_rankable', true)`** dan tanpa filter kategori — normalisasi min-max pada
  `competitive_headroom` butuh nilai kepadatan terkecil & terbesar di antara semua kawasan,
  termasuk yang tidak diperingkat; menyaringnya di query menggeser `lo`/`hi` dan mengubah
  peringkat. Penyaringan + pemotongan Top 5 terjadi **setelah** skoring, di JavaScript
  (`hasil.areas.filter(isRankedArea).slice(0, 5)`). `isRankedArea` menolak baris `is_rankable`
  yang `skor`-nya `null` (demand/price_median kosong = bug pipeline, sudah dilaporkan
  `console.error` oleh `scoreAreas`) — baris seperti itu tidak boleh diperingkat, dan kalau
  lolos ke klien `area.skor.toLocaleString()` di sidebar melempar galat.
- **Response hanya berisi Top 5.** Jangan menyimpulkan apa pun dari ketiadaan sebuah kawasan
  di `areas` — kawasan peringkat 6 ke bawah tetap dinilai, cuma tidak dikirim. Penanda
  "data belum cukup" untuk peta dan sidebar dibaca dari flag `is_rankable` milik
  [`/api/stations`](api-stations.md), bukan dari selisih terhadap endpoint ini.
- `harga_sumber` di request bersifat **opsional**, bukan bagian kontrak literal
  `context-mvp.md` §6.8 (yang cuma menyebut `{ tipe_3, harga_target }`) — ditambahkan supaya
  field `catatan.harga_sumber` di respons (yang memang wajib ada di kontrak) bisa diisi dari
  hasil `/api/prompt-request` tanpa server menebak. Default `"pengguna"` kalau tidak dikirim.
  Ini keputusan implementasi, bukan keputusan tim tertulis — tandai kalau perlu didiskusikan.
- Route ini **tidak pernah menulis** ke `scored_areas` — hanya `SELECT`.
