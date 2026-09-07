# ARCHITECTURE.md — SIGMAPS WebGIS Frontend

Dokumen acuan struktur direktori dan aturan kolaborasi frontend (**Caca & Clement**).

> **Sumber kebenaran produk/skoring:** `context/context-mvp.md` (v3) + `context/dokumentasi-erd-mvp.md`.
> **Sumber kebenaran kontrak endpoint:** `docs/api-*.md` (ditulis dari `app/api/*/route.ts` yang
> benar-benar jalan). Bila dokumen ini bertentangan dengan keduanya, keduanya yang berlaku.
>
> 🔄 **Diperbarui mengikuti kode pasca-`88418d0 integrate fe + be`.** Versi sebelumnya masih
> menulis `/api/parse-intent`, `lib/dummy/*`, dan menandai B-1…B-6 memblokir — semuanya sudah
> tidak berlaku (lihat §9).

---

## 0. Agent Guardrails (baca ini dulu)

1. **Satu dokumen acuan.** Ikuti `context/context-mvp.md` v3. Tidak ada H3/heatmap, tidak ada
   isokron 5 menit, tidak ada UI edit bobot, tidak ada `risk_level`.
2. **AI cuma di dua titik:** `/api/prompt-request` (parse Business Brief) dan
   `/api/community-sentiment` (ringkasan laporan warga). Skor 100% deterministik di
   `lib/scoring/index.ts` (`0,25·D + 0,50·C + 0,25·S`), server-side. **AI tidak pernah menghitung
   skor**, dan kalimat penjelasan komponen pun bukan dari AI
   (`lib/scoring/explanations.ts`).
3. **Zona kepemilikan** — lihat §5. Kalau ragu file ini milik siapa, tanya sebelum menulis.
4. **Sidebar tidak boleh menyentuh peta langsung.** Tidak ada `map.flyTo()` dan tidak ada import
   dari `components/map/` di `components/sidebar/`. Komunikasi lewat `useSelectedStation`.
5. **Semua styling lewat token CSS** `app/globals.css` (`var(--color-brand)`, `.t-body`, dst).
   Tidak ada hex atau ukuran font yang di-hardcode di komponen.

---

## 1. Prinsip utama

1. **Satu direktori, satu tanggung jawab.** Tidak ada `utils/`, `misc/`, `common/`.
2. **Zona kepemilikan, bukan larangan.** Kalau terjadi konflik merge, owner zona yang resolve.
3. **Kontrak data ada di `types/`.** Ubah `types/` dulu, baru implementasi.
4. **State bersama lewat hooks, bukan prop drilling.** Sidebar dan peta tidak saling kenal.
5. **Design token di `globals.css`.**
6. **Skor tidak pernah dihitung AI**, dan tidak pernah dihitung ulang di klien.

---

## 2. Alur end-to-end (sesuai kode sekarang)

```
1. Halaman dibuka
   → BaseMap merender basemap MAPID
   → useStations() GET /api/stations  → StationLayer menggambar semua pin stasiun

2. User menulis rencana usaha di sidebar, tekan "Nilai kawasan"
   → useBriefResult.submitBrief():
        POST /api/prompt-request { prompt }
             → Gemini + Zod → { tipe_3, harga_target, harga_sumber, confidence }
        POST /api/score { tipe_3, harga_target, harga_sumber }
             → lib/scoring/index.ts (deterministik) → areas terurut, HANYA yang rankable
   → Sidebar: ScoredPanel (skor + bar D/C/S + kalimat penjelas), maksimal 5 kawasan teratas
   → Peta: pin dapat badge #peringkat; stasiun yang tidak ada di hasil diberi label
           "data belum cukup" (disimpulkan frontend, bukan dikirim backend)

3. User memilih satu kawasan (klik pin di peta ATAU klik angka di RankStrip)
   → setSelectedStation(...) → BaseMap flyTo()
   → GET /api/community-sentiment?station_id=  → AreaInsightBlock
   → GET /api/properties?station_id=           → PropertyList + PropertyLayer

4. User klik satu titik properti di peta → popup unit
```

