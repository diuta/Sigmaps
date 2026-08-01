# SIGMAPS — Context & Spec Bersama

**Dokumen acuan tunggal untuk penyusunan proposal MAPID WebGIS Competition 2026.**
Semua anggota tim wajib menulis mengacu ke dokumen ini. Kalau ada yang mau diubah, ubah di sini dulu, jangan di draf bab masing-masing.

Versi: 1.0 — 1 Agustus 2026

---

## 1. Identitas Proyek

| Item | Isi |
|---|---|
| Nama | **SIGMAPS** — Spatial Decision Support System & Transit Property Listing for TOD Ecosystem |
| Kompetisi | MAPID WebGIS Competition 2026 ("Maps That Think"), kolaborasi dengan PT KAI |
| Tema | Mass Transportation |
| Wilayah | Aglomerasi Jabodetabek — koridor KRL Commuter Line, MRT Jakarta, LRT Jabodebek, TransJakarta |
| Produk | WebGIS interaktif + dashboard analitik spasial + antarmuka AI + katalog properti transit |
| Pengguna sasaran | Calon pelaku usaha / penyewa ruko di kawasan stasiun (UMKM, ritel, F&B) |

---

## 2. Aturan Lomba yang Mengikat

Ini bukan preferensi tim — ini syarat lolos. Jangan menulis apa pun yang melanggar poin-poin ini.

1. **Wajib minimal 1 dataset** dari kelompok Community Maps **atau** Data Mission. SIGMAPS memakai 3 dataset Data Mission → memenuhi syarat, dan tidak memakai Community Maps. Ini sah.
2. **Basemap wajib MAPID MAPS.**
3. **AI wajib hadir di dalam interface WebGIS** sebagai bagian pengalaman pengguna — bukan hanya proses di balik layar. Output AI harus bisa dipetakan / dikaitkan dengan lokasi.
4. **AI wajib bisa dijelaskan**: input, proses, output, dan validasinya.
5. **Output akhir wajib insight + rekomendasi**, bukan sekadar titik di peta atau data mentah.
6. Peta wajib mendukung: zoom, klik objek, filter, tabel atribut, layer control.
7. Analisis spasial wajib **open-source** (QGIS / Python / GEE). Dilarang ArcGIS atau tool berbayar yang tidak bisa diakses publik.
8. Tahap final: WebGIS **wajib dapat diakses publik**, responsif desktop + mobile, loading wajar.
9. Tahap 50 besar: **wajib survey activities via MAPID Apps** + rencana survei.
10. Dilarang: data fiktif, WebGIS tanpa analisis, konten tak etis, pelanggaran hak cipta / data pribadi, dan menyebarluaskan data mentah MAPID.

---

## 3. Problem Statement

1. **Uninformed location choices** — pelaku UMKM dan ritel memilih lokasi di sekitar stasiun tanpa analisis presisi terhadap ritme komuter, jangkauan pejalan kaki, dan rasio kompetitor.
2. **Asset underutilization** — properti komersial siap sewa di sekitar stasiun belum terdata terpusat dan tidak sampai ke penyewa yang tepat.
3. **Data fragmentation** — belum ada platform yang menggabungkan analisis demografi-perilaku berorientasi transit dengan katalog properti.

## 4. Core Solution

Platform *Spatial Decision Support System* berkonsep *Transit-Oriented Development*, yang mencocokkan kebutuhan bisnis pengguna dengan stasiun dan ruko yang paling sesuai, berbasis data transaksi dan aktivitas riil di kawasan stasiun.

**Alur pengguna (need-first, property-last):**

> input kebutuhan bisnis → skoring stasiun → peringkat stasiun yang cocok → tampilkan ruko di kawasan terpilih → bandingkan antar-opsi

---

## 5. Arsitektur Analisis — Dua Sumbu

Ini keputusan struktural terpenting. **Jangan menulis proposal seolah-olah ada satu formula WLC datar berisi 5 parameter.** Modelnya bertingkat.

### Sumbu Node (konteks — TIDAK diberi bobot)

Dibangun dari data terbuka. Fungsinya **bukan** menyumbang skor, tapi:

- **Mendelineasi wilayah analisis.** Wilayah stasiun $i$ = poligon isokron jaringan pejalan kaki 10 menit dari *exit gate*, dihitung dari OSM `highway=footway` via OSMnx. Ini penggunaan spasial yang benar — isokron adalah *batas wilayah*, bukan variabel yang dinormalisasi 0–1.
- **Menyediakan basis pembanding.** Stasiun dikelompokkan berdasarkan hirarki + konektivitas, sehingga stasiun hanya dibandingkan dengan stasiun sekelas.
- **Menyediakan konteks tampilan** (posisi Node–Place tiap stasiun).

