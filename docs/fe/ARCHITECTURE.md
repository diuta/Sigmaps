# ARCHITECTURE.md — SIGMAPS WebGIS Frontend

Dokumen acuan teknis struktur direktori dan aturan kolaborasi untuk **Caca & Clement**
selama proses *vibe coding* MVP SIGMAPS.

> **Sumber kebenaran:** `context/context-mvp.md` (v3, 3 Sep 2026 — pindah dari
> `docs/fe/context-mvp.md` v2, sudah dihapus). Bila ada konflik antara dokumen ini dan
> context-mvp, **context-mvp yang berlaku**.
>
> ⚠️ Dokumen ARCHITECTURE.md ini sendiri **belum disinkronkan ke v3** (masih menyebut
> `/api/parse-intent`, dsb. — nama endpoint sudah berubah jadi `/api/prompt-request` per
> v3 §2 Langkah 2). Untuk kontrak endpoint/skema yang akurat, rujuk `context/context-mvp.md`
> langsung, bukan detail di bawah ini.

> **Tujuan dokumen ini:** supaya dua orang tidak saling injak, AI yang membantu tidak
> menebak-nebak "file ini milik siapa", dan setiap file punya rumah yang jelas.

---

## 0. Agent Guardrails (Baca Ini Dulu)

> Paste section ini sebagai konteks di awal setiap sesi coding AI.

**1. Single Truth Document**
- Follow `docs/fe/context-mvp.md` v2 strictly.
- No H3 / heatmaps. No 5-minute isochrones. No weight customization UI. `hex-area.ts` kept as artifact only.
- AI touches ONLY: (a) intent parsing via Zod in `/api/parse-intent`, (b) community sentiment in `/api/community-sentiment`.
- Scoring is 100% deterministic server-side in `lib/scoring.ts` (`0.25·D + 0.50·C + 0.25·S`). AI does NOT calculate scores.

**2. Ownership & Directory Boundaries**
- **CACA** owns: `components/map/*`, `hooks/useMapInstance.ts`, `app/globals.css` — MapLibre instance, station pins, property dots, isochrone.
- **CLEMENT** owns: `components/sidebar/*`, `app/api/*`, `lib/scoring.ts`, `lib/dummy/*` — sidebar UI, API routes, dummy data.
- **SHARED** (never modify unilaterally): `types/`, `hooks/useSelectedStation.ts`.

**3. Cross-Boundary Communication**
- Sidebar MUST NOT call `map.flyTo()` directly or import from `components/map/`.
- Sidebar sets `selectedStation` via `useSelectedStation` → `BaseMap.tsx` listens and triggers `flyTo()` internally.
- All styling: CSS variables from `app/globals.css` only (e.g. `var(--color-brand)`). No hardcoded hex.
- All placeholder data: `lib/dummy/` only, hooks tagged `// 🟡 FASE DUMMY`.

**4. API Status — Semua Masih Pending dari Jalur 1**

| Endpoint | Method | Shape | Status |
|----------|--------|-------|--------|
| `/api/parse-intent` | POST | `{ teks }` → `IntentOutput` | ❓ Menunggu konfirmasi |
| `/api/score` | POST | `{ tipe_3, harga_target }` → `ScoreResponse` (§6.8 context-mvp) | ❓ Menunggu `scored_areas` |
| `/api/properties` | GET | `?station_id=` → `PropertyUnit[]` | ❓ Menunggu isokron (B-1) |
| `/api/community-sentiment` | GET | `?station_id=` → `{ ringkasan: string }` | ❓ Menunggu tabel Activity (B-6) |

Sampai API dikonfirmasi: semua hooks pakai `lib/dummy/*`.

---

## 1. Prinsip Utama