**Yang TIDAK ada di MVP:** narasi AI Area Insight dari skor (titik #4), layar edit bobot,
isokron 5 menit, H3/heatmap, `risk_level`, filter percakapan AI, export PDF, matriks
perbandingan properti.

---

## 3. Struktur direktori (keadaan nyata)

```
sigmaWebgis/
│
├── app/
│   ├── layout.tsx                    # font Plus Jakarta Sans + metadata
│   ├── page.tsx                      # 'use client': provider + Sidebar + BaseMap(+layers)
│   ├── globals.css                   # token CSS + kelas .t-* + animasi marker
│   ├── template/page.tsx             # 🗑️ sisa template create-next-app, tidak dipakai
│   └── api/
│       ├── stations/route.ts         # GET  — semua stasiun (tabel langsung, bukan view)
│       ├── prompt-request/route.ts   # POST — Gemini + Zod → Intent
│       ├── score/route.ts            # POST — scored_areas → lib/scoring → areas
│       ├── properties/route.ts       # GET  — view properti_go_by_station
│       └── community-sentiment/route.ts # GET — view + Gemini → ringkasan
│
├── components/
│   ├── map/                          # ZONA CACA
│   │   ├── BaseMap.tsx               # instance MapLibre + MapInstanceProvider + flyTo
│   │   ├── LayerPanel.tsx            # panel tampilan peta (⚠️ belum dirender di page.tsx)
│   │   ├── layers/
│   │   │   ├── StationLayer.tsx
│   │   │   ├── PropertyLayer.tsx
│   │   │   └── IsochroneLayer.tsx    # 🟡 masih poligon sintetis
│   │   └── dev/DevToolsOverlay.tsx   # 🟡 dev-only, hapus sebelum demo final
│   │
│   └── sidebar/                      # ZONA CLEMENT — 13 komponen, lihat docs/component-sidebar.md
│       ├── Sidebar.tsx (overlay `fixed` + tombol tab buka/tutup)
│       ├── BriefSection.tsx  BusinessBriefInput.tsx  SubmittedBrief.tsx
│       ├── OutputSection.tsx  ScoredPanel.tsx  StationNoBriefPanel.tsx
│       ├── RankStrip.tsx  ScoreComponentBar.tsx  AreaInsightBlock.tsx  PropertyList.tsx
│       └── UnrankableNotice.tsx  PriceAssumptionNotice.tsx  StaleOutputNotice.tsx
│
├── hooks/                            # satu folder per topik, tipe di *.types.ts bersebelahan
│   ├── map/useMapInstance.tsx        # Context — INTERNAL components/map/ saja
│   ├── station/useSelectedStation.tsx  useStations.tsx
│   ├── brief/useBriefResult.tsx      # Context — prompt-request + score jadi satu aksi
│   ├── property/useProperties.tsx    usePropertyPopupConfig.tsx   🟡
│   ├── sentiment/useCommunitySentiment.tsx
│   └── isochrone/useIsochroneConfig.tsx                            🟡
│
├── lib/                              # tanpa React
│   ├── scoring/index.ts              # ⚠️ KRITIS — rumus D/C/S, dipanggil HANYA dari api/score
│   ├── scoring/explanations.ts(+.test.ts)  # kalimat komponen, deterministik
│   ├── station/index.ts  property/index.ts # baris DB → GeoJSON
│   ├── tipe3/index.ts                # enum TIPE_3 dari view Supabase (cache 10 menit)
│   ├── ai/gemini.ts  parseIntent.ts  summarizeSentiment.ts
│   ├── schemas/                      # Zod: prompt-request, score, community-sentiment
│   ├── supabase/server.ts            # service role, SERVER-ONLY
│   ├── fixtures/layers.ts  brief.ts  # konstanta tampilan
│   └── map/isochrone-generator.ts    # 🟡 poligon sintetis
│
├── types/                            # kontrak data — diskusi bersama sebelum diubah
│   ├── station/  property/  scoring/  sentiment/  prompt-request/  tipe3.ts
│
├── helper/hex-area.ts                # 🗑️ artefak, tidak dipakai siapa pun
├── supabase/views.sql                # dijalankan manual di Supabase SQL Editor
├── etl/                              # Python — jangan disentuh dari FE
└── public/assets/map/*.svg           # aset marker (ZONA CACA)
```

---

## 4. Kontrak antar zona

### 4.1 `useSelectedStation` — jembatan sidebar ⇄ peta

```ts
interface StationLocation {
  area_id: string; station_name: string; lng: number; lat: number; is_rankable: boolean;
}
interface SelectedStationContextValue {
  selectedStation: StationLocation | null;
  setSelectedStation: (station: StationLocation | null) => void;
}
```

- **Sidebar menulis** (`ScoredPanel.selectArea`), **peta menulis** (klik pin di `StationLayer`),
  **`BaseMap` membaca** untuk `flyTo()`.
- ⛔ Sidebar tidak pernah memanggil `map.flyTo()` sendiri.
- Isinya lokasi saja, tanpa skor — pembacanya sudah punya `useBriefResult()`.

### 4.2 `useMapInstance` — internal peta

```ts
interface MapInstanceContextValue { map: maplibregl.Map | null }
```

Disediakan `BaseMap` **setelah** `map.on('load')`, jadi layer tidak pernah ter-mount sebelum peta
siap. ⛔ Sidebar tidak boleh meng-import hook ini.

### 4.3 `ScoreResponse` — keluaran `/api/score`

Bentuk persisnya di [docs/api-score.md](../api-score.md). Yang wajib diingat di sisi FE:

- `areas` **hanya berisi kawasan `is_rankable = true`**, sudah terurut skor menurun. Kawasan
  tanpa data cukup **tidak dikirim** — frontend menyimpulkannya dengan membandingkan terhadap
  `/api/stations`.
- `bobot` selalu `{ wD: 0.25, wC: 0.5, wS: 0.25 }`, ditetapkan server; klien tidak pernah
  mengirim bobot.
- `catatan.harga_sumber` menentukan tampil/tidaknya `PriceAssumptionNotice`.

⚠️ Komentar di `types/scoring/index.ts` masih menulis bahwa kawasan `is_rankable=false` ikut
dikirim — itu keliru dan belum dibetulkan di kode; jangan dijadikan acuan.

### 4.4 `PropertyUnit` — keluaran `/api/properties`

Route mengembalikan FeatureCollection; `useProperties` meratakannya jadi:

```ts
interface PropertyUnit {
  id: string; kategori_properti: string; jenis_properti: string; // "Sewa" | "Jual"
  alamat: string; foto_tampak_depan: string | null; foto_spanduk: string | null;
  lat: number; lng: number;
}
// ⛔ DILARANG menampilkan luas, harga, kontak — kolomnya tidak ada di properti_go
```

### 4.5 `Intent` — keluaran `/api/prompt-request`

```ts
interface Intent {
  tipe_3: string;            // salah satu TIPE_3 dari database, atau 'SEMUA'
  harga_target: number;      // 1.000 – 1.000.000
  harga_sumber: 'pengguna' | 'perkiraan';
  confidence: number;        // 0–1, TIDAK memblokir apa pun
}
// ⛔ NAMA LAMA DILARANG: kategori_usaha, target_jam, segmen, skala, weights
```

---

## 5. Zona kepemilikan

| Zona | Owner | Direktori / file |
|---|---|---|
| Peta & geospasial | **Caca** | `components/map/`, `hooks/map/`, `hooks/isochrone/`, `lib/map/`, `public/assets/map/` |
| Sidebar & UI | **Clement** | `components/sidebar/`, `hooks/brief/`, `hooks/sentiment/` |
| API routes & skoring | **Clement** (koordinasi Jalur 1) | `app/api/`, `lib/scoring/`, `lib/schemas/`, `lib/ai/`, `lib/supabase/` |
| Token CSS | **Caca** | `app/globals.css` |
| Kontrak bersama | diskusi bersama | `types/`, `hooks/station/`, `hooks/property/`, `lib/fixtures/` |
| Entry point | commit bersama | `app/layout.tsx`, `app/page.tsx` |

---

## 6. Design token

Definisi lengkap di [DESIGN.md](DESIGN.md) dan `app/globals.css`. Ringkas: warna, spacing 4px,
radius, elevation, `--sidebar-width`, token motion (`--motion-fast/base/slow`, `--ease-out`),
dan kelas tipografi `.t-display-score`, `.t-heading-1/2`, `.t-body`, `.t-button`, `.t-tabular`,
`.t-micro`.

```tsx
<button className="t-button bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)]">Nilai kawasan</button>  // ✅
<button className="bg-[#1E40AF] text-[13px]">Nilai kawasan</button>                                              // ❌
```

**Aturan warna yang mengikat:** `--color-opportunity` khusus keluaran deterministik (skor, bar
D/C/S), `--color-accent` khusus keluaran AI (`AreaInsightBlock`). Jangan ditukar — pemisahan itu
yang membuat user bisa membedakan angka mesin dari kalimat model.

---

## 7. Konvensi penamaan

| Tipe | Konvensi | Contoh |
|---|---|---|
| Komponen React | PascalCase | `StationLayer.tsx` |
| Hook | camelCase, prefix `use`, `.tsx` bila memuat Provider | `useSelectedStation.tsx` |
| Tipe milik hook | `<nama hook>.types.ts` bersebelahan | `useBriefResult.types.ts` |
| Modul `lib/` | folder + `index.ts` per fitur | `lib/scoring/index.ts` |
| Route Next.js | konvensi Next | `route.ts`, `page.tsx` |

⚠️ Pola `lib/<fitur>/index.ts` menyimpang dari `CLAUDE.md` bagian 12 (`camelCase.ts`). Dipakai
konsisten di seluruh `lib/`; dicatat supaya diketahui, bukan dianggap sudah sesuai aturan.

---

## 8. Aturan anti-merge-conflict

1. Satu komponen = satu file.
2. Tidak ada state di `app/page.tsx` — hanya susunan provider + mount `Sidebar` & `BaseMap`.
3. `types/` tidak boleh meng-import dari `components/`.
4. `lib/` tidak boleh meng-import dari `hooks/`.
5. `lib/scoring/` hanya boleh dipanggil dari `app/api/score/route.ts`, tidak pernah dari klien.
6. Ragu menaruh file? Tanya dulu, jangan bikin folder baru.

---

## 9. Yang sudah berubah (⚠️ jangan pakai versi lama)

| Item | Versi lama (JANGAN PAKAI) | Sekarang |
|---|---|---|
| Endpoint parse | `/api/parse-intent` | `/api/prompt-request` |
| Jumlah endpoint | 4 | 5 (+`GET /api/stations`) |
| Sumber data stasiun | Server Component query Supabase langsung | `GET /api/stations` lewat `useStations()` |
| Data palsu | `lib/dummy/*` + penanda `🟡 FASE DUMMY` di hooks | dihapus — semua hook memanggil API nyata; `lib/fixtures/*` hanya konstanta tampilan |
| Modul lib | `lib/scoring.ts`, `lib/supabase.ts` (browser) | `lib/scoring/index.ts`; tidak ada Supabase client sisi browser |
| Hook | `hooks/useMapInstance.ts` (flat) | `hooks/map/useMapInstance.tsx` (folder + `.types.ts`) |
| Posisi sidebar | kanan, `border-l` | **kiri**, `border-r`, lebar `--sidebar-width` |
| Data stasiun statis | `public/geojson/krl.geojson` | dihapus, folder `public/geojson/` kosong |
| `ScoreResponse.areas` | memuat kawasan `is_rankable=false` | hanya kawasan rankable |
| IntentSchema | `kategori_usaha`, `target_jam`, `segmen`, `skala`, `weights` | `tipe_3`, `harga_target`, `harga_sumber`, `confidence` |
| Tabel skor | `scored_cells` + `scored_areas` | hanya `scored_areas` |
| Wilayah | 5 stasiun Tangsel | DKI Jakarta |
| Isokron | 5 + 10 menit | hanya 10 menit |
| Titik AI aktif | #1, #2, #3, #5 | hanya #3 dan #5 (#1 & #2 dicabut permanen) |
| Layar edit bobot | "ditunda" | dihapus permanen |

---

## 10. Status open question FE

**Sudah tertutup** (B-1…B-6 versi lama): daftar stasiun Jakarta, sensus restoran, data Menu Go,
dua tabel padanan manual, dan tabel Community Activity semuanya sudah tersedia
(`context-mvp.md` §9); keempat endpoint yang dulu "menunggu Jalur 1" sudah ada dan dipakai.

**Masih terbuka:**

| ID | Pertanyaan | Status |
|---|---|---|
| B-1 | Poligon isokron resmi MAPID belum dipasang — peta masih memakai generator sintetis | ❓ satu-satunya sisa item pemblokir visual |
| — | `scored_areas` sudah terisi pipeline batch atau belum (menentukan `/api/score` mengembalikan isi atau `503`/array kosong) | ❓ cek langsung ke Supabase |
| O-4 | Jarak jalan kaki di kartu properti: buang, atau garis lurus dengan label jujur (`jarak_garis_lurus_m`) | ❓ sekarang tidak ditampilkan |
| O-5 | Bila kawasan rankable < 5, "Top 5" tidak terpenuhi — tampilkan seadanya atau ubah judul | ❓ sekarang `RankStrip` menampilkan seadanya |
| — | Notice `tipe_3 = 'SEMUA'` diwajibkan `context-mvp.md` §2 tapi belum ada di UI | ❌ belum diimplementasikan |

---

## 11. Perilaku UI yang wajib ada

| Kondisi | Perilaku | Komponen |
|---|---|---|
| `harga_sumber = 'perkiraan'` | Tampilkan perkiraan harga + tawaran mengubah | `PriceAssumptionNotice` ✅ |
| `tipe_3 = 'SEMUA'` | Beri tahu penilaian kompetisi memakai seluruh kategori kuliner | ❌ belum ada |
| Kawasan tanpa skor | Label "data belum cukup" di peta + ringkasan `<details>` tertutup di bagian paling bawah sidebar, tanpa angka skor | `StationLayer`, `UnrankableNotice` ✅ |
| Usaha non-kuliner | Tolak dengan pesan jelas, jangan beri skor | pesan galat 400 ditampilkan `Sidebar` ✅ |
| `confidence` rendah | Tidak memblokir apa pun | — ✅ |
| Rencana sedang disunting | Hasil lama diredupkan + diberi keterangan, bukan dihapus | `StaleOutputNotice` ✅ |

---

## 12. Dokumen terkait

`docs/component-sidebar.md` · `docs/component-map-layers.md` · `docs/component-base-map.md` ·
`docs/hooks.md` · `docs/lib-fixtures.md` · `docs/lib-scoring.md` ·
`docs/lib-scoring-explanations.md` · `docs/api-*.md` · `docs/fe/DESIGN.md`

*Terakhir disinkronkan dengan kode: 7 September 2026.*
