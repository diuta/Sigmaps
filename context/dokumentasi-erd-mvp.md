# Dokumentasi ERD SIGMAPS — MVP

**Versi:** MVP. Enam tabel, satu foreign key.
**Pemilik:** Jalur 2
**Berkas terkait:** `sigmaps-erd-mvp.dbml`, `daftar-api-mvp.md`

Dokumen ini menjelaskan **setiap kolom untuk apa**, **perannya di rumus skoring**, dan
**kenapa strukturnya begitu**.

---

## Peta enam tabel

| Tabel | Golongan | Diisi oleh | Dibaca oleh |
|---|---|---|---|
| `stasiun` | sumber mentah | ETL katalog MAPID | `/api/stations`, batch |
| `menu_go` | sumber mentah | ETL API lomba | batch |
| `katalog_restoran` | sumber mentah | ETL berkas GeoJSON | batch |
| `scored_areas` | **hasil batch** | pipeline Python | `/api/score`, `/api/properties` |
| `properti_go` | pendukung | ETL API lomba | `/api/properties` |
| `community_activity` | pendukung | ETL API lomba | `/api/community-sentiment` |

**Sumber mentah** adalah bahan yang diolah pipeline. **Hasil batch** adalah satu-satunya
tabel yang ditulis pipeline dan dibaca mesin skoring. **Pendukung** tidak menyentuh skor sama
sekali; hanya ditampilkan setelah pengguna memilih kawasan.

```
ALIRAN BATCH (terjadwal, Python, tanpa AI)
  stasiun ──→ MAPID Isochrone Tool ──→ poligon ──┐
  menu_go ───────────────────────────────────────┼── ST_Within → hitung → scored_areas
  katalog_restoran ───────────────────────────────┘

ALIRAN RUNTIME (tiap request, TypeScript, deterministik)
  scored_areas ── satu SELECT ── hitung C dan S ── gabung demand ── Top 5
```

Panah pada aliran batch adalah **pemrosesan**, bukan relasi basis data. Terjadi sekali saat
batch berjalan, bukan tiap query. Karena itu tidak muncul sebagai garis di ERD.

---

## 1. `stasiun`

Katalog titik stasiun. Sumber daftar kawasan, sekaligus masukan MAPID Isochrone Tool.

| Kolom | Untuk apa |
|---|---|
| `station_id` | Kunci utama. Teks yang bisa dibaca manusia (`st_grogol`), bukan UUID, agar mudah dicek saat debugging |
| `nama` | Nama tampil di peta dan daftar Top 5 |
| `tipe` | `COMMUTER` atau `KERETA API`. Hanya informasi; tidak dipakai perhitungan |
| `alamat`, `kecamatan`, `kabkot` | Konteks wilayah. `kabkot` berguna memfilter per kota saat menambah cakupan |
| `geom` | Titik stasiun. **Masukan Isochrone Tool** untuk menghasilkan poligon |

### Kenapa tabel ini terpisah dari `scored_areas`

Relasinya satu-ke-satu, dan itu biasanya tanda dua tabel yang seharusnya digabung. Di sini
tidak, karena tiga hal:

**Jumlahnya tidak sama.** `stasiun` memuat seluruh stasiun DKI, sekitar 50–60. `scored_areas`
hanya memuat yang isokronnya sudah dibuat. Bila baru Jakarta Barat selesai, tabelnya menjadi
50 baris `stasiun` dan 11 baris `scored_areas`. Peta tetap bisa menggambar 50 titik sementara
skoring berjalan di 11.

**Diisi pihak berbeda pada waktu berbeda.** `stasiun` datang dari ETL dan hampir tidak pernah
berubah; `scored_areas` ditulis ulang tiap kali batch jalan. Menggabungkannya membuat satu bug
di pipeline dapat menimpa nama dan koordinat stasiun.

**Tipe geometrinya berbeda.** Titik dan poligon. Satu kolom `geom` per tabel jauh lebih bersih
daripada dua kolom geometri dengan indeks GiST masing-masing.

### Peringatan deduplikasi

Katalog aslinya **memuat baris ganda**. Contoh dari berkas isokron Jakarta Barat:

| Stasiun | id_tool |
|---|---|
| Bojong Indah | R-1 (COMMUTER) + R-15 (KERETA API) |
| Grogol | R-21 + R-22 |
| Pesing | R-3 + R-4 |