1. **Satu direktori, satu tanggung jawab.** Tidak ada folder bernama `utils/`, `misc/`, atau `common/` tanpa deskripsi jelas.
2. **Zona kepemilikan, bukan aturan larangan.** Bukan berarti salah satu tidak boleh menyentuh zona lain — tapi kalau merge conflict terjadi, *owner* zona itu yang resolve.
3. **Kontrak data ada di `types/`.** Kalau ada perubahan shape data dari API atau Supabase, ubah di `types/` dulu, baru implementasi.
4. **Shared state via hooks, bukan prop drilling.** Komponen map dan sidebar tidak tahu satu sama lain secara langsung — mereka berkomunikasi lewat hooks yang ada di `hooks/`.
5. **Design token ada di `globals.css`.** Tidak ada *magic number* warna atau spacing yang di-hardcode di komponen. Selalu pakai `var(--color-brand)`, dll. (lihat Bagian 6).
6. **Skor tidak pernah dihitung oleh AI.** Seluruh logika ada di `lib/scoring.ts` — deterministik, server-side. AI hanya untuk parse-intent dan ringkasan sentimen.

---

## 2. Alur End-to-End MVP (dari context-mvp.md §1)

```
1. User buka app
   → basemap MAPID + titik stasiun (diambil Server Component dari Supabase)

2. User ketik kebutuhan usaha (Business Brief)
   → POST /api/parse-intent  → Gemini + Zod → IntentOutput
   → POST /api/score         → lib/scoring.ts (deterministik) → Top 5
   → tampil: nama stasiun, skor, dekomposisi D/C/S (angka, TANPA narasi AI)

3. User klik satu stasiun
   → Tab Sentimen: GET /api/community-sentiment?station_id=...  → Gemini ringkasan
   → Tab Unit:     GET /api/properties?station_id=...           → FeatureCollection

4. User klik satu properti → property card
```

**Yang TIDAK ada di MVP:** narasi AI area insight, layar edit bobot, isokron 5 menit,
H3/heatmap, risk_level, filter percakapan AI, export PDF.

---

## 3. Struktur Direktori Target

