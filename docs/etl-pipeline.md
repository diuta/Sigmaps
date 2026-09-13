# `etl/` — pipeline batch Jalur 2

## Apa fungsinya

Mengisi tabel Supabase yang dibaca aplikasi. Berjalan offline, dijalankan manual, **tanpa AI
generatif/LLM**. Satu-satunya jembatan antara Python dan Next.js adalah tabel di Supabase —
`app/` dan `lib/` tidak pernah mengimpor apa pun dari sini.

⚠️ **Catatan revisi:** `extract_phone_spanduk.py` (lihat
[etl-extract-phone-spanduk.md](etl-extract-phone-spanduk.md)) memakai PaddleOCR, model deep
learning untuk pengenalan teks — bukan LLM/AI generatif, tapi tetap model ML, bukan kode
deterministik murni seperti skrip lain di sini. Klaim "tanpa AI sama sekali" di paragraf ini
dan di `context/context-mvp.md` §3 ("tahap batch Python sekarang tanpa AI sama sekali")
perlu ditinjau ulang tim mengingat perubahan ini — belum diperbarui di sana.

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
python load_mapid.py       # 4. muat keduanya -> menu_go, properti_go (sumber='propertigo')
python extract_phone_spanduk.py # 4b. OCR foto_spanduk -> properti_go.contact_number
python load_activity.py    # 5. muat Community Activity -> community_activity
python tarik_kai.py        # 6. tarik 546 aset komersial KAI dari space.kai.id
python load_kai.py         # 7. muat yang di dalam isokron -> properti_go (sumber='kai_space')
python hitung_rute.py      # 8. rute jalan kaki properti -> stasiun (OSRM foot) -> rute_properti
python pipeline_scoring.py # 9. hitung D, median harga, pesaing, is_rankable
```

Semua aman diulang. Tiap skrip mengosongkan tabelnya lalu mengisi ulang dalam satu transaksi;
gagal di tengah berarti tidak ada perubahan yang tersimpan. `properti_go` diisi dua skrip
(`load_mapid.py`, `load_kai.py`); masing-masing hanya menghapus baris dengan `sumber`-nya
sendiri, jadi urutan 4 dan 6 bebas dibolak-balik.

Langkah 1, 3, 4, 4b, 5, dan 9 juga bisa dijalankan sebagai **satu perintah**, `python run_pipeline.py`
(berhenti di kegagalan pertama), dan **terjadwal harian lewat GitHub Actions** — lihat
[etl-github-actions.md](etl-github-actions.md). Langkah 2 (`load_isokron.py`) sengaja tidak ikut
karena berkas isokronnya disiapkan manual.

**Dua tabel TIDAK diisi Python:** `stasiun` dan `katalog_restoran` diimpor manual lewat Table
Editor Supabase (Insert → Import data from CSV). Keduanya datang sebagai berkas tabel biasa,
jadi tidak ada gunanya lewat kode.

| Berkas | Tugas |
|---|---|
| `db.py` | Koneksi bersama. Satu-satunya tempat `DATABASE_URL` dibaca |
| `cek_koneksi.py` | Laporan kondisi database. Hanya membaca, tidak pernah menulis |
| `load_isokron.py` | GeoJSON MAPID Isochrone Tool → `scored_areas.geom` + `area_km2` |
| `tarik_mapid.py` | Unduh Menu Go, Properti Go & Activities dari API, simpan mentah ke `etl/data/` |
| `load_mapid.py` | Berkas mentah → tabel `menu_go` dan `properti_go` (`sumber='propertigo'`) |
| `extract_phone_spanduk.py` | OCR `foto_spanduk` (PaddleOCR) → `properti_go.contact_number` |
| `load_activity.py` | `activities.geojson` → tabel `community_activity` (tanpa kolom identitas pengguna — sengaja) |
| `tarik_kai.py` | Unduh daftar aset komersial KAI (`space-api.kai.id`) ke `etl/data/kai_space.json` |
| `load_kai.py` | Aset KAI yang jatuh di dalam isokron → `properti_go` (`sumber='kai_space'`) |
| `hitung_rute.py` | Rute jalan kaki tiap pasangan (properti, stasiun) → `rute_properti`. Lihat [etl-hitung-rute.md](etl-hitung-rute.md) |
| `pipeline_scoring.py` | Isi seluruh kolom komponen di `scored_areas` |
| `run_pipeline.py` | Orkestrator: jalankan 1, 3, 4, 4b, 5, 9 berurutan sebagai satu perintah (dipakai GitHub Actions). Langkah KAI & rute (6–8) belum ikut |

## Dependency / prasyarat

**Env var** (di `.env.local`, lihat `.env.example`):

- `DATABASE_URL` — connection string PostgreSQL Supabase. Ambil di Settings → Database →
  Connection string → URI, pilih **Session pooler**, bukan Direct connection. Direct butuh
  IPv6 yang jarang tersedia di jaringan Indonesia; gejalanya `Network is unreachable` padahal
  kredensialnya benar. Passwordnya password **database**, bukan service role key.
- `MAPID_API_KEY` — hanya untuk `tarik_mapid.py`.

**Berkas sumber** di `etl/data/` (di-gitignore, tidak ikut ter-commit):

- `isokron.geojson` — 43 poligon dari MAPID Isochrone Tool
- `menugo.geojson`, `propertigo.geojson`, `activities.geojson` — dibuat sendiri oleh `tarik_mapid.py`
- `kai_space.json` — dibuat sendiri oleh `tarik_kai.py`

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

**10. `community_activity` sekarang diisi `load_activity.py`** (dari `activities.geojson` yang
ditarik `tarik_mapid.py` dengan rentang tanggal penuh — tanpa `start_date`/`end_date`, API diam-diam
memotong ke jendela terbaru, 96% data hilang). Kolom identitas pengguna (`user_name`,
`user_full_name`, foto) sengaja **tidak** disimpan — jangan ditambahkan. Angka rujukan
`community_activity 0` di bawah berasal dari sebelum skrip ini ada.

**11. Aset KAI Space (`load_kai.py`) — cara kerja & batasannya.**

- Sumber: `GET https://space-api.kai.id/api/v1/komersialasetram`, header
  `Authorization: Bearer space.kai.id`. Token itu **bukan rahasia** — nilai statis yang
  dibundel di `space.kai.id/assets/assets/config/config_prod.json` situs publiknya sendiri,
  jadi tidak masuk `.env`. Tidak perlu login, tidak ada paginasi (546 aset sekali tarik).