Koordinatnya **identik** untuk tiap pasangan; yang berbeda hanya tipe layanan. Dari 22 baris
hanya ada 11 lokasi.

Bila dimuat apa adanya, satu stasiun muncul dua kali di Top 5 dengan skor identik.
**Deduplikasi berdasarkan koordinat, bukan nama**, dan lakukan **sebelum** dikirim ke
Isochrone Tool agar kuotanya tidak terbuang separuh.

---

## 2. `scored_areas`

Hasil pipeline. Satu baris per stasiun. Satu-satunya tabel yang dibaca mesin skoring.

### Peran tiap kolom di dalam rumus

```
skor = 100 × (0,25 · D + 0,50 · C + 0,25 · S)
```

Dari 13 kolom, **hanya satu yang langsung masuk rumus**. Sisanya bahan, pembagi, penanda,
atau cadangan.

| Kolom | Peran |
|---|---|
| `demand` | **Langsung jadi D** |
| `competitor_counts` | Bahan C |
| `total_restaurants` | Bahan C, jalur alternatif |
| `area_km2` | Pembagi C |
| `price_median` | Bahan S |
| `is_rankable` | Penyaring, sebelum rumus jalan |
| `n_observations`, `n_price` | Penentu `is_rankable` |
| `geom` | Dipakai batch, bukan rumus |
| `area_id`, `station_id`, `station_name` | Identitas |
| `temporal_fitness`, `kde_penalty` | Cadangan, selalu `NULL` |

### `demand` — satu-satunya yang siap pakai

```ts
const D = area.demand;   // 0,528
```

Tidak ada perhitungan di runtime. Batch sudah menyelesaikannya:

```
Sepi = 0, Sedang = 0,5, Ramai = 1
rata   = Σ nilai ÷ n
demand = (n × rata + 8 × 0,5) ÷ (n + 8)
```

**Kenapa bisa final di batch:** D tidak bergantung pada apa yang diketik pengguna. Seberapa
ramai sebuah kawasan sama saja apakah pengguna mau membuka kafe atau warteg.

Angka 8 menarik nilai ke netral. Kawasan dengan 8 pengamatan setengah ditentukan datanya
sendiri, setengah oleh nilai netral 0,5. Tanpa itu, kawasan dengan 3 pengamatan yang semuanya
"Ramai" mendapat 1,00 sempurna dan langsung juara.

**Tanpa normalisasi apa pun.** Rumusnya sudah menghasilkan 0–1. Normalisasi min-max justru
merusak: tiga kawasan bernilai 0,528 / 0,469 / 0,460 yang berdekatan akan direntangkan paksa
menjadi 1,00 / 0,13 / 0,00.

### `competitor_counts` + `area_km2` — bahan C

Isi `competitor_counts`:

```json
{ "CEPAT SAJI": 8, "KAFE DAN RESTO": 3, "SEAFOOD": 4 }
```

Runtime:

```ts
// 1. ambil kategori yang diminta pengguna
const jumlah = area.competitor_counts["KAFE DAN RESTO"] ?? 0;   // 3

// 2. bagi luas → kepadatan
const kepadatan = jumlah / area.area_km2;                        // 3 ÷ 0,97 = 3,09

// 3. ratakan 0–1 dibanding seluruh kawasan
const x = (kepadatan - lo) / (hi - lo);                          // 0,356

// 4. kurva punuk
const C = Math.max(0, 1 - Math.abs(x - 0.4) / 0.6);              // 0,927
```

**Kenapa disimpan mentah, bukan sebagai angka 0–1.** Kategori baru diketahui saat pengguna
mengetik. Bila batch sudah memampatkannya jadi satu angka, angka itu hanya berlaku untuk satu
kategori — pengguna yang mencari kafe akan menerima skor kompetisi yang dihitung untuk warteg.
Menyimpan mentah membuat **satu baris melayani 24 kategori**.

Alternatifnya 24 kolom terpisah, yang berarti mengubah struktur tabel setiap kali daftar
kategori berubah.

**Kenapa harus dibagi `area_km2`.** Tanpa itu, kawasan berisokron besar otomatis punya lebih
banyak pesaing dan terlihat lebih sesak, padahal hanya lebih luas. Membagi luas menyamakan
ukuran. Inilah sebabnya `area_km2` bertanda `NOT NULL` — bila kosong, pembagiannya gagal dan
variabel dengan bobot terbesar mati.

