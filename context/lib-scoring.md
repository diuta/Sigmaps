> ⚠️ **Duplikat kedaluwarsa.** Versi yang berlaku ada di `docs/lib-scoring.md` — berkas ini masih
> menyebut path sebelum refactor (`lib/scoring.ts`, `lib/tipe3.ts`, `lib/stations.ts`) dan
> belum diperbarui untuk perubahan skoring di merge `bb4c280`. Belum dihapus karena
> pembagian `docs/` vs `context/` masih menunggu keputusan tim — lihat `docs/README.md`.

# lib/scoring.ts

Mesin skoring SIGMAPS MVP — fungsi murni, tanpa HTTP/Supabase, 100% deterministik (tidak
pernah memanggil AI). Menghitung `skor = 100 × (0,25·D + 0,50·C + 0,25·S)` per kawasan dari
baris `scored_areas` yang sudah difilter `is_rankable = true`.

## Cara pakai

```ts
import { scoreAreas, type ScoredAreaRow } from '@/lib/scoring'

const rows: ScoredAreaRow[] = [
  {
    area_id: 'st_tanah_abang',
    station_id: 'st_tanah_abang',
    station_name: 'Tanah Abang',
    area_km2: 0.97,
    demand: 0.528,
    price_median: 15000,
    competitor_counts: { 'KAFE DAN RESTO': 3, 'CEPAT SAJI': 8 },
    total_restaurants: 41,
    n_observations: 28,
    n_price: 28,
  },
  // ...kawasan lain, wajib SEMUA baris is_rankable dikirim sekaligus
]

const areas = scoreAreas(rows, 'KAFE DAN RESTO', 20000)
// areas[0] = { area_id, station_id, station_name, skor: 78.3,
//              komponen: { demand, competitive_headroom, segment_match },
//              bobot: { wD: 0.25, wC: 0.5, wS: 0.25 }, n_observations, n_price, is_rankable: true }
// sudah terurut skor tertinggi -> terendah
```

## Dependency/prasyarat

Tidak ada — murni fungsi TypeScript, bisa dites tanpa server/database.

## Batasan/gotcha

- **Wajib dipanggil dengan SELURUH baris `is_rankable = true` sekaligus**, bukan satu per
  satu — normalisasi min-max pada C butuh nilai kepadatan terkecil & terbesar di antara semua
  kawasan (lihat `context/context-mvp.md` §6.8). Memanggilnya per-baris akan selalu
  menghasilkan `C = 1` (karena `lo === hi`).
- Baris dengan `demand`/`price_median` bernilai `null` dibuang otomatis (dicatat lewat
  `console.error`) — ini seharusnya tidak pernah terjadi kalau batch sudah menjaga aturan
  `is_rankable = n_observations >= 10 AND n_price >= 5` (§6.9), jadi kalau muncul di log,
  periksa pipeline batch, bukan kode ini.
- `tipe_3 = 'SEMUA'` memakai `total_restaurants`, bukan `competitor_counts`.
- Bobot tunggal `{ wD: 0,25, wC: 0,50, wS: 0,25 }` ditetapkan di sini, **tidak** menerima
  bobot dari caller — sesuai keputusan MVP bahwa layar edit bobot dihapus permanen (§6.5).
