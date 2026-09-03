# Context FINAL — SIGMAPS (MAPID WebGIS Competition 2026)

**Disusun:** 30 Agustus 2026, direvisi 2–3 September 2026. **Status:** dokumen acuan utama
untuk seluruh keputusan teknis & produk SIGMAPS di luar scope MVP. Disintesis dari: PRD
resmi tim, riset teknis ketiga jalur, dan keputusan konflik yang diambil koordinator.

🔄 **Untuk scope MVP 5 hari, `context/context-mvp.md` yang berlaku bila bertentangan dengan
dokumen ini** — lihat catatan 🔄 yang ditambahkan di seluruh dokumen ini pada bagian yang
sudah diganti/dicabut untuk MVP. Bagian yang tidak ditandai 🔄 tetap berlaku penuh, baik
untuk MVP maupun rencana produk pasca-MVP.

## Aturan utama dokumen ini

Setiap poin ditandai ✅ **DIPUTUSKAN**, 🔶 **REKOMENDASI (belum final)**, atau ❓
**PERTANYAAN TERBUKA**. Jangan hapus tag ❓ dan menggantinya dengan asumsi — bagian 9
merangkum semua yang masih perlu dijawab tim, dan bagian penutup dokumen ini merangkum apa
saja yang perlu diputuskan sebelum dokumen ini bisa dianggap 100% final.

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
Ini keputusan final terbaru (30 Agustus 2026), **membalik** keputusan sebelumnya yang sempat
mempersempit ke KRL+TransJakarta saja.

❓ **Belum diputuskan/dikonfirmasi:** apakah Jalur 2 (pemilik riset spasial & daftar simpul)
sudah tahu dan menyesuaikan pekerjaannya dengan perubahan scope ini — riset spasial
sebelumnya berjalan dengan asumsi MRT/LRT di luar cakupan. Perlu dikonfirmasi langsung ke
Jalur 2 karena ini mempengaruhi daftar simpul yang mereka proses.

✅ **Wilayah studi:** Jabodetabek secara umum untuk cakupan produk; **survey activities**
wajib difokuskan ke 5 kawasan stasiun prioritas di **Tangerang Selatan** (semuanya KRL):

🔄 **Untuk MVP** (`context-mvp.md` 2): kawasan yang benar-benar diskor & disurvei berpindah
ke **DKI Jakarta** (klaster Menu Go terbesar ada di Tanah Abang, Sudirman, koridor Sawah
Besar–Juanda), menggantikan 5 stasiun Tangsel di bawah — alasannya Menu Go (sumber tunggal D
dan S) menumpuk di Jakarta dan nyaris nol di Tangsel. Cakupan produk tetap Jabodetabek,
tabel 5 stasiun di bawah tetap berlaku sebagai rencana produk penuh pasca-MVP.

| Stasiun | Moda | Alasan (dari PRD) |
|---|---|---|
| Cisauk | KRL, BSD Link | Node transit antarmoda paling terintegrasi |
| Serpong | KRL | Transisi suburban ↔ perumahan terencana |
| Rawa Buntu | KRL | Hub berbasis kendaraan pribadi, akses tol |
| Sudimara | KRL | Penyangga pemukiman padat |
| Jurangmangu | KRL | Integrasi komersial suburban |

❓ **Daftar pasti "12 simpul/titik transit prioritas"** (disebut di User Flow PRD)
**belum ada di dokumen manapun** — cuma angka "12", dan hanya
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
| **Struk Go** | ~~Sinyal permintaan riil (D) + profil temporal (T)~~ | 🔄 **Diperbarui mengikuti `context-mvp.md` Bagian 7:** verifikasi data nyata (bukan lagi cuma konfirmasi lisan) menemukan **Struk Go mati** — dari 100 sampel se-Jabodetabek, kolom `tanggal` kosong `{}` di 100 dari 100 baris, dan tidak ada kolom nominal transaksi. Struk Go **tidak dipakai lagi** sebagai sumber D maupun T untuk MVP. D sekarang bersumber dari `kondisi_tempat` Menu Go + survei tim (lihat `context-mvp.md` 6.2), dan T dicabut dari formula MVP sepenuhnya. |
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

~~**Mitigasi yang sudah direncanakan (Jalur 2):** generator data sintetis (2.000 transaksi
palsu dengan pola jam terkontrol) untuk membangun & menguji pipeline sekarang, sambil
menunggu survey activities wajib mengisi data lapangan riil.~~

🔄 **Diperbarui mengikuti `context-mvp.md` Bagian 8:** generator data sintetis untuk Struk Go
**dicabut**. Karena Struk Go terkonfirmasi mati (lihat catatan di tabel 3.1), D untuk MVP
dibangun langsung dari `kondisi_tempat` Menu Go + survei tim yang datanya sudah nyata
tersedia, bukan dari data sintetis.

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

**Dedup rule (mencegah hitung ganda dengan Menu Go):** ~~merchant/properti dianggap objek
sama kalau kedekatan koordinat **< 20 m** dan nama/kategori mirip (dari PRD bagian Data
Processing — Cleaning).~~

