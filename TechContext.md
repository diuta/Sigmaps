# Context: SIGMAPS — MAPID WebGIS Competition 2026

Dokumen ini merangkum seluruh diskusi sejauh ini, supaya siapa pun (termasuk Claude di
percakapan lain) bisa melanjutkan tanpa perlu membaca ulang riwayat chat.

## Siapa yang bertanya

Bagas, mahasiswa Manajemen (bukan tech), berperan sebagai koordinator/PM untuk kompetisi
ini. Tim terbagi dua: **tim product** dan **tim tech** (3 orang). Percakapan ini fokus ke
pembagian riset async untuk tim tech.

## Isi Lengkap Ketiga Dokumen Sumber (Base Context)

Bagian ini adalah transkrip eksplisit isi tiga PDF yang diunggah ke percakapan ini. Semua
bagian lain di file ini adalah hasil sintesis/analisis dari isi berikut, jadi bagian ini
adalah rujukan utama kalau ada detail yang perlu dicek ulang.

### Dokumen 1 — Proposal "Kamehameha_SIGMAPS.pdf" (14 halaman)

Proposal ide WebGIS untuk MAPID WebGIS Competition 2026, tema "Maps That Think! - Mass
Transportation Edition", oleh Tim **Kamehameha** (BINUS University). Anggota yang tercantum
di sampul: Bernardus William Santosa, Clarawita, Clarissa Aditjakra, Clement Nathanael,
Dimas Putra (5 nama — tim keseluruhan, bukan berarti seluruhnya di tim tech; user
menyebutkan tim tech beranggotakan 3 orang dari kelompok ini).

**1. Ringkasan Eksekutif** — Transportasi massal Jabodetabek melayani 2,3 juta orang/hari
lewat 371 stasiun MRT/LRT/KRL/TransJakarta. Pendanaan MRT Jakarta melonjak 140%, Pemprov DKI
menyiapkan 30 kawasan baru berorientasi transit (seperti Dukuh Atas, Blok M). UMKM
menyumbang 61% PDB dan menyerap 97% tenaga kerja nasional, tapi pemilihan lokasi usaha masih
subjektif karena data (ketersediaan properti, daya beli, kepadatan pesaing, zonasi resmi)
tersebar dan sulit diakses. SIGMAPS adalah WebGIS berbasis analisis spasial dan AI dengan
alur *need-first, property-last*: user masukkan rencana usaha dalam bahasa sehari-hari, AI
terjemahkan jadi parameter, sistem hitung & ranking kawasan lewat mesin skoring
deterministik, AI menyaring hasil jadi insight naratif. Dibangun di atas Data Mission MAPID
+ data pendukung terbuka, divisualisasikan di atas basemap MAPID MAPS.

**2. Latar Belakang Masalah** — Detail statistik yang sama (2,3 juta penumpang/hari, 371
stasiun di 25 lintas layanan, pendanaan MRT +140%, konektivitas antar moda ~93% wilayah
kota, 30 kawasan TOD baru disiapkan). Grafik "Potensi Kawasan TOD": 371 stasiun total, 30
kawasan TOD baru disiapkan Pemprov DKI, 3 kawasan TOD mapan (contoh Blok M, Dukuh Atas). UMKM
aktif 2025: 65,5 juta unit. Masalah: pemilihan lokasi UMKM masih subjektif tanpa data
terstruktur; kajian Stasiun MRT Blok A menunjukkan proporsi lahan campuran/komersial di
sekitar stasiun masih perlu ditingkatkan. SIGMAPS hadir sebagai WebGIS fokus transit yang
menyatukan data komersial, data komunitas, dan analisis spasial AI dalam satu layar untuk
rekomendasi lokasi yang *actionable*.

**3. Solusi yang Diusulkan**
- *3.1 Deskripsi Solusi* — membalik alur pencarian ruko konvensional (biasanya cari lokasi
  dulu baru menebak kecocokan) menjadi alur *need-first, property-last*: user masukkan ide
  bisnis (misal "toko roti yang menyasar pekerja kantoran di pagi hari"), AI baca kalimat itu
  jadi kriteria terukur, sistem hitung & ranking kawasan stasiun berdasar data pergerakan
  manusia riil, baru tampilkan daftar ruko siap sewa di kawasan rekomendasi.
- *3.2 Sumber Data* — Data Mission MAPID: **Struk Go** (kategori merchant, tanggal & waktu
  transaksi, metode bayar, koordinat — ukur intensitas permintaan & profil temporal
  kawasan), **Menu Go** (jenis tempat, harga rata-rata, kondisi ramai/sepi, koordinat — data
  kompetitor F&B, proksi daya beli, label validasi), **Properti Go** (kategori, jenis,
  alamat, koordinat — katalog persediaan aset, tanpa data harga karena dataset tidak
  memiliki kolom harga terstruktur). Data pendukung terbuka: Katalog Data MAPID (batas
  wilayah, kepadatan penduduk, titik fasilitas/ritel eksisting, diprioritaskan sebelum
  sumber eksternal), Overpass API OSM (jaringan jalur pejalan kaki, titik pintu masuk
  stasiun, perhitungan isokron jalan kaki) + Nominatim API (geocoding alamat properti), BPS
  (kepadatan penduduk usia produktif, Survei Komuter Jabodetabek), ATR/BPN GISTARU RDTR (peta
  zonasi tata ruang untuk kesesuaian lahan & regulasi OSS-NIB).