```
sigmaWebgis/
│
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout (font, metadata)
│   ├── page.tsx                      # Server Component: fetch stasiun dari Supabase → props
│   ├── globals.css                   # Design tokens sebagai CSS variables (lihat §6)
│   └── api/
│       ├── parse-intent/
│       │   └── route.ts              # [Server] Gemini + Zod → IntentOutput
│       ├── score/
│       │   └── route.ts              # [Server] baca scored_areas → lib/scoring.ts → Top 5
│       ├── community-sentiment/
│       │   └── route.ts              # [Server] query Community Activity → Gemini → ringkasan
│       └── properties/
│           └── route.ts              # [Server] query properti_go dalam isokron stasiun
│
├── components/                       # UI Components — dibagi per zona
│   ├── map/                          # ZONA CACA — semua layer di atas peta
│   │   ├── BaseMap.tsx               # maplibre-gl canvas; listens to selectedStation → flyTo
│   │   ├── layers/
│   │   │   ├── StationLayer.tsx      # Titik stasiun
│   │   │   ├── PropertyLayer.tsx     # Titik oranye properti sekitar
│   │   │   └── IsochroneLayer.tsx    # Poligon isokron (border dashed, fill transparan)
│   │   └── dev/                      # 🟡 DEV / EXPERIMENTAL ONLY (mudah dihapus)
│   │       └── DevToolsOverlay.tsx   # Unified floating dev tools (Isochrone + Property Popup)
│   │
│   └── sidebar/                      # ZONA CLEMENT — right sidebar 380px
│       ├── Sidebar.tsx               # Container + orchestrator
│       ├── BusinessBriefInput.tsx    # Textarea + suggestion pills + tombol submit
│       ├── ActiveBriefChip.tsx       # Collapsed brief state setelah submit
│       │                             #   ↳ wajib tampilkan harga_sumber='perkiraan' warning
│       │                             #   ↳ wajib tampilkan tipe_3='SEMUA' notice
│       ├── RankingCard.tsx           # Card #1–#5: skor + bar D/C/S (angka, bukan narasi)
│       │                             #   ↳ is_rankable=false → label "data belum cukup"
│       └── StationDetailPanel.tsx    # Dua tab: Sentimen AI + Katalog Unit
│
├── hooks/                            # Shared logic — tidak ada owner tunggal
│   ├── useMapInstance.ts             # Context: expose maplibre Map object (INTERNAL map only)
│   ├── useSelectedStation.ts         # Context: stasiun aktif (Clement tulis sidebar→, Caca baca di map)
│   ├── useParseIntent.ts             # POST /api/parse-intent → return IntentOutput
│   └── useScore.ts                   # POST /api/score setelah intent → return ScoreResponse
│
├── lib/                              # Pure functions & clients — tidak ada React
│   ├── scoring.ts                    # ⚠️ KRITIS — implementasi rumus D/C/S (context-mvp §6)
│   │                                 #   dipanggil HANYA dari app/api/score/route.ts
│   ├── dummy/                        # 🟡 FASE PURE FE — hapus saat API real sudah siap
│   │   ├── stations.ts               # DUMMY_STATIONS: StationRanking[] (5 stasiun Jakarta)
│   │   ├── properties.ts             # DUMMY_PROPERTIES: PropertyUnit[] per station_id
│   │   ├── score.ts                  # DUMMY_SCORE_RESPONSE: ScoreResponse
│   │   └── sentiment.ts             # DUMMY_SENTIMENT: string (ringkasan palsu)
│   ├── map/
│   │   └── hex-area.ts               # hexArea() geometric helper
│   └── supabase.ts                   # Supabase browser client (anon key only)
│
├── types/                            # Kontrak data — DISKUSI BERSAMA sebelum diubah
│   ├── station.ts                    # StationFeature (GeoJSON), StationRanking
│   ├── property.ts                   # PropertyUnit (kolom properti_go: lihat §4.4)
│   ├── scoring.ts                    # ScoreResponse, AreaScore (lihat §4.3)
│   └── api.ts                        # IntentOutput, request shapes (lihat §4.5)
│
├── docs/
│   ├── fe/
│   │   ├── context-mvp.md            # ← SUMBER KEBENARAN (v2, 2 Sep 2026)
│   │   ├── DESIGN.md                 # Token spesifikasi visual
│   │   └── ARCHITECTURE.md           # ← dokumen ini
│   └── jalur1-context.md             # Status & open questions backend/data
│
├── etl/                              # Python scripts — JANGAN disentuh dari FE
└── public/
    ├── geojson/
    │   └── krl.geojson               # Static GeoJSON stasiun KRL (4 stasiun dummy)
    └── assets/
        └── map/                      # ZONA CACA — semua aset visual untuk map layer
            ├── marker-station-active.svg    # Shield pin — stasiun aktif (Cobalt Metro)
            ├── marker-station-inactive.svg  # Shield pin — is_rankable=false (Cool Slate)
            └── [tambah aset lain di sini]   # Konsistensi nama: kebab-case, prefix konteks
```

---

## 4. Kontrak Antarmuka Antar Zona

**Ini adalah "API" internal antara dua orang.** Harus disetujui sebelum mulai coding.

### 4.1 `useSelectedStation` — Jembatan Sidebar → Map

```typescript
// hooks/useSelectedStation.ts
interface SelectedStationContextValue {
  selectedStation: StationRanking | null;
  setSelectedStation: (station: StationRanking | null) => void;
}
```

- **Clement tulis ke:** `setSelectedStation(station)` saat user klik ranking card di sidebar
- **Caca baca:** `selectedStation` di dalam `BaseMap.tsx` untuk trigger `flyTo()` secara internal
- ⛔ **Sidebar TIDAK boleh memanggil `map.flyTo()` secara langsung** — hanya set state, map yang bereaksi

### 4.2 `useMapInstance` — Internal Map Only

```typescript
// hooks/useMapInstance.ts
interface MapInstanceContextValue {
  map: maplibregl.Map | null;
}
```

- Caca provide di `BaseMap.tsx` setelah `map.on('load', ...)`
- ⛔ **Hook ini hanya untuk dipakai di dalam `components/map/`.** Sidebar tidak boleh import hook ini.

### 4.3 `ScoreResponse` — Output `/api/score` → Sidebar