**Kenapa kurva punuk, bukan garis lurus menurun.** Dengan hubungan lurus, kawasan tanpa
pesaing selalu menang. Tetapi nol pesaing berarti pasar belum terbukti. Punuk menghukum dua
ujung.

| x | C | arti |
|---:|---:|---|
| 0,0 | 0,33 | tanpa pesaing, pasar belum terbukti |
| 0,4 | 1,00 | ideal |
| 0,7 | 0,50 | mulai padat |
| 1,0 | 0,00 | paling sesak |

### `total_restaurants` — jalur alternatif C

Dipakai hanya ketika pengguna tidak menyebut jenis usaha:

```ts
const jumlah = tipe_3 === 'SEMUA'
  ? area.total_restaurants                 // 41
  : area.competitor_counts[tipe_3] ?? 0;
```

Maknanya berubah dari "ruang untuk kategorimu" menjadi "ruang kuliner umum di kawasan ini".
Masih bermakna, dan yang penting **skoring tetap jalan** tanpa perlu menghentikan pengguna
dengan pertanyaan susulan.

### `price_median` — bahan S

```ts
const S = Math.max(0, 1 - Math.abs(area.price_median - harga_target) / harga_target);
// 1 − |15.000 − 20.000| ÷ 20.000 = 0,750
```

**Kenapa median, bukan rata-rata.** Data harga memuat kesalahan input nyata: Rp5, Rp17, dan
Rp180.000 untuk sebuah warung pecel. Rata-rata tertarik pencilan; median tidak.

**Kenapa pembaginya `harga_target`, bukan angka tetap.** Supaya selisihnya relatif. Meleset
Rp5.000 fatal untuk target Rp10.000, sepele untuk target Rp100.000.

**Kenapa dibatasi minimal 0.** Bila meleset 100% atau lebih, hasilnya negatif, dan komponen
negatif merusak tampilan dekomposisi di UI.

✅ **S selalu terhitung.** `harga_target` selalu terisi (dari pengguna atau tabel perkiraan),
dan `price_median` dijamin ada oleh ambang `n_price >= 5`. Tidak ada cabang "S dibuang" dan
tidak ada penyebaran ulang bobot.

### `is_rankable`, `n_observations`, `n_price` — penyaring

```sql
where is_rankable = true
```

Berjalan **sebelum** rumus, di klausa `WHERE`. Kawasan yang gagal tidak pernah masuk
perhitungan. Diisi batch:

```python
is_rankable = n_observations >= 10 and n_price >= 5
```

**Dua ambang karena dua komponen berbeda.** `n_observations` menentukan apakah D dapat
dipercaya; `n_price` menentukan apakah S dapat dipercaya. Kawasan bisa punya 15 pengamatan
tetapi hanya 2 yang harganya lolos pembersihan — median dari 2 titik itu goyah, tetapi S akan
tetap dihitung dengan bobot penuh 0,25. Ambang kedua menutup celah itu, sekaligus menjamin
`price_median` tidak pernah `NULL` pada baris yang lolos.

**Kenapa `n_price` bisa lebih kecil dari `n_observations`.** Menu Go selalu memuat harga —
100 dari 100 pada sampel. Yang mengurangi adalah **pembersihan**: nilai di luar rentang
2.000–150.000 digugurkan, seperti Rp180.000 untuk warung pecel. Perlu diperhatikan bahwa batas
atas 150.000 adalah pilihan tim; bila di kawasan target ada restoran mahal yang sah, harganya
ikut gugur. Bila `n_price` jatuh jauh di bawah `n_observations` di kawasan tertentu, periksa
dulu apakah yang gugur benar-benar salah input.

**Melindungi dari skor tinggi, bukan rendah.** Ini sering dikira terbalik. Kawasan bersampel
tipis **tidak** otomatis berskor rendah. Telusuri kawasan dengan 2 pengamatan yang keduanya
"Ramai":

- **D tidak jatuh.** `(2 × 1,0 + 8 × 0,5) ÷ 10 = 0,60`, sedikit di atas netral.
- **C tidak terpengaruh sama sekali** — dihitung dari sensus yang lengkap.
- **S justru berbahaya.** Median dari 2 harga sangat goyah, dan bisa saja pas sempurna.

