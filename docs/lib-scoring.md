# `lib/scoring.ts` — mesin skor

## Apa fungsinya

Menghitung skor akhir 0–100 tiap kawasan dari baris `scored_areas`, lalu mengurutkannya.
Fungsi murni: tidak menyentuh database, tidak tahu apa pun soal HTTP. Dipanggil dari
`app/api/score/route.ts`.

Rumusnya `skor = 100 × (0,25·D + 0,50·C + 0,25·S)`. **Skor akhir tidak pernah disimpan** —
selalu dihitung ulang tiap request, karena C bergantung pada `tipe_3` dan S bergantung pada
`harga_target` yang baru diketahui saat pengguna mengetik.

Pemilik: **Jalur 2**. Meski `/api/score` milik Jalur 1, seluruh konstanta rumus sengaja
dipegang satu orang supaya Python (batch) dan TypeScript (runtime) tidak menyimpang.

## Cara pakai

```ts
import { hitungSkor, type BarisKawasan } from '@/lib/scoring'

// WAJIB tarik SELURUH baris — jangan pakai `where is_rankable = true`.
// Alasannya di bagian "Batasan" di bawah.
const { data } = await supabase
  .from('scored_areas')
  .select('area_id, station_id, station_name, area_km2, demand, price_median, ' +
          'competitor_counts, total_restaurants, n_observations, n_price, is_rankable')

const hasil = hitungSkor(data as BarisKawasan[], 'CEPAT SAJI', 15000)
```

Keluarannya:

```jsonc
{
  "areas": [
    {
      "area_id": "R-14",
      "station_id": "R-14",
      "station_name": "STASIUN TANAH ABANG",
      "skor": 84.3,                       // null bila komponennya belum lengkap
      "komponen": {
        "demand": 0.5,
        "competitive_headroom": 0.935,
        "segment_match": 1                // null berarti "tidak dinilai", BUKAN nol
      },
      "bobot": { "wD": 0.25, "wC": 0.5, "wS": 0.25 },
      "n_observations": 11,
      "n_price": 11,
      "is_rankable": true
    }
    // ... 42 kawasan lain, yang is_rankable=false selalu di urutan bawah
  ],
  "catatan": {
    "kelompok_dinilai": "CEPAT SAJI",
    "fallback_ke_semua": false,
    "kawasan_berisi": 10,
    "kawasan_diperingkat": 11,
    "total_kawasan": 43
  }
}
```

Top 5 diambil dengan `hasil.areas.filter(a => a.is_rankable).slice(0, 5)`.

Fungsi lain yang diekspor:

| | Kegunaan |
|---|---|
| `kelompokUntuk(tipe_3)` | Nama kelompok penilaian untuk sebuah kategori, `null` bila tidak dikenali |
| `KELOMPOK` | Peta 14 kelompok → kategori sensus anggotanya |
| `BOBOT` | `{ wD: 0.25, wC: 0.5, wS: 0.25 }` |
| `SEMUA` | Penanda `'SEMUA'` |

## Dependency / prasyarat

- Tabel `scored_areas` sudah diisi `etl/pipeline_scoring.py`. Tanpa itu `demand` bernilai
  `null` dan seluruh `skor` ikut `null`.
- Tidak butuh env var apa pun. Tidak mengimpor Supabase maupun `Request`/`Response`.
- Aman dipanggil dari Server Component maupun Route Handler. **Jangan** dipanggil dari Client
  Component — bukan karena tidak jalan, tetapi karena berarti 43 baris `scored_areas` dikirim
  ke browser tanpa alasan.

## Batasan / gotcha

**1. Jangan menyaring `is_rankable` di query.** Ini kesalahan paling mudah dan paling tidak
kelihatan. Dua alasannya:

- Skala normalisasi C dibangun dari sebaran **seluruh** kawasan. `is_rankable` mengukur
  ketebalan pengamatan Menu Go — itu urusan D dan S. Data pesaing datang dari sensus yang
  lengkap tanpa peduli ada pengamatan atau tidak. Menyaringnya menggeser persentil 5/95 dan
  mengubah peringkat.
- Kawasan `is_rankable = false` tetap harus digambar di peta dengan label "data belum cukup".

**2. `segment_match: null` berarti "tidak dinilai", bukan "buruk".** Terjadi saat
`price_median` kosong. Jangan menampilkannya sebagai 0 — pengguna akan membacanya sebagai
kawasan yang sangat tidak cocok, padahal artinya tidak ada datanya. `skor` juga `null` pada
kasus itu.

**3. `catatan.fallback_ke_semua` wajib ditampilkan ke pengguna.** Bila `true`, kategori yang
diminta terlalu tipis dan penilaian kompetisi memakai seluruh kategori kuliner. Diamkan, dan
pengguna mengira ramennya dinilai terhadap sesama ramen. Per 6 September 2026 **7 dari 14
kelompok selalu jatuh ke sini**, termasuk `KAFE DAN RESTO` dan `ASIA TIMUR` — jadi ini sering
muncul, bukan kasus pinggiran.

**4. `SEMUA` harus dikecualikan dari validasi `tipe_3`.** Nilai itu tidak ada di sensus dan
tidak ada di `competitor_counts`. Kalau validasi menolak apa pun yang bukan salah satu dari 24
kategori, jalur fallback ditolak oleh validasinya sendiri.

**5. `tipe_3` peka huruf besar-kecil.** Harus persis seperti di sensus (`'CEPAT SAJI'`, bukan
`'Cepat Saji'`). Kategori tak dikenal melempar `Error` — tangkap dan balas `400`, jangan
biarkan jadi `500`.

**6. Mengubah `KELOMPOK` tidak butuh migrasi.** `competitor_counts` menyimpan 24 kunci mentah;
pengelompokan cuma penjumlahan saat request. Edit blok konstantanya, muat ulang, selesai.

**7. Empat penggabungan kategori adalah penilaian tim, bukan fakta** — `RESTORAN CINA` ke
`ASIA TIMUR`, `RESTORAN MEKSIKO` ke `MASAKAN BARAT`, `JAJANAN` ke `KAFE DAN RESTO`, dan
`RESTORAN AYAM` ke `CEPAT SAJI`. Ada catatannya di kode. Boleh dibantah.

**8. Puncak kurva punuk `0,4` masih asumsi kerja** dan sendirian menentukan siapa yang menang
(`context-mvp.md` 6.10). Jangan diubah tanpa keputusan tim tertulis, dan jangan mengubah
penyebut `0,6` terpisah — dia turunan `maks(puncak, 1 − puncak)`.