- *3.3 Visualisasi* — prototype UI WebGIS dengan dummy data (link prototype:
  https://sigmaps-web.vercel.app/), menampilkan peta jaringan transit bergaya diagram MRT,
  panel pencarian bahasa natural, filter usaha, dan panel ranking kawasan/properti.
- *3.4–3.6 Metode Analisis Spasial dan Prediksi* — lima pilar analitik:
  1. **Analisis Area Tangkapan Isochrone** — area jangkauan komersial faktual berdasar waktu
     tempuh jalan kaki riil (5 dan 10 menit), menyusuri topologi jaringan jalan MAPID, otomatis
     menyeleksi rintangan fisik nyata (jalan buntu, ketiadaan jembatan penyeberangan).
  2. **Pemodelan Gravitasi Ekonomi Empiris** — mengawinkan data POI statis dengan bukti
     transaksi riil dari Menu Go dan Struk Go, memastikan lokasi rekomendasi terbukti berada
     di pusat konversi transaksi aktif.
  3. **Pemrofilan Temporal Transaksi** — membedah atribut tanggal & waktu transaksi Struk Go
     dengan algoritma *daily peak detection* untuk mengklasifikasikan ritme komuter ke
     ekosistem *First-Mile* atau *Last-Mile*, menyelaraskan produk penyewa dengan jam
     operasional komuter.
  4. **Market Saturation** — Spatial Kernel Density Estimation (KDE) pada data Menu Go dan
     status mobilitas pedagang untuk memetakan tingkat kejenuhan pasar secara presisi,
     membedakan Zona Risiko Tinggi dari Celah Pasar.
  5. **Mesin Penilaian Deterministik** — menyatu-padukan seluruh variabel ternormalisasi ke
     dalam *Weighted Linear Combination* yang disesuaikan profil bisnis penyewa, dikurangi
     penalti risiko KDE secara proporsional.
- *3.5 Peran AI (Input, Proses, Output)* — tabel 3 fungsi AI: (a) **Pemetaan arti** — input
  teks nama merchant/menu, proses pencocokan kemiripan ke kategori usaha standar lewat tiga
  dataset (MenuGo/PropertyGo/StrukGo), output perhitungan kompetitor; (b) **Klasifikasi
  arketipe** — input prompt teks rencana bisnis, proses ekstraksi jenis usaha/jam
  operasi/segmen, output preset bobot terpilih yang bisa dilihat user; (c) **AI Area
  Insight** — input hasil skoring kawasan, proses *data-to-text template*, output insight
  narasi kelebihan/kekurangan kawasan yang terkoneksi ke peta. **Mesin skoring bersifat
  pasti dan tidak memanggil AI sama sekali** — AI hanya di dua ujung sistem (menerjemahkan
  masukan & meringkas keluaran).
- *3.6 Output Utama* — lima fungsionalitas: (1) **Peringkat Lokasi Teroptimal** — peta
  interaktif menyoroti Top 5 properti skor tertinggi; (2) **Scorecard Probabilitas
  Kesuksesan** — Skor Kesesuaian Bisnis 0–100 + Indeks Risiko Spasial (Low/Medium/High)
  dihitung dari daya beli MenuGo, ritme jam puncak StrukGo, dan tingkat kanibalisasi; (3)
  **Panel & Sintesis AI** — grafik dekomposisi parameter (kontribusi daya beli, keselarasan
  jam puncak, penalti risiko KDE) dipadukan narasi preskriptif LLM; (4) **Katalog Inventaris
  Properti Terintegrasi** — menghubungkan analisis spasial makro dengan ketersediaan aset
  siap sewa (*ready-to-lease*), termasuk denah tata letak stasiun & detail fisik (luas,
  kapasitas listrik, posisi arus lalu lintas pejalan kaki); (5) **Matriks Uji Kelayakan
  Komparatif** — layar split screen untuk mensejajarkan 2–3 properti secara *apple-to-apple*
  (kesesuaian luas, skor AI final, jam puncak transaksi, level risiko) sebagai dokumen
  penentu alokasi kapital sebelum penandatanganan kontrak sewa.
- *3.7 Integrasi Sistem End-to-End* — diagram 4 tahap: **Akuisisi Data** (Data Mission
  PropertiGo/MenuGo/StrukGo, MAPID Data Catalogue, OSM, Kemenhub, Survey MAPID Apps) →
  **Pre-Computation** (Python, QGIS: isokron OSMnx, binning H3 res 9, pemetaan arti merchant
  via AI) → **Scoring Machine** (normalisasi min-max, Weighted Linear Combination per
  arketipe, Level 1 stasiun → Level 2 properti) → **Visualization** (H3 Map, klasifikasi
  arketipe dari AI, Panel AI Area Insight, Filter).

**4. Potensi WebGIS dan Manfaat** — SIGMAPS mengubah proses tebak-tebakan cari lokasi
menjadi keputusan berbasis data. Alur: user masukkan jenis usaha, jam operasional, target
segmen pasar, kategori luas kebutuhan → sistem meranking stasiun sesuai & menampilkan
properti tersedia di kawasan terpilih. Wilayah analisis dibatasi isokron jaringan jalan kaki
5 & 10 menit dari pintu keluar stasiun (mengikuti jalur yang benar-benar bisa dilalui, bukan
lingkaran berjarak lurus). Tiga fitur utama: (1) peringkat stasiun berbasis kebutuhan usaha
(dari intensitas transaksi StrukGo, kesesuaian ritme jam, ruang kompetisi, kesesuaian daya
beli MenuGo dgn target pasar), (2) katalog & perbandingan properti transit (dari PropertyGo:
kategori, jenis sewa/jual, jarak jalan kaki ke stasiun, bisa dibandingkan berdampingan), (3)
heatmap potensi kawasan & AI Area Insight (visualisasi intensitas aktivitas komersial per sel
spasial + ringkasan naratif otomatis yang bisa ditelusuri kembali ke data asalnya). Manfaat
berlapis: pelaku usaha dapat keputusan berbasis ritme transaksi/rasio kompetitor bukan
perkiraan; pemilik aset dapat eksposur ke calon penyewa profil sesuai lewat data terupdate
berkala dari survey activities; kawasan berpotensi tumbuh lebih merata jadi TOD yang hidup
sepanjang hari.

**5. Kelayakan Teknis**
- *5.1 Sumber dan Ketersediaan Data* — dataset mengikuti sub-bab 3.2 (StrukGo, MenuGo,
  PropertyGo dari MAPID + jaringan transit dari Overpass API). Data klasifikasi jenis stasiun
  dari Kementerian Perhubungan & PT KAI dipakai sebagai acuan tambahan pembeda bobot antar
  simpul transit.
- *5.2 Persyaratan Teknis Implementasi* — sebelum dipakai pra-komputasi, kategori usaha &
  koordinat dari ketiga dataset MAPID distandardisasi & divalidasi (penyamaan format
  penamaan kategori, pengecekan koordinat tidak wajar), penting karena data dikumpulkan
  surveyor berbeda-beda. **Sistem dirancang dua tahap terpisah: pra-komputasi dan proses saat
  pengguna mengakses peta.** Perhitungan isokron, agregasi H3, serta pencocokan jenis usaha
  dijalankan lebih dulu dan disimpan hasilnya, sehingga saat WebGIS diakses pengguna, sistem
  hanya membaca berkas hasil olahan tanpa perlu menghitung ulang dari awal — membuat peta
  tetap ringan diakses dan waktu muat wajar meski volume data cukup besar. Seluruh alat
  analisis spasial bersifat open source: GeoPandas, QGIS, OSMnx untuk pengolahan data, serta
  MapLibre GL JS untuk visualisasi peta di sisi klien.
- *5.3 Validasi AI* — keluaran AI diuji dengan korelasi Spearman terhadap label kondisi
  pembeli pada Menu Go, dilengkapi confusion matrix serta pengujian holdout per stasiun untuk
  cek konsistensi hasil di lokasi yang belum pernah dipakai saat pelatihan. Pemisahan peran
  sejak awal: AI hanya di titik masuk & titik keluar sistem (menerjemahkan masukan &
  meringkas hasil), mesin skor yang menentukan angka akhir bersifat deterministik dan tidak
  memanggil AI — sehingga proses penilaian tetap bisa ditelusuri dan diaudit ulang kapan
  saja.
- *5.4 Teknologi* — (1) **Analisis spasial:** Python (GeoPandas, OSMnx, Shapely, PySAL,
  h3-py), didukung QGIS, open source. (2) **Basemap:** MAPID MAPS sesuai ketentuan lomba.
  (3) **Antarmuka:** React dan Next.js dengan MapLibre GL JS, serta Turf.js di sisi
  pengguna. (4) **Model bahasa:** API eksternal untuk ketiga fungsi AI, kandidat model
  belum ditentukan. (5) **Publikasi:** Vercel atau Netlify, dapat diakses publik, responsif
  desktop dan mobile.

**6. Kesimpulan** — Pertumbuhan pesat transportasi massal Jabodetabek membuka peluang besar
bagi UMKM tumbuh di sekitar titik transit baru, tapi peluang ini sulit ditangkap karena
pemilihan lokasi usaha kebanyakan lewat perkiraan, sementara data yang dibutuhkan (pola
transaksi, kepadatan kompetitor, ketersediaan properti) tersebar dan sulit diakses pelaku
usaha kecil. SIGMAPS membalik cara kerja pencarian properti: dari mulai dari peta lalu
menebak kecocokan, menjadi mulai dari rencana bisnis, lalu sistem mencari & meranking
kawasan berdasar data pergerakan & transaksi riil, diperkaya jaringan jalan OSM & data
demografi BPS. Keunggulan utama: mesin skoring sepenuhnya deterministik & bisa ditelusuri —
setiap angka kelayakan lokasi dihitung lewat formula matematis yang jelas, bukan tebakan
model AI. AI ditempatkan hanya di titik-titik yang memang butuh pemahaman bahasa
(menerjemahkan rencana bisnis pengguna, merangkai hasil skoring jadi narasi mudah dibaca),
sehingga hasil akhirnya tetap transparan dan bisa dipertanggungjawabkan.

**Daftar Pustaka** — 13 sitasi terbagi dua kelompok: (A) Sitasi pada Latar Belakang Masalah
— [1] Wikipedia: Greater Jakarta Integrated Mass Transit System; [2] Sustain Review: MRT
Jakarta dan jalan panjang transportasi berkelanjutan (2025); [3] Pemprov DKI Jakarta:
Siaran pers Sosialisasi Pergub No.11/2026 ttg insentif & disinsentif KLB; [4] CISDI: Kawasan
berorientasi transit; [5] OJK Institute: UMKM mendunia (2025); [6] GoodStats: Kontribusi
UMKM atas PDB Indonesia (2026); [7] Lestari & Rahman (2022): Strategi pemilihan lokasi usaha
efektif untuk UMKM (ResearchGate). (B) Sitasi pada Sub-bab Sumber Data — [8] Repository UGM:
Kajian penerapan TOD pada kawasan Stasiun MRT Blok A; [9] MAPID: Data catalogue; [10] OSM
Foundation: Overpass API; [11] OSM Foundation: Nominatim; [12] BPS: Statistik kepadatan
penduduk & Survei Komuter Jabodetabek; [13] Kementerian ATR/BPN: GISTARU - RDTR Interaktif.

**Lampiran — Survei Kemampuan Teknis Anggota Tim** (jawaban tiap anggota atas 3 pertanyaan:
framework/library frontend yang dikuasai, bahasa/framework backend yang pernah dipakai,
jenis database yang pernah dipakai untuk data geospasial):
- **Anggota 1 — Clarissa Aditjakra:** Frontend: Swift, React JS, Vue JS. Backend: Swift,
  Laravel. Database: MySQL, MongoDB.
- **Anggota 2 — Clarawita:** Frontend: Swift, React JS, Next JS. Backend: Node.js, ASP.NET,
  Laravel. Database: MySQL.
- **Anggota 3 — Dimas Putra Aryawan:** Frontend: React JS, Next JS, Laravel. Backend:
  Node.js, ASP.NET. Database: PostgreSQL, SSMS, MySQL.
- **Anggota 4 — Clement Nathanael:** Frontend: Swift, Laravel, Leaflet.js dan React JS.
  Backend: Swift, Laravel. Database: MySQL.
- **Anggota 5 — Bernardus William Santosa:** Frontend: Laravel, SwiftUI. Backend: Laravel.
  Database: MySQL.

*(Catatan: dari kelima nama ini, user menyebutkan hanya 3 orang yang menjadi tim tech untuk
pembagian riset di percakapan ini — belum dikonfirmasi siapa saja yang 3 orang tersebut.)*

### Dokumen 2 — "Ketentuan Data & WebGIS - MAPID WebGIS Competition 2026.pdf" (12 halaman)

Ini adalah **aturan resmi tahap proposal** (sebelum lolos Top 50), terbagi tiga bagian besar:
Panduan Data, Ketentuan & Panduan WebGIS, dan Panduan Penggunaan AI.

**A. Panduan Data**
- *A.1 Ketentuan Umum* — data terdiri dari data dasar panitia (Community Maps), data hasil
  survey activities (wajib bagi tim terkurasi), dan data pendukung/sekunder resmi & terbuka.
  Peserta tidak wajib kumpulkan semua data dari nol, tapi **wajib** pakai data yang tersedia
  secara bertanggung jawab. Tim yang lolos 50 besar **wajib** memakai data dasar panitia
  termasuk Community Maps MAPID, dan **wajib** mengikuti survey activities pakai MAPID Apps
  untuk pengayaan/validasi/pelengkapan data sesuai arahan panitia. Data pendukung boleh
  dipakai selama resmi, terbuka, relevan, dan sumbernya dicantumkan. Data hasil survey wajib
  dipakai memperkaya analisis & WebGIS. **Dilarang** memakai Data Community Maps MAPID atau
  data kompetisi untuk tujuan di luar kompetisi tanpa izin; data mentah MAPID/partner tidak
  boleh disebarluaskan ke pihak luar. Format data yang disediakan: CSV, SHP, GeoJSON,
  GeoPackage. **Setelah melalui kurasi 50 tim, peserta dapat mengakses data dengan
  menggunakan API yang akan diberikan dokumentasinya oleh tim MAPID.**
- *A.2 Struktur Data yang Dapat Digunakan* — tiga kelompok: **Data Community Maps** (data
  aktivitas dari interaksi pengguna di dalam MAPID Apps, disediakan sebagai bagian data
  dasar kompetisi), **Data Mission** (dataset misi lapangan mencakup Properti Go, Struk Go,
  Menu Go, disediakan sebagai dataset pendukung sesuai ketentuan panitia), **Data
  Pendukung/Data Sekunder** (kumpulan data tambahan resmi/terbuka/relevan, dicari lewat menu
  Import Data pada mode Editor GEO MAPID, termasuk sumber sekunder lain seperti InaRISK,
  BIG, KLHK). Peserta **wajib memilih minimal satu** dari kelompok Data Community Maps dan
  Data Mission untuk dipakai; kelompok data pendukung/sekunder boleh dipakai untuk
  memperkaya WebGIS.
- *A.3 Data Community Maps (Activity)* — dihasilkan dari interaksi pengguna MAPID Apps,
  mencakup judul kegiatan, deskripsi, dokumentasi foto/video, lokasi aktivitas. Atribut kolom:
  title (text), description (text), latitude (angka desimal), longitude (angka desimal),
  medias (link, dipisah koma), images (link), videos (link).
- *A.4 Data Mission* — dataset dari misi pengumpulan data MAPID Catalyst, terdiri Properti
  Go, Struk Go, Menu Go, dihasilkan dari interaksi pengguna dalam MAPID Apps.
  - *A.4.1 Properti Go* — misi dokumentasi properti yang dipasarkan (dijual/disewakan) di
    berbagai kota Indonesia, pengambilan data di area publik/diizinkan. Atribut: Kategori
    Properti (dropdown: Rumah, Kantor, Gudang, Restoran, Coworking Space, Ruko, Laundry,
    Coffee Shop, Minimarket, Retail F&B, Hotel, Retail lain seperti toko baju/olahraga/
    elektronik, Tanah, Kos), Jenis Properti (Sewa/Jual), Tanggal, Alamat, Foto Tampak Depan,
    Foto Spanduk/Papan Promosi, Latitude, Longitude. Sample data: 15 titik.
  - *A.4.2 Struk Go* — misi pengumpulan data pengeluaran riil per transaksi dari berbagai
    tempat (restoran, warung, minimarket, apotek, e-commerce, transportasi). Atribut: Nama
    Tempat/Merchant, Kategori Tempat (dropdown: Restoran/kafe, Warung/kaki lima,
    Minimarket/supermarket, Apotek, Transportasi, Lainnya), Tanggal Transaksi, Waktu
    Transaksi, Metode Pembayaran (dropdown: Tunai, QRIS, Debit, Kartu Kredit, E-wallet),
    Foto Struk/Bukti Bayar, Latitude, Longitude. Sample data: 15 titik.
  - *A.4.3 Menu Go* — misi dokumentasi profil tempat makan (kaki lima/gerobak, warung, fast
    food, kafe, restoran), memetakan lokasi kuliner beserta menu & harga. Atribut: Nama
    Tempat/Makan, Jenis Tempat Makan (dropdown: Restoran, Kaki Lima/Gerobak, Kafe,
    Warung/Tenda Menetap, Fast Food), Tanggal, Waktu, Foto Tempat, Foto Menu 1 & 2, Menu
    Digital (link opsional), Menu Utama/Andalan (text), Harga rata-rata per porsi (angka),
    Kondisi Pembeli Saat Kunjungan (dropdown: Sepi = hanya ada penjual/tidak ada
    antrean/pembeli lain, Sedang = ada 1–3 pembeli menunggu/makan, Ramai = antrean lebih
    dari 3 orang/kursi-meja mayoritas terisi), Apakah Berjualan Berkeliling (Ya/Tidak),
    Latitude, Longitude. Sample data: 15 titik.
- *A.5 Data Pendukung/Data Sekunder* — kumpulan dataset di MAPID Data Catalogue
  (mapid.co.id/data-catalog), diakses lewat menu Import Data mode Editor GEO MAPID, berfungsi
  sebagai referensi tambahan analisis spasial/validasi lapangan/kebutuhan relevan lain. Data
  tambahan di luar Data Catalogue diperbolehkan selama resmi, terbuka, relevan, dan sumbernya
  dicantumkan. Data pendukung **tidak menggantikan** kewajiban penggunaan data dasar panitia
  bagi tim yang lolos kurasi.
- *A.6 Data Hasil Survey* — bagi tim terkurasi, data hasil survey activities (pakai MAPID
  Apps bagian mission/activities) menjadi bagian dataset kompetisi untuk pengayaan, validasi,
  atau pelengkapan data WebGIS. Bentuk data yang dapat dikumpulkan: foto, catatan lapangan,
  dokumentasi kondisi fasilitas, validasi konektivitas, skor kondisi, atribut tambahan,
  narasi pengalaman pengguna, sesuai ketentuan panitia & kebutuhan solusi. Lokasi survey:
  sekitar/dalam transportasi massal, atau lokasi lain yang sesuai solusi. Tim terkurasi
  **wajib** membuat rencana survey activities (teknis & format diberikan setelah terkurasi
  50 tim). Data hasil survey **wajib** dipakai memperkaya analisis & WebGIS. Budget survey
  activities hanya boleh dipakai untuk aktivitas yang berhubungan langsung dengan
  pengembangan solusi WebGIS.
- *A.7 Ringkasan Checklist Data* — 4 item: Data Community MAPS digunakan sesuai jenis
  (Community Maps/Properti Go/Struk Go/Menu Go); Data pendukung/sekunder resmi & sumber
  dicantumkan; Data survey activities adalah data primer lapangan dari 50 tim terkurasi;
  Etika & kerahasiaan — data kompetisi hanya untuk kebutuhan kompetisi, tidak disebarluaskan
  tanpa izin.

**B. Ketentuan dan Panduan WebGIS**
- *B.1 Tujuan Produk WebGIS* — WebGIS harus membantu pengguna memahami konteks, pola,
  hubungan, dan makna data (bukan sekadar peta interaktif). Bentuk produk bebas (dashboard,
  story map, analytical map, decision-support map, mobility intelligence map, accessibility
  dashboard, atau format relevan lain). Output final **wajib** menghasilkan insight dan
  rekomendasi, bukan hanya data mentah/titik di peta. WebGIS perlu menghubungkan data dengan
  isu nyata, contoh: aksesibilitas, konektivitas antarmoda, ekosistem ekonomi, potensi lokasi
  (site selection), pengalaman pengguna transportasi.
- *B.2 Komponen Wajib WebGIS* — Peta interaktif wajib jadi elemen utama; basemap wajib
  MAPID MAPS; interaksi peta wajib mendukung zoom, klik objek, filter data, tabel lokasi,
  tabel informasi atribut, layer control; visualisasi data bisa layer peta, table, grafik,
  chart, infografik, atau visualisasi lain yang relevan; fitur AI di dalam interface WebGIS
  wajib hadir sebagai bagian interaksi pengguna; akses publik wajib di tahap final via
  provider seperti Vercel/Netlify.
- *B.3 Alur Pengolahan Data hingga WebGIS* — kerangka 8 tahap: (1) Identifikasi data awal —
  tentukan data Community Maps/Mission/survey/sekunder relevan dgn masalah; (2) Data
  cleaning & standardisasi — bersihkan data, perbaiki tabel atribut, samakan format; (3)
  Pengayaan & validasi — lewat survey activities sesuai kebutuhan solusi; (4) Pengolahan
  data tidak terstruktur — olah foto/teks/deskripsi/catatan jadi informasi siap dianalisis;
  (5) Penggunaan AI — untuk ekstraksi/klasifikasi/ringkasan/rekomendasi/pemrosesan lain yg
  relevan; (6) Analisis spasial — temukan pola/keterkaitan/prioritas/konteks lokasi; (7)
  Output final data spasial & insight — rumuskan temuan utama yang dipahami pengguna &
  relevan bagi stakeholder; (8) Integrasi dalam WebGIS — tampilkan data hasil analisis,
  insight, rekomendasi, & interaksi AI lewat interface WebGIS.
- *B.4 Pengolahan dan Analisis Data* — peserta wajib mengolah data mentah panitia + data
  hasil survey; tidak semua metode wajib dipakai, pilih sesuai masalah & data. Kelompok
  pengolahan & contoh metode diperbolehkan: **Penyiapan data** (cleaning, standardisasi
  atribut, filtering, geocoding, penggabungan data); **Pengolahan informasi** (klasifikasi,
  ekstraksi informasi dari teks, interpretasi informasi dari foto/dokumentasi visual,
  AI-assisted tagging); **Analisis spasial** (spatial join, network/context analysis,
  clustering, scoring, indexing, visual analytics); **Validasi** (validasi data hasil survey
  + penggabungan data panitia, data survey, dan data sekunder); **Penyusunan rekomendasi**
  (menerjemahkan insight jadi rekomendasi relevan bagi stakeholder).
- *B.5 Rekomendasi Struktur WebGIS* — bersifat referensi (bukan wajib diikuti persis), tapi
  semua WebGIS **wajib** minimal punya: Peta Interaktif + Insight + AI Interface. Bagian yang
  direkomendasikan: Beranda/Overview (masalah, tujuan solusi, konteks wilayah/analisis,
  ringkasan insight utama), Peta Interaktif (ruang utama eksplorasi layer, filter, pencarian
  lokasi, popup atribut, layer control), Analisis dan Insight (hasil analisis spasial,
  indikator, grafik, tabel, perbandingan area, visual analytics), Interaksi AI di dalam
  interface WebGIS (**wajib ada** interface & interaksi AI), AI Insight (interaksi AI yang
  bantu pengguna minta ringkasan/penjelasan area/perbandingan/rekomendasi), Survey Activities
  (jelaskan data lapangan yg dikumpulkan, dokumentasi, peran dalam pengayaan/validasi data),
  Metodologi dan Sumber Data (jelaskan data, proses pengolahan, metode analisis, penggunaan
  AI, sumber & batasan data), Rekomendasi (sajikan rekomendasi berbasis insight untuk
  stakeholder relevan).
- *B.6 Desain, Responsivitas, dan Aksesibilitas* — desain wajib profesional, informatif,
  relevan tema transportasi massal; storytelling & visualisasi wajib bantu audiens paham
  data cepat & menghubungkan dengan isu nyata; website wajib diakses lewat desktop & mobile;
  tampilan peta wajib nyaman di berbagai ukuran layar; website wajib punya waktu loading
  yang wajar; WebGIS wajib bisa diakses publik di tahap final.
- *B.7 Larangan dalam Pengembangan WebGIS* — dilarang: membuat WebGIS yang hanya menampilkan
  data tanpa proses analisis/insight; memakai Data Community Maps MAPID atau data kompetisi
  untuk tujuan di luar kompetisi tanpa izin; mengolah analisis spasial dengan tools
  non-open-source (**disarankan pakai QGIS atau Google Earth Engine**); menyebarluaskan
  data mentah MAPID/partner ke pihak luar; memasukkan konten diskriminatif/provokatif/tidak
  etis; memakai konten yang melanggar hak cipta; mengambil data pribadi sensitif tanpa izin;
  memakai fitur berbayar yang tidak dapat diakses publik kecuali sudah disetujui panitia.

**C. Panduan Penggunaan AI**
- *C.1 Ketentuan Utama Penggunaan AI* — AI **wajib** hadir sebagai bagian interaksi
  pengguna di dalam WebGIS, berperan sebagai pemroses dan penerjemah data menjadi insight
  spasial, dan hadir di dalam interface WebGIS (bukan cuma proses internal tersembunyi).
  Bentuk implementasi AI tidak dibatasi, bisa disesuaikan ide masing-masing tim. AI harus
  dipakai secara relevan terhadap data, masalah, dan insight yang dibangun tim. Peserta
  **harus bisa menjelaskan** input, proses, output, dan validasi hasil AI. Tujuan akhir: AI
  harus membantu pengguna memahami insight, bukan sekadar fitur tambahan yang tidak
  terhubung dengan analisis.
- *C.2 Contoh Transformasi Data dengan AI* — contoh yang bisa diimplementasikan (bukan
  wajib persis seperti ini), dengan syarat AI harus menghasilkan output yang dapat dipetakan
  atau dikaitkan dengan lokasi (*spatial output*): Foto fasilitas/kondisi lapangan →
  (klasifikasi/interpretasi visual) → kategori kondisi fasilitas/indikator kondisi; Teks
  deskripsi lokasi → (ekstraksi info penting/tag/keyword) → tema isu lokasi/tag
  aksesibilitas/konteks area; Catatan lapangan → (klasifikasi/peringkasan informasi) →
  kategori hambatan/ringkasan observasi/indikator pengalaman pengguna; Atribut →
  (pengayaan/pengelompokan informasi) → profil ekonomi kawasan/kelompok kategori/insight
  pendukung; Layer dan hasil analisis → (penyusunan ringkasan/penjelasan/perbandingan/
  rekomendasi) → summary area/penjelasan terpilih/comparison insight/prioritas area.
- *C.3 Checklist WebGIS dan AI* — 8 item: Peta interaktif jadi elemen utama & memuat
  interaksi dasar wajib; Basemap MAPID MAPS digunakan; Data dan analisis — WebGIS
  menunjukkan proses pengolahan data & menghasilkan insight, bukan hanya data mentah; Survey
  activities — bagi tim terkurasi, data survey dipakai memperkaya/memvalidasi analisis; AI
  dalam interface — pengguna dapat mengakses fitur/hasil AI secara langsung dari WebGIS;
  Penjelasan AI — input, proses, output, validasi, dan integrasi AI dapat dijelaskan tim;
  Rekomendasi — insight diterjemahkan jadi rekomendasi bagi stakeholder relevan; Akses
  publik — WebGIS dapat diakses publik, responsif desktop & mobile, loading wajar.

### Dokumen 3 — "NEXT STEP TOP 50 MAPID WebGIS Competition.pdf" (7 halaman)

Panduan onboarding administratif untuk tim yang lolos ke tahap Top 50 (bukan requirement
teknis produk). Ringkasan isi:

- **Pembukaan** — selamat karena tim lolos ke Top 50 MAPID WebGIS Competition 2026. Seluruh
  anggota tim **wajib** bergabung ke Community resmi **"[TOP 50] - MAPID WebGIS Competition"**
  di MAPID Apps, karena seluruh update lanjutan (pengumuman, technical meeting, koordinasi,
  aktivitas kompetisi) disampaikan lewat kanal ini.
- **1. Alur Onboarding** (tabel peran) — (a) Seluruh anggota: login MAPID Apps, cari & klik
  Join Community Top 50; (b) Project Leader: pastikan semua anggota sudah klik Join, kirim
  nama tim + data akun seluruh anggota ke Admin; (c) Admin MAPID: verifikasi & approval; (d)
  Seluruh anggota: cek akses & pantau Top 50, tunggu invite Community Tim. Catatan: **setiap
  anggota wajib join mandiri pakai akun MAPID Apps masing-masing**, Project Leader tidak bisa
  mewakili proses join anggota lain. Project Leader baru menghubungi Admin **setelah** semua
  anggota menekan Join Community, dan data seluruh anggota dikirim sekaligus dalam satu
  pesan. Community khusus per tim akan di-invite kemudian oleh Tim MAPID, peserta tidak perlu
  membuat/mencarinya sendiri.
- **2. Cara Bergabung ke Community Top 50** — Langkah 1: buka MAPID Apps, klik search bar
  "Find Place, Community or Mission". Langkah 2: ketik "Top 50", pilih tab Community, klik
  "[TOP 50] - MAPID WebGIS Competition 2026". Langkah 3: scroll ke bawah, klik "Join
  Community" (akun lalu menunggu approval Admin). Langkah 4: setelah semua anggota join,
  Project Leader/perwakilan menghubungi WhatsApp Admin MAPID, kirim nama tim + username MAPID
  Apps seluruh anggota dalam satu pesan. **Catatan tanggal: proses menghubungi WA Admin MAPID
  diminta dilakukan pada hari Minggu, 9 Agustus 2026.**
- **3. Approval oleh Admin MAPID** — WhatsApp Admin: wa.me/6281216450675. Data yang dikirim:
  nama tim, nama Project Leader/perwakilan, nama + username MAPID Apps seluruh anggota tim.
  Template pesan WhatsApp resmi disediakan di dokumen (format: perkenalan tim, daftar nama +
  username tiap anggota, nama tim, nama Project Leader).
- **4. Setelah Berhasil Bergabung** — MAPID Apps jadi kanal komunikasi resmi Top 50; pantau
  Community secara berkala untuk info Technical Meeting, coaching, agenda kompetisi,
  pengumuman, koordinasi tahap berikutnya. Poin: seluruh anggota pastikan akun benar masuk
  Community Top 50; Project Leader pastikan tidak ada anggota tertinggal info; WhatsApp Admin
  dipakai khusus untuk approval/kendala akses; pertanyaan & koordinasi rutin diarahkan ke
  Community MAPID Apps.
- **5. Bergabung ke Community (Grup) Khusus Tim** — setelah verifikasi data akun seluruh
  anggota selesai, Tim MAPID akan membuat satu Community khusus per tim Top 50 (ruang
  koordinasi lebih dekat dengan fasilitator & Admin Community selama pendampingan &
  pengembangan WebGIS). Peserta **tidak perlu** membuat Community sendiri — Tim MAPID yang
  membuat, menyiapkan fasilitator & Admin, lalu mengirim invitation ke akun MAPID Apps
  masing-masing anggota. Cara bergabung: (1) tunggu invitation dari Tim MAPID (dikirim ke
  akun yang sudah dikonfirmasi saat onboarding), (2) buka & join Community sesuai nama tim
  (pastikan pakai akun yang sama dengan yang sudah dikonfirmasi), (3) pantau Community tim
  secara berkala untuk koordinasi dengan fasilitator/Admin Community, reminder agenda,
  kebutuhan mentoring/coaching, update progres, info khusus tim.
- **Catatan penting dari panitia** — (1) proses approval & respons Admin MAPID mungkin lebih
  lama pada Minggu, 9 Agustus 2026, akan ditindaklanjuti lebih responsif pada Senin, 10
  Agustus 2026. (2) **Agenda terdekat setelah onboarding: Technical Meeting pada Senin, 10
  Agustus 2026 pukul 19.00 WIB via Zoom** — seluruh peserta diminta menyesuaikan jadwal;
  akses Zoom disampaikan lewat kanal resmi MAPID Apps. *(Dari cuplikan tampilan Community di
  dokumen ini, juga terlihat ada agenda "12 Agustus: Coaching 1 - PRD & Product" yang
  disebutkan sekilas di postingan sambutan Community, meski tidak dibahas detail di badan
  dokumen.)*
- **Dua Community, dua fungsi berbeda** — tabel: "[TOP 50] - MAPID WebGIS Competition 2026"
  (fungsi: pengumuman & info resmi untuk seluruh peserta Top 50; cara gabung: cari, klik
  Join, tunggu approval Admin) vs "Community khusus [Nama Tim]" (fungsi: koordinasi spesifik
  tim bersama fasilitator MAPID WebGIS Competition & Admin Community; cara gabung: di-invite
  langsung oleh Tim MAPID).
- **Checklist Tim Top 50** (6 item) — seluruh anggota tim punya akun MAPID Apps; seluruh
  anggota tahu username akun masing-masing; seluruh anggota menemukan Community "[TOP 50] -
  MAPID WebGIS Competition 2026"; seluruh anggota menekan "Join Community"; Project
  Leader/perwakilan mengirim nama tim + daftar username seluruh anggota ke WhatsApp Admin;
  seluruh anggota sudah di-approve & dapat mengakses Community. Catatan penutup: selama
  kompetisi, seluruh anggota wajib memantau **kedua** Community — info publik/umum di
  Community Top 50, koordinasi spesifik tim di Community tim.

*(Catatan analisis: tanggal-tanggal di dokumen ini — approval Minggu 9 Agustus 2026,
Technical Meeting Senin 10 Agustus 2026 — sudah lewat dari tanggal percakapan berlangsung
(27 Agustus 2026). Kemungkinan besar Technical Meeting dan sesi Coaching 1 sudah
berlangsung, tapi belum ada konfirmasi materi/notulen dari sesi tersebut yang masuk ke
percakapan ini — lihat "Open questions" di bawah.)*

## Sintesis dan Analisis Lanjutan

Bagian-bagian di bawah ini adalah hasil sintesis, penjelasan, dan pengembangan dari isi tiga
dokumen di atas, dibahas sepanjang percakapan.

### Tentang kompetisinya

**MAPID WebGIS Competition 2026** — "Maps That Think! Mass Transportation Edition".
Tim bernama **Kamehameha** (BINUS University), sudah **lolos ke tahap Top 50** dari tahap
proposal.

## Produk yang diusulkan: SIGMAPS

**SIGMAPS (Spatial Intelligence & Geography MAPS)** — WebGIS berbasis analisis spasial dan
AI untuk membantu calon pelaku UMKM menemukan lokasi usaha terbaik di sekitar kawasan
stasiun transportasi massal Jabodetabek (MRT, LRT, KRL, TransJakarta).

Alur kerja produk: **need-first, property-last**. Pengguna memasukkan rencana bisnis dalam
bahasa sehari-hari → AI menerjemahkan jadi parameter → sistem menghitung & meranking
kawasan stasiun paling cocok berdasarkan data pergerakan manusia riil → menampilkan
daftar properti siap sewa di kawasan rekomendasi.

### Lima pilar analitik inti
1. **Analisis Area Tangkapan Isochrone** — area jangkauan jalan kaki 5 & 10 menit dari
   stasiun, dihitung dari topologi jaringan jalan riil (bukan lingkaran radius).
2. **Pemodelan Gravitasi Ekonomi Empiris** — gabungkan data POI statis dengan bukti
   transaksi riil (Menu Go, Struk Go).
3. **Pemrofilan Temporal Transaksi** — algoritma daily peak detection untuk klasifikasi
   ritme komuter First-Mile / Last-Mile.
4. **Market Saturation** — Kernel Density Estimation (KDE) untuk memetakan kejenuhan pasar
   → Zona Risiko Low/Medium/High.
5. **Mesin Penilaian Deterministik** — Weighted Linear Combination, normalisasi min-max,
   dikurangi penalti risiko KDE.

**Prinsip penting:** mesin skoring bersifat 100% deterministik & bisa ditelusuri (tidak
ada black-box). AI **tidak** dipakai untuk menghitung skor. AI hanya dipakai di dua titik:
(a) menerjemahkan input bahasa natural pengguna jadi parameter terstruktur, dan (b) meringkas
hasil skoring jadi narasi "AI Area Insight".

### Output utama produk
- Peringkat Top 5 lokasi teroptimal
- Scorecard probabilitas kesuksesan (skor 0–100) + Indeks Risiko Spasial
- Panel & sintesis AI (dekomposisi kontribusi variabel + narasi)
- Katalog inventaris properti terintegrasi (ready-to-lease)
- Matriks uji kelayakan komparatif (bandingkan 2–3 properti side-by-side)

### Arsitektur end-to-end (dari proposal, Gambar 3.2)
```
Akuisisi Data → Pre-Computation (Python, QGIS) → Scoring Machine → Visualization
```
Kutipan penting dari proposal (bagian 5.2) yang **mengunci arsitektur**:
> "Sistem dirancang dengan dua tahap terpisah, yaitu pra-komputasi dan proses saat
> pengguna mengakses peta. Perhitungan isokron, agregasi H3, serta pencocokan jenis
> usaha dijalankan lebih dulu dan disimpan hasilnya, sehingga saat WebGIS diakses
> pengguna, sistem hanya membaca berkas hasil olahan tanpa perlu menghitung ulang dari
> awal."

Ini artinya backend + database **wajib ada**, bukan opsional — meski data mentahnya
berasal dari API MAPID dan fitur AI-nya pakai LLM API eksternal. Lihat bagian "Kenapa
backend & database tetap perlu" di bawah.

## Stack teknologi yang sudah/akan dipakai

| Layer | Pilihan | Status |
|---|---|---|
| Frontend | **Next.js** (React) + **MapLibre GL JS** + **Turf.js** | Sudah fix, ditentukan user |
| Basemap | **MAPID MAPS** | Wajib dipakai sesuai ketentuan lomba, bukan basemap bebas |
| Isokron | **OSMnx dari nol** (build graf jaringan jalan kaki dari OSM, hitung isokron sendiri) | **Dikonfirmasi tetap dipakai.** Sempat muncul klaim di dokumen pembanding lain bahwa MAPID punya tool Isochrone bawaan yang bisa dipakai langsung — **user mengonfirmasi klaim itu tidak benar, MAPID tidak punya tool isochrone**, jadi OSMnx dari nol tetap jadi pendekatan utama Jalur 2, bukan cadangan |
| Metode Market Saturation (KDE) | **Belum diputuskan** — kandidat: PySAL vs scikit-learn (`sklearn.neighbors.KernelDensity`) | **Perlu riset lebih lanjut, ditugaskan ke Anggota 2 (Jalur 2).** Lihat bagian "Pembagian riset" |
| Analisis spasial lain | Python: **GeoPandas, Shapely, h3-py**, didukung **QGIS** | Tetap dipakai, tidak ada perubahan |
| Model bahasa (AI) | Belum ditentukan kandidatnya | Bagian riset Jalur 3 |
| Database | Belum ditentukan | Bagian riset Jalur 1. Kandidat: PostgreSQL+PostGIS, atau layanan terkelola (Supabase/Neon) |
| Backend live (tempat langkah terakhir skoring/WLC dihitung) | **Belum diputuskan** — kandidat: Next.js API Routes (JS, serverless) vs backend Python terpisah (mis. FastAPI) | **Perlu riset lebih lanjut, ditugaskan ke Anggota 1 (Jalur 1).** Ini soal arsitektur backend: di bahasa/runtime apa langkah penjumlahan berbobot final (WLC) dijalankan saat user request. Lihat penjelasan detail di bagian "Cara kerja sistem end-to-end" dan "Pembagian riset" |
| Publikasi/hosting | **Vercel atau Netlify** | Wajib bisa diakses publik di tahap final |

**Batasan data Properti Go (penting untuk desain fitur):** dataset Properti Go **tidak** punya
kolom luas (m²), **tidak** punya kolom harga, dan **tidak** punya kolom kontak pemilik. Juga
**tidak ada OCR** — seluruh analisis harus membaca kolom terstruktur, bukan mengekstrak data
dari foto. Konsekuensi langsung ke desain fitur: jangan buat filter luas atau filter anggaran,
jangan tampilkan harga sewa per unit, dan jangan buat tombol "hubungi pemilik" karena datanya
memang tidak tersedia.

**Cakupan wilayah & moda (scope dipersempit):** cakupan produk **dipersempit ke KRL
Commuter Line + TransJakarta saja**. MRT dan LRT dikeluarkan dari cakupan tahap ini
(berbeda dari proposal awal yang mengasumsikan seluruh 371 stasiun lintas MRT/LRT/KRL/
TransJakarta). Catatan yang perlu dicek ke tim: dua contoh kawasan TOD andalan di proposal
(Dukuh Atas, Blok M) adalah simpul multi-moda yang juga dilayani MRT — perlu dipastikan
keduanya tetap masuk cakupan lewat jalur KRL/TransJakarta yang melewatinya, supaya studi
kasus andalan proposal tidak hilang akibat penyempitan scope ini.

## Ketentuan lomba yang relevan (dari "Ketentuan Data & WebGIS MAPID WebGIS Competition 2026")

- **Data yang boleh dipakai:** Data Community Maps (aktivitas dari MAPID Apps), Data
  Mission (Properti Go, Struk Go, Menu Go), dan Data Pendukung/Sekunder resmi & terbuka
  (BPS, ATR/BPN GISTARU RDTR, InaRISK, BIG, KLHK, via MAPID Data Catalogue). Wajib pilih
  minimal satu dari Data Community Maps / Data Mission.
- **Status akses data saat proposal:** hanya sample data (±15 titik per dataset Data
  Mission) dalam format CSV/SHP/GeoJSON/GeoPackage. **Akses API penuh dengan dokumentasi
  resmi baru diberikan MAPID setelah tim lolos kurasi 50 besar** — karena tim sudah lolos
  Top 50, perlu dicek ke Community/fasilitator apakah dokumentasi API ini sudah diberikan.
- **Survey activities:** tim terkurasi (Top 50) **wajib** melakukan survey lapangan pakai
  MAPID Apps untuk pengayaan/validasi/pelengkapan data. Data hasil survei wajib dipakai
  memperkaya analisis.
- **Larangan penting:** dilarang menyebarluaskan data mentah MAPID/partner ke pihak luar;
  dilarang memakai data pribadi sensitif tanpa izin; dilarang WebGIS tanpa analisis/insight
  (tidak boleh cuma tampilkan data mentah); dilarang tools analisis non-open-source
  (disarankan QGIS atau Google Earth Engine); dilarang fitur berbayar yang tidak bisa
  diakses publik.
- **AI wajib** hadir sebagai bagian interaksi pengguna **di dalam interface WebGIS**
  (bukan cuma proses backend tersembunyi) — user harus bisa memicu/mengakses AI secara
  langsung. Tim harus bisa jelaskan input, proses, output, dan validasi AI-nya.
- **Komponen wajib WebGIS:** peta interaktif (zoom, klik, filter, layer control, tabel
  atribut), basemap MAPID MAPS, minimal struktur "Peta Interaktif + Insight + AI
  Interface", desain profesional & responsif desktop/mobile, akses publik di tahap final.

## Status kompetisi saat ini

Tim sudah lolos ke **Top 50**. Ada dokumen onboarding ("NEXT STEP TOP 50") yang isinya
murni administratif: cara join Community MAPID Apps ([TOP 50] - MAPID WebGIS Competition
2026), proses approval via WhatsApp Admin MAPID, dan agenda Technical Meeting. **Catatan:**
tanggal-tanggal di dokumen itu (approval Minggu 9 Agustus 2026, Technical Meeting Senin 10
Agustus 2026) sudah lewat dari tanggal hari ini (27 Agustus 2026) — kemungkinan besar
technical meeting & sesi coaching ("Coaching 1 - PRD & Product") sudah berlangsung. **Belum
dikonfirmasi** apakah ada materi/notulen dari sesi tersebut, termasuk dokumentasi API MAPID
yang dijanjikan diberikan setelah lolos kurasi. Ini masih jadi open question.

## Kenapa backend & database tetap perlu (meski data via API)

Ini poin yang sempat dipertanyakan user secara kritis — jawaban lengkapnya:

1. **Pra-komputasi berat tidak bisa dihitung ulang tiap request.** Isokron (OSMnx), H3
   binning, KDE — semua ini butuh waktu proses signifikan. Tidak realistis dihitung live
   tiap kali user buka peta untuk ratusan stasiun. Proposal sendiri sudah berkomitmen pada
   pola pra-komputasi + simpan hasil (lihat kutipan di atas).
2. **Data dari banyak sumber perlu digabung secara spasial** (StrukGo + MenuGo + PropertyGo
   + OSM + BPS + GISTARU) — perlu tempat join/index, idealnya database geospasial
   (PostGIS-style).
3. **Fitur ranking & komparasi (Top 5, matriks komparatif) adalah operasi query**, bukan
   tampilan statis — butuh data yang sudah tersimpan & bisa di-query cepat.
4. **Klaim "bisa ditelusuri/auditable"** di proposal butuh histori skor & komponen skor
   tersimpan untuk validasi (korelasi Spearman, confusion matrix).
5. **Survey activities datang bertahap** sepanjang kompetisi — perlu tempat akumulasi data
   dari waktu ke waktu.
6. **Keamanan API key LLM** — panggilan ke LLM API tidak boleh dilakukan langsung dari
   browser/client (key akan ter-expose), harus lewat server/backend.
7. **Kontrol biaya & rate limit** — panggilan ke API MAPID dan LLM API perlu dikontrol lewat
   satu lapisan server, bukan dipanggil bebas dari tiap client.

Catatan: "backend" di sini tidak harus server berat 24 jam — bisa berupa Next.js API
Routes (serverless), dan "database" bisa berupa layanan terkelola (Supabase/Neon) yang
sudah menyediakan PostgreSQL+PostGIS plus API layer otomatis.

## Cara kerja sistem end-to-end (klarifikasi lanjutan)

Pembahasan lanjutan menjawab kebingungan konkret: "kalau frontend & backend sama-sama
Next.js, sementara analisis pakai Python, gimana cara connect-nya? dan gimana Properti Go
dimunculkan?"

### Next.js dan Python tidak saling memanggil langsung
Next.js (Node.js) dan Python adalah dua runtime terpisah, tidak bisa saling import fungsi.
Keduanya terhubung **lewat database**, bukan lewat panggilan langsung:
- **Python** jalan sebagai proses **batch/offline** (bukan menunggu request user). Tugasnya:
  baca data, hitung analisis spasial berat, tulis hasilnya ke database (pakai
  psycopg2/SQLAlchemy).
- **Next.js (API Routes)** terhubung ke database yang sama, tapi cuma untuk **baca** dan
  menyajikan ke frontend (pakai Prisma/node-postgres).
- Analogi: Python = pabrik (kerja sesekali, simpan stok), Next.js = kasir (layani
  pengunjung cepat pakai stok yang sudah disiapkan pabrik).

### Yang berat vs yang ringan dalam mesin skoring
Bukan semua langkah skoring perlu Python. Dipecah jadi dua:
- **Berat & sama untuk semua orang** (isokron, agregasi H3, KDE, model gravitasi) → dihitung
  sekali oleh Python, disimpan sebagai **skor komponen** per hex/stasiun di database. Ini
  sudah pasti tetap di Python, tidak ada perdebatan di bagian ini.
- **Ringan & beda-beda tergantung input user** (Weighted Linear Combination — penjumlahan
  berbobot final) → cuma perkalian & penjumlahan, bobotnya baru diketahui setelah AI
  membaca rencana bisnis user. **Di bahasa/runtime apa langkah ini dijalankan saat live
  masih belum diputuskan** — lihat catatan di bawah.

**Status per 27 Agustus 2026 — masih riset, belum final:** sebelumnya bagian ini sempat
menyatakan langkah WLC pasti dihitung di Next.js API Route (JS/TS), dengan alasan langkahnya
ringan (cuma perkalian & penjumlahan) dan tidak perlu Python nyala saat request. Setelah
dibandingkan dengan context.md dari sesi/dokumen lain yang memilih sebaliknya (backend Python
terpisah, mis. FastAPI, dengan alasan supaya rumus skoring cuma punya satu salinan dan tidak
ditulis ulang di dua bahasa), **keputusan ini di-reset jadi belum final** dan ditugaskan
sebagai riset lanjutan ke Anggota 1 (Jalur 1). Ini murni soal **arsitektur backend**: server
yang melayani request live (menghitung skor akhir per kawasan dan menjawab frontend) bisa
ditulis dalam Next.js API Routes (JavaScript/TypeScript, satu layanan yang sama dengan
frontend) atau dalam backend Python terpisah (misalnya FastAPI, di-deploy sebagai layanan
kedua). Pertimbangan yang perlu ditimbang saat riset: kesiapan skill tim (dari survei
kemampuan di Lampiran Dokumen 1, tidak ada anggota yang eksplisit menyebut pengalaman
framework web Python seperti FastAPI/Django/Flask — Python yang disebut selama ini untuk
pipeline analisis data, bukan untuk melayani web request), kompleksitas operasional (backend
terpisah = layanan deployment kedua, berpotensi cold start), vs risiko duplikasi implementasi
rumus skoring di dua bahasa kalau dipisah JS/Python.

### Ranking dua tingkat: kawasan dulu, baru properti (menjawab "Properti Go dimunculkan gimana")
Alurnya bukan "371 stasiun diisokron lalu langsung dicocokkan ke Properti Go", tapi dua
tahap:
- **Level 1 — kawasan:** isokron 5–10 menit tiap dari 371 stasiun → skor kawasan dihitung
  dari sinyal permintaan riil (Struk Go, Menu Go) yang jatuh di area isokron itu.
- **Level 2 — properti:** untuk kawasan dengan skor tertinggi (misal Top 5), baru dilakukan
  spatial join — cari titik Properti Go yang koordinatnya jatuh di dalam polygon isokron
  kawasan itu. Itulah yang ditampilkan ke user sebagai daftar properti rekomendasi.
- Struk Go/Menu Go menjawab "di mana orangnya ramai & sesuai profil usaha", Properti Go
  menjawab "ruko mana yang bisa disewa di situ". Skor kawasan **tidak** dihitung dari
  Properti Go.
- **Kasus tepi yang perlu direncanakan:** bisa ada kawasan skor tinggi tapi nol Properti Go
  di isokronnya (karena Properti Go data crowdsourced, bukan listing lengkap). Perlu aturan
  cadangan: perluas radius, beri label "berpotensi tinggi, data properti masih terbatas",
  atau jadikan prioritas survey manual.

### Membangun database sendiri dari API MAPID (menjawab "MAPID gak kasih 1 database besar")
MAPID tidak akan pernah kasih satu dump database besar. Itu bukan berarti tidak bisa dipakai
— API dengan parameter filter tertentu justru **alat untuk membangun database sendiri**,
lewat pola **ETL (Extract, Transform, Load)**, persis seperti tahap "Akuisisi Data" di
diagram arsitektur proposal:
1. **Extract** — script panggil API MAPID berulang dengan kombinasi parameter beda (kategori,
   wilayah, pagination).
2. **Transform** — bersihkan & standardisasi tiap hasil (koordinat, kategori, format waktu).
3. **Load** — tulis hasil bersih ke database milik tim sendiri (PostgreSQL/PostGIS).

Setelah itu, semua analisis Python baca dari database sendiri, bukan menembak API MAPID
tiap kali analisis jalan. **Risiko sebenarnya bukan soal akses API, tapi soal kelengkapan
data**: Struk Go/Menu Go/Properti Go adalah data crowdsourced dari survey komunitas, jadi
banyak dari 371 stasiun kemungkinan datanya tipis/kosong karena belum ada yang mensurvei
area itu, bukan karena keterbatasan API. Ini alasan tim Top 50 diwajibkan survey activities
sendiri, dan implikasinya: scope awal sebaiknya beberapa koridor/stasiun prioritas dengan
data cukup padat, bukan langsung mencakup semua 371 stasiun secara merata.

### Studi kasus lengkap (dipakai untuk menjelaskan semua konsep di atas)
Skenario: *"Saya ingin buka toko roti kecil yang menyasar pekerja kantoran di pagi hari."*
1–5. **(Python, batch)** hitung isokron (OSMnx) → agregasi H3 → gabungkan transaksi
   Struk Go/Menu Go jadi skor gravitasi ekonomi per hex → daily peak detection dari jam
   transaksi (deteksi puncak pagi 06.00–09.00) → KDE untuk skor kompetisi/saturasi.
   Hasil disimpan: `{hex_id, stasiun: "Dukuh Atas", skor_daya_beli: 0.72, skor_jam_pagi: 0.85,
   skor_kompetisi_kde: 0.60}`.
6. **(AI, live)** parsing kalimat user → `{kategori: F&B-bakery, target_jam: pagi (06-09),
   segmen: pekerja kantoran, skala: kecil}`.
7. **(Next.js, live)** ambil preset bobot arketipe → `{w_daya_beli: 0.4, w_jam_pagi: 0.4,
   w_kompetisi: -0.2}` → hitung `skor = 0.4×daya_beli + 0.4×jam_pagi − 0.2×kompetisi_kde` →
   urutkan Top 5 kawasan.
8. **(Next.js, live)** spatial join Properti Go di dalam isokron tiap kawasan Top 5 (Level 2).
9. **(LLM API, live)** buat narasi AI Area Insight dari skor & komponennya.

## Pembagian riset async — 3 anggota tim tech

Sudah dituangkan jadi dua deliverable terpisah, isinya sama tapi format beda:
- **Artifact (halaman web)** — "Jalur Riset SIGMAPS" (versi ringkas, untuk dibuka/dibagikan cepat)
- **PDF** — "Jalur Riset Stack" v2 (versi lebih detail, memuat seluruh penjelasan "Cara kerja
  sistem end-to-end" di atas + studi kasus lengkap, cocok untuk dibaca/dicetak/di-share ke
  seluruh tim termasuk tim product)

Ringkasan tiap jalur:

### Jalur 1 — Data, Basis Data & Backend
Riset: peta sumber data MAPID (endpoint, skema, status akses API) + strategi ETL untuk
membangun database sendiri, batasan etika data, pilihan database geospasial, skema tabel
hasil olahan **dua tingkat** (skor komponen per hex/stasiun + Properti Go dengan indeks
spasial, termasuk rencana fallback kawasan tanpa properti), orkestrasi proses batch Python,
keamanan (secret management, rate limiting). **Tidak menunggu siapa pun** — bisa mulai dengan
skema hasil pra-komputasi yang diasumsikan sendiri.

**Riset tambahan (belum final, prioritas):** arsitektur backend live — Next.js API Routes
(JS/TS) vs backend Python terpisah (mis. FastAPI) — untuk menjalankan langkah terakhir
skoring (Weighted Linear Combination) secara live. Lihat penjelasan lengkap & pertimbangan di
bagian "Cara kerja sistem end-to-end → Yang berat vs yang ringan dalam mesin skoring".

### Jalur 2 — Analisis Spasial & Mesin Skoring (Python)
Riset: isokron dari nol pakai **OSMnx** (dikonfirmasi tetap dipakai, MAPID tidak punya tool
isochrone bawaan), agregasi H3 (h3-py), model gravitasi ekonomi, profil temporal transaksi
(daily peak detection), format output **skor komponen** (bukan skor final — penjumlahan
berbobot final masih jadi riset terbuka, lihat Jalur 1), validasi tools open-source
(QGIS/Google Earth Engine).
**Tidak menunggu** — sample data 15 titik per dataset sudah tersedia sekarang, PoC bisa
langsung dimulai.

**Riset tambahan (belum final, prioritas):** metode Market Saturation/KDE — **PySAL vs
scikit-learn (`sklearn.neighbors.KernelDensity`)** — belum ada pilihan pasti, perlu
dibandingkan dari sisi kemudahan pakai, kelengkapan dokumentasi, dan kecocokan dengan
kebutuhan (KDE 2D sederhana untuk kepadatan kompetitor).

### Jalur 3 — Frontend Mapping & Interaksi AI
Riset: Next.js + MapLibre GL JS + integrasi basemap MAPID MAPS, Turf.js, pola fetching
data dari backend (kontrak skema: kawasan Top 5 + properti dalam kawasan), pemilihan LLM
API (bandingkan 2-3 provider), desain interaksi AI yang benar-benar bisa dipicu user di UI,
keamanan panggilan AI (key tidak boleh di client, semua lewat backend Jalur 1), deployment
Vercel vs Netlify. Jalur ini **tidak perlu paham Python** — cuma konsumsi JSON dari endpoint
Jalur 1. **Tidak menunggu** — bisa mulai dengan dummy/mock data yang meniru skema hasil
skoring dua tingkat.

**Setelah riset:** tiap anggota bikin ringkasan singkat (dokumen 1 halaman/video pendek),
lalu sesi sinkronisasi tim untuk menyamakan skema data dua tingkat (Jalur 1 ↔ Jalur 2) dan
kontrak endpoint (Jalur 1 ↔ Jalur 3), **baru setelah itu** masuk tahap membangun aplikasi.

## Open questions / hal yang belum terjawab

1. Apakah dokumentasi API MAPID (untuk StrukGo, MenuGo, PropertyGo) sudah diberikan ke
   tim setelah lolos Top 50? Perlu dicek ke Community/fasilitator MAPID.
2. Apakah ada notulen/materi dari Technical Meeting (10 Agustus 2026) dan Coaching 1 - PRD
   & Product yang mungkin sudah berisi requirement tambahan khusus tahap Top 50?
3. Kandidat LLM API belum dipilih.
4. Pilihan database belum diputuskan (masih jadi scope riset Jalur 1).
5. **Arsitektur backend live: Next.js API Routes (JS) vs backend Python terpisah (mis.
   FastAPI)** — belum diputuskan, ditugaskan ke Jalur 1. Ini menentukan di bahasa apa
   langkah terakhir skoring (Weighted Linear Combination) dijalankan saat user request.
6. **Metode Market Saturation: PySAL vs scikit-learn (`KernelDensity`)** — belum diputuskan,
   ditugaskan ke Jalur 2.
7. Belum ada rencana teknis untuk survey activities (format, tools, jadwal) — di dokumen
   ketentuan disebut "teknis dan format akan diberikan setelah terkurasi 50 tim".
8. Perlu dikonfirmasi ke tim: apakah stasiun Dukuh Atas & Blok M (contoh andalan proposal,
   simpul multi-moda) tetap masuk cakupan setelah scope dipersempit ke KRL + TransJakarta
   saja (lihat "Cakupan wilayah & moda" di atas).

## Rekonsiliasi dengan context.md versi lain (27 Agustus 2026)

User mengunggah satu file context.md lain (kemungkinan dari sesi/anggota tim lain) yang berisi
keputusan arsitektur lebih matang untuk SIGMAPS. Setelah dibandingkan, beberapa poin berbeda
langsung ditindaklanjuti dan diputuskan user sebagai berikut — **ini adalah keputusan final
untuk poin-poin ini, kecuali dua yang eksplisit ditandai "masih riset" di atas:**

1. Dokumen lain itu mengklaim MAPID punya tool Isochrone bawaan yang bisa dipakai langsung
   (menggantikan OSMnx). **User mengonfirmasi klaim ini tidak benar** — MAPID tidak punya
   tool isochrone. OSMnx dari nol tetap jadi pendekatan utama Jalur 2.
2. Dokumen lain memilih scikit-learn dan mencoret PySAL untuk KDE. **Belum diputuskan** —
   dijadikan riset lanjutan eksplisit untuk Anggota 2.
3. Dokumen lain mengunci backend Python (FastAPI) untuk menjalankan WLC secara live,
   berlawanan dengan arah yang sempat saya jelaskan sebelumnya (WLC di Next.js). **Belum
   diputuskan** — dijadikan riset lanjutan eksplisit untuk Anggota 1.
4. Dokumen lain menyoroti bahwa MAPID punya tool "Site Selection" bawaan yang mirip SIGMAPS
   (risiko diferensiasi). **Poin ini diabaikan/tidak dipakai** atas instruksi user — tidak
   masuk ke context ini.
5. Batasan data Properti Go (tanpa kolom luas/harga/kontak, tanpa OCR) dari dokumen lain
   **diterima dan sudah dimasukkan** ke bagian "Stack teknologi" di atas.
6. Penyempitan scope ke KRL + TransJakarta saja (MRT & LRT dikeluarkan) dari dokumen lain
   **diterima dan sudah dimasukkan**, dengan catatan perlu verifikasi status Dukuh Atas/Blok M
   (lihat open question #8).
7. Penjelasan kasus tepi "kawasan skor tinggi tapi nol Properti Go" dari context.md milik
   percakapan ini (tidak dibahas di dokumen lain) **dipertahankan**, tidak dihapus.

## File terkait dari percakapan ini

- Proposal SIGMAPS (Kamehameha_SIGMAPS.pdf) — proposal yang sudah lolos ke Top 50
- Ketentuan Data & WebGIS MAPID WebGIS Competition 2026.pdf — aturan tahap proposal
- NEXT STEP TOP 50 MAPID WebGIS Competition.pdf — panduan onboarding administratif Top 50
- Artifact "Jalur Riset SIGMAPS" — halaman web pembagian tugas riset 3 anggota tim tech,
  versi ringkas (link dibagikan terpisah di chat)
- "Jalur Riset Stack" (jalur-riset-sigmaps.pdf) — versi PDF lebih detail dari pembagian
  tugas riset, memuat penjelasan lengkap arsitektur end-to-end, ranking dua tingkat, strategi
  ETL, dan studi kasus (dikirim terpisah di chat)
- context.md (file ini) — ringkasan seluruh percakapan untuk melanjutkan diskusi di sesi lain