Komponen: `StationClass` (Kemenhub/KAI — Besar 1.0 / Sedang 0.6 / Kecil 0.3), `TransitConnectivity` (jumlah rute & titik halte/feeder dalam 100 m, OSM `public_transport`).

Node Context Score (untuk peer-grouping & tampilan saja):

$$N_i = 0.5\,\text{StationClass}_i + 0.5\,\text{TransitConnectivity}_i^{\text{norm}}$$

### Sumbu Place (skoring — 100% Data Mission)

Seluruh parameter berbobot berasal dari Data Mission. Ini yang menjawab kritik "Data Mission cuma tempelan".

### Spatial binning

Agregasi memakai **Uber H3 resolusi 9** — panjang sisi ±174 m, luas sel ±0,105 km². Satu isokron 10 menit ± berisi 20–25 sel.

> **Catatan penting:** resolusi 9 **bukan** ±100 m. Yang mendekati 65 m adalah resolusi 10. Resolusi 10 hanya dipakai kalau kerapatan data di suatu koridor memang mencukupi — kalau tidak, sel akan banyak yang kosong.

---

## 6. Definisi Parameter — Level 1 (Skor Stasiun)

$$S_i^{(a)} = w_1 D_i + w_2 T_i(h) + w_3 H_i + w_4 M_i(b), \qquad \sum_k w_k = 1$$

Semua variabel ternormalisasi ke [0,1]. Bobot ditentukan arketipe $a$ (§7).

### D — Demand Intensity `[Struk Go]`

Kepadatan **transaksi riil**, bukan kepadatan gerai. Ini pembedanya: 10 gerai sepi ≠ 3 gerai ramai.

$$D_i = \text{minmax}\left(\ln\left(1 + \frac{T_i}{A_i}\right)\right)$$

$T_i$ = jumlah transaksi Struk Go dalam isokron stasiun $i$; $A_i$ = luas isokron (km²). Transformasi log karena sebaran kepadatan transaksi *heavy-tailed*.

### T — Temporal Fitness `[Struk Go × input pengguna]`

Fitur andalan. Mencocokkan jam operasional rencana pengguna dengan ritme transaksi aktual kawasan.

Misal $p_i(t)$ = proporsi transaksi di stasiun $i$ pada jam $t$ (t = 0…23), dengan $\sum_t p_i(t) = 1$. Untuk jendela jam operasional $h$:

$$\text{lift}_i(h) = \frac{\sum_{t \in h} p_i(t)}{|h| / 24}, \qquad T_i(h) = \min\left(\frac{\text{lift}_i(h)}{2},\ 1\right)$$

Pembagian dengan $|h|/24$ mencegah bias: tanpa itu, usaha buka 24 jam otomatis menang. Nilai lift = 1 berarti aktivitas kawasan merata; > 1 berarti terkonsentrasi di jendela jam pengguna.

Contoh kalimat output ke pengguna: *"73% transaksi di Stasiun X terjadi pukul 06.00–09.00 — selaras dengan rencana operasimu."*

### H — Competitive Headroom `[Menu Go + Struk Go + OSM POI]`

Rasio pasokan terhadap permintaan, bukan jumlah kompetitor mentah.

$$\text{Sat}_i = \frac{\text{Competitors}_i}{T_i}, \qquad H_i = 1 - \text{minmax}(\text{Sat}_i)$$

`Competitors` = gerai sejenis (jenis Menu Go untuk F&B, kategori merchant Struk Go untuk non-F&B, dilengkapi OSM POI). Arah tetap: saturasi tinggi → headroom rendah. Perbedaan antar-arketipe ditangani lewat **besar bobot $w_3$**, bukan lewat pembalikan tanda.

> **Keterbatasan yang diakui:** untuk Bisnis Tujuan, saturasi sedang sebenarnya bisa positif (efek aglomerasi — orang datang ke "kawasan kuliner"). Model kurva U-terbalik adalah penyempurnaan untuk tahap 50 besar setelah data survei tersedia. Tulis ini terbuka di proposal; jangan disembunyikan.

### M — Segment Match `[Menu Go + Struk Go]`

Kesesuaian daya beli kawasan dengan target pasar pengguna.

$$M_i(b) = 1 - \left| \text{PriceBand}_i^{\text{norm}} - \text{TargetBand}_b^{\text{norm}} \right|$$

`PriceBand` = median kolom **harga rata-rata** Menu Go dalam isokron, dibanding ke pita (rendah / menengah / atas).

`CashlessRatio` (proporsi metode bayar non-tunai dari Struk Go) **ditampilkan sebagai konteks pendukung**, tidak masuk sebagai suku berbobot — supaya tidak menggandakan sinyal yang sama.

> **Larangan tegas:** jangan mengestimasi harga properti. Properti Go tidak memiliki kolom harga (harga hanya ada di foto banner). Estimasi harga = data generatif = pelanggaran.