🔄 **Dicabut mengikuti `context-mvp.md` 6.9:** aturan dedup jarak/nama di atas tidak berlaku
lagi untuk MVP. Bila anggota tim mensurvei tempat yang sudah ada di Menu Go, hasilnya
dihitung sebagai **dua pengamatan terpisah** (dua observasi keramaian pada waktu berbeda),
bukan digabung jadi satu baris.

---

## 5. Pipeline pengolahan data & analisis spasial (Jalur 2 — final)

### 5.1 Keputusan stack (final, dikonfirmasi 30 Agustus 2026)

| Hal | Keputusan | Catatan |
|---|---|---|
| Isokron | **MAPID Isochrone Tool** (profil `foot`, mode batch "Pilih Layer", satuan menit **dan** meter bisa diatur, nilai **300 & 600 detik**) | ✅ **OSMnx dicoret permanen** — dikonfirmasi ulang 30 Agustus. PRD masih menyebut OSMnx di Timeline M2 — **itu bagian PRD yang perlu direvisi tim product**, bukan rencana teknis yang berlaku. 🔄 **Untuk MVP** (`context-mvp.md` 2): hanya isokron **10 menit** yang dipakai, isokron 5 menit dicabut dari formula & UI. |
| Kalibrasi jarak jalan kaki | **MAPID Routing Tool**, 15–20 pasang rute kalibrasi, kecepatan acuan **4,4 km/jam**, faktor detour = median(jarak jaringan/jarak garis lurus), nilai wajar 1,2–1,4 | Routing Tool tidak punya mode batch — hanya untuk kalibrasi, bukan komputasi massal per properti. |
| Unit agregasi | **Uber H3**, `h3-py` | 🔄 **Tidak dipakai untuk MVP** (`context-mvp.md` 4): skoring MVP di level kawasan/stasiun langsung dari `scored_areas`, tanpa agregasi sel H3 maupun `scored_cells`. Tetap berlaku untuk rencana produk penuh pasca-MVP. |
| Resolusi H3 | ✅ **9 — final, dikonfirmasi koordinator 31 Agustus 2026** | Sempat ada rekomendasi pindah ke resolusi 10 (alasan: resolusi 9 cuma hasilkan 9–11 sel/isokron 10 menit, dianggap kasar untuk k-ring smoothing, persentil ke-75, dan bandwidth KDE 250 m). **Rekomendasi itu ditolak** — tim tetap pakai resolusi 9 sesuai PRD. Jangan diubah lagi tanpa keputusan baru dari koordinator/Jalur 2. Berlaku untuk H3 pasca-MVP; **tidak dipakai sama sekali di MVP** (baris di atas). |
| KDE (kejenuhan pasar) | ~~**scikit-learn `KernelDensity`**, kernel gaussian, bandwidth **200–300 m**~~ | 🔄 **Dicabut untuk MVP** (`context-mvp.md` 4 & 8): tidak ada `kde_penalty`/KDE/scikit-learn/EPSG:32748 di pipeline MVP. Kolom `kde_penalty` di `scored_areas` MVP selalu `NULL`. Tetap berlaku sebagai rencana produk penuh pasca-MVP. |
| Normalisasi | ~~**Berbasis persentil** (bukan min-max)~~ | 🔄 **Diganti untuk MVP** (`context-mvp.md` 6.3): normalisasi komponen C sekarang **min-max dengan pemotongan pencilan persentil ke-5/95**, bukan persentil murni — alasannya di level kawasan (5 kawasan) persentil murni cuma menghasilkan 5 nilai seragam yang tidak mencerminkan kenyataan. Persentil murni tetap berlaku untuk skoring level sel H3 pasca-MVP. |
| Agregasi sel → kawasan | ~~**Persentil ke-75**~~ | 🔄 **Tidak berlaku untuk MVP** (`context-mvp.md` 4): MVP tidak beragregasi dari sel H3 ke kawasan — `scored_areas` MVP diisi langsung dari spatial join pengamatan ke poligon isokron kawasan (6.9), bukan dari sel H3. Tetap berlaku untuk `scored_cells` pasca-MVP. |
| Verifikasi silang | MAPID Grid Tool (mode Titik+Poligon, segi enam) + QGIS | Cuma pembanding visual — **tidak** dipakai sebagai sumber tabel (tidak punya `h3_index` global, tidak reproducible). |
| Perkakas | GeoPandas, Shapely, h3-py, scikit-learn, scipy (`find_peaks`), NumPy, QGIS | Seluruhnya open source. 🔄 Untuk pipeline batch MVP, `h3-py` dan `scikit-learn` **tidak dipakai** (lihat baris Unit agregasi & KDE di atas); tetap relevan untuk pipeline penuh pasca-MVP. |

### 5.2 Formula skoring — rencana produk penuh (lihat catatan MVP di bawah)

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

**Bobot arketipe (sudah diisi PRD, dianggap final untuk rencana produk penuh):**

| Arketipe | w1 (D) | w2 (T) | w3 (C) | w4 (S) |
|---|---|---|---|---|
| Bisnis Arus (mengandalkan lalu-lalang) | 0,35 | 0,30 | 0,20 | 0,15 |
| Bisnis Tujuan (didatangi khusus) | 0,20 | 0,15 | 0,30 | 0,35 |
| Bisnis Harian (kebutuhan rutin) | 0,25 | 0,25 | 0,25 | 0,25 |

