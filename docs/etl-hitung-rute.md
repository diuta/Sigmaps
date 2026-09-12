# `etl/hitung_rute.py` — rute jalan kaki properti → stasiun

## Apa fungsinya

Menghitung rute jalan kaki nyata (mengikuti jaringan jalan, bukan garis lurus) dari tiap
properti ke stasiun yang isokronnya memuat properti itu, lalu menyimpan **jarak (m), waktu
(detik), dan geometri LineString** ke tabel `rute_properti`. Hasilnya dibaca web lewat kolom
`jarak_jalan_m`, `waktu_jalan_s`, `rute` di view `properti_go_by_station` → `/api/properties`
→ digambar `RouteLayer` dan ditulis di property card ("≈ 890 m · 12 mnt jalan kaki").

Ini yang menjawab pertanyaan "properti ini keluar jalur tidak?": ruko di Jalan Pintu Kecil
garis lurusnya ~600 m dari Stasiun Jakarta Kota, tapi rute jalan kakinya 888 m karena harus
memutar lewat Museum Bank Indonesia.

> ⚠️ **Status keputusan produk.** `context/context-mvp.md` tabel keputusan #10 menyatakan
> "property card menampilkan jarak jalan kaki — tidak ditampilkan, tidak ada sumber angkanya
> di MVP". Alasan penolakannya (tidak ada sumber) sekarang terjawab oleh skrip ini, dan PRD
> Gambar 10.3 memang merancang "Modul Routing". Tapi keputusan tertulisnya belum dicabut —
> **angkat di sesi sinkronisasi** sebelum dianggap final (CLAUDE.md §9).

## Cara pakai

```bash
cd etl && source .venv/bin/activate
python hitung_rute.py          # hanya pasangan yang belum punya rute (idempoten)
python hitung_rute.py --ulang  # hitung ulang semua, mis. setelah isokron/stasiun berubah
```

Keluaran:

```
rute yatim dihapus : 0
pasangan dihitung  : 66 (yang belum ada)
  [1/66] R-10 KAI-7515...: 345 m, 4 mnt
  ...
rute_properti : 66 baris (berhasil 66, gagal 0)
jarak m       : min 0 | median 241 | maks 1829
```

Jalankan **setelah** `load_mapid.py` / `load_kai.py` (pasangannya berasal dari view yang
bergantung pada `properti_go` dan `scored_areas`). Kalau salah satu loader dijalankan lagi,
jalankan `hitung_rute.py` lagi — dia menghapus rute yang pasangannya sudah hilang dan
menghitung yang baru saja.

## Dependency / prasyarat

- **SQL**: tabel `rute_properti` + view `properti_go_by_station` versi baru di
  `supabase/views.sql` harus sudah dijalankan.
- **Engine**: OSRM publik FOSSGIS profil pejalan kaki
  (`https://routing.openstreetmap.de/routed-foot/`) — server yang sama di balik "Directions"
  openstreetmap.org. Gratis, **tanpa API key**, tidak ada env var baru. Kecepatan yang
  dipakainya ~4,5 km/jam, dekat dengan acuan 4,4 km/jam di PRD.
- **`pyopenssl`** (sudah di `requirements.txt`) — lihat gotcha #1.
- Tidak butuh `MAPID_API_KEY`. MAPID Routing Tool dikonfirmasi tidak punya mode batch
  (`context/context-final.md` §3, baris kalibrasi detour).

## Batasan / gotcha

1. **`SSLV3_ALERT_HANDSHAKE_FAILURE` padahal `curl` bisa.** Python bawaan macOS (3.9) memakai
   LibreSSL 2.8.3 yang tidak bisa TLS-handshake ke server routing modern. Skrip mendeteksi
   `LibreSSL` di `ssl.OPENSSL_VERSION` dan menyuntikkan pyOpenSSL ke urllib3. Kalau kamu
   pakai Python dari Homebrew/pyenv (OpenSSL), blok itu tidak berjalan dan tidak mengganggu.
2. **Pemakaian ringan saja.** Server FOSSGIS gratis dan tanpa kuota resmi, tapi bukan untuk
   beban berat: skrip memberi jeda 0,3 s antar-request, mengirim `User-Agent` yang jelas,
   dan hanya menghitung pasangan yang belum ada. 66 pasangan ≈ 30 detik. Jangan dipanggil
   dari `route.ts`.
3. **Titik tujuan = titik stasiun di tabel `stasiun`**, bukan pintu masuk. Untuk kios di
   dalam bangunan stasiun hasilnya 0–50 m (UI menulis "< 50 m · di lokasi stasiun"), atau
   justru memutar mengikuti pagar/peron di OSM (Manggarai: 133 m garis lurus → 345 m rute).
   Keduanya jujur terhadap peta OSM, bukan galat. Kalau nanti ada data pintu stasiun, ganti
   sumber koordinat di query `pasangan` saja.
4. **Satu properti bisa punya dua rute** kalau masuk dua isokron (Kampung Bandan Atas/Bawah):
   primary key-nya `(station_id, property_id)`, dan view mengembalikan rute yang sesuai
   stasiun yang sedang dipilih.
5. **Tanpa foreign key ke `properti_go`** — sengaja. Loader mengosongkan-mengisi ulang
   `properti_go` per `sumber`; FK `on delete cascade` akan ikut membuang rute yang masih
   valid. Sebagai gantinya skrip ini membersihkan baris yatim di awal.
6. **Kolom `rute` NULL bukan galat.** Web dirancang menampilkan properti tanpa jarak kalau
   rutenya belum ada; `RouteLayer` tidak menggambar apa-apa. Jadi pipeline tetap jalan walau
   langkah ini dilewati.