### Gate — syarat kecukupan data

Sebelum skor ditampilkan, stasiun harus lolos dua syarat:

- $\text{Listing}_i \geq 1$ (ada minimal satu properti terpetakan)
- $n_i \geq 30$ transaksi Struk Go (agar profil temporal tidak berbasis derau)

Kalau tidak lolos → tampilkan status **`data belum memadai`**, **bukan** skor rendah. Skor rendah palsu lebih berbahaya daripada sel kosong yang jujur.

---

## 7. Arketipe Bisnis & Preset Bobot

Bobot adalah **preset yang bisa diaudit**, bukan angka yang dikarang LLM saat runtime. Tugas LLM hanya mengklasifikasikan prompt pengguna ke salah satu arketipe.

| Arketipe | Contoh usaha | Karakter kebutuhan | $w_1$ D | $w_2$ T | $w_3$ H | $w_4$ M |
|---|---|---|---|---|---|---|
| **Bisnis Arus** | kopi *grab-and-go*, roti, ritel cepat | butuh arus lewat tinggi, keputusan beli impulsif | 0.40 | 0.30 | 0.20 | 0.10 |
| **Bisnis Tujuan** | restoran, klinik, salon, kursus | orang datang sengaja; daya beli menentukan | 0.20 | 0.15 | 0.25 | 0.40 |
| **Bisnis Harian** | minimarket, laundry, apotek | kebutuhan rutin warga sekitar; butuh keseimbangan | 0.30 | 0.20 | 0.30 | 0.20 |

> Angka ini adalah **prior awal**, bukan kebenaran. Kalibrasi dilakukan lewat prosedur validasi di §10. Tulis di proposal sebagai "bobot awal yang akan dikalibrasi", jangan seolah-olah sudah terbukti.

**Input kebutuhan dari pengguna:** jenis usaha, jam operasional, target segmen pasar, anggaran, kebutuhan luas.

---

## 8. Definisi Parameter — Level 2 (Skor Properti)

Dijalankan hanya di dalam stasiun yang sudah terpilih di Level 1.

$$F_j = 0.40\,\text{CellDemand}_j + 0.35\,\text{GateProximity}_j + 0.25\,\text{TypeMatch}_j$$

- **CellDemand** — nilai $D$ pada sel H3 yang memuat properti $j$. Menangkap mikro-lokasi: sisi gate mana, di jalur pejalan kaki atau tidak.
- **GateProximity** — $1 - (\text{waktu jalan}_j / 10\text{ menit})$, dihitung menyusuri jaringan `footway`, bukan garis lurus.
- **TypeMatch** — kesesuaian kategori & jenis properti (Properti Go) dengan kebutuhan usaha.

Filter keras dari input pengguna: kategori properti, kebutuhan luas.

---

## 9. Peran AI di Antarmuka WebGIS

Wajib terlihat pengguna. Empat titik AI, semuanya punya input–proses–output yang bisa dijelaskan:

| # | Fungsi | Input | Proses | Output |
|---|---|---|---|---|
| 1 | **Klasifikasi arketipe** | prompt teks ide bisnis | LLM → 1 dari 3 arketipe + ekstraksi jam operasi, segmen, luas, kategori | preset bobot terpilih (ditampilkan ke pengguna, bisa disunting manual) |
| 2 | **Normalisasi teks menu & merchant** | teks menu Menu Go, nama merchant Struk Go | pencocokan kemiripan teks → kategori usaha terstandar | penghitungan kompetitor yang konsisten |
| 3 | **AI Area Insight** | hasil skoring per stasiun/sel | *data-to-text* NLG bertemplat | ringkasan naratif kelebihan/kekurangan kawasan, terkait langsung ke objek peta |

**Prinsip:** AI menerjemahkan dan meringkas, **tidak** mengarang angka. Semua nilai yang muncul di narasi harus bisa ditelusuri ke sel H3 atau baris data.

---

## 10. Validasi

Kolom **`kondisi pembeli`** di Menu Go (Ramai / Sedang / Sepi) adalah **label hasil yang sudah tersedia** — dipakai sebagai *ground truth*.

Prosedur:
1. Untuk tiap titik Menu Go, ambil skor $S$ pada sel H3 yang memuatnya.
2. Hitung korelasi Spearman antara skor dan label ordinal Ramai/Sedang/Sepi.
3. Laporkan $\rho$ dan confusion matrix.
4. *Holdout* per stasiun untuk menguji generalisasi antar-koridor.
5. Kalibrasi ulang bobot arketipe berdasarkan hasil.

Ini menjawab syarat lomba "AI harus explainable + validatable" tanpa perlu mengarang metrik.

---

## 11. Data

