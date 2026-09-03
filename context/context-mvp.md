# Context: SIGMAPS MVP

**Versi:** 3 — turunan langsung dari `context-mvp-will.md` (v2), 3 September 2026.
Versi ini menutup seluruh item B-1 sampai B-6 (sebelumnya memblokir) dan membuang seluruh
item O-1 sampai O-8 (sebelumnya "perlu keputusan, tidak memblokir") dari dokumen v2.

**Status:** dokumen acuan utama untuk pengerjaan MVP, menggantikan v2. **Berdiri sendiri**
— seluruh spesifikasi mesin skoring tetap dimuat penuh di Bagian 6, tidak perlu membuka
dokumen lain. `context-final.md` tetap berlaku untuk hal di luar MVP, tetapi bila
bertentangan dengan dokumen ini, **dokumen ini yang berlaku**.

## Aturan penanda

✅ **DIPUTUSKAN** · 🔶 **ASUMSI TIM (boleh dipakai, wajib diakui di PRD)** · ❓ **TERBUKA
(jangan tulis kode seolah sudah ada jawabannya)**

---

## 1. Alur end-to-end MVP

```
1. User buka app
   → basemap MAPID + titik stasiun

2. User ketik kebutuhan usaha di sidebar (Business Brief)
   → AI terjemahkan jadi parameter terstruktur (Zod)
   → backend hitung skor per kawasan (deterministik, BUKAN AI)
   → tampil Top 5 kawasan + skor + dekomposisi komponen (angka, TANPA narasi AI)

3. User klik satu titik stasiun
   → dua panel:
     a. Ringkasan sentimen Community Activity kawasan itu (AI)
     b. Katalog properti dalam isokron stasiun itu

4. User klik satu properti
   → property card (deskripsi dari Properti Go)
```

---

## 2. Detail tiap langkah

### Langkah 1 — Basemap + titik stasiun

✅ `components/map/BaseMap.tsx` (map instance, style MAPID MAPS), titik stasiun sebagai
layer terpisah (`components/map/layers/StationLayer.tsx`).

🔄 **Diperbarui 4 September 2026, mengikuti `daftar-api-sigmaps.xlsx` (ground truth API):**
data stasiun **tidak lagi** diambil langsung oleh Server Component dari Supabase. Sumbernya
adalah `GET /api/stations` (tanpa parameter, baca tabel `stasiun`, kembalikan seluruh
stasiun termasuk yang belum berskor). `StationLayer.tsx` mengambilnya lewat `fetch`. Ini
menggantikan pola "Server Component query langsung lalu passing props" yang sebelumnya
ditulis di sini — bukan pelanggaran aturan Server/Client Component `CLAUDE.md` Bagian 3,
karena `/api/stations` tetap route tipis yang cuma baca dan balas.

✅ **Wilayah MVP: DKI Jakarta**, menggantikan rencana 5 stasiun Tangsel di versi sebelumnya
(Cisauk, Serpong, Rawa Buntu, Sudimara, Jurangmangu). Alasannya di Bagian 7: Menu Go, sumber
tunggal variabel D dan S, menumpuk di Jakarta dan nyaris nol di Tangsel. Cakupan PRD tetap
Jabodetabek, yang menyempit hanya kawasan yang diskor di MVP.

✅ **Daftar stasiun Jakarta sudah aman.** Datanya tersedia. Struktur dan daftar final
mengikuti skema Zod yang akan dibuat di kode, jadi tidak perlu dituliskan manual di dokumen
ini. Klaster Menu Go terbesar berada di sekitar Tanah Abang, Sudirman, dan koridor Sawah
Besar–Juanda.

### Langkah 2 — Business Brief → Top 5 (ONE-SHOT)

✅ Alurnya **one-shot**, user ketik, langsung dapat Top 5. Tidak ada layar review/edit
parameter.

⚠️ v1 menyebut layar edit bobot "ditunda setelah MVP". Sekarang **dihapus permanen**, karena
bobotnya tunggal dan tidak ada lagi yang bisa disunting (Bagian 6.5).

**Alur teknis:**
```
Sidebar (Client Component)
  → POST /api/prompt-request { teks: "..." }
      → Gemini + Zod (IntentSchema: kategori_usaha, target_jam, segmen, skala, weights, confidence)
  → POST /api/score { weights }
      → baca scored_areas/scored_cells dari Supabase
      → hitung WLC live (lib/scoring.ts) — DETERMINISTIK, bukan AI
      → urutkan, ambil Top 5
  → tampilkan Top 5 + skor + dekomposisi komponen mentah (angka/chart)
```

⚠️ `/api/score` **tidak lagi menerima `weights`** dari klien. Bobot tunggal dan ditetapkan
di server.

⚠️ `scored_cells` **tidak dipakai**. Skoring hanya di level kawasan (`scored_areas`).

