# `app/api/score/route.ts` — POST /api/score

## Apa fungsinya

Menerima `tipe_3` dan `harga_target` (hasil `/api/prompt-request`), lalu mengembalikan
**Top 5 kawasan** beserta skor dan dekomposisi komponennya. Deterministik — tidak pernah
memanggil AI. Parameter yang sama selalu menghasilkan skor yang sama.

Route ini tipis sesuai `CLAUDE.md` bagian 2: validasi → tarik `scored_areas` → panggil
`lib/scoring` → potong Top 5 → format respons. Seluruh rumus ada di `lib/scoring/index.ts`.

## Cara pakai

```
POST /api/score
Content-Type: application/json

{ "tipe_3": "CEPAT SAJI", "harga_target": 15000, "harga_sumber": "pengguna" }
```

`harga_sumber` opsional — diteruskan apa adanya dari `/api/prompt-request` supaya UI dapat
menawarkan koreksi harga. Default `'pengguna'`.

Respons sukses:

```jsonc
{
  "data": {
    "areas": [
      {
        "area_id": "R-14",
        "station_id": "R-14",
        "station_name": "STASIUN TANAH ABANG",
        "skor": 84.3,
        "komponen": {
          "demand": 0.5,
          "competitive_headroom": 0.935,
          "segment_match": 1          // null berarti "tidak dinilai", BUKAN nol
        },
        "bobot": { "wD": 0.25, "wC": 0.5, "wS": 0.25 },
        "n_observations": 11,
        "n_price": 11,
        "is_rankable": true
      }
      // ... maksimal 5 kawasan
    ],
    "catatan": {
      "harga_sumber": "pengguna",
      "kelompok_dinilai": "CEPAT SAJI",
      "fallback_ke_semua": false,
      "kawasan_berisi": 10,
      "kawasan_diperingkat": 11,
      "total_kawasan": 43
    }
  }
}
```

Kode galat:

| Kondisi | Kode | Pesan |
|---|---|---|
| Body gagal validasi Zod | 400 | `Input tidak valid` |
| `tipe_3` tidak dikenali `lib/scoring` | 400 | `Kategori usaha tidak dikenali` |
| Gagal membaca daftar kategori | 503 | `Gagal mengambil daftar kategori usaha` |
| Supabase tidak merespons | 503 | `Gagal mengambil data skor` |

Tidak ada kawasan yang layak diperingkat **bukan galat** — responsnya `200` dengan
`areas: []`. Frontend menampilkan state kosong.

## Dependency/prasyarat

- [`lib/scoring/index.ts`](lib-scoring.md) — seluruh rumus.
- `lib/schemas/score.ts` — `buildScoreRequestSchema(tipe3Values)`, enum dibangun dinamis.
- `lib/tipe3` — `getTipe3Values()`, membaca view `tipe3_values` (`supabase/views.sql`).
- `lib/supabase/server.ts` — butuh `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY`.
- Tabel `scored_areas` sudah diisi `etl/pipeline_scoring.py` ([docs](etl-pipeline.md)).

## Batasan/gotcha

**1. Query SENGAJA tanpa `.eq('is_rankable', true)`.** Jangan menambahkannya kembali. Pernah
ada, dan menghasilkan angka yang salah: skala persentil C jadi dibangun dari 11 kawasan
alih-alih 43. Penjelasan lengkapnya di [`docs/lib-scoring.md`](lib-scoring.md) gotcha nomor 1.
Kolom `is_rankable` tetap ikut di `SELECT` karena `lib/scoring` membutuhkannya.

**2. Hanya Top 5 yang keluar dari server, bukan dipotong di frontend.** Pembatasan di frontend
bukan batas keamanan — apa pun yang dikirim backend terlihat di DevTools → Network, berapa pun
yang dirender. Enam kawasan berperingkat di luar Top 5 tidak pernah dikirim.

**3. Konsekuensinya, kawasan `is_rankable = false` juga tidak terkirim** — sehingga peta belum
dapat memberi label "data belum cukup" seperti diminta `context-mvp.md` §6.8. Penandanya harus
diambil dari `/api/stations` (permintaan terbuka ke Jalur 1: tambahkan `is_rankable` lewat join
`area_id = station_id`), **BUKAN** dengan melonggarkan respons ini.

**4. `catatan.fallback_ke_semua` wajib ditampilkan.** Bila `true`, kategori yang diminta
terlalu tipis dan penilaian memakai seluruh kategori kuliner. Per 6 September 2026, 7 dari 14
kelompok selalu jatuh ke sini — sering muncul, bukan kasus pinggiran.

**5. Skor akhir tidak pernah disimpan di database.** Dihitung ulang tiap request. Tidak ada
tabel atau kolom berisi skor 0–100.

**6. `harga_sumber` tidak dipakai perhitungan apa pun** — cuma diteruskan ke respons agar UI
dapat menampilkan tawaran koreksi harga.

⚠️ **Tapi kalau frontend LUPA meneruskannya, nilainya diam-diam jadi `'pengguna'`.** Efeknya:
harga yang sebenarnya ditebak AI (`'perkiraan'`) terbaca seolah disebut pengguna, tawaran
koreksi tidak pernah muncul, dan pengguna tidak tahu angka Rp25.000 itu bukan angkanya
sendiri. Server tidak bisa mendeteksi ini — dia tidak tahu apa yang terjadi di
`/api/prompt-request`. **Frontend wajib meneruskan `harga_sumber` apa adanya** dari respons
`/api/prompt-request` ke request `/api/score`.
