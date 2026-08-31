# Context FINAL — SIGMAPS (MAPID WebGIS Competition 2026)

**Disusun:** 30 Agustus 2026. **Status:** dokumen acuan utama, menggantikan `context.md`
versi 27/28 Agustus 2026 (disimpan di luar repo ini, di folder induk `MAPID/`) untuk seluruh
hal teknis. Disintesis dari: PRD resmi tim (`Kamehameha_SIGMAPS_PRD_MAPID_WebGIS_Competition_
2026.md`), tiga dokumen riset jalur (`docs/jalur1-context.md`, `docs/jalur2-context.md`,
`docs/jalur3-context.md`), draft pengisian PRD (`docs/prd-section9-13-draft.md`), dan
keputusan konflik yang diambil koordinator (Bagas) pada 30 Agustus 2026.

## Aturan utama dokumen ini

Sama seperti tiga dokumen jalur: setiap poin ditandai ✅ **DIPUTUSKAN**, 🔶 **REKOMENDASI
(belum final)**, atau ❓ **PERTANYAAN TERBUKA**. Jangan hapus tag ❓ dan menggantinya dengan
asumsi — bagian 9 merangkum semua yang masih perlu dijawab tim. Dokumen sumber
(`jalur1/2/3-context.md`, PRD) tidak dihapus/digantikan secara fisik — dokumen ini adalah
lapisan sintesis di atasnya. Kalau ada pertentangan antara dokumen ini dan salah satu
dokumen jalur, dokumen ini yang berlaku (karena sudah melalui proses rekonsiliasi konflik).

---

## 1. Ringkasan produk

**SIGMAPS** (Spatial Intelligence & Geography MAPS) — WebGIS analisis spasial + AI untuk
membantu calon pelaku UMKM menemukan lokasi usaha terbaik di kawasan transit massal
Jabodetabek. Tim **Kamehameha** (BINUS University), sudah lolos **Top 50** MAPID WebGIS
Competition 2026 ("Maps That Think! — Mass Transportation Edition").

**Alur produk (need-first, property-last):** pengguna mendeskripsikan rencana usaha dalam
bahasa sehari-hari (Business Brief) → AI menerjemahkan jadi arketipe usaha + bobot parameter
(dapat disunting) → mesin skoring deterministik meranking kawasan stasiun → properti siap
sewa/jual ditampilkan di kawasan hasil rekomendasi teratas.

**Prinsip yang mengunci seluruh desain:** mesin skoring **100% deterministik**, tidak pernah
memanggil AI. AI hanya di titik masuk (menerjemahkan bahasa manusia → parameter) dan titik
keluar (meringkas hasil skoring → narasi).

**Tim (dari PRD):**

| No. | Nama | Peran PRD |
|---|---|---|
| 1 | Clarawita | Project Leader |
| 2 | Bernardus William Santosa | Business/Product Analyst |
| 3 | Clarissa Aditjakra | WebGIS Developer |
| 4 | Clement Nathanael | UI/UX Developer |
| 5 | Dimas Putra Aryawan | Data & AI Analyst |

❓ Pemetaan nama di atas ke "Anggota 1/2/3 Jalur Riset Tech" tidak eksplisit dikonfirmasi di
dokumen manapun (kecuali bahwa koordinator/user berperan sebagai Anggota 1/Jalur 1). Sesuai
arahan koordinator sebelumnya, ini **tidak dipersoalkan lebih lanjut**.

---

## 2. Ruang lingkup (scope) — FINAL setelah keputusan 30 Agustus 2026