**Data Mission (MAPID)** — inti analisis:
- `Struk Go` — transaksi riil: merchant, kategori, **tanggal/waktu**, **metode bayar**, koordinat. → sinyal permintaan & ritme kawasan. Kolom foto struk tidak digunakan.
- `Menu Go` — jenis tempat makan, menu andalan, **harga rata-rata**, **kondisi ramai/sepi**, koordinat. → kompetitor F&B, proxy daya beli, label validasi.
- `Properti Go` — kategori, jenis, alamat, koordinat. → katalog ketersediaan (**tanpa variabel harga**). Kolom foto banner tidak digunakan.

**Data sekunder (MAPID Data Catalogue):** batas administrasi & kepadatan penduduk Jabodetabek; POI fasilitas & ritel eksis; simpul transportasi publik.

**Data terbuka:** OSM (`highway=footway`, `public_transport`); hirarki stasiun Kemenhub/PT KAI.

**Survey activities (MAPID Apps):** *ground-truthing* aksesibilitas pejalan kaki & validasi sebaran ruko. Wajib tahap 50 besar.

> **Risiko terbuka — harus dijawab eksplisit di bab Kelayakan Teknis.** Dari pemeriksaan CSV sampel: Menu Go tersedia di Depok (Jabodetabek), sementara Struk Go dan Properti Go terkonsentrasi di Bandung. Ketiganya belum ko-lokasi di Jabodetabek. Rencana penutup celah: survei terarah di 5–6 stasiun prioritas, **dijadwalkan di beberapa slot jam** (pagi/siang/sore/akhir pekan) — karena Struk Go membutuhkan sebaran waktu, bukan hanya sebaran titik. Jangan sembunyikan ini; nyatakan dan tunjukkan rencananya.

---

## 12. Tech Stack

- **Basemap:** MAPID MAPS (wajib)
- **GIS / analisis:** Python (`GeoPandas`, `OSMnx`, `PySAL`, `Shapely`, `h3-py`) + QGIS
- **Frontend:** React / Next.js + MAPID Web SDK / Mapbox GL JS
- **Deployment:** Vercel / Netlify, publik, responsif desktop + mobile

---

## 13. Struktur Proposal & Batas Halaman

| # | Bab | Batas | Isi wajib |
|---|---|---|---|
| 1 | Halaman Sampul | — | — |
| 2 | Ringkasan Eksekutif | maks 1 hal | masalah, solusi, keunikan, dampak |
| 3 | Latar Belakang Masalah | maks 1–2 hal | 3 problem statement §3, didukung konteks Jabodetabek |
| 4 | Solusi yang Diusulkan | — | deskripsi, data & visualisasi, analisis spasial (§5–8), peran AI (§9), output insight, sistem end-to-end |
| 5 | Potensi WebGIS dan Manfaat | maks 1 hal | manfaat bagi pelaku usaha, pemilik aset, operator transit |
| 6 | Kelayakan Teknis | maks 1–2 hal | tech stack, rencana survei, **risiko data §11**, validasi §10 |
| 7 | Kesimpulan | maks 1 hal | — |

---

## 14. Aturan Penulisan untuk Semua Anggota

1. **Nol data fiktif.** Tidak ada angka yang tidak bisa ditelusuri ke dataset atau sumber resmi. Kalau belum punya angkanya, tulis metodenya, bukan hasilnya.
2. **Tiga hal yang tidak dipakai sama sekali** — keputusan tim, final, jangan dihidupkan lagi di draf manapun:
   - **Data Community Maps** — SIGMAPS memenuhi syarat lewat 3 dataset Data Mission.
   - **Variabel harga properti** — tidak tersedia sebagai data terstruktur; estimasi apa pun bersifat generatif.
   - **OCR foto struk & banner** — dihapus dari lingkup. Seluruh analisis hanya memakai kolom terstruktur.
3. **Nyatakan keterbatasan secara terbuka** (kurva U-terbalik, ko-lokasi data, bobot yang belum dikalibrasi). Juri lebih menghargai batasan yang diakui daripada peta mulus yang tidak jujur.
4. **Bahasa lugas dan teknis**, tanpa *fluff* dan tanpa narasi berlebihan.
5. **Terminologi konsisten** dengan dokumen ini. Jangan bikin istilah baru sendiri — kalau perlu istilah baru, tambahkan ke dokumen ini dulu.
6. Setiap sumber data eksternal **wajib dicantumkan**.

---

## 15. Keputusan yang Belum Diambil

Catat di sini kalau ada yang mengganjal, jangan diputuskan sepihak di draf bab:

- [ ] Berapa stasiun prioritas untuk survei — 5 atau 6? Koridor mana?
- [ ] Cakupan operator di tahap proposal — keempatnya, atau fokus KRL dulu lalu perluas?
- [ ] Pembagian penulis per bab.