> Sumber: **context-mvp.md §6.8** — skema final, bukan placeholder.

```typescript
// types/scoring.ts

interface AreaScore {
  area_id: string;                  // e.g. "st_tanah_abang"
  station_name: string;             // e.g. "Tanah Abang"
  skor: number;                     // 0–100
  komponen: {
    demand: number;                 // D, 0–1
    competitive_headroom: number;   // C, 0–1
    segment_match: number;          // S, 0–1
  };
  bobot: {
    wD: number;                     // 0.25 (fixed di server)
    wC: number;                     // 0.50 (fixed di server)
    wS: number;                     // 0.25 (fixed di server)
  };
  n_observations: number;
  n_price: number;
  is_rankable: boolean;             // false → label "data belum cukup", tidak diperingkat
}

interface ScoreResponse {
  areas: AreaScore[];               // semua kawasan, termasuk is_rankable=false
  catatan: {
    harga_sumber: 'pengguna' | 'perkiraan';
  };
}
```

### 4.4 `PropertyUnit` — Output `/api/properties`

> Sumber: **context-mvp.md §2 Langkah 4**

```typescript
// types/property.ts
interface PropertyUnit {
  id: string;
  kategori_properti: string;
  jenis_properti: string;           // "Sewa" | "Jual"
  alamat: string;
  foto_tampak_depan: string | null;
  foto_spanduk: string | null;
  lat: number;
  lng: number;
}
// ⛔ DILARANG tampilkan: luas, harga, kontak — kolom ini TIDAK ADA di properti_go
```

### 4.5 `IntentOutput` — Output `/api/parse-intent`

> Sumber: **context-mvp.md §6.6** — menggantikan seluruh schema v1.

```typescript
// types/api.ts (cerminan Zod schema di server)
interface IntentOutput {
  tipe_3: string;                   // nilai dari TIPE_3_VALUES | 'SEMUA'
  harga_target: number;             // integer, 1000–1_000_000
  harga_sumber: 'pengguna' | 'perkiraan';
  confidence: number;               // 0–1, TIDAK memblokir apapun — hanya UI hint
}

// ⛔ NAMA LAMA DILARANG: kategori_usaha, target_jam, segmen, skala, weights
```

---

## 5. Zona Kepemilikan

| Zona | Owner | Direktori / File |
|------|-------|-----------------|
| **Map Layer & Geospatial** | **Caca** | `components/map/`, `hooks/useMapInstance.ts`, `lib/map/` |
| **Sidebar & UI Logic** | **Clement** | `components/sidebar/`, `hooks/useParseIntent.ts`, `hooks/useScore.ts` |
| **Scoring & API Routes** | **Clement** (koordinasi Jalur 1) | `lib/scoring.ts`, `app/api/` |
| **Dummy Data Layer** | **Clement** (hapus saat API siap) | `lib/dummy/` |
| **Design Token CSS** | **Caca** | `app/globals.css` |
| **Shared Contracts** | Diskusi bersama | `types/`, `hooks/useSelectedStation.ts` |
| **Layout / Entry Point** | Siapapun, commit bersama | `app/layout.tsx`, `app/page.tsx` |

**Aturan zona:**
- Sebelum ubah file di `types/` → buat kesepakatan dulu, jangan unilateral.
- Caca tidak perlu tahu implementasi sidebar — cukup tahu `setSelectedStation` dan CSS variable yang dipakai.
- Clement tidak perlu tahu cara `StationLayer.tsx` render pin — cukup tahu shape `StationRanking` di `types/station.ts`.
- ⛔ Sidebar TIDAK boleh import apapun dari `components/map/`. Komunikasi hanya lewat `types/` dan `hooks/`.

---

## 6. Design Tokens (CSS Variables)

Token dari `DESIGN.md` sebagai CSS custom properties di `app/globals.css`.
**Jangan hardcode warna atau spacing di komponen.** Selalu pakai variabel:

