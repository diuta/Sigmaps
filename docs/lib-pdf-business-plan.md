# lib/pdf/businessPlanDocument.tsx

Menyusun dokumen PDF "Ringkasan Rencana Usaha" — teks rencana usaha, jenis usaha & harga
target, tabel peringkat Top 5 kawasan, dekomposisi skor kawasan yang sedang dibuka, dan
daftar unit properti kawasan itu. Dipakai satu-satunya oleh
[`components/sidebar/ExportPdfButton.tsx`](component-sidebar.md) — tombol "Unduh PDF" yang
tampil di header `ScoredPanel` setelah brief dinilai.

## Cara pakai

```ts
import { generateBusinessPlanPdfBlob } from "@/lib/pdf/businessPlanDocument";

const blob = await generateBusinessPlanPdfBlob({
  brief: "mau buka warung nasi padang harga sekitar 20000 per porsi",
  intent: { tipe_3: "RESTORAN PADANG", harga_target: 20000, harga_sumber: "pengguna", confidence: 1 },
  areas: scoreResult.areas,       // Top 5 dari ScoreResponse, termasuk yang is_rankable=false
  activeArea: scoreResult.areas[0],
  properties,                     // hasil useProperties(activeArea.station_id)
});

const url = URL.createObjectURL(blob);
// ...trigger <a download> lalu revoke url, lihat ExportPdfButton.tsx
```

`BusinessPlanDocument` (komponen `<Document>`-nya) juga diekspor terpisah kalau nanti
dibutuhkan preview langsung di layar lewat `<PDFViewer>` dari `@react-pdf/renderer`.

## Dependency/prasyarat

- **`@react-pdf/renderer`** (npm, ditambahkan untuk fitur ini) — renderer PDF vektor yang
  jalan penuh di browser, tidak butuh headless browser/server.
- [`lib/scoring/explanations.ts`](lib-scoring-explanations.md) — sumber `COMPONENT_LABELS`,
  `explainComponent`, `explainNeutralPull`. **Sengaja dipakai ulang, bukan ditulis ulang**,
  supaya kalimat penjelasan skor di PDF selalu identik dengan yang tampil di `ScoredPanel`.
- Tipe `AreaScore`/`ScoreComponentKey` (`types/scoring`), `IntentOutput`
  (`types/prompt-request`), `PropertyUnit` (`types/property`).

## Batasan/gotcha

- **Dirender 100% di client, sengaja tidak lewat `app/api/*`.** Generate PDF (layout +
  encode) tidak butuh apa pun dari server; menaruhnya di `route.ts` cuma menambah risiko kena
  batas waktu function Vercel Hobby (CLAUDE.md §8) untuk pekerjaan yang sebenarnya aman
  dikerjakan browser. Jangan pindahkan ini ke endpoint API "supaya rapi" — itu kemunduran.
- **Foto properti (`foto_tampak_depan`, `foto_spanduk`) sengaja TIDAK disertakan.** Meng-
  embed gambar eksternal ke PDF di `@react-pdf/renderer` berarti fetch tiap URL foto satu per
  satu dari browser user (bisa lambat/gagal karena CORS) sebelum PDF selesai dibuat. Daftar
  properti di PDF cuma teks (kategori, jenis, alamat) — sama seperti kolom yang memang boleh
  ditampilkan (lihat larangan harga/luas/kontak di `types/property/index.ts`).
- **Maksimal 30 unit properti ditulis ke tabel** (`MAX_PROPERTIES_LISTED`); sisanya diringkas
  jadi satu baris "+N unit lain". Ini murni supaya PDF tidak membengkak untuk kawasan dengan
  ratusan unit — bukan filter data, `properties` yang dioper tetap daftar lengkap.
  `activeArea` di sini WAJIB salah satu anggota `areas` — dipakai untuk mencari peringkat
  (`peringkat`) dan menandai baris aktif di tabel Top 5. Kalau tidak, `peringkat` jatuh ke 0.
- **`areas` difilter ke `is_rankable` di dalam fungsi ini**, bukan tanggung jawab pemanggil —
  konsisten dengan `RankStrip` yang juga cuma menerima kawasan rankable.