✅ **"Summary kenapanya" TIDAK termasuk MVP.** AI Area Insight (titik sentuh AI #4) di luar
scope. Top 5 cukup tampilkan angka skor + dekomposisi komponen mentah (`demand: 0.528`,
dst.), **tanpa** kalimat naratif AI.

✅ **Skema `scored_areas` final** (Bagian 6.7). Data dummy/seed tidak diperlukan lagi,
Jalur 1 dan Jalur 3 dapat langsung membangun di atas nama kolom final.

**Yang wajib ditangani UI:**

| Kondisi | Perilaku |
|---|---|
| `harga_sumber = 'perkiraan'` | Tampilkan "Harga tidak disebutkan, kami perkirakan Rp25.000 dari jenis usaha. Ubah?" |
| `tipe_3 = 'SEMUA'` | Tampilkan bahwa penilaian kompetisi memakai seluruh kategori kuliner |
| `is_rankable = false` | Kawasan tampil di peta dengan label "data belum cukup", **tidak** ikut diperingkat |
| Usaha non-kuliner | Tolak dengan pesan jelas, jangan beri skor |

### Langkah 3 — Klik stasiun → dua panel

#### 3a. Ringkasan sentimen Community Activity — titik sentuh AI #5

✅ Masuk scope MVP.

```
1. User klik stasiun → GET /api/community-sentiment?station_id=...
2. Backend query tabel Community Activity, filter berdasarkan isokron stasiun itu
3. WAJIB dibuang sebelum kirim ke AI: user_name, user_full_name,
   user_profile_picture, community_picture
4. Yang dikirim ke Gemini: kumpulan title+description (+ agregat total_comment, likes)
5. Gemini balikin satu ringkasan
```

✅ Community Activity **tidak masuk formula skor** (alasannya di Bagian 7), tetapi tetap
hidup di sini dan sebagai layer peta. Kewajiban memakainya terpenuhi lewat jalur ini.

✅ **Tabel Community Activity di Supabase sudah aman**, datanya tersedia. Skema Zod untuk
output ringkasan mengikuti skema yang akan dibuat di kode bersamaan dengan endpoint ini.

#### 3b. Katalog properti dalam isokron

✅ **Poligon isokron dari MAPID Isochrone Tool sudah aman.** Datanya tersedia untuk dipakai,
termasuk untuk `area_km2` yang jadi penyebut kepadatan pada rumus C. Struktur datanya
mengikuti skema Zod yang akan dibuat di kode, jadi skoring dapat berjalan penuh.

✅ Poligon dibuat untuk semua titik stasiun yang masuk daftar, bukan hanya kawasan survei.

⚠️ Hanya isokron **10 menit** yang dipakai. Isokron 5 menit dicabut, rumus tidak
memakainya.

```
GET /api/properties?station_id=... → FeatureCollection Properti Go
  (sudah difilter dalam isokron)
```

### Langkah 4 — Klik properti → property card

✅ Kolom yang ditampilkan: `kategori_properti`, `jenis_properti` (Sewa/Jual), alamat, foto
(`foto_tampak_depan`, `foto_spanduk`).

❓ **Masih terbuka** (`daftar-api-sigmaps.xlsx`, sheet Masih Terbuka): apakah jarak jalan
kaki ke pintu stasiun ditampilkan di property card. MAPID Routing Tool tidak dipakai untuk
MVP, jadi tidak ada sumber angka jarak jalan kaki asli. **Bila** kelak dipakai garis lurus
sebagai pengganti, field-nya **wajib** dinamai `jarak_garis_lurus_m`, **bukan**
`jarak_jalan_kaki_m` — supaya tidak mengklaim akurasi yang tidak ada. Sampai keputusan ini
diambil, field jarak **tidak ditampilkan sama sekali** (lihat juga Bagian 8 item 10).

✅ **Dilarang** menampilkan filter/field luas, harga, kontak pemilik, Properti Go tidak
punya kolom itu.

---

## 3. Titik sentuh AI — MVP hanya #3 dan #5

⚠️ Jumlah titik sentuh AI turun dari **5 menjadi 3**. Titik #1 dan #2 bukan lagi "di luar
scope MVP" melainkan **dicabut permanen**.

| # | Nama | Kapan | Status |
|---|---|---|---|
| 1 | Normalisasi kategori merchant | Batch | ❌ **Dicabut permanen** — `TIPE_3` sensus restoran sudah baku, tidak perlu dinormalisasi AI |
| 2 | Klasifikasi Community Activity per-laporan | Batch | ❌ **Dicabut permanen** — Community Activity tidak lagi menyentuh formula |
| 3 | Parse Business Brief → parameter | Runtime | ✅ **Masuk MVP** (Langkah 2) |
| 4 | AI Area Insight (narasi skor) | Runtime | ❌ Di luar scope MVP |
| 5 | Ringkasan sentimen Community Activity | Runtime | ✅ **Masuk MVP** (Langkah 3a) |

✅ **Konsekuensi:** tahap batch Python sekarang **tanpa AI sama sekali**.

⚠️ **Klaim PRD "AI menentukan bobot parameter" gugur.** AI menentukan kategori usaha dan
perkiraan harga, bukan bobot.

✅ **Prinsip yang tidak berubah:** skor akhir 100% dihitung `lib/scoring.ts`, tidak pernah
oleh AI. Kalimat yang benar untuk PRD, parameter yang sama selalu menghasilkan skor yang
sama, bukan "AI tidak pernah dipanggil".

---

## 4. Yang sengaja di luar scope MVP

- **AI Area Insight** (titik #4), Top 5 tampil tanpa narasi AI.
- Filter percakapan AI ("tunjukkan kawasan risiko rendah...").
- Matriks perbandingan 2–3 properti berdampingan.
- Export ringkasan ke PDF.
- Rate limiting per-IP matang (`middleware.ts`), perlu sebelum publik, bukan blocker demo.
- **`scored_cells`, H3, heatmap kejenuhan pasar**, sampel per sel terlalu tipis.
- **`risk_level` / Indeks Risiko Spasial**, tidak ada rumusnya di model baru.
- **T (`temporal_fitness`)**, butuh survei 4 slot waktu, tidak layak dalam sisa waktu.
- **`kde_penalty`, KDE, scikit-learn, λ.**
- **Isokron 5 menit.**
- **Layar edit bobot manual**, dihapus permanen, bukan ditunda.
- **Arketipe non-kuliner** (laundry, minimarket, barbershop), tidak ada data pesaingnya.

⚠️ Empat item bertanda tebal di atas (`heatmap`, `risk_level`, isokron 5 menit, klaim bobot
AI) **ada di in-scope PRD**. PRD perlu direvisi atau menandainya pasca-MVP, jika tidak akan
terlihat seperti janji yang tidak ditepati saat demo.

---

## 5. Pemetaan kerja per jalur

- **Jalur 1 (Data/Backend):** `app/api/prompt-request`, `app/api/score`, `app/api/properties`,
  `app/api/community-sentiment` (baru, untuk Langkah 3a), skema tabel sementara (dummy/seed)
  sambil nunggu Jalur 2, tabel Community Activity di Supabase (belum ada, cuma di ETL).
- **Jalur 2 (Analisis Spasial/Skoring):** **blocking item** — skema & isi `scored_areas`/
  `scored_cells` final, status poligon isokron semua stasiun. MVP Langkah 2 & 3b menunggu ini.
- **Jalur 3 (Frontend/AI):** `components/map/*`, sidebar Business Brief (UI one-shot), panel
  hasil Top 5 + dekomposisi komponen (angka/chart, **tanpa** narasi AI — titik #4 di luar
  scope), panel klik stasiun (2 tab: sentimen + katalog), property card. Zod schema yang
  dipakai MVP cuma dua: `IntentSchema` (titik #3, wajib pakai nama final Jalur 2 — lihat
  `context-final.md` §7.2) dan schema output titik #5 (nama masih ❓, lihat §7.2).
  `InsightSchema` (titik #4) **tidak perlu dikerjakan** untuk MVP ini.

---

## 6. Perhitungan skor

### 6.1 Rumus

```
skor = 100 × (0,25·D + 0,50·C + 0,25·S)
```

### 6.2 D — permintaan

```
nilai:  Sepi = 0    Sedang = 0,5    Ramai = 1

rata =  (Σ nilai) ÷ n
D    =  (n × rata + 8 × 0,5) ÷ (n + 8)
```

**Sumber:** `kondisi_tempat` di Menu Go + survei tim.

⚠️ **D dipakai apa adanya, TANPA normalisasi.** Rumus di atas sudah menghasilkan 0–1 karena
merupakan rata-rata tertimbang dari angka yang seluruhnya di 0–1. Normalisasi min-max justru
merusak: tiga kawasan bernilai 0,528 / 0,469 / 0,460 yang berdekatan akan direntangkan
paksa menjadi 1,00 / 0,13 / 0,00.

**K = 8** adalah kekuatan tarikan ke netral: kawasan dengan tepat 8 pengamatan akan setengah
ditentukan datanya sendiri, setengah oleh nilai netral 0,5. Tanpa ini, kawasan dengan 3
pengamatan yang semuanya "Ramai" mendapat D = 1,00 dan langsung juara. Kawasan tanpa data
(n = 0) otomatis mendarat di 0,5 tanpa aturan khusus.

### 6.3 C — ruang kompetisi

```
kepadatan = jumlah restoran ber-TIPE_3 sama ÷ area_km2
            (bila tipe_3 = 'SEMUA': pakai total_restaurants)

lo = persentil ke-5 kepadatan seluruh kawasan
hi = persentil ke-95
x  = (clip(kepadatan, lo, hi) − lo) ÷ (hi − lo)

C  = maks(0, 1 − |x − 0,4| ÷ 0,6)
```

**Sumber:** sensus restoran, kolom `TIPE_3`.

| x | C | arti |
|---:|---:|---|
| 0,0 | 0,33 | tanpa pesaing, pasar belum terbukti, ikut dihukum |
| 0,4 | 1,00 | ideal |
| 0,7 | 0,50 | mulai padat |
| 1,0 | 0,00 | paling sesak |

Penyebut 0,6 **terikat** pada puncak 0,4, bukan angka bebas: `maks(puncak, 1 − puncak)`.
Bila puncak digeser ke 0,3, penyebut otomatis jadi 0,7. Jangan diubah terpisah.

⚠️ **Normalisasi min-max, bukan persentil.** Ini mencabut keputusan lama. Keputusan lama
benar untuk sel H3 (ribuan sel, satu pencilan bisa menekan semuanya), tetapi skoring
sekarang di level kawasan, dengan 5 kawasan, persentil hanya bisa menghasilkan lima nilai:
0 · 0,25 · 0,50 · 0,75 · 1,00, dan mengarang jarak seragam yang tidak ada di kenyataan.
Pemotongan pencilan menutup satu-satunya kelemahan min-max. 🔶 Dengan kurang dari ~10
kawasan, pemotongan ini praktis tidak berpengaruh.

### 6.4 S — kecocokan segmen

```
S = maks(0, 1 − |price_median − harga_target| ÷ harga_target)
```

**Sumber:** `harga_rata_rata` di Menu Go + survei tim, diambil median per kawasan.

Pembagi memakai `harga_target` agar selisihnya relatif: meleset Rp5.000 fatal untuk target
Rp10.000, sepele untuk target Rp100.000.

### 6.5 Bobot — tunggal, tidak per arketipe

⚠️ **Berubah dari rencana lama** yang memakai 3 arketipe PRD dengan bobot berbeda.

Empat set bobot diuji pada data yang sama, dan **urutannya identik di kedelapan baris uji**.
Angkanya bergeser, peringkatnya tidak pernah berubah. Penyebabnya rentang tiap variabel:

```
D:  0,460 – 0,528   rentang 0,068
C:  0,000 – 0,927   rentang 0,927
S:  0,700 – 1,000   rentang 0,300
```

C punya rentang **14 kali lebih lebar** daripada D. Bobot hanya berpengaruh bila rentang
variabelnya sebanding.

✅ Kalimat untuk PRD: *kami menguji empat set bobot dan menemukan peringkat tidak berubah,
sehingga dipilih satu set berbasis literatur ketimbang variasi yang tidak berdasar.*

**Asal 0,25 / 0,50 / 0,25:** rasio C : D sebesar 2 : 1 dari studi AHP-TOPSIS pemilihan lokasi
usaha, JUTIN Universitas Pahlawan 2026 (jumlah pesaing 0,34; tingkat keramaian 0,17). Dua
kriteria lain dalam studi itu tidak dipakai, aksesibilitas 0,27 sudah disaring lebih dulu
oleh isokron, dan biaya sewa 0,22 tidak ada datanya di Properti Go. S nilainya keputusan tim.

🔶 **Wajib di PRD:** biaya sewa masuk dua besar pada seluruh studi AHP yang dirujuk, dan
SIGMAPS tidak dapat mengukurnya. SIGMAPS mengukur **potensi pasar**, bukan **kelayakan
investasi**.

### 6.6 Kontrak masukan dari AI

```ts
export const IntentSchema = z.object({
  tipe_3: z.enum([...TIPE_3_VALUES, 'SEMUA']),
  harga_target: z.number().int().min(1000).max(1_000_000),
  harga_sumber: z.enum(['pengguna', 'perkiraan']),
  confidence: z.number().min(0).max(1),
});
```

⚠️ **Mengganti seluruh `IntentSchema` v1** (`kategori_usaha`, `target_jam`, `segmen`,
`skala`, `weights`). Nama lama dilarang dipakai.

✅ **Tidak ada field `null`.** Semua selalu terisi, sehingga skoring tidak pernah berhenti
di tengah dan alur one-shot terjaga.

| Tidak disebut pengguna | Penanganan |
|---|---|
| Harga | AI memperkirakan dari `tipe_3` lewat tabel padanan; `harga_sumber = 'perkiraan'` |
| Jenis usaha | `tipe_3 = 'SEMUA'`; C dihitung dari `total_restaurants` |

**Prinsipnya:** inferensi yang **terlihat dan bisa disunting** itu sah; inferensi yang
diam-diam masuk rumus tidak.

❌ **`SEMUA` bukan tempat pembuangan.** Usaha non-kuliner tetap ditolak dengan pesan jelas,
karena kepadatan restoran tidak mengatakan apa pun tentang peluang usaha jenis itu.

`confidence` **tidak masuk rumus**; hanya dipakai UI untuk menampilkan konfirmasi
penafsiran. 🔶 Angka ini penilaian model tentang dirinya sendiri dan cenderung menumpuk di
rentang sempit, **jangan dipakai untuk memblokir apa pun**, dan kalibrasi ambangnya dari
uji nyata 20–30 prompt. `harga_sumber` dan `tipe_3 = 'SEMUA'` adalah sinyal faktual yang
lebih andal.

✅ **Dua tabel manual (padanan teks bebas → `TIPE_3` + `SEMUA`, dan perkiraan harga per
`TIPE_3`) sudah aman datanya.** Struktur dan isinya mengikuti skema Zod yang akan dibuat di
kode. Daftar harga wajib diberikan di dalam prompt agar hasil AI konsisten antar pemanggilan.

### 6.7 Skema data — enam tabel, satu foreign key

🔄 **Ditulis ulang 4 September 2026.** Skema di bawah dan seluruh keputusan ERD MVP kini
mengikuti tiga dokumen ground truth: `context/dokumentasi-erd-mvp.md` (penjelasan lengkap
per kolom, alasan desain), `context/daftar-api-sigmaps.xlsx` (kontrak tiap endpoint), dan
diagram ERD dbdiagram.io (skema visual). Ketiganya **menggantikan** versi `scored_areas`
lama di dokumen ini — versi lama tidak punya kolom `station_id`, sebuah kekurangan nyata
yang sudah diperbaiki di bawah.

**Peta enam tabel** (detail penuh tiap kolom & alasannya ada di `dokumentasi-erd-mvp.md`):

| Tabel | Golongan | Dibaca oleh |
|---|---|---|
| `stasiun` | sumber mentah, diisi ETL katalog MAPID | `/api/stations`, batch |
| `menu_go` | sumber mentah, diisi ETL API lomba | batch |
| `katalog_restoran` | sumber mentah, diisi ETL GeoJSON | batch |
| `scored_areas` | **hasil batch**, satu-satunya yang dibaca mesin skoring | `/api/score`, `/api/properties` |
| `properti_go` | pendukung, tidak masuk skor | `/api/properties` |
| `community_activity` | pendukung, tidak masuk skor | `/api/community-sentiment` |

✅ **Nama tabel restoran — dikonfirmasi langsung koordinator 4 September 2026:
`katalog_restoran`.** Sempat ada selisih penamaan antar dokumen sumber: prosa
`dokumentasi-erd-mvp.md` dan query SQL di `daftar-api-sigmaps.xlsx` sebelumnya memakai
`sensus_restoran`, sementara diagram ERD dbdiagram.io memakai `katalog_restoran`.
`dokumentasi-erd-mvp.md` sudah diperbaiki mengikuti nama yang dikonfirmasi ini. Bila ada
salinan `daftar-api-sigmaps.xlsx` yang belum diperbarui, query di dalamnya
(`select distinct tipe_3 from sensus_restoran ...`) harus dibaca sebagai
`katalog_restoran`.

**Hampir tidak ada foreign key** — keanggotaan kawasan (properti, restoran, laporan warga
masuk kawasan mana) ditentukan lewat `ST_Within(titik.geom, area.geom)` saat batch berjalan,
bukan kolom kunci tersimpan (satu titik bisa masuk 2 isokron berdempetan, FK cuma bisa
menunjuk satu induk). Satu-satunya foreign key sungguhan: `scored_areas.station_id →
stasiun.station_id`, satu-ke-satu, karena satu isokron memang diturunkan dari tepat satu
stasiun. Detail lengkap alasannya ada di `dokumentasi-erd-mvp.md` bagian "Kenapa hampir
tidak ada foreign key".

```sql
create table stasiun (
  station_id  text primary key,
  nama        text not null,
  tipe        text,                       -- 'COMMUTER' atau 'KERETA API', info saja
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

  temporal_fitness   double precision,          -- selalu NULL
  kde_penalty        double precision,          -- selalu NULL

  is_rankable        boolean not null default false,
  updated_at         timestamptz not null default now()
);

create index scored_areas_geom_idx on scored_areas using gist (geom);
create index stasiun_geom_idx on stasiun using gist (geom);
```

`competitor_counts` berbentuk `{ "CEPAT SAJI": 8, "KAFE DAN RESTO": 3, ... }`.

🔶 `area_id` sebenarnya mubazir selama relasinya satu-ke-satu dengan `stasiun` (isokron 5
menit dicabut) — `station_id` bisa langsung jadi primary key. Dipertahankan sebagai `area_id`
terpisah supaya penamaan tidak berubah di tengah pengerjaan.

⚠️ **`stasiun` dan `scored_areas` sengaja dua tabel terpisah walau relasinya satu-ke-satu**:
jumlah barisnya beda (`stasiun` memuat seluruh ~50–60 stasiun DKI, `scored_areas` hanya yang
isokronnya sudah selesai — peta tetap bisa menggambar semua titik stasiun sementara skoring
baru jalan di sebagian), diisi pihak & waktu berbeda (`stasiun` dari ETL, hampir tidak
berubah; `scored_areas` ditulis ulang tiap batch jalan), dan tipe geometrinya beda (titik vs
poligon).

⚠️ **Katalog `stasiun` mentah punya baris ganda** — stasiun yang melayani lebih dari satu
moda (mis. Grogol: COMMUTER + KERETA API) muncul sebagai 2 baris dengan koordinat identik.
**Deduplikasi berdasarkan koordinat, bukan nama**, dan wajib dilakukan **sebelum** dikirim ke
MAPID Isochrone Tool (bukan sesudah) supaya kuota panggilan tidak terbuang separuh untuk
titik yang sama. Bila dimuat apa adanya, satu stasiun muncul dua kali di Top 5 dengan skor
identik.

Definisi tabel `menu_go`, `katalog_restoran`, `properti_go`, `community_activity` (kolom,
index, RLS) ada lengkap di `dokumentasi-erd-mvp.md` — tidak diulang di sini supaya tidak ada
dua sumber kebenaran untuk hal yang sama.

✅ **Skor akhir tidak disimpan**, dihitung live di `lib/scoring.ts` saat request.

### 6.8 Kontrak `/api/score`

```
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

🔄 **`station_id` ditambahkan 4 September 2026** mengikuti `daftar-api-sigmaps.xlsx` (sheet
Field Response) — field ini sempat hilang dari contoh di atas, padahal wajib ada (dipakai
frontend untuk memanggil `/api/properties` dan `/api/community-sentiment` saat kawasan
diklik).

Kawasan dengan `is_rankable = false` tetap dikirim agar dapat digambar di peta dengan label
"data belum cukup", tetapi tidak ikut diperingkat.

⚠️ **Query `/api/score` tanpa join, tanpa filter kategori, tanpa agregasi** — seluruh baris
`scored_areas` dengan `is_rankable = true` ditarik dalam satu `SELECT`, karena normalisasi
min-max pada C butuh nilai terkecil dan terbesar di antara semua kawasan (skor satu kawasan
bergantung pada kawasan lain, tidak bisa dihitung baris per baris). Lihat
`dokumentasi-erd-mvp.md` bagian "Kenapa `station_name` diduplikasi".

⚠️ **Pengaman wajib saat menghitung C** (`daftar-api-sigmaps.xlsx`, sheet Aturan & Pengaman):
bila `hi === lo` (tidak ada kawasan lain yang punya kategori itu), pembagi normalisasi
bernilai nol dan hasilnya `NaN` — **gagal diam-diam tanpa pesan galat**. Set `x = 0.5` agar
semua kawasan mendapat C yang sama pada kasus ini. Kunci `tipe_3` yang dipakai mencari di
`competitor_counts` **harus cocok persis** (huruf besar semua, sama seperti di
`katalog_restoran`) — kalau enumnya beda ejaan, pencarian selalu bernilai 0, C seragam 0,33,
dan skor tetap keluar terlihat wajar padahal salah (gagal diam-diam juga).

### 6.8b Endpoint lain, kode galat, dan pengaman — ringkasan (ground truth: `daftar-api-sigmaps.xlsx`)

🔄 **Ditambahkan 4 September 2026.** Lima endpoint masuk MVP: `GET /api/stations`,
`POST /api/parse-intent`, `POST /api/score`, `GET /api/properties`,
`GET /api/community-sentiment`. `POST /api/insight` di luar MVP (titik AI #4). Tiga dari
lima endpoint MVP memanggil AI: `parse-intent`, `community-sentiment`, dan (di luar MVP)
`insight` — `score`, `properties`, `stations` murni deterministik/baca data.

Urutan pemanggilan satu sesi: `/api/stations` → `/api/parse-intent` → `/api/score` → klik
stasiun → `/api/properties` + `/api/community-sentiment`.

**Kode galat wajib** (daftar lengkap ada di xlsx, sheet Kode Galat — ringkasan yang paling
gampang salah dilewatkan):

| Endpoint | Kondisi | Kode | Catatan |
|---|---|---|---|
| `/api/parse-intent` | Usaha non-kuliner | 400 | `'SEMUA'` bukan tempat pembuangan, tetap tolak |
| `/api/parse-intent` | Zod gagal setelah retry AI SDK | 422 | — |
| `/api/parse-intent` / `/api/community-sentiment` | Kuota Gemini habis | 503 | Kuota per project, bukan per key |
| `/api/score` | `tipe_3` tak dikenali | 400 | Harus persis sama dengan isi `competitor_counts` |
| `/api/score` | Tidak ada kawasan `is_rankable` | 200 + array kosong | **Bukan galat** — state kosong di frontend |
| `/api/properties` | Kawasan tanpa properti | 200 + FeatureCollection kosong | Kondisi normal |
| `/api/community-sentiment` | Kawasan tanpa laporan | 200 + ringkasan kosong | Jangan panggil Gemini kalau tidak ada isi |
| Semua | Supabase tidak merespons | 503 | Cek dulu apakah project di-pause idle 7 hari |

**Query baku tiap endpoint** (persis, dari xlsx sheet Query Database):

```sql
-- /api/stations
select station_id, nama, tipe, kecamatan, kabkot, geom from stasiun;

-- /api/score (tanpa join, tanpa filter kategori — lihat alasan di 6.8)
select area_id, station_id, station_name, area_km2, demand, price_median,
       competitor_counts, total_restaurants, n_observations, n_price
from scored_areas where is_rankable = true;

-- /api/properties
select p.* from properti_go p
join scored_areas a on ST_Within(p.geom, a.geom)
where a.station_id = $1;

-- /api/community-sentiment
select c.title, c.description, c.total_comment, c.likes
from community_activity c
join scored_areas a on ST_Within(c.geom, a.geom)
where a.station_id = $1;
```

**Pengaman wajib lain** (selain hi===lo dan pencocokan `tipe_3` persis di 6.8):
- `TIPE_3_VALUES` (enum Zod `IntentSchema`) **wajib dihasilkan dari query**
  (`select distinct tipe_3 from katalog_restoran order by tipe_3;`), bukan diketik manual —
  mencegah enum kode dan isi tabel diam-diam berbeda.
- Tidak ada endpoint yang menulis ke database — seluruh tulis hanya dari pipeline batch
  dengan service role key.
- Jangan kirim `segment_match` bernilai `0` untuk kawasan yang belum dinilai — nol dibaca
  sebagai "buruk secara segmen", padahal artinya "tidak dinilai" (tidak relevan untuk MVP
  karena S dijamin selalu terhitung, lihat 6.4, tapi tetap jadi pengingat kalau logic
  berubah).
- Cache hasil `/api/community-sentiment` per kawasan — kuota Gemini per project dipakai
  bersama semua pengunjung.
- Degradasi anggun bila Gemini mati: peta, `/api/stations`, dan `/api/score` tetap harus
  jalan; sediakan filter manual sebagai cadangan.

### 6.9 Tahap batch (Python, tanpa AI)

1. **Kumpulkan pengamatan**, gabungkan Menu Go dan survei tim; kolomnya sama.
2. **Spatial join** ke poligon isokron. Titik pada dua isokron bertumpuk dihitung di
   keduanya, karena kawasan berdekatan memang berbagi pasar.
3. **Hitung D** (6.2).
4. **Bersihkan harga, hitung median:**
```python
if harga < 1000:
    harga = harga * 1000            # koreksi satuan
if not (2000 <= harga <= 150000):
    lewati record ini               # di luar akal untuk makanan per porsi
```
5. **Hitung jumlah pesaing per `TIPE_3`**, simpan apa adanya sebagai JSONB. Jangan
   dinormalisasi di sini, normalisasi butuh kategori yang baru diketahui saat runtime.
6. **Tandai** `is_rankable = n_observations >= 10 AND n_price >= 5`.

🔄 **Diperbarui 4 September 2026** — ambang lama di dokumen ini cuma menyebut
`n_observations >= 10` (satu syarat). `daftar-api-sigmaps.xlsx` (sheet Aturan & Pengaman)
memastikan ada **dua** syarat: `n_observations` menjamin D dapat dipercaya, `n_price`
menjamin S dapat dipercaya (`price_median` tidak pernah `NULL` pada baris yang lolos).
Kawasan bisa saja punya 15 pengamatan tapi cuma 2 yang harganya lolos pembersihan — tanpa
syarat kedua, S tetap dihitung dari median 2 titik yang goyah dengan bobot penuh 0,25. Lihat
detail lengkap di `dokumentasi-erd-mvp.md` bagian `is_rankable, n_observations, n_price`.

⚠️ **Deduplikasi berubah.** Aturan lama ("objek sama bila < 20 m dan nama mirip") dicabut.
Bila anggota tim mensurvei tempat yang sudah ada di Menu Go, hasilnya dihitung sebagai **dua
pengamatan**, bukan satu, keduanya pengamatan keramaian pada waktu berbeda, bukan duplikat
baris.

### 6.10 Konstanta dan asalnya

| Konstanta | Nilai | Status | Asal |
|---|---|---|---|
| Skala ordinal | 0 / 0,5 / 1 | 🔶 | Jarak antar tingkat **diasumsikan sama** |
| Kekuatan tarikan K | 8 | 🔶 | Keputusan tim |
| Nilai netral | 0,5 | ✅ | Titik tengah skala ordinal |
| Puncak kurva punuk | 0,4 | 🔶 | Ditetapkan tim sebagai asumsi kerja |
| Penyebut punuk | 0,6 | ✅ | Turunan: `maks(puncak, 1 − puncak)` |
| Pemotongan pencilan | persentil 5 & 95 | 🔶 | Menutup kelemahan min-max |
| Bobot 0,25 / 0,50 / 0,25 | — | ✅ | Rasio 2 : 1 dari literatur (6.5) |
| Ambang `is_rankable` | 10 | 🔶 | Tanpa dasar statistik formal |
| Pengali skala | 100 | ✅ | Kosmetik |
| Pembersihan harga | 1.000 / 2.000 / 150.000 | 🔶 | Menangani salah input nyata |

---

## 7. Temuan data yang mendasari perubahan

Seluruhnya hasil pemeriksaan langsung, bukan asumsi.

**Struk Go mati.** Dari 100 record se-Jabodetabek, `tanggal` bernilai `{}` pada **100 dari
100** baris, dan tidak ada kolom nominal transaksi. Kolom yang ada hanya `nama_tempat`,
`kategori_tempat`, `metode_pembayaran`, `foto_struk`.

⚠️ Ini **membantah** catatan lama bahwa Struk Go "punya jam transaksi", yang berdasar
konfirmasi lisan, bukan data. Konsekuensinya D dan T tidak dapat dibangun dari Struk Go di
kawasan mana pun, bukan hanya di Cisauk.

**Community Activity bias secara kepadatan.** 1.653 laporan, seluruhnya dari satu komunitas
dengan 141 kontributor, 1.396 di antaranya dibuat pada Agustus 2026, periode lomba.
Kepadatan laporan mengukur di mana tim peserta memilih survei, bukan di mana aktivitas
ekonominya tinggi. Karena itu ia keluar dari formula, tetapi tetap dipakai di Langkah 3a.

**Menu Go menumpuk di Jakarta, nyaris nol di Tangsel.** Ini alasan wilayah MVP berpindah.

**Menu Go bukan populasi restoran.** Sebaran `jenis_tempat` pada sampel 100: Kaki Lima 47,
Restoran 22, Warung/Tenda 21, Fast Food 6, Kafe 4.

🔶 Konsekuensi yang wajib ditulis di PRD: **S mengukur tingkat harga kawasan sebagai
cerminan daya beli**, bukan kesesuaian dengan harga pesaing sekategori. Menghitung S per
kategori tidak mungkin, dengan 4 Kafe se-Jabodetabek, tidak ada kawasan bersampel cukup.

**Ada salah input harga yang nyata.** Ditemukan Rp5, Rp17, Rp20 (surveyor mengetik dalam
satuan ribuan) dan Rp180.000 untuk sebuah warung pecel.

### Sumber data

| Dataset | Peran |
|---|---|
| Menu Go (API lomba) | D dan S |
| Survei tim | D dan S, format sama dengan Menu Go |
| Sensus restoran (GeoJSON per kota) | C |
| MAPID Isochrone Tool | batas kawasan + `area_km2` |
| Properti Go | katalog properti, tidak masuk skoring |
| Community Activity | layer peta + titik AI #5, tidak masuk skoring |

Sensus yang sudah ada: Jakarta Pusat 1.160 · Kota Tangerang Selatan 1.391 · Kabupaten
Tangerang 1.435. Tidak ada duplikat antar berkas.

🔶 **Batasan sensus restoran, wajib di PRD Bab 5:** hanya kuliner (`TIPE_2` seragam
RESTORAN, arketipe non-kuliner tidak dapat dilayani); dikumpulkan **Q4 2023** meski nama
berkasnya "TAHUN 2025"; `STATUS` seragam BUKA sehingga tidak ada catatan usaha yang tutup;
dipotong batas administratif kota sehingga setiap kota butuh berkasnya sendiri.

✅ Seluruh data pendukung (sensus restoran, poligon isokron, dua tabel padanan manual,
tabel Community Activity, daftar stasiun Jakarta) sudah aman dan tersedia. Struktur field
persisnya mengikuti skema Zod yang akan dibuat langsung di kode saat implementasi, bukan
dituliskan manual di dokumen ini.

---

## 8. Konflik dengan v1 dan bagaimana diselesaikan

| | Isi v1 | Penyelesaian |
|---|---|---|
| 1 | `IntentSchema`: `kategori_usaha`, `target_jam`, `segmen`, `skala`, `weights`, `confidence` | **Diganti** oleh 6.6. Nama lama dilarang |
| 2 | `/api/score` menerima `{ weights }` dari klien | **Dicabut.** Bobot tunggal, ditetapkan server (6.8) |
| 3 | Langkah 2 membaca `scored_areas`/`scored_cells` | **`scored_cells` dicabut** dari MVP. Hanya `scored_areas` |
| 4 | Daftar stasiun: 5 stasiun Tangsel | **Diganti** stasiun Jakarta. Data sudah aman, lihat skema Zod |
| 5 | Titik AI #1 & #2 "di luar scope MVP, milik Jalur 2" | **Dicabut permanen**, bukan ditunda (Bagian 3) |
| 6 | ❓ "sumber data skor komponen masih di-research Jalur 2" | **Ditutup.** Skema final di 6.7 |
| 7 | `/api/score` boleh dibangun dengan data dummy/seed | **Tidak perlu lagi.** Nama kolom final sudah tersedia |
| 8 | Layar edit bobot "ditunda setelah MVP" | **Dihapus permanen.** Tidak ada yang bisa disunting |
| 9 | Isokron 5 & 10 menit | **Hanya 10 menit** |
| 10 | Property card menampilkan jarak jalan kaki | **Tidak ditampilkan.** Tidak ada sumber angkanya di MVP ini |
| 11 | Out-of-scope: "resolusi penuh 12+ simpul termasuk MRT/LRT" | Tetap di luar scope, tetapi daftar stasiun berpindah ke Jakarta |

**Yang dicabut dari `context-final.md`** dan tidak lagi berlaku untuk MVP: formula 4 variabel
+ λ·P_KDE, tabel 3 arketipe, scikit-learn/KDE/EPSG:32748, normalisasi persentil, H3 resolusi
9, agregasi persentil ke-75, skema `scored_cells`, aturan dedup < 20 m, validasi Spearman vs
`kondisi_tempat`, Struk Go sebagai sumber D dan T, generator data sintetis, dan kontrak
`/api/score` lama.

---

## 9. Status penyelesaian item dari v2

✅ **B-1 sampai B-6 (sebelumnya memblokir) sudah ditutup.** Poligon isokron, daftar stasiun
Jakarta, sensus restoran, data Menu Go, dua tabel padanan manual, dan tabel Community
Activity, seluruhnya sudah aman dan tersedia. Detail struktur field masing-masing mengikuti
skema Zod yang akan dibuat langsung di kode saat implementasi, sehingga tidak perlu
dispesifikasikan lebih jauh di dokumen ini.

❌ **O-1 sampai O-8 (perlu keputusan, tidak memblokir) dibuang dari dokumen ini.** Item-item
itu dinilai tidak penting untuk scope MVP 5 hari dan tidak lagi menjadi bagian dari context
ini. Tim tidak perlu menunggu keputusan apa pun terkait metode validasi, rentang nilai D,
posisi puncak kurva C, jarak jalan kaki di property card, ambang `is_rankable`, skema output
titik AI #5, maupun asal-usul dan umur sensus restoran, semuanya dianggap selesai secara
default mengikuti keputusan yang sudah ada di Bagian 6 dan 7, tanpa perlu pembahasan lebih
lanjut.

---

## 10. Revisi PRD yang harus diberitahukan tim produk

1. **Indeks Risiko Spasial** keluar dari MVP.
2. **Heatmap kejenuhan pasar** keluar dari MVP.
3. **Isokron 5 menit** dicabut.
4. **Klaim "AI menentukan bobot parameter" gugur.**
5. **Bab 5 Dataset**, tambahkan sensus restoran; koreksi peran Struk Go, Menu Go, dan
   Community Activity.
6. **Bab 7 Metode**, ganti formula, hapus KDE dan OSMnx.
7. **Bab 9 Persyaratan Teknis**, coret scikit-learn.
8. Tambahkan pernyataan bahwa SIGMAPS mengukur **potensi pasar**, bukan **kelayakan
   investasi**, karena biaya sewa tidak terukur.

---

## 11. Referensi

- `CLAUDE.md`, aturan struktur folder & kode (tetap berlaku penuh).
- `context/context-final.md`, arsitektur & keputusan produk di luar MVP; berlaku kecuali
  yang dicabut di Bagian 8.
- Studi AHP-TOPSIS pemilihan lokasi usaha, JUTIN, Universitas Pahlawan, 2026, sumber rasio
  bobot 2 : 1.

🔄 **Ground truth data/ERD/API, ditetapkan 4 September 2026** — untuk segala hal soal
struktur tabel, kolom, dan kontrak endpoint, tiga dokumen berikut **menang atas isi Bagian 6
di dokumen ini** bila ada selisih detail kecil yang terlewat saat sinkronisasi:
- `context/dokumentasi-erd-mvp.md` — penjelasan lengkap tiap kolom enam tabel, alasan
  desain, dan kenapa hampir tidak ada foreign key.
- `context/daftar-api-sigmaps.xlsx` — kontrak persis tiap endpoint (field request/response,
  kode galat, query SQL baku, pengaman wajib, keputusan yang masih terbuka). ⚠️ Query
  contoh di sheet Aturan & Pengaman masih menulis `sensus_restoran` — dibaca sebagai
  `katalog_restoran` (lihat catatan penamaan di 6.7).
- Diagram ERD dbdiagram.io (PDF) — skema visual enam tabel, sumber nama tabel
  `katalog_restoran` yang dikonfirmasi benar (lihat 6.7).
