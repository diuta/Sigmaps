# GitHub Actions — pipeline batch `etl/` terjadwal (tanpa laptop)

Menjalankan `etl/run_pipeline.py` di runner GitHub setiap hari 03:00 WIB dan/atau manual dari tab
**Actions** — supaya data tersegarkan **tanpa bergantung laptop siapa pun menyala**. Ini versi
"selalu jalan" dari otomasi n8n lokal ([etl-n8n-automation.md](etl-n8n-automation.md)); keduanya
menjalankan skrip yang persis sama, tidak ada logika yang dobel.

Sesuai keputusan di `context/context-final.md` (tabel deployment): batch Python =
*"Lokal / GitHub Actions (`schedule:` + `workflow_dispatch`), tidak di-deploy sebagai service
selalu-hidup"*.

## Apa isinya

Satu berkas: `.github/workflows/etl-pipeline.yml`.

| Bagian | Isi |
|---|---|
| `on.schedule` | `0 20 * * *` UTC = **03:00 WIB** tiap hari (cron GitHub selalu UTC) |
| `on.workflow_dispatch` | Tombol **Run workflow** di tab Actions |
| `concurrency` | Grup `etl-pipeline`, tidak saling batalkan — run kedua **menunggu**, tidak pernah dua pipeline menulis tabel yang sama bersamaan |
| `timeout-minutes: 15` | Normal ~1 menit; ini cuma pengaman kalau API MAPID/Supabase menggantung |
| Step *Pastikan secret terisi* | Gagal cepat dengan pesan jelas kalau secret belum diset, bukan traceback psycopg2 |
| Step *Jalankan pipeline* | `python etl/run_pipeline.py` — `cek_koneksi` → `tarik_mapid` → `load_mapid` → `load_activity` → `pipeline_scoring` |
| Step *artifact* | `menugo.geojson` + `propertigo.geojson` hasil `tarik_mapid.py`, disimpan 7 hari, juga saat run gagal — untuk memeriksa apa yang API kembalikan pada run itu |

## Cara pakai

**Sekali di awal (butuh akses admin repo):**

1. Repo → **Settings → Secrets and variables → Actions → New repository secret**, buat dua:
   - `DATABASE_URL` — connection string **Session pooler** Supabase (sama persis dengan yang di
     `.env` lokal; lihat `.env.example`).
   - `MAPID_API_KEY` — key MAPID Competition API.
2. Merge berkas workflow ke **`main`**. Jadwal (`schedule`) hanya berjalan dari default branch —
   selama berkasnya cuma ada di `dev/sprint-2`, jadwal tidak akan pernah fire (tombol manual tetap
   bisa dipakai dari branch itu).

**Jalankan manual:** tab **Actions → ETL Pipeline → Run workflow** (pilih branch) → **Run workflow**.
Log tiap tahap terlihat langsung di step *Jalankan pipeline*.

**Lihat hasil jadwal harian:** tab Actions, filter workflow *ETL Pipeline*. Run gagal = merah, dan
GitHub mengirim email ke pemilik repo (default notifikasi Actions).

## Dependency/prasyarat

- Secret `DATABASE_URL` dan `MAPID_API_KEY` di repo (di atas). Tidak ada `.env` di runner —
  `etl/db.py` memanggil `load_dotenv()` yang tidak apa-apa kalau berkasnya tidak ada, lalu
  `os.getenv` membaca env yang diset workflow.
- `DATABASE_URL` **wajib Session pooler** (IPv4). Runner GitHub-hosted **tidak punya IPv6**, jadi
  *Direct connection* Supabase pasti gagal `Network is unreachable` — sama seperti di jaringan
  lokal Indonesia.
- Tabel `stasiun`, `katalog_restoran`, dan kerangka `scored_areas` sudah terisi (manual /
  `load_isokron.py`) — sama seperti prasyarat pipeline lokal, lihat [etl-pipeline.md](etl-pipeline.md).
- Runner `ubuntu-latest` + Python 3.12 dari `actions/setup-python`; `psycopg2-binary` tersedia
  sebagai wheel, tidak perlu compiler.

## Batasan/gotcha

- **Jadwal hanya dari `main`.** Ini aturan GitHub, bukan pilihan. Kalau kamu mengubah cron di
  branch fitur, perubahan baru berlaku setelah di-merge.
- **Cron GitHub tidak presisi.** Saat beban tinggi, run terjadwal bisa telat beberapa menit sampai
  (jarang) lebih dari satu jam. Kalau butuh waktu pasti, itu bukan GitHub Actions.
- **GitHub mematikan jadwal otomatis setelah 60 hari tanpa commit** di repo. Tab Actions akan
  menampilkan banner "This scheduled workflow is disabled" dengan tombol untuk menyalakan lagi.
  Untuk repo yang sudah tidak aktif dikembangkan, ini berarti data berhenti disegarkan
  diam-diam — cek tab Actions sesekali.
- **`activities.geojson` sengaja tidak masuk artifact.** Berkas mentahnya memuat `user_name`,
  `user_full_name`, foto profil dari API — kolom yang `load_activity.py` sengaja buang (lihat
  catatan PRIVASI di kepala berkas itu). Artifact bisa diunduh siapa pun dengan akses baca repo.
- **Secret otomatis disamarkan di log** (`***`), tapi jangan pernah `echo $DATABASE_URL` di step —
  penyamaran GitHub cocok per-string persis, potongan URL (mis. hanya passwordnya) tetap bisa
  bocor kalau dicetak terpisah.
- **Berbagi tabel dengan n8n lokal.** Kalau n8n lokal ([etl-n8n-automation.md](etl-n8n-automation.md))
  juga aktif dengan jadwal 03:00 WIB, dua pipeline bisa menulis tabel yang sama hampir bersamaan.
  `concurrency` di workflow ini hanya mencegah tumpang-tindih **antar-run GitHub**, bukan dengan
  proses di luar GitHub. Pilih satu sebagai jadwal harian; pakai yang lain hanya manual.
- **`load_isokron.py` tetap tidak ikut** (sama seperti `run_pipeline.py` lokal) — berkas isokron
  disiapkan manual, dan tidak ada di runner sama sekali (`etl/data/` di-gitignore).

## Status verifikasi (12 September 2026)

Workflow ini **belum pernah dijalankan di GitHub** (berkasnya belum di-push). Yang sudah
diverifikasi lokal, meniru kondisi runner sedekat mungkin — kontainer `python:3.12` (Debian/glibc,
seperti `ubuntu-latest`) bersih, `pip install -r etl/requirements.txt` dari nol, **tanpa berkas
`.env`** (hanya env var, persis seperti secret di Actions):

- Pipeline penuh sukses, 48 detik, hasil identik dengan run lokal (11 dari 43 `is_rankable`,
  D 0,333–0,545).
- Step *Pastikan secret terisi* menghasilkan anotasi `::error::` yang benar saat secret kosong.

Yang **belum** bisa diverifikasi tanpa push: jalur jaringan runner GitHub → Supabase pooler dan
→ API MAPID (rate limit MAPID dari IP GitHub tidak diketahui). Setelah merge ke `main` + secret
diset, jalankan sekali manual dan pastikan step *Jalankan pipeline* berakhir di
`Semua 5 tahap selesai`.