```css
/* app/globals.css */
:root {
  /* Brand */
  --color-brand:          #1E40AF;  /* Cobalt Metro */
  --color-brand-hover:    #1D4ED8;
  --color-brand-active:   #172554;

  /* Accent */
  --color-accent:         #4F46E5;  /* Electric Ultramarine */
  --color-accent-surface: #EEF2FF;

  /* Opportunity */
  --color-opportunity:    #10B981;  /* Neon Emerald */
  --color-opportunity-bg: #ECFDF5;
  --color-opportunity-tx: #065F46;

  /* Property Pin */
  --color-pin:            #F97316;  /* Warm Tangerine */
  --color-pin-hover:      #EA580C;
  --color-pin-surface:    #FFF7ED;

  /* Warning */
  --color-warning:        #F59E0B;
  --color-warning-bg:     #FEF3C7;
  --color-warning-tx:     #92400E;

  /* Neutrals */
  --color-surface:        #FFFFFF;
  --color-surface-muted:  #F8FAFC;
  --color-border:         #E2E8F0;
  --color-muted:          #94A3B8;
  --color-text:           #0F172A;
  --color-text-sub:       #64748B;

  /* Spacing (4px base) */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 24px;

  /* Radius */
  --radius-card:  8px;
  --radius-pill:  9999px;

  /* Elevation */
  --shadow-card:  0 1px 3px 0 rgba(0,0,0,.05), 0 1px 2px 0 rgba(0,0,0,.03);
  --shadow-float: 0 10px 15px -3px rgba(0,0,0,.08), 0 4px 6px -2px rgba(0,0,0,.03);
}
```

**Cara pakai di Tailwind v4:**
```tsx
// ✅ Pakai CSS variable
<button className="bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)]">
  Nilai Kawasan
</button>

// ❌ Jangan hardcode hex
<button className="bg-[#1E40AF]">Nilai Kawasan</button>
```

---

## 7. Konvensi Penamaan File

| Tipe | Konvensi | Contoh |
|------|----------|--------|
| React Component | PascalCase | `StationLayer.tsx` |
| Hook | camelCase, prefix `use` | `useSelectedStation.ts` |
| Pure function / lib | kebab-case | `hex-area.ts`, `scoring.ts` |
| Next.js route | lowercase, Next convention | `route.ts`, `page.tsx` |
| Type definitions | camelCase | `station.ts`, `api.ts` |

---

## 8. Aturan Anti-Merge-Conflict

1. **Satu komponen = satu file.** Tidak ada dua komponen dalam satu `.tsx`.
2. **Tidak ada state di `app/page.tsx`.** Page hanya mount `<BaseMap>` dan `<Sidebar>`. State ada di Context.
3. **Import `types/` tidak boleh import dari `components/`.** Types adalah pure data shapes — tidak ada React di sana.
4. **`lib/` tidak boleh import dari `hooks/`.** `lib/` adalah pure functions, tidak tahu React lifecycle.
5. **`lib/scoring.ts` tidak boleh dipanggil dari client component.** Hanya boleh dari `app/api/score/route.ts`.
6. **Kalau ragu taruh di mana:** tanya dulu via chat, jangan buat folder baru sembarangan.

---

## 9. Hal-Hal yang Sudah Berubah dari Versi Lama (⚠️ Jangan Pakai)

> Sync dari **context-mvp.md §8**. Kalau AI atau context lain menyebutkan ini, abaikan.

| Item | Versi Lama (JANGAN PAKAI) | Versi Sekarang |
|------|--------------------------|----------------|
| API route scoring | `/api/rank-area` (satu route) | `/api/parse-intent` + `/api/score` (dua route terpisah) |
| IntentSchema fields | `kategori_usaha`, `target_jam`, `segmen`, `skala`, `weights` | `tipe_3`, `harga_target`, `harga_sumber`, `confidence` |
| `/api/score` request body | Terima `weights` dari klien | Bobot tunggal di server, tidak dikirim dari klien |
| Tabel skor | `scored_cells` + `scored_areas` | Hanya `scored_areas` |
| Wilayah data | 5 stasiun Tangsel (Cisauk, Serpong, dll) | DKI Jakarta (daftar stasiun ❓ belum final) |
| Isokron | 5 menit + 10 menit | **Hanya 10 menit** |
| Titik AI aktif | #1, #2, #3, #5 | #1 & #2 **dicabut permanen** — hanya #3 dan #5 |
| Layar edit bobot | "Ditunda setelah MVP" | **Dihapus permanen** |
| Sumber data D & T | Struk Go | **Tidak mungkin** — `tanggal` 100% null di Struk Go |
| Normalisasi skor | Persentil (rank-based) | Min-max dengan clip persentil 5 & 95 |

