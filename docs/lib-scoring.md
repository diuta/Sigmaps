# `lib/scoring/index.ts` — mesin skor

## Apa fungsinya

Menghitung skor akhir 0–100 tiap kawasan dari baris `scored_areas`, lalu mengurutkannya.
Fungsi murni: tidak menyentuh database, tidak tahu apa pun soal HTTP. Dipanggil dari
`app/api/score/route.ts`.

Rumusnya `skor = 100 × (0,25·D + 0,50·C + 0,25·S)`. **Skor akhir tidak pernah disimpan** —
selalu dihitung ulang tiap request, karena C bergantung pada `tipe_3` dan S bergantung pada
`harga_target` yang baru diketahui saat pengguna mengetik.

Pemilik: **Jalur 2**. Meski `/api/score` milik Jalur 1, seluruh konstanta rumus sengaja
dipegang satu orang supaya Python (batch) dan TypeScript (runtime) tidak menyimpang — kalau
menyimpang, hasilnya angka yang salah tanpa satu pun galat.

> Berkas ini dulu ada di `lib/scoring.ts`, berdampingan dengan `lib/scoring/index.ts` milik
> versi lain. Keduanya bersaing di jalur impor `@/lib/scoring` yang sama. Sudah digabung ke
> satu tempat: **`lib/scoring/index.ts`**. `lib/scoring.ts` dihapus.

## Cara pakai

```ts
import { scoreAreas, type ScoredAreaRow } from '@/lib/scoring'

// WAJIB tarik SELURUH baris — jangan pakai .eq('is_rankable', true).
// Alasannya di bagian "Batasan" nomor 1.
const { data } = await supabaseServer
  .from('scored_areas')
  .select('area_id, station_id, station_name, area_km2, demand, price_median, ' +
          'competitor_counts, total_restaurants, n_observations, n_price, is_rankable')

const hasil = scoreAreas(data as ScoredAreaRow[], 'CEPAT SAJI', 15000)
const top5 = hasil.areas.filter((a) => a.is_rankable).slice(0, 5)
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

Fungsi ini sengaja mengembalikan **seluruh 43 kawasan** agar dapat dites dan diaudit utuh.
Pemotongan ke Top 5 dilakukan di `route.ts`, bukan di sini.

Yang juga diekspor:

| | Kegunaan |
|---|---|
| `groupFor(tipe3)` | Nama kelompok penilaian untuk sebuah kategori, `null` bila tidak dikenali |
| `GROUPS` | Peta 14 kelompok → kategori sensus anggotanya |
| `SEMUA` | Penanda `'SEMUA'` |
| `ScoringResult`, `ScoredArea`, `ScoredAreaRow` | Tipe |

## Dependency / prasyarat

- Tabel `scored_areas` sudah diisi `etl/pipeline_scoring.py`. Tanpa itu `demand` bernilai
  `null` dan seluruh `skor` ikut `null`.
- Tidak butuh env var apa pun. Tidak mengimpor Supabase maupun `Request`/`Response`, jadi bisa
  dites tanpa server maupun database.
- Aman dipanggil dari Server Component maupun Route Handler. **Jangan** dipanggil dari Client
  Component — bukan karena tidak jalan, tetapi karena berarti 43 baris `scored_areas` dikirim
  ke browser tanpa alasan.

## Batasan / gotcha

**1. Jangan menyaring `is_rankable` di query.** Kesalahan paling mudah dan paling tidak
kelihatan — pernah benar-benar ada di `route.ts` dan sudah dicabut. Dua alasannya:

- Skala normalisasi C dibangun dari sebaran **seluruh** kawasan. `is_rankable` mengukur
  ketebalan pengamatan Menu Go — itu urusan D dan S. Data pesaing datang dari sensus yang
  lengkap tanpa peduli ada pengamatan atau tidak. Menyaringnya membuang data pesaing yang
  valid, menggeser persentil 5/95, dan mengubah peringkat.
- Kawasan `is_rankable = false` tetap dibutuhkan pemanggil untuk digambar di peta dengan label
  "data belum cukup".

**2. `segment_match: null` berarti "tidak dinilai", bukan "buruk".** Terjadi saat
`price_median` kosong. Jangan menampilkannya sebagai 0 — pengguna akan membacanya sebagai
kawasan yang sangat tidak cocok, padahal artinya tidak ada datanya. `skor` dan `demand` juga
bisa `null` pada kasus itu.

**3. `catatan.fallback_ke_semua` wajib ditampilkan ke pengguna.** Bila `true`, kategori yang
diminta terlalu tipis dan penilaian kompetisi memakai seluruh kategori kuliner. Diamkan, dan
pengguna mengira ramennya dinilai terhadap sesama ramen. Per 6 September 2026 **7 dari 14
kelompok selalu jatuh ke sini**, termasuk `KAFE DAN RESTO` dan `ASIA TIMUR` — jadi ini sering
muncul, bukan kasus pinggiran.

**4. `SEMUA` harus dikecualikan dari validasi `tipe_3`.** Nilai itu tidak ada di sensus dan
tidak ada di `competitor_counts`. Kalau validasi menolak apa pun yang bukan salah satu dari 24
kategori, jalur fallback ditolak oleh validasinya sendiri. `buildScoreRequestSchema` di
`lib/schemas/score.ts` sudah menanganinya.

**5. `tipe_3` peka huruf besar-kecil.** Harus persis seperti di sensus (`'CEPAT SAJI'`, bukan
`'Cepat Saji'`). Kategori tak dikenal melempar `Error` — tangkap dan balas `400`, jangan
biarkan jadi `500`. `route.ts` sudah melakukannya.

**6. Cakupan kategori diukur pada kawasan `is_rankable`, bukan seluruh 43.** Perhatikan
bedanya dengan nomor 1: **skala** dibangun dari semua kawasan, **cakupan** hanya dari yang
diperingkat. Bedanya nyata — `RESTORAN MELAYU` ada di 26 dari 43 kawasan, terdengar cukup,
tapi cuma di 4 dari 11 kawasan yang benar-benar diperingkat. Mengukur pada populasi yang salah
membuat fallback tidak menyala saat seharusnya menyala.

**7. Mengubah `GROUPS` tidak butuh migrasi.** `competitor_counts` menyimpan 24 kunci mentah;
pengelompokan cuma penjumlahan saat request. Edit blok konstantanya, muat ulang, selesai.

**8. Empat penggabungan kategori adalah penilaian tim, bukan fakta** — `RESTORAN CINA` ke
`ASIA TIMUR`, `RESTORAN MEKSIKO` ke `MASAKAN BARAT`, `JAJANAN` ke `KAFE DAN RESTO`, dan
`RESTORAN AYAM` ke `CEPAT SAJI`. Ada catatannya di kode. Boleh dibantah.

**9. Puncak kurva punuk `0,4` masih asumsi kerja** dan sendirian menentukan siapa yang menang
(`context-mvp.md` §6.10). Jangan diubah tanpa keputusan tim tertulis, dan jangan mengubah
penyebut `0,6` terpisah — dia turunan `maks(puncak, 1 − puncak)`.

**10. Pembulatan 3 desimal pada `komponen` hanya untuk tampilan.** `skor` dihitung dari nilai
penuh, jadi pembulatan tidak pernah menggeser peringkat.
