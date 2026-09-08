# `etl/` — pipeline batch Jalur 2

## Apa fungsinya

Mengisi tabel Supabase yang dibaca aplikasi. Berjalan offline, dijalankan manual, **tanpa AI
sama sekali**. Satu-satunya jembatan antara Python dan Next.js adalah tabel di Supabase —
`app/` dan `lib/` tidak pernah mengimpor apa pun dari sini.

Yang dihitung di sini hanya **D** dan bahan mentah untuk C dan S. Skor akhir, C, dan S
dihitung `lib/scoring.ts` saat request.

## Cara pakai

Sekali di awal:

```bash
cd etl && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
```

Lalu, berurutan:

```bash
python cek_koneksi.py      # 1. pastikan tersambung & lihat kondisi tabel
python load_isokron.py     # 2. 43 poligon  -> scored_areas
python tarik_mapid.py      # 3. tarik Menu Go + Properti Go dari API, simpan ke etl/data/
python load_mapid.py       # 4. muat keduanya -> menu_go, properti_go
python pipeline_scoring.py # 5. hitung D, median harga, pesaing, is_rankable
```

Semua aman diulang. Tiap skrip mengosongkan tabelnya lalu mengisi ulang dalam satu transaksi;
gagal di tengah berarti tidak ada perubahan yang tersimpan.

**Dua tabel TIDAK diisi Python:** `stasiun` dan `katalog_restoran` diimpor manual lewat Table
Editor Supabase (Insert → Import data from CSV). Keduanya datang sebagai berkas tabel biasa,
jadi tidak ada gunanya lewat kode.

| Berkas | Tugas |
|---|---|
| `db.py` | Koneksi bersama. Satu-satunya tempat `DATABASE_URL` dibaca |
| `cek_koneksi.py` | Laporan kondisi database. Hanya membaca, tidak pernah menulis |
| `load_isokron.py` | GeoJSON MAPID Isochrone Tool → `scored_areas.geom` + `area_km2` |
| `tarik_mapid.py` | Unduh Menu Go & Properti Go dari API, simpan mentah ke `etl/data/` |
| `load_mapid.py` | Berkas mentah → tabel `menu_go` dan `properti_go` |
| `pipeline_scoring.py` | Isi seluruh kolom komponen di `scored_areas` |

## Dependency / prasyarat

**Env var** (di `.env.local`, lihat `.env.example`):

- `DATABASE_URL` — connection string PostgreSQL Supabase. Ambil di Settings → Database →
  Connection string → URI, pilih **Session pooler**, bukan Direct connection. Direct butuh
  IPv6 yang jarang tersedia di jaringan Indonesia; gejalanya `Network is unreachable` padahal
  kredensialnya benar. Passwordnya password **database**, bukan service role key.
- `MAPID_API_KEY` — hanya untuk `tarik_mapid.py`.

**Berkas sumber** di `etl/data/` (di-gitignore, tidak ikut ter-commit):

- `isokron.geojson` — 43 poligon dari MAPID Isochrone Tool
- `menugo.geojson`, `propertigo.geojson` — dibuat sendiri oleh `tarik_mapid.py`

**Urutan wajib:** `stasiun` harus terisi sebelum `load_isokron.py` (ada foreign key), dan
`menu_go` + `katalog_restoran` harus terisi sebelum `pipeline_scoring.py`.

Sengaja **tanpa geopandas/shapely** — seluruh operasi spasial dikerjakan PostGIS di sisi
database. Lebih cepat, dan menghapus satu kelas ketidakcocokan versi yang terkenal merepotkan.

## Batasan / gotcha

**1. `load_stasiun` tidak ada.** Tabel `stasiun` diisi manual. `load_isokron.py` akan berhenti
dengan pesan jelas kalau tabelnya masih kosong.

**2. `load_isokron.py` menolak isokron yang salah.** Hanya menerima
`isochrone_profile = "foot"` dan `time_limit = 600`. Isokron berkendara luasnya bisa 20–30×
lipat, dan `area_km2` adalah penyebut rumus C — memuat berkas yang salah membuat seluruh
peringkat salah **tanpa satu pun pesan galat**. Penolakan ini disengaja.

**3. `kondisi_tempat` dari API berupa kalimat panjang.** Nilainya
`'Sedang (Ada 1-3 pembeli yang sedang menunggu/makan)'`, sementara constraint `kondisi_sah`
di tabel hanya menerima `Sepi`/`Sedang`/`Ramai`. `load_mapid.py` memotong ke kata pertamanya.
Tanpa itu seluruh insert ditolak database.

**4. Harga dibersihkan di loader, bukan di pipeline.** `harga_asli` disimpan apa adanya untuk
audit; `harga_bersih` hasil koreksi. Aturannya: di bawah 1.000 dikali 1.000 (surveyor menulis
dalam ribuan — ditemukan 5, 17, 20, 40), lalu di luar 2.000–150.000 jadi `null` (ditemukan
180.000 untuk sebuah warung). **Yang dibuang hanya harganya** — pengamatannya tetap dihitung
untuk D, karena surveyor tetap melihat tempatnya ramai atau sepi.

**5. Kedua API tidak mengembalikan `id`.** Dibangkitkan di loader: `MG-n` dan `PG-n`,
mengikuti pola `RS-n` di `katalog_restoran`. Urutannya dikunci ke koordinat + nama, bukan
urutan balasan API, supaya menjalankan ulang menghasilkan id yang sama.

**6. Titik pada dua isokron bertumpuk dihitung di keduanya.** Disengaja — kawasan berdekatan
memang berbagi pasar (`context-mvp.md` 6.9). Lima pasang stasiun berjarak di bawah 900 m,
sepasang bahkan 262 m.

**7. `pipeline_scoring.py` tidak menghitung C, S, maupun skor akhir.** Ketiganya butuh input
pengguna. Kalau kamu tergoda menambahkannya di sini, itu tanda salah paham arsitektur — baca
`docs/lib-scoring.md`.

**8. Ambang `is_rankable` (3 dan 3) ada di dua tempat**: konstanta di `pipeline_scoring.py`
dan `context-mvp.md` 6.9. Kalau diubah, ubah keduanya. Per 6 September 2026 ambang ini
meloloskan **11 dari 43 kawasan** — 74% peta berlabel "data belum cukup".

**9. `tarik_mapid.py` memakai kotak pembatas DKI**, bukan gabungan isokron. Disengaja: data
tetap utuh kalau daftar stasiun berubah, dan pemeriksaan "berapa yang jatuh di luar semua
kawasan" tetap bisa dijawab. API MAPID mewajibkan poligon wilayah; tidak ada opsi "kirim
semua".

**10. `community_activity` bukan tugas Jalur 2.** Tabelnya ada tapi kosong. Cara menariknya
sama persis dengan Menu Go — `tarik_mapid.py` bisa dijadikan contoh oleh Jalur 1.

## Angka rujukan per 6 September 2026

Dipakai untuk memastikan hasil pemuatan benar:

```
stasiun            43     manual
scored_areas       43     0,493-1,580 km2, median 1,059
katalog_restoran   6.392  5 kota, 24 kategori, manual
menu_go            176    79 di dalam isokron, tersebar di 19 kawasan
properti_go        191    26 di dalam isokron, hanya 9 kawasan
community_activity 0      milik Jalur 1

is_rankable        11 dari 43
demand             0,333 - 0,545
total_restaurants  4 - 57 per kawasan, median 12
```