✅ **Moda transportasi: KRL, LRT, MRT, dan TransJakarta — keempatnya masuk scope.**
Ini keputusan final terbaru (30 Agustus 2026), **membalik** keputusan sebelumnya di
`context.md` versi 27 Agustus yang sempat mempersempit ke KRL+TransJakarta saja. Ini juga
**membalik** pernyataan eksplisit di `jalur2-context.md` bagian 10 ("MRT dan LRT di luar
cakupan tahap ini") — Jalur 2 **belum tahu** perubahan ini, perlu dikabari karena
mempengaruhi daftar simpul yang dia proses.

✅ **Wilayah studi:** Jabodetabek secara umum untuk cakupan produk; **survey activities**
wajib difokuskan ke 5 kawasan stasiun prioritas di **Tangerang Selatan** (semuanya KRL):

| Stasiun | Moda | Alasan (dari PRD) |
|---|---|---|
| Cisauk | KRL, BSD Link | Node transit antarmoda paling terintegrasi |
| Serpong | KRL | Transisi suburban ↔ perumahan terencana |
| Rawa Buntu | KRL | Hub berbasis kendaraan pribadi, akses tol |
| Sudimara | KRL | Penyangga pemukiman padat |
| Jurangmangu | KRL | Integrasi komersial suburban |

❓ **Daftar pasti "12 simpul/titik transit prioritas"** (disebut di User Flow PRD dan di
`jalur2-context.md` bagian 6) **belum ada di dokumen manapun** — cuma angka "12", dan hanya
5 nama di atas yang eksplisit (itu pun cuma untuk survey, bukan berarti daftar lengkap 12).
Dengan MRT/LRT sekarang ikut masuk scope, daftar ini kemungkinan perlu direvisi/ditambah.
**Jangan diasumsikan 12 = 5 stasiun survey + 7 lainnya yang belum ditentukan** — tanyakan
langsung ke tim mana yang dimaksud.

**In-scope lain (dari PRD, tidak berubah):** Business Brief teks bebas + filter terstruktur,
mesin skoring deterministik, isokron 5&10 menit, agregasi H3, tiga dataset Data Mission
(Struk Go/Menu Go/Property Go) + Community Activity + Katalog MAPID/OSM/BPS, basemap MAPID
MAPS wajib, Scorecard 0–100 + Indeks Risiko Spasial, AI Area Insight, katalog & matriks
perbandingan properti, export PDF, responsif desktop/mobile, akses publik.

**Out-of-scope (dari PRD, tidak berubah):** transaksi sewa/pembayaran di dalam platform,
prediksi omzet/proyeksi keuangan rupiah, estimasi harga sewa (Property Go tidak punya kolom
harga), data tap-in/tap-out real-time operator transit, aplikasi mobile native, model ML
prediktif untuk skor (skor 100% formula deterministik), pembaruan data real-time/streaming.

---

## 3. Data — sumber, akses, dan kondisi nyata

### 3.1 Dataset dasar panitia

| Dataset | Fungsi dalam produk | Batasan penting |
|---|---|---|
| **Properti Go** | Katalog aset siap sewa/jual, ditampilkan setelah kawasan diperingkat | ✅ **Tidak** punya kolom luas, harga, kontak pemilik. **Tidak ada OCR** — semua baca kolom terstruktur. Properti berstatus terjual tidak dihitung. |
| **Struk Go** | Sinyal permintaan riil (D) + profil temporal (T) | ✅ Dikonfirmasi koordinator: **punya jam transaksi**, bukan cuma tanggal (bukan hasil verifikasi data nyata — lihat catatan 3.2). |
| **Menu Go** | Basis kompetitor (C, P_KDE) + daya beli (S), kolom Kondisi Pembeli jadi ground truth validasi | — |
| **Community Activity** | Pengayaan kondisi kawasan (hambatan pejalan kaki, aksesibilitas, keramaian, konektivitas antarmoda), **wajib** dipakai | ✅ Diputuskan (implisit lewat PRD): jadi **lapisan konteks UI saja**, **tidak** masuk formula skor D/T/C/S. Jalur 2 sendiri menyebut opsi ini "paling lemah kalau ditanya juri" — tim sudah pilih opsi ini secara de facto lewat PRD, sadari trade-off-nya. |

### 3.2 Status akses API MAPID — terverifikasi langsung (bukan asumsi)

✅ **API Competition MAPID sudah bisa diakses penuh** (bukan cuma sample 15 titik), dibuktikan
`etl/script.py` yang berhasil fetch 4 endpoint:

| Endpoint | URL | Auth |
|---|---|---|
| Properti Go | `POST server.mapid.io/web/competition/propertigo` | header `x-api-key` |
| Struk Go | `POST server.mapid.io/web/competition/struckgo` | header `x-api-key` |
| Menu Go | `POST server.mapid.io/web/competition/menugo` | header `x-api-key` |
| Activities | `POST server.mapid.io/web/competition/activities` | header `x-api-key` |

🔶 Rate limit per-request ~100 baris/panggilan (disebut di PRD bagian Risiko), diatasi dengan
pagination berulang (sudah diimplementasi di `script.py`). ❓ Kuota harian/menit dari sisi
panitia (di luar batas per-request ini) belum diketahui — belum pernah dites sampai batas.

🔴 **Temuan konkret dari pengecekan langsung file hasil ETL di area pilot Cisauk** (bukan
tebakan — dibuka satu per satu):

| Dataset | Jumlah fitur di Cisauk |
|---|---|
| `cisauk-propertigo.geojson` | 19 |
| `cisauk-menugo.geojson` | **1** (dan field `tanggal` baris itu kosong `{}` — dicek: bukan bug ETL, `script.py` tidak transform apa pun, ini data mentah dari API apa adanya) |
| `isauk-strukgo.geojson` | **0** |
| `cisauk-activity.geojson` | 24 |

**Implikasi:** ini **bukan masalah akses API** (API terbukti merespons normal) — murni data
crowdsourced yang masih sangat tipis di area pilot ini. Konsekuensi: parameter D dan T
(bergantung penuh pada Struk Go) **tidak bisa dihitung dari data nyata di Cisauk sekarang**.
❓ **Belum bisa diverifikasi dari data nyata:** apakah Struk Go benar-benar simpan jam
transaksi (dikonfirmasi koordinator secara keputusan, tapi baris nyata untuk mengecek formatnya
masih nol di area pilot ini) — verifikasi ulang begitu ada data Struk Go nyata masuk (area
lain, atau hasil survey activities).

**Mitigasi yang sudah direncanakan (Jalur 2):** generator data sintetis (2.000 transaksi
palsu dengan pola jam terkontrol) untuk membangun & menguji pipeline sekarang, sambil
menunggu survey activities wajib mengisi data lapangan riil.

### 3.3 Dataset pendukung (dari PRD)

Basemap MAPID MAPS (vector tile langsung ke frontend), Dataset Stasiun (Katalog MAPID, input
batch MAPID Isochrone Tool), Overpass API (jaringan pejalan kaki), Nominatim API (geocoding
alamat survei), Basis data POI MAPID (taksonomi 3 tingkat), Statistik BPS (kepadatan
penduduk usia produktif, survei komuter).

---

## 4. Rencana Survey Activities (wajib, dari PRD)

**Objek yang disurvei:** POI kuliner & ritel dalam isokron 10 menit, unit properti komersial
siap sewa/jual, titik akses pejalan kaki (pintu masuk/keluar, jembatan penyeberangan,
hambatan), Community Activity (kondisi kawasan, keramaian, first/last-mile).

**Ketentuan:** data sesuai kondisi lapangan, koordinat akurat, foto jelas tanpa wajah/plat
nomor, tidak boleh dari Google Street View/internet, wajib divalidasi sebelum dipakai.

**Dedup rule (mencegah hitung ganda dengan Menu Go):** ✅ merchant/properti dianggap objek
sama kalau kedekatan koordinat **< 20 m** dan nama/kategori mirip (dari PRD bagian Data
Processing — Cleaning). Catatan kecil: `jalur2-context.md` menyarankan radius 25 m untuk
aturan serupa — beda angka, tapi bukan konflik substansial, PRD yang final (20 m).

---

## 5. Pipeline pengolahan data & analisis spasial (Jalur 2 — final)

### 5.1 Keputusan stack (final, per `jalur2-context.md` + konfirmasi 30 Agustus)

| Hal | Keputusan | Catatan |
|---|---|---|
| Isokron | **MAPID Isochrone Tool** (profil `foot`, mode batch "Pilih Layer", satuan menit **dan** meter bisa diatur, nilai **300 & 600 detik**) | ✅ **OSMnx dicoret permanen** — dikonfirmasi ulang 30 Agustus. PRD masih menyebut OSMnx di Timeline M2 — **itu bagian PRD yang perlu direvisi tim product**, bukan rencana teknis yang berlaku. |
| Kalibrasi jarak jalan kaki | **MAPID Routing Tool**, 15–20 pasang rute kalibrasi, kecepatan acuan **4,4 km/jam**, faktor detour = median(jarak jaringan/jarak garis lurus), nilai wajar 1,2–1,4 | Routing Tool tidak punya mode batch — hanya untuk kalibrasi, bukan komputasi massal per properti. |
| Unit agregasi | **Uber H3**, `h3-py` | — |
| Resolusi H3 | ✅ **9 — final, dikonfirmasi koordinator 31 Agustus 2026** | Sempat ada rekomendasi pindah ke resolusi 10 (alasan: resolusi 9 cuma hasilkan 9–11 sel/isokron 10 menit, dianggap kasar untuk k-ring smoothing, persentil ke-75, dan bandwidth KDE 250 m). **Rekomendasi itu ditolak** — tim tetap pakai resolusi 9 sesuai PRD. Jangan diubah lagi tanpa keputusan baru dari koordinator/Jalur 2. |
| KDE (kejenuhan pasar) | **scikit-learn `KernelDensity`**, kernel gaussian, bandwidth **200–300 m** | Wajib proyeksi ke meter (**EPSG:32748**, UTM 48S) sebelum dihitung; `score_samples` hasil log-densitas wajib `np.exp`; wajib dikalikan jumlah titik kompetitor (densitas KDE murni berupa probabilitas, totalnya selalu 1). |
| Normalisasi | **Berbasis persentil** (bukan min-max) | Min-max dicoret: satu pencilan menekan seluruh sel lain. |
| Agregasi sel → kawasan | **Persentil ke-75** | Bukan rata-rata — user tidak menyewa di sel rata-rata. |
| Verifikasi silang | MAPID Grid Tool (mode Titik+Poligon, segi enam) + QGIS | Cuma pembanding visual — **tidak** dipakai sebagai sumber tabel (tidak punya `h3_index` global, tidak reproducible). |
| Perkakas | GeoPandas, Shapely, h3-py, scikit-learn, scipy (`find_peaks`), NumPy, QGIS | Seluruhnya open source. |

### 5.2 Formula skoring — FINAL (dari `jalur2-context.md` + dikonfirmasi identik di PRD)

```
Skor Kesesuaian = 100 × (w1·D + w2·T + w3·C + w4·S) − λ·P_KDE     (Σw = 1)
```

| Simbol | Nama baku | Arti | Sumber |
|---|---|---|---|
| D | `demand` | Intensitas transaksi pada sel & tetangga (k-ring radius 1) | Struk Go |
| T | `temporal_fitness` | Proporsi transaksi kawasan yang jatuh di jam operasional rencana usaha | Struk Go |
| C | `competitive_headroom` | Ruang kompetisi tersisa pada kategori sejenis | Menu Go + survei |
| S | `segment_match` | Kecocokan median harga menu kawasan vs rentang harga segmen sasaran | Menu Go |
| P_KDE | `kde_penalty` | Densitas pesaing sekategori (KDE) | Menu Go + survei |

✅ **Nama kolom lama dilarang eksplisit** oleh Jalur 2: `skor_daya_beli`, `skor_jam_pagi`,
`skor_kompetisi_kde` — **jangan dipakai lagi di mana pun**, termasuk kode/skema yang mungkin
masih mengacu ke nama itu.

**Bobot arketipe (sudah diisi PRD — ini progres yang belum tercatat balik ke `jalur2-context.md`,
yang masih menandainya "keputusan tertunda #5"):**

| Arketipe | w1 (D) | w2 (T) | w3 (C) | w4 (S) |
|---|---|---|---|---|
| Bisnis Arus (mengandalkan lalu-lalang) | 0,35 | 0,30 | 0,20 | 0,15 |
| Bisnis Tujuan (didatangi khusus) | 0,20 | 0,15 | 0,30 | 0,35 |
| Bisnis Harian (kebutuhan rutin) | 0,25 | 0,25 | 0,25 | 0,25 |

❓ λ (koefisien penalti KDE) **belum dikalibrasi** — masih menunggu grid search Jalur 2.
Jangan tulis angka final di PRD/kode sebelum ini selesai.

### 5.3 Skema keluaran (satu baris per sel H3, final dari Jalur 2)

```
h3_index, station_id, isochrone_band (300/600), demand, temporal_fitness,
competitive_headroom, segment_match, kde_penalty, ritme (first_mile/last_mile/
midday/data_terbatas), kontribusi_* (kontribusi tiap variabel ke skor akhir),
n_struk (jumlah sampel, penanda data_terbatas jika <30)
```

Di database (Supabase), ini masuk kelompok tabel `scored_*` (sesuai konvensi PRD:
`scored_cells`, `scored_areas`, `scored_properties`).

**Prinsip kunci — konflik `scored_areas` DISELESAIKAN 30 Agustus 2026, mengikuti riset
Jalur 2 apa adanya (bukan angka statis 0–100 yang sempat tersirat di PRD):**

`scored_areas` **bukan** tabel skor final 0–100 + level risiko yang disimpan permanen. Yang
disimpan di `scored_areas` adalah **agregasi komponen per kawasan** — hasil Tahap 5 pipeline
Jalur 2 ("Normalisasi persentil ke rentang 0–1 untuk tiap komponen"), yaitu nilai `demand`,
`temporal_fitness`, `competitive_headroom`, `segment_match`, `kde_penalty` yang sudah
diringkas dari level sel (H3) ke level kawasan/stasiun lewat **persentil ke-75** (bukan
skor akhir, komponen-nya saja) — struktur mirip `scored_cells` tapi satu baris per
`(station_id, isochrone_band)`, bukan per `h3_index`.

Skor akhir 0–100 dan level risiko **tidak pernah ditulis ke tabel manapun** — keduanya
**dihitung live** di Next.js API Route saat ada request, dengan mengalikan komponen di
`scored_areas` dengan bobot arketipe (atau bobot hasil edit pengguna) dan menjumlahkannya
sesuai formula bagian 5.2. Ini bukan interpretasi — ini kutipan langsung prinsip Jalur 2 di
`jalur2-context.md` bagian 12: *"Simpan skor komponen, bukan skor final. Bobot berubah
tergantung arketipe pengguna, jadi skor final dihitung saat request. Kalau menyimpan skor
final, seluruh tabel harus dihitung ulang setiap ada pengguna baru."* Prinsip ini berlaku
sama persis di level kawasan seperti di level sel — tidak ada pengecualian untuk
`scored_areas`.

**Konsekuensi ke PRD:** kalimat PRD bagian 7.4 ("scored_areas — skor 0–100 dan level
risiko") **perlu direvisi** jadi "scored_areas — komponen D/T/C/S/P_KDE teragregasi
persentil ke-75 per kawasan; skor 0–100 dan level risiko dihitung live oleh backend saat
request, tidak disimpan di tabel ini."

### 5.4 Dua fungsi AI batch (milik Jalur 2, bukan runtime)

1. **Normalisasi semantik kategori merchant** — teks nama merchant/menu → kategori baku.
2. **Klasifikasi Community Activity** — narasi bebas → tag terstruktur (hambatan pejalan
   kaki, aksesibilitas, keramaian, konektivitas antarmoda).

Keduanya wajib output JSON tervalidasi skema (enum tertutup), bukan kategori bebas.

### 5.5 Validasi model

Korelasi Spearman (skor sel vs Kondisi Pembeli Menu Go sebagai ground truth), confusion
matrix (klasifikasi arketipe & normalisasi kategori), uji holdout (1–2 simpul disisihkan),
grid search (kalibrasi λ dan bandwidth KDE). Opsional: Moran's I (`esda`) untuk uji
autokorelasi spasial skor.

---

## 6. Database & backend (Jalur 1 — final)

### 6.1 Database

✅ **Supabase (PostgreSQL + PostGIS)** — dikonfirmasi tetap dipakai 30 Agustus 2026 (sempat
ada rekomendasi pindah ke Neon dari Jalur 3, ditolak koordinator).

✅ **Konsekuensi wajib:** heartbeat harian via GitHub Actions (query ringan tiap hari) supaya
project tidak di-pause otomatis setelah 7 hari idle — kalender lomba (submisi → Top 10 →
final) melewati jeda itu. **Status: belum dibuat.**

✅ Tabel `properti_go` sudah jalan end-to-end: kolom `geom geometry(Point,4326) generated
always as (ST_SetSRID(ST_MakePoint(lng,lat),4326)) stored`, index GiST, data 19 baris area
Cisauk sudah ter-upload lewat `etl/load_supabase.py`.

❓ Tabel Struk Go/Menu Go/Activity **belum dibuat** di Supabase (baru file `.geojson` hasil
ETL, belum ada loader ke DB).

❓ **RLS belum diaktifkan** di `properti_go` — 🔶 rekomendasi: `enable row level security`
+ policy `SELECT` publik, `INSERT/UPDATE/DELETE` hanya lewat service role key.

❓ **Jenis `SUPABASE_KEY` yang dipakai sekarang** (anon vs service role) — belum dicek/dicatat.

❓ **Region project Supabase** — belum dicek apakah Singapura (relevan untuk latensi).

### 6.2 Backend live (arsitektur request saat pengguna akses web)

✅ **Next.js API Routes** — satu deployment sama dengan frontend, **bukan** backend Python
terpisah (FastAPI dsb). Ini sekarang dikonfirmasi dari **tiga sumber independen** yang
sepakat: rekomendasi riset Jalur 1, rekomendasi riset Jalur 3 (alasan cold start Python di
free tier), dan pernyataan eksplisit PRD ("Backend hanya melakukan penjumlahan berbobot.
Tidak ada rumus yang diduplikasi di dua bahasa"). Status: cukup kuat untuk dianggap final,
tinggal konfirmasi resmi di sesi sinkronisasi.

**Tugas Next.js API Routes:**
1. Proxy panggilan ke Gemini (parsing Business Brief, narasi AI Area Insight) — key
   tersembunyi di server.
2. Baca skor komponen dari Supabase, hitung WLC pakai bobot arketipe/hasil edit pengguna.
3. Spatial join Properti Go ke kawasan terpilih (`ST_Within`/`ST_DWithin`).

✅ **Diselesaikan, dikonfirmasi ulang 31 Agustus 2026** (lihat detail penuh di bagian 5.3):
skor final kawasan **selalu dihitung live** di langkah ke-2 di atas, untuk arketipe preset
**maupun** bobot hasil edit manual pengguna — tidak ada jalur "pra-hitung skor final" sama
sekali. `scored_areas` cuma menyimpan komponen teragregasi (persentil ke-75), bukan skor
0–100.

---

## 7. Frontend & AI (Jalur 3 — final)

### 7.1 Stack

✅ **Next.js (App Router) + MapLibre GL JS + Turf.js.** Turf **hanya** untuk operasi ringan
sisi klien (highlight titik dalam polygon, zoom ke bounds, jarak garis lurus label, centroid)
— **bukan** untuk isokron/buffer, itu tetap 100% di Python/MAPID Tool.

✅ **Basemap MAPID MAPS** — endpoint GL Style/TileJSON/WMTS/XYZ, key publik `?key=` (boleh
di client, beda dari key Competition `x-api-key` yang wajib server-side). MapLibre wajib
`'use client'` + `dynamic(..., {ssr:false})`; instance map disimpan di `useRef` bukan
`useState`.

### 7.2 AI (Gemini)

✅ **Google Gemini** via Google AI Studio (free tier), **Vercel AI SDK** (`ai` +
`@ai-sdk/google`) + **Zod** untuk validasi skema output (`generateObject`).

🔶 Model: `gemini-2.5-flash-lite` untuk parse intent & filter (task terstruktur, tidak perlu
model besar), `gemini-2.5-flash` untuk narasi insight. Nama model **wajib** di environment
variable (Google merotasi model cepat).

✅ **Empat titik sentuh AI** (bukan dua seperti proposal lama): 2 batch (milik Jalur 2, lihat
5.4) + 2 runtime (parse Business Brief, narasi AI Area Insight — milik Jalur 3/backend).

🔴 **Aksi wajib, belum dikerjakan:** skema Zod `IntentSchema` di `jalur3-context.md` masih
pakai nama lama yang sudah dilarang (`w_daya_beli`, `w_jam_puncak`, `w_kompetisi`, cuma 3
bobot). **Harus direvisi** jadi 4 bobot dengan nama baku Jalur 2 (`w1`–`w4` mengacu ke
`demand/temporal_fitness/competitive_headroom/segment_match`), sesuai formula final di
bagian 5.2. Ini perlu dikabari eksplisit ke Anggota 3 — belum dikerjakan per dokumen
terakhir yang diserahkan.

**Rate limit Gemini:** berlaku **per project**, bukan per key (WebGIS publik berbagi satu
kuota); RPD reset tengah malam Pasifik (~14.00–15.00 WIB). Mitigasi wajib: cache narasi per
(kawasan × arketipe) di DB, rate limit per IP, degradasi anggun (peta/skor/filter manual
tetap jalan kalau AI mati).

### 7.3 Kontrak data (ringkas — detail lengkap di `jalur3-context.md` §3)

```
POST /api/score    { weights: {...} } → { areas: [{ station_id, station_name, score,
                     risk_level, components: {...}, isochrone_5min, isochrone_10min,
                     property_count }] }
GET  /api/properties?station_id=... → FeatureCollection (sudah difilter dalam isokron)
```

`property_count` sengaja ikut di response ranking supaya UI bisa tandai kawasan skor tinggi
tanpa properti **sebelum** diklik (state kosong eksplisit, bukan panel kosong seperti bug —
ini juga jadi mitigasi risiko "zero listing" di PRD bagian Risiko).

### 7.4 Fitur produk & Acceptance Criteria (dari PRD, tidak berubah)

Business Brief, Peringkat Kawasan Stasiun, Peta isokron 5&10 menit, Heatmap kejenuhan pasar,
Scorecard & dekomposisi skor, AI Area Insight (klik statement → sorot data di peta), Katalog
properti terintegrasi (Top 5), Matriks perbandingan 2–3 properti, Export ringkasan PDF.
Acceptance criteria detail: lihat PRD section 8 (waktu respons: Business Brief <5 detik,
ranking <3 detik, AI Insight <10 detik).

---

## 8. Deployment (final — lihat juga `docs/prd-section9-13-draft.md` untuk versi siap-tempel PRD)

| Komponen | Tempat | Status |
|---|---|---|
| Next.js (UI + API Routes) | **Vercel Hobby** | ✅, 🔶 perlu diverifikasi repo bukan GitHub organization (`github.com/diuta/sigmaWebgis` — ❓ belum dicek personal/org) |
| PostgreSQL + PostGIS | **Supabase** (bukan Neon) | ✅ final, ❓ heartbeat & RLS belum dibuat, ❓ region belum dicek |
| Batch Python | Lokal / GitHub Actions (`schedule:` + `workflow_dispatch`) | ✅, tidak di-deploy sebagai service selalu-hidup |
| AI | Google AI Studio (Gemini, free tier) | ✅ |

🔶 Region Vercel function disarankan disamakan dengan region Supabase (idealnya Singapura)
untuk latensi — bergantung hasil cek region Supabase di atas.

---

## 9. Konflik & pertanyaan terbuka yang BELUM terjawab (rekap final)

Diurutkan dari yang paling mendesak/berdampak struktural:

1. ✅ ~~`scored_areas` — pra-hitung atau live?~~ **Selesai** (lihat bagian 5.3 & 6.2): tidak
   ada skor 0–100 yang disimpan statis di tabel manapun. `scored_areas` cuma menyimpan
   komponen D/T/C/S/P_KDE teragregasi persentil ke-75 per kawasan; skor akhir + level risiko
   selalu dihitung live di Next.js API Route, untuk arketipe preset maupun bobot hasil edit
   pengguna. PRD bagian 7.4 perlu direvisi mengikuti rumusan ini.
2. ❓ **Kunci gabungan `(h3_index, station_id)`** — Jalur 2 minta ini disepakati dengan
   Jalur 1 sebelum tabel `scored_cells` dibuat (satu sel bisa masuk isokron 2 stasiun
   berdekatan). Belum ada konfirmasi eksplisit dari Jalur 1.
3. ❓ **`competitive_headroom` per kategori usaha atau generik?** Bagian metode Jalur 2
   bilang C "difilter per kategori, berubah tergantung arketipe", tapi skema keluaran final
   cuma satu kolom generik per sel — potensi inkonsistensi di dalam dokumen Jalur 2 sendiri.
4. ❓ **Daftar pasti simpul dalam scope** (12? lebih, karena MRT/LRT baru masuk?) — cuma 5
   nama stasiun KRL Tangsel yang eksplisit (itu pun untuk survey, bukan daftar lengkap).
5. ✅ ~~Resolusi H3: 9 vs 10~~ **Selesai** — dikonfirmasi koordinator 31 Agustus 2026: tetap
   **resolusi 9** sesuai PRD, rekomendasi pindah ke 10 ditolak.
6. ❓ λ (koefisien penalti KDE) belum dikalibrasi — masih grid search.
7. ❓ Jenis `SUPABASE_KEY` (anon/service role) dan region project Supabase — belum dicek.
8. ❓ Repo `sigmaWebgis` — akun personal atau GitHub organization? (Blocking untuk Vercel
   Hobby kalau ternyata organization.)
9. ❓ Slot Community Activity di formula — PRD sudah memilih "konteks UI saja" (bukan
   variabel skor), tapi Jalur 2 menyebut ini opsi "paling lemah kalau ditanya juri" — sadari
   trade-off ini, bukan berarti harus diubah, tapi siapkan jawaban kalau ditanya.
10. ❓ **Skema Zod Jalur 3 (`IntentSchema`) belum direvisi** mengikuti nama kolom final Jalur
    2 — masih 3 bobot nama lama, seharusnya 4 bobot nama baku. Aksi: kabari Anggota 3.
11. ❓ Verifikasi Struk Go simpan jam transaksi dari **data nyata** (bukan cuma konfirmasi
    lisan) — pilot Cisauk masih nol baris Struk Go, cek ulang begitu ada data nyata masuk.
12. ❓ Cakupan Menu Go dibanding kepadatan riil (dicek via OSM POI) — belum dilakukan.
13. ❓ Kepemilikan Jalur 2 (William vs Dimas) — **sengaja tidak dipersoalkan** atas arahan
    koordinator, dicatat di sini hanya supaya tidak hilang sebagai keputusan sadar, bukan
    lupa dibahas.
14. ⏭️ **Realisme timeline PRD** (M1–M5) — **sengaja tidak dibahas** atas arahan koordinator.

---

## 10. Log keputusan konflik (30 Agustus 2026)

| # | Konflik | Keputusan |
|---|---|---|
| 1 | OSMnx vs MAPID Isochrone Tool | ✅ MAPID Isochrone Tool, OSMnx dicoret permanen. PRD Timeline M2 perlu direvisi tim product. |
| 2 | Resolusi H3: 9 vs 10 | ✅ Tetap **9** (dikonfirmasi ulang 31 Agustus 2026) — rekomendasi pindah ke 10 dipertimbangkan tapi ditolak. |
| 3 | Scope moda: KRL+TJ saja vs +MRT+LRT | ✅ Keempat moda masuk scope — reverses keputusan sebelumnya. |
| 4 | Skema Zod Jalur 3 vs penamaan final Jalur 2 | ✅ Ikuti Jalur 2 (final), Jalur 3 perlu revisi skemanya. |
| 5 | Kepemilikan Jalur 2 (William/Dimas) | ⏭️ Diabaikan atas arahan koordinator. |
| 6 | Struk Go simpan jam atau cuma tanggal | ✅ Dikonfirmasi koordinator: simpan jam. Verifikasi data nyata masih tertunda (lihat §9.11). |
| 7 | Database: Supabase vs Neon | ✅ Tetap Supabase + heartbeat wajib (diputuskan sebelum sesi ini, dicatat ulang untuk kelengkapan). |
| 8 | Realisme timeline PRD | ⏭️ Tidak dibahas atas arahan koordinator. |
| 9 | `scored_areas` — skor final statis 0–100 vs komponen live | ✅ Ikuti riset Jalur 2 apa adanya: **tidak ada** skor final statis. `scored_areas` cuma simpan komponen teragregasi persentil ke-75; skor 0–100 + level risiko dihitung live di Next.js API Route. PRD 7.4 perlu direvisi. Dikonfirmasi ulang 31 Agustus 2026. |

---

## 11. Referensi

- `Kamehameha_SIGMAPS_PRD_MAPID_WebGIS_Competition_2026.md` — PRD resmi tim (di `~/Downloads`).
- `docs/jalur1-context.md` — riset Data, Basis Data & Backend (Anggota 1/koordinator).
- `docs/jalur2-context.md` — riset Analisis Spasial & Mesin Skoring.
- `docs/jalur3-context.md` — riset Frontend, AI, Deployment.
- `docs/prd-section9-13-draft.md` — draft siap-tempel untuk PRD Section 9 & 13.
- `context.md` (folder induk `MAPID/`, di luar repo ini) — versi lama, sudah digantikan
  dokumen ini untuk seluruh keputusan teknis; masih relevan untuk detail administratif
  kompetisi (onboarding Top 50, dll) yang tidak diulang di sini.
- Kode: `etl/script.py`, `etl/load_supabase.py`, tabel `properti_go` di Supabase.