❓ λ (koefisien penalti KDE) **belum dikalibrasi** — masih menunggu grid search Jalur 2.
Jangan tulis angka final di PRD/kode sebelum ini selesai.

---

🔄 **Formula MVP — mengikuti `context-mvp.md` 6.1–6.5, menggantikan formula di atas untuk
scope MVP:**

```
skor = 100 × (0,25·D + 0,50·C + 0,25·S)
```

Bukan 4 variabel + penalti KDE seperti di atas, melainkan 3 variabel: `demand`,
`competitive_headroom`, `segment_match`. `temporal_fitness` (T) dan `kde_penalty` (P_KDE)
**dicabut dari formula MVP** — bukan karena rumusnya salah, tapi karena sumber datanya
(Struk Go untuk T, KDE untuk P_KDE) tidak layak dibangun dalam sisa waktu MVP (lihat catatan
Struk Go di 3.1 dan baris KDE di 5.1).

Bobot MVP **tunggal, bukan per-arketipe** — tabel tiga arketipe (Bisnis Arus/Tujuan/Harian)
di atas **tidak dipakai untuk MVP**: empat set bobot diuji pada data yang sama dan
peringkatnya identik di seluruh baris uji (rentang C 14× lebih lebar dari D), sehingga
dipilih satu bobot 0,25 D : 0,50 C : 0,25 S dari rasio 2:1 studi AHP-TOPSIS (lihat
`context-mvp.md` 6.5 untuk detail dan rujukan). λ juga tidak relevan lagi untuk MVP karena
P_KDE dicabut. Formula & tabel bobot arketipe di atas tetap berlaku sebagai rencana produk
penuh pasca-MVP, bukan dihapus permanen.

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
sesuai formula bagian 5.2. Prinsip yang berlaku: *"Simpan skor komponen, bukan skor final.
Bobot berubah tergantung arketipe pengguna, jadi skor final dihitung saat request. Kalau
menyimpan skor final, seluruh tabel harus dihitung ulang setiap ada pengguna baru."* Prinsip
ini berlaku sama persis di level kawasan seperti di level sel — tidak ada pengecualian untuk
`scored_areas`. **Prinsip "skor akhir tidak pernah disimpan" ini tetap berlaku untuk MVP**,
lihat skema konkret MVP di bawah.