Gabungannya dapat menembus 87. Ambang inilah yang mencegahnya.

Memberi skor rendah berarti **mengklaim** kawasan itu buruk, padahal yang diketahui hanya
datanya kurang. Kawasan yang tidak lolos tetap tampil di peta dengan label "data belum cukup",
tanpa angka skor.

🔶 Ambang 10 dan 5 adalah keputusan tim, tanpa dasar statistik formal. Praktisnya kemungkinan
hampir tidak pernah aktif — klaster Menu Go di Jakarta memuat 24 pengamatan atau lebih. Tetap
dipasang sebagai pengaman bila cakupan melebar ke stasiun pinggiran.

### `geom` — dipakai batch, bukan rumus

Poligon isokron. Tidak menyentuh rumus sama sekali, tetapi **seluruh kolom di atas lahir
darinya**:

```
geom ──ST_Within──→ menu_go         ──→ demand, price_median
     ──ST_Within──→ katalog_restoran ──→ competitor_counts, total_restaurants
     ──luas───────→ area_km2
```

Saat runtime, dipakai `/api/properties` untuk memfilter properti dalam kawasan.

### Kenapa `station_name` diduplikasi

Ini melanggar normalisasi, dan disengaja.

`/api/score` menarik **seluruh baris** dalam satu `SELECT` tanpa join, karena normalisasi
min-max pada C membutuhkan nilai terkecil dan terbesar di antara semua kawasan. Skor sebuah
kawasan bergantung pada kawasan lain, jadi tidak bisa dihitung baris per baris.

Menyalin nama menjaga sifat itu. Nama stasiun praktis tidak pernah berubah, sehingga risiko
data tidak sinkron mendekati nol.

### Kenapa dua kolom sengaja `NULL`

`temporal_fitness` dan `kde_penalty` tidak dibaca, tidak dihitung, tidak dikirim ke frontend.
Menyimpannya berarti bila kelak dihidupkan, Jalur 1 dan Jalur 3 tidak perlu mengubah kode —
hanya isinya yang berubah. Menghapus sekarang lalu menambahkan lagi nanti berarti dua kali
migrasi dan dua kali koordinasi tim.

### Kenapa tidak ada kolom skor

Skor bergantung pada `tipe_3` dan `harga_target` yang berbeda tiap pengguna. Bila disimpan,
seluruh tabel harus dihitung ulang setiap ada pengguna baru dengan kebutuhan berbeda. Yang
disimpan adalah bahan; perakitannya terjadi saat request.

### Kenapa relasi ke `stasiun` satu-ke-satu

Satu stasiun menghasilkan tepat satu poligon isokron, karena isokron 5 menit sudah dicabut.
Bila kelak dua band dihidupkan kembali (300 dan 600 detik), relasinya berubah menjadi
satu-ke-banyak dan kuncinya perlu menjadi `(station_id, batas_menit)`.

🔶 `area_id` sebenarnya mubazir selama relasinya satu-ke-satu — `station_id` dapat langsung
menjadi primary key. Dipertahankan agar penamaan tidak berubah di tengah pengerjaan.

---

## 3. `menu_go`

Pengamatan lapangan dari API lomba. **Sumber langsung variabel D dan S.**

| Kolom | Untuk apa |
|---|---|
| `obs_id` | Kunci utama |
| `nama_tempat` | Identifikasi saat verifikasi |
| `jenis_tempat` | Kaki Lima, Restoran, Warung, Fast Food, Kafe. Tidak dipakai perhitungan, tetapi menjelaskan sifat sampel |
| `kondisi_tempat` | Sepi / Sedang / Ramai. **Masukan D** |
| `harga_bersih` | Harga setelah koreksi satuan. **Masukan S**. `NULL` bila gugur pembersihan |
| `harga_asli` | Nilai mentah sebelum dibersihkan |
| `geom` | Koordinat, untuk `ST_Within` ke poligon kawasan |

### Kenapa `harga_asli` disimpan juga

Pemeriksaan data menemukan kesalahan input nyata: Rp5, Rp17, Rp20 (surveyor mengetik dalam
satuan ribuan) dan Rp180.000 untuk sebuah warung pecel.

Menyimpan nilai sebelum dan sesudah membuat aturan pembersihan dapat diaudit baris per baris.
Bila hanya menyimpan yang bersih, koreksinya tidak bisa dibuktikan.

