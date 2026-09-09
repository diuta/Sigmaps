# lib/scoring/explanations.ts

Mengubah nilai komponen skor (0–1) jadi satu kalimat bahasa Indonesia untuk ditampilkan di
bawah tiap bar D/C/S di sidebar. Kalimatnya **dibangkitkan dari ambang batas di dalam kode**,
bukan dari LLM: komponen skor adalah keluaran deterministik (`context-mvp.md` §6), jadi
penjelasannya harus bisa direproduksi persis — dua orang dengan angka sama wajib membaca
kalimat yang sama.

## Cara pakai

```ts
import {
  COMPONENT_LABELS, explainComponent, explainNeutralPull, observedRange,
} from '@/lib/scoring/explanations'

COMPONENT_LABELS.competitive_headroom      // 'Ruang kompetisi'
explainComponent('competitive_headroom', 0.93)
// 'Kepadatan pesaing mendekati titik paling ideal: ...'

explainNeutralPull(28)   // null  → tidak perlu klausa tambahan
explainNeutralPull(5)    // 'Angka ini ditarik ke nilai tengah karena baru ada 5 pengamatan, ...'

observedRange([0.46, 0.53, 0.47])   // { min: 0.46, max: 0.53 }
observedRange([])                    // null
```

Tiga pita per komponen, batasnya sama untuk ketiganya: `< 0,35` · `< 0,65` · sisanya.

`explainNeutralPull(n)` mengembalikan klausa hanya bila `n <= 8` (K pada rumus D,
`context-mvp.md` §6.2) — di bawah itu, sebagian nilai yang tampil memang bukan berasal dari
kawasannya sendiri, dan itu wajib dikatakan.

`observedRange(values)` dipakai `ScoreComponentBar` untuk menggambar dua garis penanda rentang
nilai D di seluruh kawasan; rentang D memang sempit (§6.5), jadi penanda itu sekaligus
menjelaskan kenapa komponen ini hampir tidak membedakan kawasan.

## Dependency/prasyarat

Tidak ada — fungsi murni, hanya butuh tipe `ScoreComponentKey` dari `types/scoring`. Bisa
dites tanpa server, database, maupun React.

## Test

```bash
node lib/scoring/explanations.test.ts     # cetak "score-explanations: ok" bila lolos
```

Node 24 menjalankan berkas `.ts` langsung (peringatan `MODULE_TYPELESS_PACKAGE_JSON` normal,
bukan kegagalan). Test-nya `node:assert` polos, tanpa framework. **Belum ada script `test` di
`package.json`**, jadi perintah di atas harus dijalankan manual — kalau nanti ada test kedua,
tambahkan script-nya sekalian.

## Batasan/gotcha

- **Jangan pernah mengambil kalimat ini dari LLM.** Warna bar-nya pun sengaja `--color-opportunity`
  (deterministik), bukan `--color-accent` (AI) — lihat [docs/component-sidebar.md](component-sidebar.md).
- **C rendah itu ambigu, dan kalimatnya wajib mengakui itu.** C adalah kurva punuk dengan
  puncak di kepadatan menengah (§6.3): C = 0,33 berarti "tanpa pesaing, pasar belum terbukti"
  dan C = 0,00 berarti "paling sesak". Karena `/api/score` hanya mengirim nilai C dan tidak
  pernah mengirim `x`, satu nilai C rendah **tidak bisa** dibedakan antara dua sebab itu.
  Kalimat yang memilih salah satu ("pesaing masih sedikit", "ruang untuk pemain baru lebar")
  adalah klaim yang tidak didukung data — test di `explanations.test.ts` secara eksplisit
  menolak bentuk kalimat itu.
- **D mengukur keramaian, bukan nilai belanja.** Sumbernya `kondisi_tempat` Menu Go
  (Sepi/Sedang/Ramai); tidak ada kolom nominal transaksi di sumber mana pun (`context-mvp.md`
  §7). Kalimat yang menyiratkan omzet salah arah.
- Mengubah ambang 0,35/0,65 mengubah kalimat yang dibaca user tanpa mengubah satu pun angka.
  Kalau diubah, perbarui test-nya sekalian — di situlah batas-batasnya dikunci.
