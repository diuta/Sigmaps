# Context: SIGMAPS MVP

**Versi:** 4 — 6 September 2026. Memperbarui v3 dengan angka hasil pengukuran langsung
setelah seluruh data benar-benar dimuat ke Supabase.

v3 menutup item B-1 sampai B-6 dengan pernyataan "data sudah aman" tanpa angka. v4
menggantinya dengan angka yang sebenarnya, dan **mengoreksi tiga keputusan yang ternyata
tidak cocok dengan data**: ambang `is_rankable` (6.9), sumber variabel D (6.2), dan cara C
menangani kategori bersampel tipis (6.3b).

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
layer terpisah (`components/map/layers/StationLayer.tsx`), diambil lewat Server Component
(`app/page.tsx`) dari Supabase, di-passing sebagai props, bukan di-fetch sendiri oleh
Client Component.

✅ **Wilayah MVP: DKI Jakarta**, menggantikan rencana 5 stasiun Tangsel di versi sebelumnya
(Cisauk, Serpong, Rawa Buntu, Sudimara, Jurangmangu). Alasannya di Bagian 7: Menu Go, sumber
tunggal variabel D dan S, menumpuk di Jakarta dan nyaris nol di Tangsel. Cakupan PRD tetap
Jabodetabek, yang menyempit hanya kawasan yang diskor di MVP.

✅ **Daftar stasiun final: 43 stasiun commuter DKI**, `station_id` = `R-1` … `R-43`, sudah
dimuat ke tabel `stasiun`. Sebarannya: Jakarta Pusat 13 · Jakarta Barat 11 · Jakarta Selatan
10 · Jakarta Timur 5 · Jakarta Utara 4.

⚠️ **PRD menyebut "12 simpul"**, angka itu perlu dikoreksi jadi 43. Secara statistik 43
justru menguntungkan: pemotongan persentil 5/95 pada rumus C baru bermakna di atas ~10
kawasan (lihat catatan 🔶 di 6.3).

🔶 **Lima pasang stasiun praktis berimpit.** Kampung Bandan Bawah–Atas berjarak 262 m; empat
pasang lain (Jakarta Kota–Jayakarta, Sawah Besar–Juanda, Pasar Minggu Baru–Duren Kalibata,
Jayakarta–Kampung Bandan Atas) di bawah 900 m. Isokronnya tumpang tindih berat dan sepasang
bisa menempati dua slot Top 5 sekaligus dengan skor nyaris identik. **Keputusan tim:
dibiarkan**, tidak digabung.

### Langkah 2 — Business Brief → Top 5 (ONE-SHOT)

✅ Alurnya **one-shot**, user ketik, langsung dapat Top 5. Tidak ada layar review/edit
parameter.

⚠️ v1 menyebut layar edit bobot "ditunda setelah MVP". Sekarang **dihapus permanen**, karena
bobotnya tunggal dan tidak ada lagi yang bisa disunting (Bagian 6.5).