**Konsekuensi ke PRD:** kalimat PRD bagian 7.4 ("scored_areas — skor 0–100 dan level
risiko") **perlu direvisi** jadi "scored_areas — komponen D/T/C/S/P_KDE teragregasi
persentil ke-75 per kawasan; skor 0–100 dan level risiko dihitung live oleh backend saat
request, tidak disimpan di tabel ini."

---

🔄 **Skema `scored_areas` MVP — final, menggantikan skema di atas untuk scope MVP**
(`context-mvp.md` 6.7). Bukan hasil agregasi persentil ke-75 dari sel H3 seperti
dideskripsikan di atas, melainkan diisi langsung lewat spatial join pengamatan ke poligon
isokron kawasan (`context-mvp.md` 6.9) — satu baris per kawasan/stasiun, bukan per
`(station_id, isochrone_band)`. Bagian dari ERD MVP lengkap **enam tabel** (`stasiun`,
`scored_areas`, `menu_go`, `katalog_restoran`, `properti_go`, `community_activity`) — detail
penuh tiap kolom ada di `context/dokumentasi-erd-mvp.md`, ground truth data/ERD MVP sejak 4
September 2026 (menang atas selisih detail kecil di dokumen ini):

```sql
create table stasiun (
  station_id  text primary key,
  nama        text not null,
  tipe        text,
  alamat      text,
  kecamatan   text,
  kabkot      text,
  geom        geometry(Point, 4326) not null
);

create table scored_areas (
  area_id            text primary key,
  station_id         text not null references stasiun(station_id),
  station_name       text not null,
  geom               geometry(Polygon, 4326) not null,
  area_km2           double precision not null,

  demand             double precision,
  n_observations     integer not null default 0,
  price_median       integer,
  n_price            integer not null default 0,

  competitor_counts  jsonb not null default '{}'::jsonb,
  total_restaurants  integer not null default 0,

  temporal_fitness   double precision,          -- selalu NULL di MVP
  kde_penalty        double precision,          -- selalu NULL di MVP

  is_rankable        boolean not null default false,
  updated_at         timestamptz not null default now()
);

create index scored_areas_geom_idx on scored_areas using gist (geom);
create index stasiun_geom_idx on stasiun using gist (geom);
```

🔄 **`station_id` ditambahkan 4 September 2026** — versi sebelumnya di dokumen ini tidak
punya kolom ini sama sekali, padahal ini satu-satunya foreign key sungguhan di seluruh ERD
MVP (`scored_areas.station_id → stasiun.station_id`, satu-ke-satu). Tabel `stasiun` juga
baru ditambahkan di sini — sebelumnya tidak ada definisi SQL-nya di dokumen ini sama sekali.

⚠️ **`is_rankable` MVP dua syarat, bukan satu**: `n_observations >= 10 AND n_price >= 5`
(bukan cuma `n_observations >= 10` seperti sempat tertulis) — lihat `context-mvp.md` 6.9.

✅ **Nama tabel restoran: `katalog_restoran`** — dikonfirmasi langsung koordinator 4
September 2026. Prosa `dokumentasi-erd-mvp.md` dan contoh query di `daftar-api-sigmaps.xlsx`
sebelumnya memakai `sensus_restoran` untuk tabel yang sama; itu nama lama yang sudah
diperbaiki. Lihat catatan penamaan di `context-mvp.md` 6.7.

Prinsip "skor akhir 0–100 tidak pernah disimpan, dihitung live" di atas tetap berlaku persis
sama untuk skema MVP ini — hanya struktur kolom komponennya yang berbeda. Kolom
`temporal_fitness` dan `kde_penalty` tetap ada di skema (mengikuti aturan penamaan kolom
`CLAUDE.md` Bagian 7) tapi selalu `NULL` karena T dan P_KDE dicabut dari formula MVP (lihat
5.2). `scored_cells` **tidak dipakai sama sekali di MVP**.

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

✅ **RLS untuk MVP — diputuskan 4 September 2026** (`dokumentasi-erd-mvp.md` bagian
"Keamanan"), bukan lagi rekomendasi terbuka: seluruh enam tabel MVP mengaktifkan Row Level
Security dengan policy `SELECT` publik; tulis/ubah/hapus hanya lewat pipeline batch memakai
service role key (yang melewati RLS, tidak perlu policy tersendiri untuk itu). ⚠️ RLS aktif
tanpa policy mengembalikan nol baris **tanpa pesan galat** — buat tabel dan policy dalam
satu sesi yang sama; hasil kosong tanpa galat adalah tersangka pertama.

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

🔄 **Untuk MVP** (`context-mvp.md` 6.5): tidak ada lagi "bobot arketipe" atau "bobot hasil
edit pengguna" — layar edit bobot manual **dihapus permanen**, bukan ditunda. Bobot MVP
tunggal (0,25/0,50/0,25) dan ditetapkan di server, `/api/score` tidak menerima `weights`
dari klien sama sekali (lihat kontrak MVP di 7.3). Prinsip "skor selalu dihitung live, tidak
pernah pra-dihitung" tetap berlaku sama persis.

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

### 7.2 AI (Gemini) — lima titik sentuh, detail lengkap

✅ **Google Gemini** via Google AI Studio (free tier), **Vercel AI SDK** (`ai` +
`@ai-sdk/google`) + **Zod** untuk validasi skema output (`generateObject`).

🔶 Model: `gemini-3.5-flash-lite` untuk parse intent & filter (task terstruktur, tidak perlu
model besar), `gemini-3.5-flash` untuk narasi insight. Nama model **wajib** di environment
variable (Google merotasi model cepat).

✅ **LIMA titik sentuh AI** (bukan empat — direvisi 2 September 2026 setelah diskusi MVP,
titik #5 ditambahkan) — ini tetap peta lengkap rencana produk penuh. **Prinsip yang tidak
berubah di kelimanya: AI tidak pernah menghitung skor akhir** — skor 100% dihitung
`lib/scoring.ts`, AI cuma menerjemahkan masuk atau meringkas keluar.

🔄 **Diperbarui mengikuti `context-mvp.md` Bagian 3:** status titik #1 dan #2 di tabel di
bawah bukan lagi "di luar MVP, milik Jalur 2" — keduanya **dicabut permanen**, bukan
ditunda. `TIPE_3` sensus restoran sudah baku (tidak perlu normalisasi AI), dan Community
Activity tidak lagi menyentuh formula skor sama sekali. Jumlah titik sentuh yang masih
relevan turun dari 5 menjadi 3 (#3, #4 non-MVP, #5), dua di antaranya (#3, #5) masuk MVP.

| # | Nama | Kapan | Status di MVP 5 hari (2 Sept 2026) |
|---|---|---|---|
| 1 | Normalisasi kategori merchant | Batch (Jalur 2) | ❌ **Dicabut permanen** — `TIPE_3` sensus restoran sudah baku, tidak perlu dinormalisasi AI |
| 2 | Klasifikasi Community Activity per-laporan | Batch (Jalur 2) | ❌ **Dicabut permanen** — Community Activity tidak lagi menyentuh formula |
| 3 | Parse Business Brief → arketipe+bobot | Runtime | ✅ **Masuk MVP** (skema diganti, lihat catatan di titik #3 di bawah) |
| 4 | AI Area Insight (narasi dari skor) | Runtime | ❌ **Di luar MVP** — ditunda setelah MVP |
| 5 | Ringkasan sentimen Community Activity | Runtime | ✅ **Masuk MVP** |

#### Titik #1 — Normalisasi semantik kategori merchant (batch, Jalur 2) ❌ DICABUT PERMANEN UNTUK MVP

🔄 Untuk MVP, titik ini **tidak dikerjakan sama sekali** — `TIPE_3` sensus restoran sudah
baku dari sumbernya, tidak perlu dinormalisasi AI (`context-mvp.md` 3). Tetap berlaku
sebagai rencana produk penuh pasca-MVP bila normalisasi kategori merchant crowdsourced
dibutuhkan lagi.

**Masalah:** Menu Go/Struk Go itu crowdsourced dari banyak surveyor berbeda, jadi kategori
usaha ditulis tidak konsisten ("Coffee Shop" vs "Kopi" vs "Minuman" untuk hal yang sama).
Tanpa distandarkan, hitungan kompetitor (`competitive_headroom`, `kde_penalty`) salah —
kompetitor yang sama terhitung sebagai kategori berbeda-beda.

**Cara kerja:** proses batch Python baca teks nama merchant/menu, kirim ke LLM untuk
dicocokkan ke satu taksonomi baku internal (daftar kategori tertutup, bukan bebas). Validasi
skema di sisi Python pakai **Pydantic** (bukan Zod — beda bahasa, konsep sama).

**Output:** kolom "kategori baku" tambahan di Menu Go/Struk Go, dipakai downstream untuk
hitung kompetitor per kategori (variabel C dan P_KDE).

#### Titik #2 — Klasifikasi Community Activity per-laporan (batch, Jalur 2) ❌ DICABUT PERMANEN UNTUK MVP

🔄 Untuk MVP, titik ini **tidak dikerjakan sama sekali** — Community Activity tidak lagi
menyentuh formula skor dalam bentuk apa pun, jadi klasifikasi tag terstruktur per-laporan
tidak dibutuhkan (`context-mvp.md` 3). Community Activity tetap dipakai di MVP, tapi hanya
lewat titik #5 (ringkasan sentimen live, bukan klasifikasi batch per-laporan). Tetap berlaku
sebagai rencana produk penuh pasca-MVP.

**Masalah:** Community Activity **wajib** dipakai (ketentuan lomba), tapi isinya narasi
bebas (`title`, `description`) — tidak terstruktur, tidak bisa langsung dianalisis spasial.

**Cara kerja:** untuk **setiap satu laporan** (satu `_id`), teksnya diklasifikasikan AI ke
tag tertutup: hambatan pejalan kaki, aksesibilitas, keramaian, konektivitas antarmoda. Kerja
**satu laporan → satu hasil tag**, dijalankan offline sekali untuk seluruh data yang ada.

**Output:** lapisan konteks kualitatif di UI — **tidak** masuk formula skor D/T/C/S (sudah
diputuskan sebelumnya, PRD pilih opsi "konteks UI saja").

**Beda dengan titik #5:** ini per-laporan individual dan offline. Titik #5 menggabungkan
BANYAK laporan sekaligus dan jalan live saat user klik.

#### Titik #3 — Parse Business Brief → arketipe + bobot (runtime) ✅ MASUK MVP (skema diganti)

**Fungsi:** pintu masuk *need-first* produk. User ketik kalimat bebas ("toko roti pagi buat
pekerja kantoran") → AI ubah jadi parameter terstruktur yang dipakai mesin skoring.

~~**Alur teknis (rencana produk penuh, tidak berlaku lagi untuk MVP — lihat skema MVP di
bawah):**~~
```
1. Client submit teks → POST /api/prompt-request { teks: "..." }
2. Route Handler kirim teks ke Gemini lewat Vercel AI SDK (generateObject)
3. Gemini dipaksa balikin JSON sesuai skema Zod berikut:

const IntentSchema = z.object({
  kategori_usaha: z.string(),
  target_jam: z.enum(['pagi','siang','sore','malam','24jam']),
  segmen: z.string(),
  skala: z.enum(['kecil','menengah','besar']),
  weights: z.object({
    w1: z.number().min(0).max(1),   // demand
    w2: z.number().min(0).max(1),   // temporal_fitness
    w3: z.number().min(0).max(1),   // competitive_headroom
    w4: z.number().min(0).max(1),   // segment_match
  }),
  confidence: z.number().min(0).max(1),
})

4. Zod validasi — gagal → AI SDK retry otomatis
5. weights (w1-w4) dikirim ke POST /api/score untuk dihitung WLC (lib/scoring.ts)
```

✅ **Catatan penting soal nama field bobot:** skema di atas pakai `w1`–`w4` (mengacu ke
`demand/temporal_fitness/competitive_headroom/segment_match`) — **bukan**
`w_daya_beli`/`w_jam_puncak`/`w_kompetisi` (nama lama 3-bobot yang sempat dipakai draf awal
Jalur 3, sekarang sudah usang dan **dilarang**, lihat bagian 5.2). Kalau ada kode yang masih
pakai nama lama itu, **wajib direvisi** sebelum dipakai.

`confidence` dipakai UI untuk menandai hasil parsing yang meragukan.

**Untuk MVP:** alurnya **one-shot** — langsung lanjut ke Top 5 tanpa layar edit bobot manual
(beda dari desain PRD lengkap yang punya chip+slider bisa disunting). Lihat
`context/context-mvp.md`.

---

🔄 **`IntentSchema` MVP — final, menggantikan skema di atas untuk scope MVP**
(`context-mvp.md` 6.6). `kategori_usaha`, `target_jam`, `segmen`, `skala`, dan `weights`
**dilarang dipakai** — AI tidak lagi menentukan bobot apa pun, hanya jenis usaha (dipetakan
ke `TIPE_3` sensus restoran) dan perkiraan harga:

```ts
export const IntentSchema = z.object({
  tipe_3: z.enum([...TIPE_3_VALUES, 'SEMUA']),
  harga_target: z.number().int().min(1000).max(1_000_000),
  harga_sumber: z.enum(['pengguna', 'perkiraan']),
  confidence: z.number().min(0).max(1),
});
```

Tidak ada field `null` — semua selalu terisi, alur one-shot tidak pernah berhenti di tengah.
`harga_sumber = 'perkiraan'` dan `tipe_3 = 'SEMUA'` dipakai UI untuk menampilkan konfirmasi
penafsiran (lihat tabel penanganan di `context-mvp.md` Langkah 2). `confidence` tetap tidak
masuk rumus, sama seperti skema lama.

#### Titik #4 — AI Area Insight: narasi dari skor komponen (runtime) ❌ DI LUAR MVP

**Fungsi:** mengubah angka skor yang **sudah dihitung backend** jadi narasi yang enak dibaca
— bukan menghitung ulang, bukan menemukan alasan baru di luar data yang dikasih (*data-to-
text*, prinsip *strict data grounding* dari PRD).

**Alur teknis:**
```
1. Backend SUDAH punya angka dari lib/scoring.ts, contoh:
   { station_name: "Dukuh Atas", score: 78.4, risk_level: "Medium",
     components: { demand: 0.72, temporal_fitness: 0.85,
                    competitive_headroom: 0.60, segment_match: 0.55 },
     property_count: 7 }

2. Object INI PERSIS (whitelist — TIDAK ada alamat/foto/identitas surveyor) dikirim ke
   Gemini lewat POST /api/insight

3. Gemini balikin JSON sesuai skema Zod:

const InsightSchema = z.object({
  ringkasan: z.string(),
  kelebihan: z.array(z.string()).max(3),
  kekurangan: z.array(z.string()).max(3),
  faktor_dominan: z.enum(['demand','temporal_fitness','competitive_headroom','segment_match']),
})

4. faktor_dominan dipakai UI untuk nyorot bar yang relevan di chart dekomposisi
```

**Kenapa payload dibatasi ketat** (cuma angka komponen, bukan data mentah lain): supaya AI
tidak bisa "mengarang" klaim di luar data yang sistem punya.

**Status: DI LUAR SCOPE MVP 5 hari** (keputusan 2 September 2026) — Top 5 hasil MVP
ditampilkan **tanpa** narasi AI, cukup angka skor + dekomposisi komponen mentah. Fitur ini
ditunda ke fase setelah MVP.

#### Titik #5 — Ringkasan sentimen Community Activity per kawasan (runtime) ✅ MASUK MVP

Titik **baru**, ditambahkan 2 September 2026 saat perencanaan MVP.

**Fungsi:** saat user klik satu titik stasiun, sistem meringkas **banyak laporan mentah**
Community Activity di kawasan (isokron) stasiun itu jadi satu insight — "apa kata orang-
orang tentang kawasan ini". Ini pertanyaan yang beda dari titik #4: titik #4 menjelaskan
"kenapa skornya segini" (dari angka), titik #5 menjelaskan "apa yang dilaporkan orang di
kawasan ini" (dari teks mentah banyak orang).

**Alur teknis (rancangan, artefak baru untuk MVP):**
```
1. User klik stasiun → GET /api/community-sentiment?station_id=...
2. Backend query tabel Community Activity, filter berdasarkan kawasan/isokron stasiun itu
3. WAJIB dibuang sebelum kirim ke AI: user_name, user_full_name, user_profile_picture,
   community_picture (data identitas pribadi pelapor)
4. Yang dikirim ke Gemini: kumpulan title+description (+ agregat: total_comment, likes)
   dari SEMUA laporan di kawasan itu, jadi satu payload
5. Gemini balikin satu ringkasan/summary
```

**Field Community Activity yang diketahui** (dari inspeksi `etl/` sebelumnya — ❓ perlu
dikonfirmasi ulang masih akurat):
```
_id, title, description, medias, total_comment, created_at, likes,
user_name, user_full_name, user_profile_picture,
community_name, community_picture, community_description
```

**Kenapa field identitas wajib dibuang:** prinsip yang sudah disepakati sebelumnya — data
pribadi (nama akun, foto profil) tidak boleh dikirim ke pihak ketiga (Gemini) tanpa alasan
kuat, sejalan dengan larangan umum "jangan kirim data pribadi ke LLM".

❓ **Belum diputuskan:** skema Zod output untuk titik ini — apakah bikin schema baru
terpisah (`CommunitySentimentSchema`) atau digeneralisasi dari `InsightSchema` yang sudah
ada. Perlu diputuskan Jalur 1/3 sebelum mulai kerja.

❓ Tabel Community Activity **belum dibuat** di Supabase (baru ada di file ETL) — jadi
endpoint ini butuh tabel + loader baru juga (lihat bagian 6.1).

**Rate limit Gemini** (berlaku untuk titik #3 dan #5 di atas): berlaku **per project**,
bukan per key (WebGIS publik berbagi satu kuota); RPD reset tengah malam Pasifik (~14.00–
15.00 WIB). Mitigasi wajib: cache hasil per (kawasan × arketipe/pertanyaan) di DB, rate
limit per IP, degradasi anggun (peta/skor/filter manual tetap jalan kalau AI mati).

### 7.3 Kontrak data endpoint — rencana produk penuh (lihat kontrak MVP di bawah)

```
POST /api/score
  request:  { weights: { w1, w2, w3, w4 } }
  response: { areas: [{ station_id, station_name, score, risk_level,
                         components: {...}, isochrone_5min, isochrone_10min,
                         property_count }] }

GET /api/properties?station_id=...
  response: FeatureCollection Properti Go (sudah difilter dalam isokron)

POST /api/prompt-request
  request:  { teks: string }
  response: hasil IntentSchema (lihat titik #3 di atas)

POST /api/insight            [DI LUAR SCOPE MVP — lihat titik #4]
  request:  InsightPayload (whitelist, lihat titik #4)
  response: hasil InsightSchema

GET /api/community-sentiment?station_id=...   [BARU, MASUK MVP — lihat titik #5]
  response: ringkasan sentimen (skema masih ❓, belum diputuskan)
```

---

🔄 **Kontrak endpoint MVP — final, menggantikan kontrak di atas untuk scope MVP**
(`context-mvp.md` 6.6, 6.8, 6.8b; ground truth persis: `context/daftar-api-sigmaps.xlsx`).
Lima endpoint masuk MVP (`/api/insight` di atas tetap di luar MVP, kontraknya tidak
berubah):

```
GET /api/stations
  request:  tanpa parameter
  response: FeatureCollection stasiun (station_id, nama, tipe, kecamatan, kabkot, geom)

POST /api/parse-intent
  request:  { teks: string }
  response: hasil IntentSchema MVP (lihat titik #3 — tipe_3, harga_target, harga_sumber, confidence)

POST /api/score
  request:  { tipe_3, harga_target }
  response:
```
```json
{
  "areas": [{
    "area_id": "st_tanah_abang",
    "station_id": "st_tanah_abang",
    "station_name": "Tanah Abang",
    "skor": 78.3,
    "komponen": { "demand": 0.528, "competitive_headroom": 0.927, "segment_match": 0.750 },
    "bobot": { "wD": 0.25, "wC": 0.50, "wS": 0.25 },
    "n_observations": 28, "n_price": 28, "is_rankable": true
  }],
  "catatan": { "harga_sumber": "pengguna" }
}
```

🔄 **`station_id` ditambahkan 4 September 2026** — sebelumnya hilang dari contoh respons di
dokumen ini, padahal wajib ada (frontend memakainya memanggil `/api/properties` dan
`/api/community-sentiment` saat kawasan diklik).

`/api/score` MVP **tidak lagi menerima `weights`** dari klien — bobot tunggal ditetapkan di
server (6.5). Respons juga tidak berisi `risk_level`, `isochrone_5min`, atau `property_count`
seperti kontrak lama — `risk_level` dicabut dari MVP (tidak ada rumusnya di model baru), dan
hanya isokron 10 menit yang dipakai. `/api/insight` (titik #4) tetap di luar scope MVP,
kontraknya di atas tidak berubah untuk rencana pasca-MVP. Kontrak `/api/properties` dan
`/api/community-sentiment` di atas tidak berubah untuk MVP.

🔄 **`GET /api/stations` menggantikan pola lama** — versi dokumen ini sebelumnya
mengasumsikan data stasiun diambil Server Component langsung dari Supabase tanpa lewat route
API. Ground truth `daftar-api-sigmaps.xlsx` menetapkan `/api/stations` sebagai endpoint
sungguhan yang dipanggil saat halaman dibuka; lihat `context-mvp.md` Langkah 1.

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

## 8. Deployment (final)

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
   berdekatan). Belum ada konfirmasi eksplisit dari Jalur 1. 🔄 **Moot untuk MVP** —
   `scored_cells` tidak dipakai sama sekali di MVP (`context-mvp.md` 4), pertanyaan ini
   hanya relevan lagi kalau/ketika `scored_cells` dibangun pasca-MVP.
3. ❓ **`competitive_headroom` per kategori usaha atau generik?** Bagian metode Jalur 2
   bilang C "difilter per kategori, berubah tergantung arketipe", tapi skema keluaran final
   cuma satu kolom generik per sel — potensi inkonsistensi di dalam dokumen Jalur 2 sendiri.
4. ❓ **Daftar pasti simpul dalam scope** (12? lebih, karena MRT/LRT baru masuk?) — cuma 5
   nama stasiun KRL Tangsel yang eksplisit (itu pun untuk survey, bukan daftar lengkap).
5. ✅ ~~Resolusi H3: 9 vs 10~~ **Selesai** — dikonfirmasi koordinator 31 Agustus 2026: tetap
   **resolusi 9** sesuai PRD, rekomendasi pindah ke 10 ditolak.
6. ❓ λ (koefisien penalti KDE) belum dikalibrasi — masih grid search. 🔄 **Moot untuk MVP** —
   P_KDE/KDE dicabut dari formula MVP (`context-mvp.md` 4), λ tidak dibutuhkan sampai KDE
   dibangun lagi pasca-MVP.
7. ❓ Jenis `SUPABASE_KEY` (anon/service role) dan region project Supabase — belum dicek.
8. ❓ Repo `sigmaWebgis` — akun personal atau GitHub organization? (Blocking untuk Vercel
   Hobby kalau ternyata organization.)
9. ❓ Slot Community Activity di formula — PRD sudah memilih "konteks UI saja" (bukan
   variabel skor), tapi Jalur 2 menyebut ini opsi "paling lemah kalau ditanya juri" — sadari
   trade-off ini, bukan berarti harus diubah, tapi siapkan jawaban kalau ditanya.
10. ❓ **Skema Zod Jalur 3 (`IntentSchema`) belum direvisi** mengikuti nama kolom final Jalur
    2 — masih 3 bobot nama lama, seharusnya 4 bobot nama baku. Aksi: kabari Anggota 3.
11. ✅ ~~Verifikasi Struk Go simpan jam transaksi dari **data nyata**~~ **Terjawab** —
    `context-mvp.md` Bagian 7 mengonfirmasi dari 100 sampel se-Jabodetabek: kolom `tanggal`
    kosong di 100/100 baris, tidak ada kolom nominal transaksi. Struk Go mati, tidak dipakai
    sebagai sumber D/T di MVP (lihat catatan 3.1).
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
| 10 | Jumlah titik sentuh AI: 4 vs 5 | ✅ **5**, ditambah titik baru "ringkasan sentimen Community Activity" (detail penuh di bagian 7.2). |
| 11 | Dokumen riset per-jalur terpisah vs satu dokumen tunggal | ✅ Semua isinya disintesis penuh ke dokumen ini — tidak ada lagi dokumen riset terpisah yang perlu dirujuk. |

---

## 11. Referensi

- `context/PRD.md` — PRD resmi tim.
- `context/context-mvp.md` — scope MVP 5 hari (turunan dokumen ini, baca bersamaan).
- `CLAUDE.md` (root repo) — aturan struktur folder & kode.
- Kode: `etl/script.py`, tabel `properti_go` di Supabase.

🔄 **Ground truth data/ERD/API, ditetapkan 4 September 2026** — lihat daftar lengkap dan
catatan penyelesaian konflik antar sumber di `context/context-mvp.md` Bagian 11:
`context/dokumentasi-erd-mvp.md`, `context/daftar-api-sigmaps.xlsx`, dan diagram ERD
dbdiagram.io (PDF).

---

## 12. Yang perlu diputuskan sebelum dokumen ini bisa dianggap 100% final

Dokumen ini **belum sepenuhnya final** — beberapa hal masih menggantung dan mempengaruhi
keputusan lain (chaining), jadi sengaja tidak dihapus/diasumsikan. Dikelompokkan per
penanggung jawab supaya jelas siapa yang perlu bergerak duluan:

**Perlu keputusan/konfirmasi Jalur 2 (Analisis Spasial & Skoring):**
- Apakah Jalur 2 sudah menyesuaikan riset & daftar simpul dengan keputusan scope terbaru
  (MRT/LRT ikut masuk, bagian 2) — riset sebelumnya berjalan dengan asumsi MRT/LRT di luar
  cakupan.
- Kunci gabungan `(h3_index, station_id)` untuk tabel `scored_cells` — perlu disepakati
  bersama Jalur 1 sebelum tabel dibuat.
- Apakah `competitive_headroom` perlu dipecah per kategori usaha, atau tetap satu kolom
  generik per sel (ada indikasi kebutuhan pemecahan per kategori, tapi skema keluaran final
  belum mencerminkan itu).
- Daftar pasti stasiun yang masuk scope (berapa jumlahnya persis, nama-namanya) — belum ada
  di dokumen manapun selain angka "12" dan 5 nama stasiun survei.
- Kalibrasi λ (koefisien penalti KDE) — masih menunggu hasil grid search. 🔄 Moot untuk MVP,
  lihat item 6 di Bagian 9.

**Perlu keputusan/konfirmasi Jalur 1 (Data & Backend):**
- Jenis `SUPABASE_KEY` yang dipakai (anon vs service role) dan region project Supabase —
  belum dicek.
- Apakah repo `sigmaWebgis` di akun personal atau GitHub organization (menentukan apakah
  Vercel Hobby bisa langsung dipakai).
- Tabel Struk Go/Menu Go/Activity di Supabase belum dibuat (baru ada di file ETL).

**Perlu keputusan/konfirmasi Jalur 3 (Frontend & AI):**
- Skema Zod output untuk titik sentuh AI #5 (ringkasan sentimen) — schema baru terpisah
  atau digeneralisasi dari `InsightSchema`.

**Perlu keputusan tim/produk secara umum:**
- Slot Community Activity di formula skor — sudah dipilih "konteks UI saja" lewat PRD, tapi
  ini opsi yang disebut "paling lemah kalau ditanya juri" — pastikan tim sudah sadar dan
  siap menjawab kalau ditanya, bukan cuma default tanpa disadari.
- ✅ Verifikasi dari data nyata bahwa Struk Go benar-benar menyimpan jam transaksi — **sudah
  terjawab**, lihat item 11 di Bagian 9: Struk Go mati, tidak dipakai di MVP.

Sampai poin-poin di atas terjawab, anggap dokumen ini **stabil untuk mulai bekerja** tapi
**belum boleh dianggap tidak akan berubah lagi** — terutama untuk apa pun yang menyentuh
skema tabel `scored_cells`/`scored_areas` dan daftar stasiun.
