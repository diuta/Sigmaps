# Context: SIGMAPS MVP

**Versi:** 2 — hasil penggabungan `context-mvp.md` v1 dengan `context-perhitungan.md`,
2 September 2026.

**Status:** dokumen acuan utama untuk pengerjaan MVP. **Berdiri sendiri** — seluruh
spesifikasi mesin skoring sudah dimuat di Bagian 6, tidak perlu membuka dokumen lain.
`context-final.md` masih berlaku untuk hal di luar MVP, tetapi bila bertentangan dengan
dokumen ini, **dokumen ini yang berlaku** (daftar pencabutan di Bagian 8).

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
layer terpisah (`components/map/layers/StationLayer.tsx`), diambil lewat Server Component
(`app/page.tsx`) dari Supabase, di-passing sebagai props — bukan di-fetch sendiri oleh
Client Component.

✅ **Wilayah MVP: DKI Jakarta.** Ini mengubah rencana v1 yang memakai 5 stasiun Tangsel
(Cisauk, Serpong, Rawa Buntu, Sudimara, Jurangmangu). Alasannya di Bagian 7: Menu Go —
sumber tunggal variabel D dan S — menumpuk di Jakarta dan nyaris nol di Tangsel. Cakupan
PRD tetap Jabodetabek; yang menyempit hanya kawasan yang diskor di MVP.

❓ **Daftar stasiun Jakarta belum ditetapkan.** PRD menyebut "12 simpul" tanpa nama.
Klaster Menu Go terbesar berada di sekitar Tanah Abang, Sudirman, dan koridor Sawah Besar–
Juanda, tetapi identitas stasiunnya belum diverifikasi. **Jangan hardcode daftar stasiun
sebelum ini ditetapkan.**

### Langkah 2 — Business Brief → Top 5 (ONE-SHOT)

✅ Alurnya **one-shot** — user ketik → langsung dapat Top 5. Tidak ada layar review/edit
parameter.

⚠️ **Berubah dari v1:** v1 menyebut layar edit bobot "ditunda setelah MVP". Sekarang
**dihapus permanen**, karena bobotnya tunggal dan tidak ada lagi yang bisa disunting
(Bagian 6.5).

**Alur teknis:**
```
Sidebar (Client Component)
  → POST /api/parse-intent { teks: "..." }
      → Gemini + Zod (IntentSchema, lihat Bagian 6.6)
  → POST /api/score { tipe_3, harga_target }
      → baca scored_areas dari Supabase
      → hitung C dan S, gabung dengan D (lib/scoring.ts) — DETERMINISTIK
      → urutkan, ambil Top 5
  → tampilkan Top 5 + skor + dekomposisi komponen mentah (angka/chart)
```

⚠️ **Berubah dari v1:** `/api/score` **tidak lagi menerima `weights`** dari klien. Bobot
tunggal dan ditetapkan di server.

⚠️ **Berubah dari v1:** `scored_cells` **tidak dipakai**. Skoring hanya di level kawasan
(`scored_areas`).