### Kenapa tidak ada `station_id`

Sudah diputuskan bahwa titik yang jatuh di dua isokron bertumpuk dihitung di **kedua**
kawasan, karena kawasan berdempetan memang berbagi pasar. Foreign key hanya dapat menunjuk
satu induk, sehingga kolom itu akan memaksa setiap pengamatan memilih.

Keanggotaan ditentukan `ST_Within` saat batch berjalan.

### Kenapa tabel ini disimpan, bukan sekadar dibaca dari berkas

**Poligon isokron kemungkinan besar akan berubah.** Bila direvisi, seluruh spatial join harus
diulang. Dengan pengamatan tersimpan, itu satu query. Tanpa itu, ETL harus dijalankan ulang
dari nol.

**Validasi membutuhkan titik, bukan agregat.** Pencocokan per titik dengan Community Activity
memerlukan koordinat dan label per tempat; `demand` yang sudah teragregasi tidak dapat
dipakai.

**Auditabilitas.** Pertanyaan "angka `demand` 0,528 ini dari pengamatan mana saja" dijawab
satu query, bukan dengan membuka berkas di laptop.

⚠️ **Datanya tidak bertambah.** Total 230 record adalah angka final — tidak ada survei tim
yang akan menambahnya. Kawasan yang sekarang tidak lolos `is_rankable` akan selamanya tidak
lolos. Ini menaikkan urgensi penarikan penuh 230 record, karena itu satu-satunya hal yang
masih bisa memperbaiki cakupan data.

---

## 4. `katalog_restoran`

Sensus titik restoran. **Sumber tunggal variabel C.**

| Kolom | Untuk apa |
|---|---|
| `id` | Kunci utama |
| `nama` | Verifikasi lapangan |
| `tipe_3` | Salah satu dari 24 kategori. **Kunci perhitungan C** dan sumber daftar enum Zod |
| `alamat`, `kecamatan`, `kabkot` | Konteks wilayah |
| `status` | Seragam `BUKA` |
| `tanggal_pengumpulan` | `Q4 2023` |
| `geom` | Koordinat, untuk `ST_Within` ke poligon kawasan |

`tipe_3` diberi indeks B-tree tersendiri karena batch mengelompokkan restoran per kategori
untuk membentuk `competitor_counts`.

### Empat batasan yang wajib disebut di PRD

1. **Hanya kuliner.** `TIPE_2` seragam RESTORAN. Usaha non-kuliner seperti laundry ditolak,
   bukan diberi skor.
2. **Dikumpulkan Q4 2023**, meski nama berkasnya bertuliskan "TAHUN 2025". Sebut Q4 2023; bila
   juri membuka datanya dan menemukan selisih itu, kredibilitas seluruh bab ikut jatuh.
3. **`status` seragam BUKA.** Tidak ada catatan usaha yang tutup, sehingga tingkat bertahan
   usaha tidak dapat diukur. Data berumur hampir tiga tahun, dan usaha kuliner tingkat
   tutupnya tinggi.
4. **Dipotong batas administratif kota.** Setiap kota butuh berkasnya sendiri, dan kawasan di
   perbatasan akan kekurangan pesaing bila berkas tetangganya belum masuk.

Kolom telepon sengaja tidak disimpan: kosong pada 418 dari 1.435 baris, tidak dipakai
perhitungan apa pun, dan menyimpan nomor telepon usaha tanpa keperluan hanya menambah
tanggung jawab data pribadi.

---

## 5. `properti_go`

Katalog properti siap sewa/jual. **Tidak masuk perhitungan skor** — hanya ditampilkan setelah
pengguna memilih kawasan.

| Kolom | Untuk apa |
|---|---|
| `id` | Kunci utama |
| `kategori_properti` | Jenis bangunan |
| `jenis_properti` | Sewa atau Jual |
| `alamat` | Ditampilkan di property card |
| `foto_tampak_depan`, `foto_spanduk` | URL foto |
| `geom` | Koordinat, untuk `ST_Within` ke poligon kawasan |

Tidak memuat luas, harga, dan kontak pemilik karena ketiganya tidak ada di dataset sumber.
**Jangan menambahkan kolomnya "untuk jaga-jaga"** — kolom kosong yang terlihat di skema akan
membuat orang mengira datanya ada.

