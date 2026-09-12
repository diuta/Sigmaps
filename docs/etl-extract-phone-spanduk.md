# etl/extract_phone_spanduk.py

## Apa fungsinya

Mengisi kolom `properti_go.contact_number` dengan nomor WhatsApp yang dibaca lewat OCR
(PaddleOCR) dari foto `foto_spanduk`, tanpa AI generatif/LLM. Bagian dari
`etl/run_pipeline.py`, jalan setelah `load_mapid.py`.

## Cara pakai

```bash
cd etl && source .venv/bin/activate
pip install -r requirements.txt   # paddleocr, paddlepaddle, phonenumbers, opencv-python-headless
python extract_phone_spanduk.py
```

Atau otomatis lewat pipeline penuh: `python run_pipeline.py`.

Input: baris `properti_go` yang `foto_spanduk is not null`.
Output: `update properti_go set contact_number = ...` untuk baris yang nomornya
lolos ambang kepercayaan; sisanya dibiarkan `null`.

## Dependency/prasyarat

- `DATABASE_URL` (koneksi langsung, sama seperti skrip `etl/` lainnya).
- `properti_go.contact_number` — kolom nullable, ditambahkan lewat
  `alter table properti_go add column if not exists contact_number text;`
  (lihat `supabase/views.sql`, dijalankan manual di SQL Editor **sebelum** skrip ini
  pertama kali jalan).
- `properti_go_spanduk_ocr` — tabel cache OCR, dibuat lewat `create table` di
  `supabase/views.sql` bersamaan dengan kolom di atas. **Sengaja tanpa foreign key**
  ke `properti_go(id)` — lihat gotcha di bawah.
- Baris `load_mapid.py` di `properti_go` (butuh `foto_spanduk` terisi).
- Model PaddleOCR (~ratusan MB) diunduh otomatis saat pertama kali `PaddleOCR()`
  dipanggil, disimpan di `~/.paddlex/official_models/`. Butuh koneksi internet di
  mesin yang menjalankan pipeline (termasuk di n8n/Docker — lihat gotcha di bawah).

## Batasan/gotcha

- **`contact_number` ikut terhapus tiap kali `load_mapid.py` jalan**, tapi skrip ini
  menulisnya ulang dari cache di `properti_go_spanduk_ocr` — tabel terpisah yang
  TIDAK ikut ter-delete karena bukan `properti_go`. Cache di-kunci per
  `properti_go_id` + URL `foto_spanduk` saat ini: URL sama dengan yang tersimpan di
  cache berarti foto belum berubah, jadi nomor ditulis ulang langsung dari cache
  **tanpa** download atau OCR ulang; URL beda (atau belum pernah diproses) baru
  memicu download + OCR. Ini mengandalkan nama file MAPID CDN yang memuat timestamp
  upload (contoh: `..._1787642691406_stamped_1787642690096.jpg`) — asumsi "URL beda
  = foto beda" wajar untuk sumber ini, tapi bukan jaminan berlaku di CDN lain.
- **Tabel cache sengaja tanpa foreign key ke `properti_go(id)`.** `load_mapid.py`
  men-delete+insert ulang seluruh `properti_go` tiap run; FK ke sana akan membuat
  delete itu gagal (FK restrict) atau cache ikut terhapus (FK cascade) — dua-duanya
  merusak tujuan tabel ini. Konsekuensinya: integritas id murni konvensi (string
  yang sama), database tidak menjaminnya — kalau urutan sumber data di
  `tarik_mapid.py`/`load_mapid.py` berubah sehingga id `PG-{i}` bergeser, cache lama
  jadi menempel ke properti yang salah sampai baris itu ter-OCR ulang secara wajar
  (URL foto beda dari yang tersimpan) atau cache dibersihkan manual.
- **Commit per baris**, bukan satu transaksi besar di akhir — kalau skrip terhenti
  di tengah, baris yang sudah diproses (baik dari cache maupun OCR baru) sudah
  tersimpan permanen. Menjalankan ulang skrip cukup melanjutkan sisanya.
- **Ambang kepercayaan default 0.90** (`AMBANG_KEPERCAYAAN` di puncak skrip). Nomor
  di bawah ambang ini, atau yang teksnya tidak cocok pola nomor Indonesia yang valid
  (divalidasi lewat `phonenumbers`, bukan regex saja), **tidak ditulis** — kolom
  dibiarkan `null`. Ini sengaja bias ke presisi: satu digit salah baca menghasilkan
  nomor yang salah tapi kelihatan valid, dan nomor ini dipakai orang asing
  menghubungi pemilik lewat WhatsApp langsung. Kalau ternyata terlalu banyak nomor
  sah malah tertolak, turunkan ke ~0.85 — jangan turunkan tanpa mengecek dulu sampel
  hasil yang tertolak.
- **PaddleOCR 3.x, bukan 2.x** — API `.ocr(img, cls=True)` / `use_angle_cls` dari
  dokumentasi/tutorial lama sudah tidak berlaku. Skrip ini pakai `.predict(img)` dan
  membaca `rec_texts`/`rec_scores` dari hasilnya — dicek langsung terhadap versi
  3.7.0 yang terpasang, bukan diasumsikan dari memori/dokumentasi versi lain.
- **Bukan OCR dokumen berkas rapi** — `foto_spanduk` adalah foto lapangan (kadang ada
  overlay tanggal/koordinat/watermark dari app survei MAPID). Regex nomor dibatasi
  panjang digit (`{8,11}` setelah prefiks `0`/`62`) dan divalidasi `phonenumbers`
  supaya string acak seperti timestamp/koordinat tidak lolos jadi "nomor".
- **Bertentangan dengan `context/context-final.md` baris ~107** ("Properti Go ...
  Tidak ada OCR") dan `context/context-mvp.md` §2 Langkah 4 ("dilarang menampilkan
  ... kontak pemilik"). Fitur ini dibuat atas arahan eksplisit di sesi kerja, tapi
  kedua dokumen itu (sumber kebenaran produk/arsitektur per `CLAUDE.md`) **belum
  diperbarui** untuk mencerminkan keputusan ini — perlu ditindaklanjuti supaya
  dokumentasi tidak menyesatkan kontributor lain. `lib/property/index.ts` juga masih
  punya komentar lama yang menyebut kontak pemilik sengaja tidak ada.
- Endpoint/`lib/property` **belum** diubah untuk mengekspos `contact_number` ke
  frontend — skrip ini baru mengisi kolomnya di database.