✅ **"Summary kenapanya" TIDAK termasuk MVP.** AI Area Insight (titik sentuh AI #4) di luar
scope. Top 5 cukup tampilkan angka skor + dekomposisi komponen mentah (`demand: 0.528`,
dst.), **tanpa** kalimat naratif AI.

✅ **Skema `scored_areas` sudah final** (Bagian 6.7). Item ❓ di v1 ("sumber data skor
komponen masih di-research oleh Jalur 2") **ditutup**. Data dummy/seed tidak diperlukan
lagi — Jalur 1 dan Jalur 3 dapat langsung membangun di atas nama kolom final.

**Yang wajib ditangani UI:**

| Kondisi | Perilaku |
|---|---|
| `harga_sumber = 'perkiraan'` | Tampilkan "Harga tidak disebutkan, kami perkirakan Rp25.000 dari jenis usaha. Ubah?" |
| `tipe_3 = 'SEMUA'` | Tampilkan bahwa penilaian kompetisi memakai seluruh kategori kuliner |
| `is_rankable = false` | Kawasan tampil di peta dengan label "data belum cukup", **tidak** ikut diperingkat |
| Usaha non-kuliner | Tolak dengan pesan jelas, jangan beri skor |

❓ **Bila kawasan `is_rankable` kurang dari 5**, "Top 5" tidak dapat dipenuhi. Perlu
diputuskan: tampilkan seadanya, atau turunkan judulnya jadi "Kawasan Teratas".

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

❓ Skema Zod output belum diputuskan — schema baru terpisah atau generalisasi.
❓ Tabel Community Activity belum ada di Supabase — perlu dibuat + loader baru.

#### 3b. Katalog properti dalam isokron

❓ **MEMBLOKIR.** Poligon isokron dari MAPID Isochrone Tool belum dipastikan siap. Ini
bukan hanya soal katalog properti — **rumus C membutuhkan `area_km2` sebagai penyebut
kepadatan**, jadi tanpa poligon tidak ada definisi kawasan dan skoring tidak bisa jalan
sama sekali. Pekerjaan Jalur 2, prioritas tertinggi.

✅ Poligon dibuat untuk semua titik stasiun yang masuk daftar, bukan hanya kawasan survei.

⚠️ **Berubah dari v1:** hanya isokron **10 menit**. Isokron 5 menit dicabut — rumus tidak
memakainya, dan ketersediaannya di MAPID Isochrone Tool belum terverifikasi.

```
GET /api/properties?station_id=... → FeatureCollection Properti Go
  (sudah difilter dalam isokron)
```

### Langkah 4 — Klik properti → property card

✅ Kolom yang ditampilkan: `kategori_properti`, `jenis_properti` (Sewa/Jual), alamat, foto
(`foto_tampak_depan`, `foto_spanduk`).

✅ **Dilarang** menampilkan filter/field luas, harga, kontak pemilik — Properti Go tidak
punya kolom itu.

❓ **Jarak jalan kaki ke stasiun.** v1 menuliskannya bersyarat ("kalau isokron/routing sudah
ada"). Perhitungan MVP tidak lagi memakai MAPID Routing Tool maupun faktor detour, jadi
tidak ada sumber angka ini. Perlu diputuskan: buang dari property card, atau pakai jarak
garis lurus dengan label yang jujur ("± sekian meter, garis lurus").

---

## 3. Titik sentuh AI — MVP hanya #3 dan #5

⚠️ **Berubah dari v1.** Jumlah titik sentuh AI turun dari **5 menjadi 3**. Titik #1 dan #2
bukan lagi "di luar scope MVP" melainkan **dicabut permanen**.

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
oleh AI. Kalimat yang benar untuk PRD: *parameter yang sama selalu menghasilkan skor yang
sama* — bukan "AI tidak pernah dipanggil".

---

## 4. Yang sengaja di luar scope MVP

- **AI Area Insight** (titik #4) — Top 5 tampil tanpa narasi AI.
- Filter percakapan AI ("tunjukkan kawasan risiko rendah...").
- Matriks perbandingan 2–3 properti berdampingan.
- Export ringkasan ke PDF.
- Rate limiting per-IP matang (`middleware.ts`) — perlu sebelum publik, bukan blocker demo.
- **`scored_cells`, H3, heatmap kejenuhan pasar** — sampel per sel terlalu tipis.
- **`risk_level` / Indeks Risiko Spasial** — tidak ada rumusnya di model baru.
- **T (`temporal_fitness`)** — butuh survei 4 slot waktu, tidak layak dalam sisa waktu.
- **`kde_penalty`, KDE, scikit-learn, λ.**
- **Isokron 5 menit.**
- **Layar edit bobot manual** — dihapus permanen, bukan ditunda.
- **Arketipe non-kuliner** (laundry, minimarket, barbershop) — tidak ada data pesaingnya.

⚠️ Empat item bertanda tebal di atas (`heatmap`, `risk_level`, isokron 5 menit, klaim bobot
AI) **ada di in-scope PRD**. PRD perlu direvisi atau menandainya pasca-MVP, jika tidak akan
terlihat seperti janji yang tidak ditepati saat demo.

---

## 5. Pemetaan kerja per jalur

**Jalur 1 (Data/Backend):** `app/api/parse-intent`, `app/api/score`, `app/api/properties`,
`app/api/community-sentiment`, tabel Community Activity di Supabase + loader.
✅ Tidak perlu lagi menunggu Jalur 2 — skema `scored_areas` (Bagian 6.7) sudah final dan
dapat dipakai sekarang.

**Jalur 2 (Analisis Spasial/Skoring):** poligon isokron **(blocking tertinggi)**, pipeline
batch Python, isi tabel `scored_areas`, dua tabel padanan manual (Bagian 6.6).

**Jalur 3 (Frontend/AI):** `components/map/*`, sidebar Business Brief, panel Top 5 +
dekomposisi (angka/chart, tanpa narasi AI), panel klik stasiun (2 tab), property card.
Zod schema yang dipakai: `IntentSchema` (Bagian 6.6) dan schema output titik #5 (❓).
`InsightSchema` tidak perlu dikerjakan.

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
| 0,0 | 0,33 | tanpa pesaing — pasar belum terbukti, ikut dihukum |
| 0,4 | 1,00 | ideal |
| 0,7 | 0,50 | mulai padat |
| 1,0 | 0,00 | paling sesak |

Penyebut 0,6 **terikat** pada puncak 0,4, bukan angka bebas: `maks(puncak, 1 − puncak)`.
Bila puncak digeser ke 0,3, penyebut otomatis jadi 0,7. Jangan diubah terpisah.

⚠️ **Normalisasi min-max, bukan persentil.** Ini mencabut keputusan lama. Keputusan lama
benar untuk sel H3 (ribuan sel, satu pencilan bisa menekan semuanya), tetapi skoring
sekarang di level kawasan — dengan 5 kawasan, persentil hanya bisa menghasilkan lima nilai:
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
kriteria lain dalam studi itu tidak dipakai — aksesibilitas 0,27 sudah disaring lebih dulu
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
rentang sempit — **jangan dipakai untuk memblokir apa pun**, dan kalibrasi ambangnya dari
uji nyata 20–30 prompt. `harga_sumber` dan `tipe_3 = 'SEMUA'` adalah sinyal faktual yang
lebih andal.

❓ **Dua tabel manual belum ditulis**, masing-masing 24 baris, ditulis tangan:
padanan teks bebas → `TIPE_3` + `SEMUA`, dan perkiraan harga per `TIPE_3`. Daftar harga
wajib diberikan di dalam prompt agar hasil AI konsisten antar pemanggilan.

### 6.7 Skema `scored_areas`

```sql
create table scored_areas (
  area_id            text primary key,
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
```

`competitor_counts` berbentuk `{ "CEPAT SAJI": 8, "KAFE DAN RESTO": 3, ... }`.

✅ **Skor akhir tidak disimpan** — dihitung live di `lib/scoring.ts` saat request.

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
    "station_name": "Tanah Abang",
    "skor": 78.3,
    "komponen": { "demand": 0.528, "competitive_headroom": 0.927, "segment_match": 0.750 },
    "bobot": { "wD": 0.25, "wC": 0.50, "wS": 0.25 },
    "n_observations": 28, "n_price": 28, "is_rankable": true
  }],
  "catatan": { "harga_sumber": "pengguna" }
}
```

Kawasan dengan `is_rankable = false` tetap dikirim agar dapat digambar di peta dengan label
"data belum cukup", tetapi tidak ikut diperingkat.

### 6.9 Tahap batch (Python, tanpa AI)

1. **Kumpulkan pengamatan** — gabungkan Menu Go dan survei tim; kolomnya sama.
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
   dinormalisasi di sini — normalisasi butuh kategori yang baru diketahui saat runtime.
6. **Tandai** `is_rankable = n_observations >= 10`.

⚠️ **Deduplikasi berubah.** Aturan lama ("objek sama bila < 20 m dan nama mirip") dicabut.
Bila anggota tim mensurvei tempat yang sudah ada di Menu Go, hasilnya dihitung sebagai **dua
pengamatan**, bukan satu — keduanya pengamatan keramaian pada waktu berbeda, bukan duplikat
baris.

### 6.10 Konstanta dan asalnya

| Konstanta | Nilai | Status | Asal |
|---|---|---|---|
| Skala ordinal | 0 / 0,5 / 1 | 🔶 | Jarak antar tingkat **diasumsikan sama** |
| Kekuatan tarikan K | 8 | 🔶 | Keputusan tim |
| Nilai netral | 0,5 | ✅ | Titik tengah skala ordinal |
| Puncak kurva punuk | 0,4 | ❓ | **Tebakan tim. Konstanta paling rapuh** |
| Penyebut punuk | 0,6 | ✅ | Turunan: `maks(puncak, 1 − puncak)` |
| Pemotongan pencilan | persentil 5 & 95 | 🔶 | Menutup kelemahan min-max |
| Bobot 0,25 / 0,50 / 0,25 | — | ✅ | Rasio 2 : 1 dari literatur (6.5) |
| Ambang `is_rankable` | 10 | 🔶 | Tanpa dasar statistik formal |
| Pengali skala | 100 | ✅ | Kosmetik |
| Pembersihan harga | 1.000 / 2.000 / 150.000 | 🔶 | Menangani salah input nyata |

❓ Puncak 0,4 **sendirian menentukan siapa yang menang**. Cara mengubahnya jadi temuan:
hitung x tiap kawasan, lalu lihat pada nilai x berapa kawasan paling banyak memuat tempat
berlabel "Ramai" di Menu Go. Geser puncak ke sana dan dokumentasikan sebagai temuan empiris.

---

## 7. Temuan data yang mendasari perubahan

Seluruhnya hasil pemeriksaan langsung, bukan asumsi.

**Struk Go mati.** Dari 100 record se-Jabodetabek, `tanggal` bernilai `{}` pada **100 dari
100** baris, dan tidak ada kolom nominal transaksi. Kolom yang ada hanya `nama_tempat`,
`kategori_tempat`, `metode_pembayaran`, `foto_struk`.

⚠️ Ini **membantah** catatan lama bahwa Struk Go "punya jam transaksi" — yang berdasar
konfirmasi lisan, bukan data. Konsekuensinya D dan T tidak dapat dibangun dari Struk Go di
kawasan mana pun, bukan hanya di Cisauk.

**Community Activity bias secara kepadatan.** 1.653 laporan, seluruhnya dari satu komunitas
dengan 141 kontributor, 1.396 di antaranya dibuat pada Agustus 2026 — periode lomba.
Kepadatan laporan mengukur di mana tim peserta memilih survei, bukan di mana aktivitas
ekonominya tinggi. Karena itu ia keluar dari formula, tetapi tetap dipakai di Langkah 3a.

**Menu Go menumpuk di Jakarta, nyaris nol di Tangsel.** Ini alasan wilayah MVP berpindah.

**Menu Go bukan populasi restoran.** Sebaran `jenis_tempat` pada sampel 100: Kaki Lima 47,
Restoran 22, Warung/Tenda 21, Fast Food 6, Kafe 4.

🔶 Konsekuensi yang wajib ditulis di PRD: **S mengukur tingkat harga kawasan sebagai
cerminan daya beli**, bukan kesesuaian dengan harga pesaing sekategori. Menghitung S per
kategori tidak mungkin — dengan 4 Kafe se-Jabodetabek, tidak ada kawasan bersampel cukup.

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

❓ Asal sensus perlu dikonfirmasi. Nama berkas memuat `IMPORTED_AT_1_SEP_2026`, yang
menyiratkan impor lewat platform MAPID. Bila benar, dataset ini masuk kategori **"Basis data
POI MAPID"** yang sudah sah sebagai dataset pendukung — kalimat PRD-nya jauh lebih kuat
daripada menyebutnya "open data pemerintah".

---

## 8. Konflik dengan v1 dan bagaimana diselesaikan

| | Isi v1 | Penyelesaian |
|---|---|---|
| 1 | `IntentSchema`: `kategori_usaha`, `target_jam`, `segmen`, `skala`, `weights`, `confidence` | **Diganti** oleh 6.6. Nama lama dilarang |
| 2 | `/api/score` menerima `{ weights }` dari klien | **Dicabut.** Bobot tunggal, ditetapkan server (6.8) |
| 3 | Langkah 2 membaca `scored_areas`/`scored_cells` | **`scored_cells` dicabut** dari MVP. Hanya `scored_areas` |
| 4 | Daftar stasiun: 5 stasiun Tangsel | **Diganti** stasiun Jakarta. Nama belum ditetapkan (❓) |
| 5 | Titik AI #1 & #2 "di luar scope MVP, milik Jalur 2" | **Dicabut permanen**, bukan ditunda (Bagian 3) |
| 6 | ❓ "sumber data skor komponen masih di-research Jalur 2" | **Ditutup.** Skema final di 6.7 |
| 7 | `/api/score` boleh dibangun dengan data dummy/seed | **Tidak perlu lagi.** Nama kolom final sudah tersedia |
| 8 | Layar edit bobot "ditunda setelah MVP" | **Dihapus permanen.** Tidak ada yang bisa disunting |
| 9 | Isokron 5 & 10 menit | **Hanya 10 menit** |
| 10 | Property card menampilkan jarak jalan kaki | ❓ **Belum selesai.** Routing Tool tidak dipakai lagi, tidak ada sumber angkanya |
| 11 | Out-of-scope: "resolusi penuh 12+ simpul termasuk MRT/LRT" | Tetap di luar scope, tetapi daftar stasiun berpindah ke Jakarta |

**Yang dicabut dari `context-final.md`** dan tidak lagi berlaku untuk MVP: formula 4 variabel
+ λ·P_KDE, tabel 3 arketipe, scikit-learn/KDE/EPSG:32748, normalisasi persentil, H3 resolusi
9, agregasi persentil ke-75, skema `scored_cells`, aturan dedup < 20 m, validasi Spearman vs
`kondisi_tempat`, Struk Go sebagai sumber D dan T, generator data sintetis, dan kontrak
`/api/score` lama.

---

## 9. Yang masih terbuka

### Memblokir

❓ **B-1. Poligon isokron belum dipastikan siap.** Menghentikan C, dan C berbobot terbesar.
Pekerjaan Jalur 2, prioritas tertinggi.

❓ **B-2. Daftar stasiun Jakarta belum ditetapkan.**

❓ **B-3. Sensus restoran Jakarta baru satu kota** (Jakarta Pusat). Barat, Selatan, Timur,
Utara belum masuk.

❓ **B-4. Menu Go baru tertarik 100 dari 230 record.** Seluruh angka pada dokumen ini masih
berbasis sampel.

❓ **B-5. Dua tabel padanan manual belum ditulis** (6.6).

❓ **B-6. Tabel Community Activity belum ada di Supabase** — dibutuhkan Langkah 3a.

### Perlu keputusan, tidak memblokir

❓ **O-1. Cara validasi belum dipilih.** Rencana lama (Spearman antara skor dan
`kondisi_tempat`) **sirkular**, karena kolom itu sekarang menjadi input D — hasilnya
mengukur sebuah angka terhadap dirinya sendiri, dan korelasinya pasti tinggi tanpa
membuktikan apa pun. Empat opsi:

- **A — Community Activity sebagai pembanding.** Independen karena sudah keluar dari
  formula. Diuji: hanya 3 dari 5 klaster punya cukup laporan berlabel, jadi **butuh ≥10
  kawasan** agar Spearman bermakna.
- **A-varian — pencocokan per titik.** Pasangkan tiap titik Menu Go dengan laporan Activity
  dalam radius 100 m, adu labelnya. Diuji: **41 dari 100** titik sampel punya pasangan;
  dengan 230 record penuh kira-kira 95 pasangan. Hasilnya matriks kecocokan 3×3. Tidak
  bergantung jumlah kawasan. **Paling kuat.**
- **B — sisihkan 30% Menu Go** sebagai holdout. Baku, tapi D kehilangan 30% sampel.
- **C — survei tim terpisah.** Paling kuat, tapi butuh tenaga lapangan.

Ekstraksi label untuk opsi A tetap butuh AI, dan itu **tidak melanggar** keputusan "batch
tanpa AI" — validasi bukan bagian dari pipeline skoring, dijalankan sekali, hasilnya tidak
pernah menyentuh `scored_areas`.

❓ **O-2. Rentang D hanya 0,068**, sehingga D hampir tidak menyumbang ke peringkat dengan
bobot apa pun. Periksa ulang setelah 230 record Menu Go penuh masuk. Bila masih serapat ini,
permintaan — yang seharusnya jadi inti produk — praktis tidak berfungsi.

❓ **O-3. Puncak kurva punuk masih tebakan** (6.10).

❓ **O-4. Jarak jalan kaki di property card** — buang, atau pakai jarak garis lurus dengan
label jujur (Langkah 4).

❓ **O-5. Bila kawasan `is_rankable` kurang dari 5**, "Top 5" tidak dapat dipenuhi
(Langkah 2).

❓ **O-6. Skema Zod output titik AI #5** belum diputuskan (Langkah 3a).

❓ **O-7. Asal sensus restoran perlu dikonfirmasi** (Bagian 7).

❓ **O-8. Sensus restoran berumur hampir tiga tahun** (Q4 2023). Usaha kuliner tingkat
tutupnya tinggi. Survei tim dapat memverifikasi sampel kecil, dan angkanya layak dilaporkan
di PRD.

---

## 10. Revisi PRD yang harus diberitahukan tim produk

1. **Indeks Risiko Spasial** keluar dari MVP.
2. **Heatmap kejenuhan pasar** keluar dari MVP.
3. **Isokron 5 menit** dicabut.
4. **Klaim "AI menentukan bobot parameter" gugur.**
5. **Bab 5 Dataset** — tambahkan sensus restoran; koreksi peran Struk Go, Menu Go, dan
   Community Activity.
6. **Bab 7 Metode** — ganti formula, hapus KDE dan OSMnx.
7. **Bab 9 Persyaratan Teknis** — coret scikit-learn.
8. Tambahkan pernyataan bahwa SIGMAPS mengukur **potensi pasar**, bukan **kelayakan
   investasi**, karena biaya sewa tidak terukur.

---

## 11. Referensi

- `CLAUDE.md` — aturan struktur folder & kode (tetap berlaku penuh).
- `context/context-final.md` — arsitektur & keputusan produk di luar MVP; berlaku kecuali
  yang dicabut di Bagian 8.
- Studi AHP-TOPSIS pemilihan lokasi usaha, JUTIN, Universitas Pahlawan, 2026 — sumber rasio
  bobot 2 : 1.