Satu properti **dapat muncul di dua kawasan** karena isokron stasiun berdekatan bertumpuk.
Pesing dan Grogol berjarak sekitar 1,9 km sementara isokron 10 menit berjari-jari sekitar
800 m. Itu perilaku yang benar, bukan duplikat yang perlu disaring.

---

## 6. `community_activity`

Laporan warga. **Tidak masuk formula skor** — dipakai untuk ringkasan sentimen AI dan sebagai
pembanding independen saat validasi model.

| Kolom | Untuk apa |
|---|---|
| `id` | Kunci utama |
| `title`, `description` | Isi laporan. `description` yang dikirim ke Gemini untuk diringkas |
| `total_comment`, `likes` | Agregat, ikut dikirim sebagai konteks |
| `created_at` | Waktu laporan dibuat |
| `geom` | Koordinat, untuk memfilter laporan mana yang masuk kawasan tertentu |

### Kenapa dikeluarkan dari formula

1.653 laporan, seluruhnya dari satu komunitas dengan 141 kontributor, dan 1.396 di antaranya
dibuat pada Agustus 2026 — periode lomba. Kepadatan laporan mengukur **di mana tim peserta
memilih survei**, bukan di mana aktivitas ekonominya tinggi.

Justru karena keluar dari formula, dia menjadi **pembanding yang sah** saat validasi: dua
sumber yang benar-benar independen.

### Empat kolom sengaja tidak ada

`user_name`, `user_full_name`, `user_profile_picture`, `community_picture`.

Menyaringnya sebelum pengiriman ke Gemini adalah langkah yang **bisa lupa ditulis**. Tidak
menyimpannya sama sekali membuat kebocoran menjadi mustahil, bukan sekadar tidak terjadi.

---

## Kenapa hampir tidak ada foreign key

Ini bagian yang paling sering dikira kekeliruan saat melihat ERD.

ERD menggambar garis ketika sebuah tabel menyimpan kunci milik tabel lain. Di sini hampir
tidak ada. Baris properti berisi kategori, jenis, alamat, foto, dan koordinat — tidak ada
kolom bertuliskan `st_grogol`.

Keanggotaan kawasan lahir dari **posisi**, bukan dari nilai tersimpan:

```sql
select p.*
from properti_go p
join scored_areas a on ST_Within(p.geom, a.geom)
where a.station_id = 'st_grogol';
```

Ini tetap join sungguhan dan tetap cepat — indeks GiST pada `geom` menjalankan peran yang sama
seperti indeks pada kolom kunci biasa. Yang tidak ada hanyalah representasi visualnya.

### Kenapa tidak ditambahkan kolom `station_id` saja

Bisa, dan ERD akan penuh garis. Tetapi tiga hal rusak.

**Satu titik dapat masuk dua kawasan.** Foreign key hanya dapat menunjuk satu induk.

**Nilainya basi tiap kali poligon berubah.** Setiap revisi isokron memaksa seluruh kolom
dihitung dan ditulis ulang. `ST_Within` selalu memberi jawaban terbaru tanpa pemeliharaan.

**Tabel sumber bukan milik kawasan.** `katalog_restoran`, `properti_go`, dan
`community_activity` ada lebih dulu dan tetap ada meski daftar stasiun berubah total. Foreign
key menyiratkan kepemilikan yang tidak ada.

### Kenapa `scored_areas` → `stasiun` justru diberi foreign key

Karena hubungannya berbeda sifat. Satu isokron memang **diturunkan dari** satu stasiun
tertentu, ditentukan saat pembuatan dan tidak berubah. Kardinalitasnya satu-ke-satu, dan ini
kepemilikan sungguhan, bukan kebetulan geometris.

**Kesimpulan: ERD menampilkan enam kotak dengan satu garis.** Itu gambaran akurat dari sistem
yang hubungannya geometris. Menggambar garis di tempat lain justru berbohong.

---

## Keamanan

Seluruh tabel mengaktifkan Row Level Security dengan policy `SELECT` publik. Operasi tulis,
ubah, dan hapus hanya dilakukan pipeline batch memakai service role key, yang melewati RLS
tanpa memerlukan policy tersendiri.

⚠️ **RLS aktif tanpa policy mengembalikan nol baris tanpa pesan galat.** Jalankan pembuatan
tabel dan policy dalam satu sesi yang sama. Bila kelak menemui hasil kosong tanpa galat, ini
tersangka pertama.
