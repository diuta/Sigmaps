@AGENTS.md

# SIGMAPS — Architecture & Collaboration Rules

Project ini dikerjakan bareng banyak orang. Aturan di bawah **wajib** diikuti tanpa
pengecualian, supaya siapa pun (termasuk kontributor baru atau AI assistant) tahu persis di
mana menaruh kode apa, tanpa perlu bertanya dulu. Kalau sebuah keputusan tidak tercakup di
sini, cek `context/context-final.md` dulu sebelum menebak — dokumen itu adalah sumber
kebenaran untuk seluruh keputusan produk/arsitektur SIGMAPS.

## 🧭 Baru pertama kali buka file ini? Mulai dari sini

Bingung taruh kode di mana? Cek baris yang cocok:

| Saya mau bikin... | Taruh di | Baca bagian |
|---|---|---|
| Endpoint API baru (misal `/api/xxx`) | `app/api/xxx/route.ts` (tipis!) | [2](#2-struktur-folder--wajib-diikuti-persis), [6](#6-validasi--error-handling--wajib-konsisten-di-semua-endpoint) |
| Logic hitung/proses data (dipakai backend) | `lib/xxx.ts` (fungsi murni, tanpa HTTP) | [1](#1-model-arsitektur-monolith-nextjs), [2](#2-struktur-folder--wajib-diikuti-persis) |
| Halaman/komponen UI baru | `components/xxx.tsx` | [3](#3-batas-server-vs-client-component--wajib-dipatuhi) |
| Utilitas kecil generik (format tanggal, hitung jarak, dll) | `helper/xxx.ts` | [2b](#2b-helper-vs-lib--bedanya-apa) |
| Sesuatu yang berkaitan dengan peta (layer, kontrol) | `components/map/...` | [11](#11-arsitektur-peta--basemap--layer-wajib-dipisah) |
| Zod schema request/response | `lib/schemas/xxx.ts` | [6](#6-validasi--error-handling--wajib-konsisten-di-semua-endpoint) |
| Env var / API key baru | `.env.local` + **wajib** tambahkan ke `.env.example` | [4](#4-environment-variable--secret--aturan-keamanan-wajib) |
| Skrip Python analisis data | `etl/` (dunia terpisah, tidak nyambung ke `app/`/`lib/`) | [2](#2-struktur-folder--wajib-diikuti-persis) |
| Selesai bikin fitur, sebelum dianggap "done" | Tambah `docs/<nama-fitur>.md` | [10](#10-dokumentasi-fitur--wajib-ditulis-di-docs) |

**Tiga aturan paling sering dilanggar (baca ini dulu kalau buru-buru):**
1. `route.ts` **tidak boleh** berisi logic — cuma validasi → panggil `lib/` → balas.
2. Secret (`SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `MAPID_API_KEY`) **tidak boleh**
   pernah dipakai di komponen `'use client'` — kalau kamu ragu, taruh di server.
3. Jangan hardcode API key langsung di kode — walau key-nya "aman untuk publik", tetap wajib
   lewat `process.env.*` (lihat kasus nyata yang baru diperbaiki di bagian 4).

---

## Daftar isi

1. [Model arsitektur: monolith Next.js](#1-model-arsitektur-monolith-nextjs)
2. [Struktur folder](#2-struktur-folder--wajib-diikuti-persis)
   - [2b. `helper/` vs `lib/` — bedanya apa?](#2b-helper-vs-lib--bedanya-apa)
3. [Batas Server vs Client Component](#3-batas-server-vs-client-component--wajib-dipatuhi)
4. [Environment variable & secret](#4-environment-variable--secret--aturan-keamanan-wajib)
5. [Koneksi Supabase](#5-koneksi-supabase--satu-sumber-tidak-boleh-duplikat)
6. [Validasi & error handling](#6-validasi--error-handling--wajib-konsisten-di-semua-endpoint)
7. [Aturan penamaan data](#7-aturan-penamaan-data--wajib-sesuai-contextcontext-finalmd)
8. [Runtime & performa](#8-runtime--performa)
9. [Sebelum menambah dependency/mengubah arsitektur](#9-sebelum-menambah-dependency-atau-mengubah-arsitektur)
10. [Dokumentasi fitur — wajib](#10-dokumentasi-fitur--wajib-ditulis-di-docs)
11. [Arsitektur peta: Basemap ≠ Layer](#11-arsitektur-peta--basemap--layer-wajib-dipisah)
12. [Penamaan file & konsistensi](#12-penamaan-file--konsistensi)
13. [Aturan ini cuma tulisan — bagaimana benar-benar ditegakkan?](#13-aturan-ini-cuma-tulisan--bagaimana-benar-benar-ditegakkan)

---

## 1. Model arsitektur: monolith Next.js

Satu project, satu deployment (Vercel). Backend **bukan** folder terpisah — dia tersebar di
dua lapisan wajib:

- **`app/api/`** — lapisan routing/HTTP. Menerima request, memanggil `lib/`, mengembalikan
  response. **Tidak boleh** berisi logic bisnis.
- **`lib/`** — lapisan logic. Semua yang bukan "menerima/mengirim HTTP" hidup di sini:
  koneksi database, kalkulasi skor, panggilan ke AI, validasi skema.

`app/` di luar `app/api/` (halaman, layout) = frontend. `components/` = frontend. `etl/` =
dunia terpisah total (Python, batch, offline) — lihat aturan #4 di bagian 2.

## 2. Struktur folder — wajib diikuti persis

```
app/
  layout.tsx, page.tsx, ...     → FRONTEND (Server Component by default)
  api/
    <nama-endpoint>/route.ts    → BACKEND, satu file = satu route HTTP

lib/
  supabase/server.ts            → satu-satunya titik koneksi Supabase sisi server
  scoring.ts                    → fungsi murni kalkulasi skor (WLC), tanpa HTTP
  schemas/                      → Zod schema request/response tiap endpoint
  ai/                           → wrapper panggilan Gemini (Vercel AI SDK)

components/                     → FRONTEND murni (Client & Server Component UI)
  map/                           → semua yang berkaitan dengan peta, dikelompokkan (bagian 11)
    MapProvider.tsx               → Context: menyimpan & membagikan satu map instance
    BaseMap.tsx                    → membuat instance maplibregl.Map, TIDAK tahu-menahu soal layer
    LayerControl.tsx                → UI toggle nyala/mati layer
    layers/
      IsochroneLayer.tsx, HexScoreLayer.tsx, StationLayer.tsx, PropertyLayer.tsx, ...

helper/                         → utilitas sisi klien murni, generik, TANPA business logic
etl/                            → Python, batch/offline, TIDAK pernah di-import dari app/ atau lib/
public/                         → aset statis
docs/                           → dokumentasi cara pakai tiap fitur (wajib, lihat bagian 10)
middleware.ts                   → BELUM DIBUAT. Nanti: rate limiting per-IP di root, jalan
                                   sebelum app/api/* — wajib ada sebelum endpoint AI live
                                   (`/api/parse-intent`, `/api/insight`) diaktifkan ke publik.
```

**ATURAN:**
1. Endpoint API baru **wajib** dibuat sebagai `app/api/<nama>/route.ts` — jangan bikin pola
   routing lain (tidak ada `pages/api`, ini App Router, bukan Pages Router).
2. `route.ts` **wajib tipis** — isinya cuma: validasi input (Zod dari `lib/schemas/`) →
   panggil fungsi `lib/` → format response. Kalkulasi/logic bisnis **dilarang** ditulis
   langsung di dalam `route.ts`.
3. Fungsi di `lib/` **wajib** fungsi murni sebisa mungkin (terima input, kembalikan output,
   tidak bergantung ke `Request`/`Response` Next.js) — supaya bisa dites tanpa server.
4. `etl/` (Python) **tidak boleh** diimpor atau dipanggil langsung dari kode `app/`/`lib/`
   mana pun. Satu-satunya jalur komunikasi Python ↔ Next.js adalah lewat tabel Supabase.

### 2b. `helper/` vs `lib/` — bedanya apa?

Ini pertanyaan yang paling sering bikin bingung karena dua-duanya "fungsi murni tanpa HTTP".
Bedanya bukan soal *bentuk kode*, tapi soal **apakah fungsinya tahu soal bisnis SIGMAPS atau
tidak**:

| | `helper/` | `lib/` |
|---|---|---|
| Contoh | `hexArea()` (hitung koordinat heksagon dari titik+radius) | `hitungSkorWLC()` (rumus skor SIGMAPS MVP: `100×(0,25·D+0,50·C+0,25·S)`, lihat `context/context-mvp.md` 6.1) |
| Tahu soal data SIGMAPS (skor, arketipe, stasiun)? | **Tidak** — dia akan berfungsi sama persis di project lain manapun | **Ya** — dia dibuat khusus untuk rumus/aturan produk SIGMAPS |
| Boleh dipanggil dari Client Component? | Ya, bebas | Boleh, tapi hanya isi yang memang aman di client (lihat bagian 3) — logic scoring/AI tetap harus lewat server |

Kalau ragu: tanya "kalau fungsi ini saya copy-paste ke project lain yang sama sekali tidak
berhubungan dengan SIGMAPS, apakah dia masih masuk akal dipakai?" — kalau **ya**, taruh di
`helper/`. Kalau **tidak** (karena dia mengandung angka/aturan spesifik SIGMAPS), taruh di
`lib/`.

## 3. Batas Server vs Client Component — wajib dipatuhi

- **Server Component** (default, tanpa `'use client'`): boleh `import` langsung dari
  `lib/supabase/server.ts` dan query database langsung, tanpa `fetch`.
- **Client Component** (ada `'use client'` di baris pertama): **dilarang keras** meng-import
  apa pun dari `lib/supabase/server.ts` atau `lib/ai/`. Wajib ambil data lewat
  `fetch('/api/...')`.
- Kalau ragu satu komponen itu Server atau Client: **default-nya Server**. Tambah
  `'use client'` **hanya** kalau butuh `useState`, `useEffect`, event handler (`onClick`,
  dll), atau library yang butuh `window` (MapLibre GL JS wajib Client Component, di-import
  lewat `dynamic(..., { ssr: false })`).
- Server Component **boleh** merender Client Component sebagai anak dan mengoper data lewat
  props (`<ClientMap stations={data} />`) — ini pola yang **direkomendasikan**, bukan
  di-hindari. Lihat contoh lengkap di bagian 11.

## 4. Environment variable & secret — aturan keamanan wajib

- Variabel **tanpa** prefix `NEXT_PUBLIC_` = server-only, otomatis `undefined` kalau diakses
  dari Client Component. Ini untuk: `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`,
  `MAPID_API_KEY` (Competition API).
- Variabel **dengan** prefix `NEXT_PUBLIC_` = sengaja dibundel ke browser, visible siapa
  saja lewat DevTools. **Hanya** untuk yang memang didesain publik: `NEXT_PUBLIC_MAPID_MAPS_KEY`
  (basemap), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (kalau nanti dipakai).
- **Dilarang keras** hardcode API key/secret langsung di kode — selalu lewat
  `process.env.*`. **Kasus nyata yang baru ditemukan & diperbaiki (31 Agustus 2026):**
  `components/BaseMap.tsx` sempat hardcode key basemap langsung di URL style
  (`?key=6a3255...`). Ini sudah diperbaiki jadi `process.env.NEXT_PUBLIC_MAPID_MAPS_KEY` —
  jadikan ini pengingat: **key yang "aman untuk publik" pun tetap wajib lewat env var**,
  bukan berarti boleh ditulis langsung di kode.
- `.env.local` (atau `.env` — dua-duanya diabaikan git) **tidak pernah** di-commit. Setiap
  penambahan variabel baru **wajib** ditambahkan juga ke **`.env.example`** (tanpa isi
  nilainya) supaya anggota lain tahu variabel itu perlu diminta. File `.env.example` sudah
  dibuat dan **dikecualikan secara eksplisit** di `.gitignore` (`!.env.example`) — pastikan
  pengecualian ini tidak terhapus kalau ada yang mengedit `.gitignore` lagi.
- **Dilarang** memanggil MAPID Competition API (`x-api-key`) atau Gemini API dari kode
  Client Component — keduanya wajib lewat `app/api/*` di server.

## 5. Koneksi Supabase — satu sumber, tidak boleh duplikat

- Hanya ada **satu** file yang boleh memanggil `createClient()` untuk service role:
  `lib/supabase/server.ts`. **Dilarang** bikin `createClient()` baru di file lain
  (termasuk di dalam `route.ts` langsung).
- Kalau nanti butuh client-side Supabase (anon key + RLS), buat di
  `lib/supabase/client.ts` terpisah — jangan campur dengan `server.ts`.
- Sebelum tabel manapun diakses publik (baik lewat Route Handler pakai service role, atau
  nanti lewat anon key), **aktifkan RLS** (`enable row level security`) dan tulis policy
  eksplisit. Tabel tanpa RLS aktif = default-nya bisa diakses penuh oleh siapa saja yang
  tahu anon key (dan anon key memang didesain publik).

## 6. Validasi & error handling — wajib konsisten di semua endpoint

- Setiap `route.ts` **wajib** validasi `request.json()` pakai Zod schema dari
  `lib/schemas/` sebelum diproses. Input tidak valid → `400` dengan pesan jelas.
- **Dilarang** mengirim error mentah (`err.message`, stack trace, detail query SQL) ke
  client. Log detail ke `console.error` di server, kirim pesan generik ke client, status
  `500`.
- Response sukses maupun gagal **wajib** format JSON konsisten: `{ data: ... }` atau
  `{ error: string }` — jangan campur bentuk response antar endpoint.
- Output dari Gemini (AI) **wajib** divalidasi Zod juga sebelum dipakai/ditampilkan — jangan
  pernah percaya output LLM mentah-mentah, walau formatnya "biasanya" benar.

## 7. Aturan penamaan data — WAJIB, sesuai `context/context-final.md`

> ⚠️ **Catatan tim:** bagian ini ditandai "masih argumentable" oleh koordinator — kalau ada
> poin di bawah yang menurutmu perlu didiskusikan ulang, angkat di sesi sinkronisasi,
> **jangan diam-diam diubah sepihak di kode**. Sampai ada keputusan baru tertulis di
> `context/context-final.md`, poin di bawah tetap yang berlaku.

- Nama kolom skor komponen yang **sah dipakai**: `demand`, `temporal_fitness`,
  `competitive_headroom`, `segment_match`, `kde_penalty`.
- Nama lama **dilarang total**, jangan dipakai di kode/skema/variabel manapun:
  `skor_daya_beli`, `skor_jam_pagi`, `skor_kompetisi_kde`.
- **Resolusi H3 = 9** (jangan diubah tanpa keputusan baru tercatat di
  `context/context-final.md`).
- **Skor final (0–100) dan level risiko TIDAK PERNAH disimpan ke database.** Tabel
  `scored_areas`/`scored_cells` hanya berisi komponen (0–1) hasil agregasi. Skor final
  **wajib** dihitung live di `lib/scoring.ts`, dipanggil dari `app/api/score/route.ts`,
  setiap ada request — tidak ada tabel/kolom bernama skor final statis.
- Database: **Supabase** (PostgreSQL + PostGIS) — bukan Neon, tidak untuk didiskusikan
  ulang tanpa keputusan tim tercatat.
- Backend live: **Next.js API Routes** — bukan service Python/FastAPI terpisah.

## 8. Runtime & performa

- Default Node.js runtime untuk semua `route.ts` (jangan set `export const runtime = 'edge'`
  kecuali ada alasan terdokumentasi — banyak library di stack ini, termasuk Supabase client,
  tidak kompatibel penuh dengan Edge runtime).
- Endpoint yang memanggil Gemini (`/api/parse-intent`, `/api/insight`) **wajib** melalui
  `middleware.ts` untuk rate limit per-IP.
- **Batas waktu function Vercel Hobby: default 10 detik, maksimum 60 detik.** Ini alasan
  keras kenapa isokron/H3/KDE **tidak boleh** dihitung di dalam `route.ts` — itu tugas
  pipeline Python offline (lihat `context/context-final.md` bagian 5). Kalau sebuah
  `route.ts` terasa lambat saat dites lokal, itu tanda ada logic berat yang salah tempat,
  bukan sesuatu yang "dioptimasi nanti".
- **Jangan kirim GeoJSON mentah/besar tanpa disederhanakan.** Isokron dan grid H3 bisa besar
  ukurannya — sederhanakan poligon di sisi batch Python (bukan di `route.ts`), dan kirim
  cuma untuk kawasan yang sedang dilihat user, bukan seluruh dataset sekaligus.

## 9. Sebelum menambah dependency atau mengubah arsitektur

Cek dulu apakah keputusan itu sudah ada di `context/context-final.md`. Kalau bertentangan
dengan yang tertulis di sana (misal ganti database, ganti provider AI, ubah resolusi H3),
**jangan diputuskan sepihak** — angkat ke sesi sinkronisasi tim dulu.

## 10. Dokumentasi fitur — WAJIB, ditulis di `docs/`

Setiap kali menambah fitur baru (endpoint API baru, komponen baru yang dipakai halaman lain,
modul baru di `lib/`), **wajib** tambahkan satu file dokumentasi di root folder **`docs/`**
sebelum dianggap selesai/di-merge. Tujuannya: anggota lain (atau kamu sendiri 2 minggu
kemudian) tidak perlu baca kode dulu buat tahu cara pakainya. Lihat juga `docs/README.md`.

**Aturan penamaan file:** `docs/<nama-fitur-kebab-case>.md`, mengikuti path fiturnya. Contoh:
- `app/api/score/route.ts` → `docs/api-score.md`
- `components/BusinessBrief.tsx` → `docs/component-business-brief.md`
- `lib/scoring.ts` → `docs/lib-scoring.md`

**Isi minimal wajib ada di tiap file dokumentasi:**
1. **Apa fungsinya** — satu-dua kalimat.
2. **Cara pakai** — contoh pemanggilan nyata (request/response untuk API, contoh props untuk
   komponen, contoh input/output untuk fungsi `lib/`).
3. **Dependency/prasyarat** — env var yang dibutuhkan, tabel Supabase yang diakses, komponen
   lain yang wajib sudah ada.
4. **Batasan/gotcha** — hal yang gampang salah dipakai (contoh: "jangan panggil ini dari
   Client Component", "field `weights` wajib totalnya sesuai Σw=1").

**Dilarang** menganggap fitur selesai kalau dokumentasinya belum ada — reviewer (siapa pun
yang review PR) berhak menolak merge kalau `docs/` belum diupdate untuk perubahan yang
dibuat.

## 11. Arsitektur peta — Basemap ≠ Layer, wajib dipisah

Basemap (style dasar MAPID MAPS) dan layer-layer produk (isokron, heatmap H3, stasiun,
properti) **bukan satu kesatuan** — keduanya dipisah jadi komponen berbeda yang berbagi satu
map instance yang sama. Ini bukan soal kerapian kode saja, tapi keterbatasan teknis nyata:
membuat ulang instance `maplibregl.Map` itu mahal (flicker, reset zoom/posisi), jadi dia
**wajib dibuat sekali** dan tidak pernah di-remount hanya karena satu layer di-toggle.

**Pembagian tanggung jawab, wajib diikuti:**
- **`components/map/MapProvider.tsx`** — cuma definisi React Context + hook (`useMap()`)
  untuk membagikan map instance ke komponen lain. Tidak tahu apa pun soal MAPID/style.
- **`components/map/BaseMap.tsx`** — membuat instance `maplibregl.Map` (style URL MAPID
  MAPS, key dari `NEXT_PUBLIC_MAPID_MAPS_KEY`) **sekali**, menaruh hasilnya ke context dari
  `MapProvider`. **Dilarang** menerima prop berisi daftar layer — Basemap tidak boleh tahu
  layer apa saja yang aktif.
- **`components/map/layers/*.tsx`** — satu file per layer (isokron, hex-score, stasiun,
  properti). Tiap layer komponennya sendiri, ambil map instance dari `useMap()`, lalu
  menambahkan dirinya sendiri lewat `map.addSource()`/`map.addLayer()` setelah map siap
  (`map.on('load', ...)`). **Dilarang** menaruh logic penambahan layer di dalam
  `BaseMap.tsx`.
- **Toggle nyala/mati layer** wajib pakai `map.setLayoutProperty(id, 'visibility', ...)`
  (operasi murah, tidak remount apa pun). **Dilarang** mencapai efek toggle dengan
  unmount/remount komponen layer atau `BaseMap`.
- **Update data layer** (misal ganti isokron karena user pilih stasiun lain) wajib pakai
  `map.getSource(id).setData(geojsonBaru)` — bukan bikin ulang layer/source.

> **Status per 31 Agustus 2026:** `components/map/BaseMap.tsx` sudah ada dan sudah dipindah
> ke lokasi ini (sebelumnya di `components/BaseMap.tsx`, flat). `MapProvider.tsx` dan
> `layers/*` **belum dibuat** — `BaseMap.tsx` saat ini masih berdiri sendiri (langsung
> dipanggil dari `app/page.tsx` tanpa Provider/Layer), itu wajar untuk tahap foundation,
> tapi begitu layer pertama mulai ditambahkan, pola di atas **wajib** diikuti dari awal —
> jangan tambah `map.addLayer()` langsung di dalam `BaseMap.tsx` "sementara".

**Pola pemakaian di halaman (Server Component tetap bisa merender anak Client Component):**

```tsx
// app/page.tsx — TETAP Server Component, boleh await data langsung
import { MapProvider } from '@/components/map/MapProvider'
import { BaseMap } from '@/components/map/BaseMap'
import { StationLayer } from '@/components/map/layers/StationLayer'

export default async function Page() {
  const stations = await getStations() // Server Component, lewat lib/supabase/server.ts
  return (
    <MapProvider>
      <BaseMap />
      <StationLayer stations={stations} />
    </MapProvider>
  )
}
```

## 12. Penamaan file & konsistensi

Supaya tidak ada gaya campur-campur antar anggota tim:

- **Komponen React** (`components/`, termasuk `components/map/`): `PascalCase.tsx`
  (`BusinessBrief.tsx`, `ScoreCard.tsx`).
- **Route Handler**: selalu nama file `route.ts` (ini konvensi wajib Next.js, tidak bisa
  diganti), yang membedakan endpoint adalah nama **foldernya** (`app/api/score/route.ts`),
  pakai kebab-case untuk nama folder kalau lebih dari satu kata (`app/api/parse-intent/`).
- **File `lib/` dan `helper/`**: `camelCase.ts` untuk file berisi satu fungsi utama
  (`scoring.ts`, `hexArea.ts`), atau nama folder kebab-case untuk grup (`lib/schemas/score.ts`).
- **Environment variable**: selalu `UPPER_SNAKE_CASE`, prefix `NEXT_PUBLIC_` hanya kalau
  memang sengaja publik (lihat bagian 4).
- **Dokumentasi** (`docs/`): kebab-case, lihat bagian 10.

## 13. Aturan ini cuma tulisan — bagaimana benar-benar ditegakkan?

Dokumen ini **tidak otomatis dicek** oleh compiler/linter — semua "wajib"/"dilarang" di atas
masih bergantung disiplin & review manual, dan itu risiko nyata untuk tim besar (aturan
gampang terlewat waktu buru-buru deadline). Kalau kapasitas ada, ini yang layak ditambahkan
belakangan (bukan blocker foundation sekarang, tapi jangan dilupakan):

- **ESLint rule `no-restricted-imports`** untuk memblokir import `lib/supabase/server` dan
  `lib/ai/*` dari file yang punya `'use client'` — supaya pelanggaran bagian 3 ketahuan saat
  `npm run lint`/CI, bukan saat sudah production dan key bocor.
- **Checklist review PR** singkat yang mengutip bagian 6 (validasi Zod ada?) dan bagian 10
  (dokumentasi ditambahkan?) — supaya reviewer tidak perlu hafal semua isi file ini.
- Pertimbangkan **pre-commit hook** yang menolak commit kalau ada string yang terlihat
  seperti API key (regex sederhana) di luar `.env*` — mencegah kasus hardcode key seperti
  yang baru ditemukan di bagian 4 terulang lagi.

Sampai salah satu di atas benar-benar dipasang, **code review manual tetap jadi satu-satunya
garis pertahanan** — jangan asumsikan "aturan sudah ditulis" berarti "aturan pasti diikuti".