**Alur teknis:**
```
Sidebar (Client Component)
  → POST /api/parse-intent { teks: "..." }
      → Gemini + Zod (IntentSchema, lihat Bagian 6.6)
  → POST /api/score { tipe_3, harga_target }
      → baca scored_areas dari Supabase
      → hitung C dan S, gabung dengan D (lib/scoring.ts), DETERMINISTIK
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

❓ **Tabel `community_activity` sudah dibuat tetapi MASIH KOSONG (0 baris).** Datanya ada di
API MAPID Competition dan cara menariknya sama persis dengan Menu Go — `etl/tarik_mapid.py`
dapat dijadikan contoh. **Pekerjaan Jalur 1**, bukan Jalur 2. Skema Zod untuk output ringkasan
dibuat bersamaan dengan endpoint ini.

#### 3b. Katalog properti dalam isokron

✅ **43 poligon isokron sudah dimuat ke `scored_areas`**, seluruhnya keluaran MAPID
Isochrone Tool apa adanya: `isochrone_profile = "foot"`, `time_limit = 600` detik. Luasnya
**0,493 – 1,580 km², median 1,059** — setara radius efektif ~580 m, wajar untuk jalan kaki
10 menit yang dibatasi jaringan jalan.

✅ **`area_km2` dihitung `ST_Area(geom::geography) / 1e6`**, luas geodesik di atas elipsoid.
Tanpa proyeksi apa pun, jadi tidak ada zona UTM yang bisa salah dipilih. Ini menutup
pertanyaan proyeksi yang tertinggal setelah EPSG:32748 dicabut di Bagian 8.

🔶 **Batasan yang wajib di PRD:** poligonnya kasar, 13–39 titik dengan median 24. Isokron
pejalan kaki sungguhan berlekuk mengikuti jalan; pada resolusi ini penghalang nyata (sungai,
rel, jalan tol) kemungkinan terlewati.

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

**Jalur 1 (Data/Backend):** `app/api/parse-intent`, `app/api/score`, `app/api/properties`,
`app/api/community-sentiment`, tabel Community Activity di Supabase + loader.
✅ Skema `scored_areas` (Bagian 6.7) sudah final dan dapat dipakai sekarang.

**Jalur 2 (Analisis Spasial/Skoring):** ✅ **selesai 6 September 2026**, kecuali dua tabel
padanan manual (6.6). Yang sudah jalan: `etl/load_isokron.py` (43 poligon),
`etl/tarik_mapid.py` + `etl/load_mapid.py` (Menu Go 176, Properti Go 191),
`etl/pipeline_scoring.py` (seluruh kolom komponen), dan `lib/scoring.ts` (C, S, skor akhir).

⚠️ **`lib/scoring.ts` dipegang Jalur 2, bukan Jalur 1**, meski `/api/score` milik Jalur 1.
Alasannya seluruh konstanta rumus harus hidup di satu kepala; kalau Python dan TypeScript
ditulis dua orang berbeda, keduanya menyimpang tanpa pernah menimbulkan galat.

⚠️ **`etl/` sekarang berisi loader Python yang terhubung langsung ke Supabase lewat psycopg2**
(`DATABASE_URL`, variabel baru di `.env.example`), menggantikan `script.py` lama yang hilang.
`stasiun` dan `katalog_restoran` diimpor **manual lewat Table Editor Supabase**, bukan lewat
Python.

**Jalur 3 (Frontend/AI):** `components/map/*`, sidebar Business Brief, panel Top 5 +
dekomposisi (angka/chart, tanpa narasi AI), panel klik stasiun (2 tab), property card.
Zod schema yang dipakai: `IntentSchema` (Bagian 6.6) dan schema output titik #5.
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

**Sumber:** `kondisi_tempat` di Menu Go.

⚠️ **Survei tim dicabut.** Tidak ada tabelnya di skema dan tidak jadi dikerjakan, sehingga D
bertumpu sepenuhnya pada **176 pengamatan Menu Go di DKI**. Sebaran nilainya: Sedang 95 ·
Sepi 54 · Ramai 27. Nilai aslinya berupa kalimat panjang (`'Sedang (Ada 1-3 pembeli yang
sedang menunggu/makan)'`), dipotong ke kata pertamanya saat dimuat.

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

### 6.3b Pengelompokan kategori dan penurunan ke `SEMUA`

⚠️ **Bagian baru di v4.** Diperlukan setelah pengukuran menunjukkan C mati untuk sebagian
besar kategori.

Sensus punya **24 kategori `TIPE_3`**, tetapi hanya 751 restoran yang jatuh di dalam isokron.
Dipecah 24 arah, sebagian besar kategori hanya ada di segelintir kawasan, dan kawasan sisanya
mendarat di `C = 0,333` — yang **bukan nilai netral melainkan hukuman** "pasar belum
terbukti". Komponen berbobot 0,50 lalu berhenti membedakan apa pun, sementara skornya tetap
keluar dan terlihat wajar.

**Dua penanganan, dipakai bersama:**

**1. 24 kategori dikelompokkan jadi 14** di `lib/scoring.ts`. Ini **lapisan pemetaan, bukan
perubahan data** — `competitor_counts` tetap menyimpan 24 kunci mentah, penjumlahan terjadi
saat request. Mengubah pemetaan tidak butuh migrasi maupun tarik ulang data.

```
CEPAT SAJI        = CEPAT SAJI + RESTORAN AYAM
KAFE DAN RESTO    = KAFE DAN RESTO + JAJANAN
ASIA TIMUR        = RESTORAN JEPANG + SUSHI + RAMEN + RESTORAN CINA
MASAKAN NUSANTARA = WARUNG TEGAL + RESTORAN NUSANTARA
ASIA TENGGARA     = RESTORAN THAILAND + RESTORAN VIETNAM
MASAKAN BARAT     = RESTORAN EROPA + PIZZA + STEAK DAN BBQ + RESTORAN MEKSIKO
(delapan lainnya berdiri sendiri)
```

🔶 Empat penggabungan berikut **penilaian tim, bukan fakta**, dan pantas dibantah:
RESTORAN AYAM→CEPAT SAJI (kuat), RESTORAN CINA→ASIA TIMUR (lemah), RESTORAN
MEKSIKO→MASAKAN BARAT (lemah), JAJANAN→KAFE DAN RESTO (paling lemah).

**2. Penurunan otomatis ke `SEMUA`** bila kelompoknya tetap terlalu tipis: kalau kurang dari
**separuh kawasan yang diperingkat** punya pesaing kelompok itu, C dihitung dari
`total_restaurants`. Responsnya membawa `catatan.fallback_ke_semua` supaya UI dapat berkata
jujur, bukan diam-diam mengganti penilaian.

⚠️ **Cakupan diukur pada kawasan `is_rankable`, bukan seluruh 43** — dan bedanya nyata.
`RESTORAN MELAYU` ada di 26 dari 43 kawasan, terdengar cukup, tetapi hanya di 4 dari 11
kawasan yang benar-benar diperingkat. Mengukur pada populasi yang salah membuat fallback
tidak menyala saat seharusnya menyala.

Hasil pengukuran 6 September 2026: **7 dari 14 kelompok** punya cakupan cukup (CEPAT SAJI 10,
SEAFOOD 9, RESTORAN PADANG 8, RESTORAN KOREA 8, MIE DAN BAKSO 6, NASI GORENG 6, ASIA TENGGARA
6 — dari 11 kawasan). Tujuh sisanya, termasuk `KAFE DAN RESTO` dan `ASIA TIMUR`, selalu turun
ke `SEMUA`. **Jalur 3 wajib menyiapkan kalimatnya**, karena ini akan sering muncul.

### 6.4 S — kecocokan segmen

```
S = maks(0, 1 − |price_median − harga_target| ÷ harga_target)
```

**Sumber:** `harga_rata_rata` di Menu Go (survei tim dicabut, lihat 6.2), median per kawasan.

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

🔄 **Diukur ulang 6 September 2026 dengan 176 pengamatan penuh: rentang D ternyata 0,212**
(0,333 – 0,545), tiga kali lebih lebar daripada angka di atas. Kekhawatiran "permintaan
praktis tidak berfungsi" jauh lebih ringan dari dugaan. Kesimpulan bobot tunggal tidak
berubah, C tetap mendominasi — tetapi **angka 0,068 di atas berasal dari sampel awal dan
jangan dikutip lagi di PRD**.

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

❓ **Dua tabel manual (padanan teks bebas → `TIPE_3` + `SEMUA`, dan perkiraan harga per
`TIPE_3`) BELUM DITULIS.** Masing-masing 24 baris, ditulis tangan. Yang sudah pasti adalah
**24 nilai `TIPE_3`-nya**, terverifikasi dari sensus — jadi tidak ada lagi yang menghalangi.
Pekerjaan Jalur 2, dipakai Jalur 1. Daftar harga wajib diikutkan di dalam prompt agar hasil
AI konsisten antar pemanggilan.

⚠️ **`SEMUA` dan 14 nama kelompok (6.3b) TIDAK ADA di sensus** — keduanya hanya hidup di
kontrak API dan di `lib/scoring.ts`. Jangan pernah menyimpannya ke `katalog_restoran.tipe_3`
atau sebagai kunci `competitor_counts`. Sebaliknya, validasi `tipe_3` di `/api/score` **wajib
mengecualikan `SEMUA`**, kalau tidak jalur fallback ditolak oleh validasinya sendiri.

### 6.7 Skema `scored_areas`

```sql
create table scored_areas (
  area_id            text primary key,          -- = station_id, mis. 'R-14'
  station_id         text not null unique references stasiun (station_id),
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
    "area_id": "R-14",
    "station_id": "R-14",
    "station_name": "STASIUN TANAH ABANG",
    "skor": 78.3,
    "komponen": { "demand": 0.528, "competitive_headroom": 0.927, "segment_match": 0.750 },
    "bobot": { "wD": 0.25, "wC": 0.50, "wS": 0.25 },
    "n_observations": 28, "n_price": 28, "is_rankable": true
  }],
  "catatan": {
    "harga_sumber": "pengguna",
    "kelompok_dinilai": "CEPAT SAJI",
    "fallback_ke_semua": false,
    "kawasan_berisi": 10,
    "kawasan_diperingkat": 11,
    "total_kawasan": 43
  }
}
```

Kawasan dengan `is_rankable = false` tetap dikirim agar dapat digambar di peta dengan label
"data belum cukup", tetapi tidak ikut diperingkat.

### 6.9 Tahap batch (Python, tanpa AI)

1. **Kumpulkan pengamatan** dari Menu Go. (Survei tim dicabut, lihat 6.2.)
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
6. **Tandai** `is_rankable = n_observations >= 3 AND n_price >= 3`.

🔄 **Ambang diturunkan dari 10 menjadi 3, dan syarat harga ditambahkan.** Bukan pelonggaran
sembarangan — ini dipaksa oleh sebaran nyata. Dari 176 pengamatan Menu Go di DKI, hanya **79
jatuh di dalam isokron**, tersebar di **19 dari 43 kawasan**:

```
14  11  10  9  6  4  4  3  3  3  3  2  1  1  1  1  1  1  1
```

| Ambang | Kawasan lolos |
|---:|---:|
| ≥ 10 | 3 |
| ≥ 5 | 5 |
| **≥ 3** | **11** |

Dengan ambang 10 hanya 3 kawasan lolos dan Top 5 mustahil dipenuhi. Dengan 5, tepat 5 lolos —
dan "Top 5" dari 5 kandidat berhenti bermakna, karena tidak ada penyaringan yang terjadi.
Ambang 3 memberi 11 kandidat sehingga peringkatnya benar-benar memilih.

Kawasan bertumpu 3 pengamatan memang tipis, tetapi tarikan K = 8 pada rumus D sudah
menahannya di dekat 0,5 — ia tidak dapat menang karena kebetulan. `n_observations` tetap
dikirim ke frontend sehingga pengguna melihat sendiri setebal apa datanya.

Syarat kedua `n_price >= 3` menjamin `price_median` tidak pernah NULL, sehingga S selalu
terhitung. Syarat ini praktis tidak mengikat: dari 176 harga, hanya 1 gugur setelah
pembersihan.

⚠️ **Konsekuensi yang wajib diketahui tim produk: hanya 11 dari 43 kawasan dapat
diperingkat.** 74% peta akan menampilkan label "data belum cukup".

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
| Ambang `is_rankable` | 3 obs & 3 harga | ✅ | Diturunkan dari sebaran nyata (6.9) |
| Ambang cakupan kategori | 0,5 × kawasan diperingkat | 🔶 | Keputusan tim (6.3b) |
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
| Sensus restoran (GeoJSON per kota) | C |
| MAPID Isochrone Tool | batas kawasan + `area_km2` |
| Properti Go | katalog properti, tidak masuk skoring |
| Community Activity | layer peta + titik AI #5, tidak masuk skoring |

**Sensus DKI lengkap: 6.392 baris, 5 kota, 24 kategori `TIPE_3`.** Jakarta Pusat 1.160 ·
Jakarta Utara 1.080 · Jakarta Barat 1.246 · Jakarta Selatan 1.519 · Jakarta Timur 1.387.

Diverifikasi langsung: `TIPE_1`/`TIPE_2` seragam MAKANAN DAN MINUMAN/RESTORAN, tidak ada
koordinat di luar DKI, 10 pasang baris kembar (0,16%, sengaja dibiarkan — bisa jadi dua gerai
nyata di satu gedung).

**751 dari 6.392 restoran (11,7%) jatuh di dalam 43 isokron**, 4–57 per kawasan dengan median
12. **Tidak ada satu pun kawasan tanpa pesaing.**

🔶 **Label `TIPE_3` tidak selalu akurat.** Uji silang nama restoran dengan kategorinya:
'PADANG' 333/333 tepat, 'SUSHI' 131/133, 'SEAFOOD' 413/438, tetapi 'BAKSO' hanya 9/27 (8
masuk CEPAT SAJI) dan sebuah '48 DIMSUM PLACE' berlabel RESTORAN PADANG. Kategori besar
labelnya rapi, kategori kecil justru paling berisik — memperkuat alasan pengelompokan di
6.3b. **Tidak diperbaiki**: normalisasi kategori pakai AI sudah dicabut permanen (titik #1).

🔶 **Batasan sensus restoran, wajib di PRD Bab 5:** hanya kuliner (`TIPE_2` seragam
RESTORAN, arketipe non-kuliner tidak dapat dilayani); dikumpulkan **Q4 2023** meski nama
berkasnya "TAHUN 2025"; `STATUS` seragam BUKA sehingga tidak ada catatan usaha yang tutup;
dipotong batas administratif kota sehingga setiap kota butuh berkasnya sendiri.

**Menu Go dan Properti Go ditarik dari API, bukan berkas.** Kotak pembatas DKI dipakai
sebagai wilayah permintaan (lon 106,65–107,00 · lat -6,40 – -6,05), bukan gabungan isokron,
supaya data tetap utuh kalau daftar stasiun berubah dan pemeriksaan "berapa yang jatuh di
luar semua kawasan" tetap bisa dijawab. Hasilnya **Menu Go 176** dan **Properti Go 191**
di DKI.

🔶 **Properti Go sangat tipis di dalam kawasan: 26 dari 191, hanya di 9 dari 43 kawasan.**
Saat pengguna mengklik stasiun, sebagian besar akan melihat panel properti kosong. Jalur 3
perlu merancang state kosongnya, bukan menganggapnya bug. Kategorinya juga bercampur: Ruko
113 · Rumah 42 · Tanah 15 · Kos 12 · Kantor 3 · Gudang 1 · Laundry 1 — tidak semuanya masuk
akal untuk usaha kuliner.

---

## 8. Konflik dengan v1 dan bagaimana diselesaikan

| | Isi v1 | Penyelesaian |
|---|---|---|
| 1 | `IntentSchema`: `kategori_usaha`, `target_jam`, `segmen`, `skala`, `weights`, `confidence` | **Diganti** oleh 6.6. Nama lama dilarang |
| 2 | `/api/score` menerima `{ weights }` dari klien | **Dicabut.** Bobot tunggal, ditetapkan server (6.8) |
| 3 | Langkah 2 membaca `scored_areas`/`scored_cells` | **`scored_cells` dicabut** dari MVP. Hanya `scored_areas` |
| 4 | Daftar stasiun: 5 stasiun Tangsel | **Diganti** 43 stasiun commuter DKI, `R-1`…`R-43` |
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

### Kondisi database per 6 September 2026

| Tabel | Baris | Cara masuk |
|---|---:|---|
| `stasiun` | 43 | import CSV manual, Table Editor |
| `scored_areas` | 43 | `etl/load_isokron.py` + `etl/pipeline_scoring.py` |
| `katalog_restoran` | 6.392 | import CSV manual, 5 berkas per kota |
| `menu_go` | 176 | `etl/tarik_mapid.py` + `etl/load_mapid.py` |
| `properti_go` | 191 | sama |
| `community_activity` | 0 | **belum dikerjakan, milik Jalur 1** |

✅ **B-1 sampai B-6 benar-benar ditutup**, kini dengan angka, bukan pernyataan.

### Yang masih terbuka

❓ **Dua tabel padanan manual (6.6) belum ditulis.** Masing-masing 24 baris: teks bebas →
`TIPE_3`, dan perkiraan harga per `TIPE_3`. 24 nilai `TIPE_3` sudah pasti dari sensus, jadi
tidak ada lagi yang menghalangi. Pekerjaan Jalur 2, dipakai Jalur 1 di prompt Gemini.

❓ **Tabel `community_activity` masih kosong.** Milik Jalur 1. Cara menariknya sama persis
dengan Menu Go — `etl/tarik_mapid.py` bisa dijadikan contoh.

❓ **Puncak kurva punuk 0,4 masih asumsi kerja** (6.10) dan sendirian menentukan siapa yang
menang. Dengan 43 kawasan terisi, kalibrasi empiris sekarang mungkin dilakukan: hitung x tiap
kawasan, lihat pada nilai x berapa kawasan paling banyak memuat tempat berlabel "Ramai" di
Menu Go. Bukan blocker MVP.

🔶 **Validasi model belum dikerjakan.** Community Activity kini layak jadi pembanding
independen — ia sudah keluar dari formula, dan 43 kawasan melewati ambang ~10 yang dibutuhkan
agar Spearman bermakna. Bukan blocker MVP.

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