- "Dekat stasiun" = **`ST_Within` ke `scored_areas`**, definisi yang sama dengan view
  `properti_go_by_station`. Jadi `load_isokron.py` wajib sudah jalan; kalau isokron berubah,
  jalankan `load_kai.py` lagi. Aset di luar isokron (mayoritas: Semarang, Cirebon, LRT
  Jabodebek, dll) **tidak** dimuat.
- Pemetaan ke kolom `properti_go` — kolom yang tidak ada padanannya dibiarkan null:
  `kategori_properti` = "Kios Stasiun" / "Lahan Stasiun"; `jenis_properti` = "Disewa" atau
  "Sudah Tersewa" (dari `rented`); `alamat` = `namablok - namalokasi, kabupatenkota`;
  `foto_tampak_depan` = `https://space-api.kai.id/proxy?guid=<fotos[0]>` (URL publik,
  dites bisa diakses tanpa header); `foto_spanduk` = null.
- Aset yang **sudah tersewa tetap dimuat** (ada outlet CFC, HokBen, Indomaret, dll di
  Manggarai/Pasar Senen) supaya titiknya terlihat di peta. Filter "sewa" di `PropertyLayer`
  mencocokkan substring, jadi keduanya ikut. Kalau produk memutuskan hanya yang tersedia,
  cukup tambah `if a.get("rented"): return False` di `layak()`.
- Yang dilewati: iklan/sticker/ATM/vending/loket (bukan ruang usaha, lihat `BUKAN_RUANG`).
- KAI juga punya `luastanah`, `luasbangunan`, `nilaikomersial` (harga sewa). **Sengaja tidak
  dimuat** — `types/property/index.ts` dan `context/context-mvp.md` Langkah 4 melarang
  kolom luas/harga/kontak di `properti_go`. Kalau mau dipakai, itu keputusan produk dulu.
- Titik-titik kios di satu stasiun berjarak beberapa meter saja (semua di dalam bangunan
  stasiun), jadi marker bertumpuk; `resolveOverlaps` di `PropertyLayer` yang merenggangkannya.

## Angka rujukan per 6 September 2026

Dipakai untuk memastikan hasil pemuatan benar:

```
stasiun            43     manual
scored_areas       43     0,493-1,580 km2, median 1,059
katalog_restoran   6.392  5 kota, 24 kategori, manual
menu_go            176    79 di dalam isokron, tersebar di 19 kawasan
properti_go        191    26 di dalam isokron, hanya 9 kawasan (sumber='propertigo')
                   +39    semuanya di dalam isokron, 16 kawasan, Manggarai terbanyak (8)
                          (sumber='kai_space', per 12 September 2026)
community_activity 0      milik Jalur 1
rute_properti      66     = jumlah pasangan di properti_go_by_station; median 241 m, maks 1.829 m

is_rankable        11 dari 43
demand             0,333 - 0,545
total_restaurants  4 - 57 per kawasan, median 12
```