---

## 10. Open Questions FE (dari context-mvp.md §9)

*Tandai ✅ saat sudah dikonfirmasi. Jangan tulis kode seolah sudah ada jawabannya.*

### Memblokir — jangan mulai fitur yang bergantung pada ini

| ID | Pertanyaan | Status |
|----|-----------|--------|
| B-1 | Poligon isokron dari MAPID belum dipastikan siap — memblokir C dan seluruh definisi kawasan | ❓ |
| B-2 | Daftar stasiun Jakarta belum ditetapkan — jangan hardcode nama stasiun | ❓ |
| B-5 | Dua tabel padanan manual (teks bebas → `TIPE_3`, perkiraan harga per `TIPE_3`) belum ditulis | ❓ |
| B-6 | Tabel Community Activity belum ada di Supabase — dibutuhkan `/api/community-sentiment` | ❓ |

### Perlu keputusan, tidak memblokir

| ID | Pertanyaan | Status |
|----|-----------|--------|
| O-4 | Jarak jalan kaki di property card — buang, atau pakai garis lurus dengan label jujur? | ❓ |
| O-5 | Bila kawasan `is_rankable` < 5, "Top 5" tidak terpenuhi — tampilkan seadanya atau ubah judul? | ❓ |
| O-6 | Skema Zod output titik AI #5 (community sentiment) belum diputuskan | ❓ |

---

## 11. Perilaku UI yang Wajib Diimplementasikan

> Sumber: **context-mvp.md §2 Langkah 2**

| Kondisi | Perilaku UI |
|---------|-------------|
| `harga_sumber = 'perkiraan'` | Tampilkan: *"Harga tidak disebutkan, kami perkirakan Rp25.000 dari jenis usaha. Ubah?"* |
| `tipe_3 = 'SEMUA'` | Tampilkan notice bahwa penilaian kompetisi memakai seluruh kategori kuliner |
| `is_rankable = false` | Kawasan tampil di peta dengan label "data belum cukup", **tidak** masuk peringkat |
| Usaha non-kuliner | Tolak dengan pesan jelas — jangan beri skor |
| `confidence` rendah | **Tidak memblokir apapun** — hanya tampilkan hint konfirmasi penafsiran di UI |

---

## 12. Dummy Data Strategy & API Injection Seam

> 🟡 **CURRENT STATUS: PURE FE DUMMY PHASE**
> Semua data adalah palsu. Tidak ada koneksi ke backend, Supabase, atau AI.
> API list dari Jalur 1 **belum diterima**.

### Keputusan Arsitektur yang Sudah Final

| Keputusan | Pilihan | Alasan |
|-----------|---------|--------|
| Station marker renderer | **HTML Marker** (`maplibregl.Marker`) | ~30 stasiun (≤50), perlu CSS hover/glow/animation per DESIGN.md |
| Data source saat ini | `lib/dummy/*` | API belum siap, pure FE phase |
| Marker shape | Menunggu asset dari Caca | Drop ke `public/assets/map/` saat siap |

### Pola Hook — Data-Source Agnostic

Komponen tidak tahu apakah data datang dari dummy atau API. Swap terjadi
hanya di dalam hook, satu baris, dengan komentar yang jelas:

```typescript
// hooks/useScore.ts — pola yang harus diikuti di semua hooks
export function useScore() {
  const [data, setData] = useState<ScoreResponse | null>(null);

  async function fetchScore(intent: IntentOutput) {
    // 🟡 FASE DUMMY: swap baris ini saat /api/score siap
    const result = DUMMY_SCORE_RESPONSE;
    // ✅ FASE REAL:  const result = await fetch('/api/score', { method:'POST', body: JSON.stringify(intent) }).then(r => r.json());
    setData(result);
  }

  return { data, fetchScore };
}
```

### Aturan Menulis Dummy Code

1. **Semua data palsu hanya di `lib/dummy/`.** Tidak ada hardcode di komponen manapun.
2. **Shape dummy harus match types persis.** TypeScript harus happy tanpa cast.
3. **Tandai setiap baris swap dengan `// 🟡 FASE DUMMY`** — satu baris, langsung di atas yang akan diganti.
4. **Tidak ada logika bisnis di dummy files** — hanya `export const DATA = ...`.

### Checklist Penghapusan Dummy (saat API siap)

Saat API dari Jalur 1 sudah dikonfirmasi, lakukan ini secara berurutan:

```
[ ] 1. Terima kontrak API (endpoint, request, response shape)
[ ] 2. Update tabel API di bawah dengan status ✅
[ ] 3. Swap baris 🟡 FASE DUMMY di setiap hook → real fetch call
[ ] 4. Verifikasi TypeScript tidak ada error
[ ] 5. Hapus seluruh folder lib/dummy/ (rm -rf lib/dummy)
[ ] 6. Hapus import dummy di setiap hook
[ ] 7. (Opsional) Hapus komentar // ✅ FASE REAL yang sudah aktif
```

**File yang akan dihapus saat API siap:**

| File | Digantikan oleh |
|------|-----------------|
| `lib/dummy/stations.ts` | Fetch dari Supabase di `app/page.tsx` (Server Component) |
| `lib/dummy/score.ts` | `fetch('/api/score', ...)` di `hooks/useScore.ts` |
| `lib/dummy/properties.ts` | `fetch('/api/properties?station_id=...')` di `hooks/useProperties.ts` |
| `lib/dummy/sentiment.ts` | `fetch('/api/community-sentiment?station_id=...')` di `hooks/useSentiment.ts` |
| `components/map/dev/` | Hapus seluruh folder saat poligon MAPID (B-1) siap |
| `lib/map/isochrone-generator.ts` | Hapus — digantikan oleh GeoJSON asli dari Jalur 2 |
| `hooks/useIsochroneConfig.tsx` | Hapus — tidak lagi dibutuhkan saat poligon statis/API siap |
| `hooks/usePropertyPopupConfig.tsx` | Hapus — tidak lagi dibutuhkan setelah varian desain popup final disepakati |

**File yang TIDAK dihapus** (tetap ada setelah dummy phase):
- `types/*` — shape tetap sama
- `hooks/*` — cukup hapus baris 🟡 dan uncomment ✅
- `components/*` — tidak ada yang perlu diubah

### API yang Sedang Ditunggu dari Jalur 1

> ❓ **Daftar endpoint final belum diterima.** Shape di bawah berdasarkan context-mvp.md —
> bisa berubah saat kontrak resmi dikirim.

| Endpoint | Method | Request | Response | Status |
|----------|--------|---------|----------|--------|
| `/api/parse-intent` | POST | `{ teks: string }` | `IntentOutput` | ❓ Menunggu konfirmasi |
| `/api/score` | POST | `{ tipe_3, harga_target }` | `ScoreResponse` | ❓ Menunggu `scored_areas` siap |
| `/api/properties` | GET | `?station_id=` | `PropertyUnit[]` | ❓ Menunggu isokron siap (B-1) |
| `/api/community-sentiment` | GET | `?station_id=` | `{ ringkasan: string }` | ❓ Menunggu tabel Community Activity (B-6) |

*Update kolom Status menjadi ✅ saat kontrak dari Jalur 1 diterima.*

---

*Terakhir diupdate: September 2026*
*Ownership: Caca = Map (~30 stasiun, HTML Marker), Clement = Sidebar & API*
*Crosscheck dengan: `docs/fe/context-mvp.md` v2 (2 Sep 2026)*
