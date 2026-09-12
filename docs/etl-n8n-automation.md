# n8n automation — pipeline batch `etl/`

Menjalankan `etl/run_pipeline.py` (lima skrip `etl/` berurutan) di dalam Docker lewat n8n,
terjadwal atau manual, alih-alih dijalankan tangan lewat terminal tiap kali data perlu
disegarkan. Hanya untuk **lokal** (satu mesin developer) — bukan deployment publik.

> Jadwalnya hanya fire selama Docker & laptop menyala; run yang terlewat **tidak** dikejar. Untuk
> jadwal yang benar-benar tanpa pengawasan pakai [etl-github-actions.md](etl-github-actions.md)
> (skrip yang sama, dijalankan runner GitHub). Jangan aktifkan jadwal harian di **keduanya**
> sekaligus — keduanya menulis tabel yang sama.

## Apa isinya

| Berkas | Tugas |
|---|---|
| `etl/run_pipeline.py` | Orkestrator: `cek_koneksi.py` → `tarik_mapid.py` → `load_mapid.py` → `load_activity.py` → `pipeline_scoring.py`, berhenti di kegagalan pertama. Bisa dipakai tanpa Docker/n8n: `cd etl && source .venv/bin/activate && python run_pipeline.py` |
| `n8n/Dockerfile` | Image n8n resmi **2.38.7** (dipin) + interpreter Python 3.12 lengkap di `/opt/python` (dependency `etl/requirements.txt` sudah terpasang) + `etl/` dibekukan ke `/app/etl` |
| `docker-compose.yml` (root) | Satu service `n8n`, port `5678`, env dari `.env`, volume `etl/data/` dan `n8n/workflows/` |
| `.dockerignore` (root) | Menyaring konteks build: hanya `etl/` yang dikirim, tanpa `data/`, `.venv`, dupe `* 2.py`, GeoJSON lama |
| `n8n/workflows/etl-pipeline.json` | Workflow siap-impor, id tetap `sigmaps-etl-pipeline` (lihat diagram di bawah) |

Alur workflow:

```
Manual Trigger ─┐
                ├─► Run ETL Pipeline ──(Success)──► Pipeline OK
Daily at 03:00 ─┘   (Execute Command)
                          └────────────(Error)────► Pipeline FAILED ──► Tandai eksekusi gagal
                                                                         (Stop and Error)
```

- **Run ETL Pipeline** = node Execute Command, perintah
  `/opt/python/bin/python3 /app/etl/run_pipeline.py`, setting *On Error → Continue (using
  error output)*. Exit code 0 → output Success membawa `{exitCode, stdout, stderr}`. Exit code
  ≠ 0 → output Error membawa **hanya** `{error: <stderr>}` (tidak ada `exitCode`/`stdout` di
  cabang ini — node-nya melempar error, bukan mengembalikan data).
- **Pipeline OK / Pipeline FAILED** = NoOp, placeholder untuk notifikasi (Slack/email/dll).
  Tidak ada kredensial notifikasi yang diasumsikan.
- **Tandai eksekusi gagal** = Stop and Error dengan pesan `{{ $json.error }}`. Tanpa ini,
  eksekusi yang pipelinenya gagal tetap tercatat **hijau/success** di n8n (cabang Error dianggap
  "sudah ditangani") — menyesatkan untuk job tanpa pengawasan. Dengan ini tercatat merah/error,
  pesannya = stderr Python (termasuk baris `GAGAL di tahap '...'`), dan Error Workflow global
  n8n bisa menangkapnya.

## Cara pakai

```bash
# 1. Pastikan .env (root repo) berisi DATABASE_URL dan MAPID_API_KEY — lihat .env.example
# 2. Build & jalankan
docker compose build n8n
docker compose up -d n8n

# 3. Impor workflow — lewat CLI (tanpa buka UI):
docker compose exec n8n n8n import:workflow --input=/app/n8n/workflows/etl-pipeline.json
#    ...atau lewat UI: http://localhost:5678 → menu "..." → Import from File.
#    CLI import meng-upsert berdasarkan `id` di JSON, jadi aman diulang setelah JSON diubah.

# 4. Aktifkan jadwal harian: buka http://localhost:5678, buka workflow "SIGMAPS - ETL Pipeline",
#    toggle "Active". Pertama kali buka UI, n8n minta bikin akun owner (lokal, di volume n8n_data).
```

Jalankan **sekali sekarang** lewat n8n tanpa UI (eksekusinya tercatat di riwayat, terlihat di UI):

```bash
docker compose exec n8n sh -c 'N8N_RUNNERS_BROKER_PORT=5680 n8n execute --id sigmaps-etl-pipeline'
```

`N8N_RUNNERS_BROKER_PORT=5680` wajib: `n8n execute` menyalakan task broker sendiri di port
5679 yang sudah dipakai server n8n yang sedang jalan di kontainer yang sama — tanpa override
port, perintahnya langsung berhenti dengan "port 5679 is already in use".

Jalankan skrip Python langsung, tanpa n8n sama sekali (debug cepat):

```bash
docker compose exec n8n python3 /app/etl/cek_koneksi.py     # hanya baca, aman
docker compose exec n8n python3 /app/etl/run_pipeline.py    # pipeline penuh
```

Pakai `exec` (kontainer yang sudah jalan), **bukan** `docker compose run --rm n8n python3 ...`:
entrypoint image n8n adalah `exec n8n "$@"`, jadi argumen apa pun diteruskan ke biner `n8n`,
bukan dijalankan sebagai perintah. Kalau memang butuh kontainer terpisah, override entrypoint:
`docker compose run --rm --entrypoint python3 n8n /app/etl/run_pipeline.py`.

## Dependency/prasyarat

- **Docker Desktop** (atau daemon Docker lain) menyala. Build pertama menarik `n8nio/n8n:2.38.7`
  (~1 GB) dan `python:3.12-alpine`.
- **`.env` di root repo** (bukan `.env.local` — `docker-compose.yml` `env_file` menunjuk `.env`),
  berisi minimal:
  - `DATABASE_URL` — connection string **Session pooler** Supabase
    (`postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres`),
    passwordnya password **database**, bukan service role key.
  - `MAPID_API_KEY` — untuk `tarik_mapid.py`.
  Variabel lain di `.env` ikut termuat ke kontainer tapi tidak dipakai skrip ini.
- Tabel `stasiun`, `katalog_restoran`, dan kerangka `scored_areas` (dari `load_isokron.py`) harus
  **sudah** terisi sebelum pipeline pertama kali dijalankan — tidak ada skrip di sini yang
  mengisinya, `cek_koneksi.py` (tahap pertama) akan melapor kalau belum. Lihat
  [etl-pipeline.md](etl-pipeline.md).
- `etl/data/isokron.geojson` — **tidak** ditangani otomasi ini. Berkas ini datang dari MAPID
  Isochrone Tool secara manual, dan `load_isokron.py` sengaja **tidak** dimasukkan ke
  `run_pipeline.py` (lihat komentar di kepala berkas itu). Taruh berkasnya di `etl/data/` (volume,
  tidak perlu build ulang) lalu jalankan manual saat isokron berubah:
  `docker compose exec n8n python3 /app/etl/load_isokron.py`.

## Batasan/gotcha

- **n8n ≥ 2.0 mematikan node Execute Command secara default** (`NODES_EXCLUDE` bawaan berisi
  `n8n-nodes-base.executeCommand`). `docker-compose.yml` menyalakannya lagi dengan
  `NODES_EXCLUDE=[]`. Kalau baris itu hilang, workflow tidak bisa dijalankan ("Unrecognized node
  type"). Konsekuensinya: siapa pun yang bisa login ke n8n ini bisa menjalankan perintah shell
  di kontainer — wajar untuk instance lokal satu orang, **tidak** untuk instance bersama/publik.
- **Versi n8n dipin ke 2.38.7** di `n8n/Dockerfile`, bukan `:latest` — 2.x mengubah default yang
  memengaruhi setup ini. Naikkan versi dengan sengaja, lalu tes ulang dengan `n8n execute` di atas.
  Ditarik dari Docker Hub (`n8nio/n8n`), bukan `docker.n8n.io`: yang terakhir cuma proxy ke Docker
  Hub dan sering kena `429 Too Many Requests` karena batas tarik anonim dihitung per IP proxy itu.
- **`etl/` di-`COPY` ke image saat build, bukan di-mount** — kalau kamu mengubah skrip `etl/*.py`,
  jalankan `docker compose build n8n && docker compose up -d n8n` sebelum menjalankan workflow
  lagi, atau workflow memakai versi lama yang beku di image. `etl/data/` dan `n8n/workflows/`
  **di-mount**, jadi perubahan di sana langsung terlihat (workflow tetap perlu di-import ulang).
- **Konteks build adalah root repo** (`context: .`), jadi hanya `.dockerignore` di **root** yang
  dibaca Docker — `.dockerignore` di dalam `etl/` tidak pernah berlaku. Root `.dockerignore`
  memakai pola "buang semua, izinkan `etl/` saja" supaya `node_modules`, `.next`, `.git`, `.env`
  tidak ikut dikirim ke daemon tiap build. Kalau nanti Dockerfile perlu `COPY` folder lain,
  tambahkan `!<folder>` di sana.
- **`n8n import:workflow` menolak JSON tanpa `id`** (`NOT NULL constraint failed:
  workflow_entity.id`). `etl-pipeline.json` sudah punya `"id": "sigmaps-etl-pipeline"` — jangan
  dihapus. Impor lewat UI tidak butuh id (dibuatkan otomatis), tapi id-nya jadi acak dan perintah
  `n8n execute --id ...` di atas harus disesuaikan.
- **Log startup selalu memuat `Failed to start Python task runner ... Python 3 is missing`** —
  abaikan. Itu runner untuk node *Code* mode Python (butuh venv `@n8n/task-runner-python` yang
  tidak ada di image), bukan yang dipakai pipeline ini. Tidak ada env var yang mematikan
  probe-nya; cuma warning.
- **Tidak ada timeout** untuk node Execute Command maupun workflow (`EXECUTIONS_TIMEOUT` default
  mati). Kalau API MAPID menggantung, `tarik_mapid.py` sendiri punya `timeout=120` per request
  dan batas 100 halaman per sumber — itu satu-satunya pengaman.
- **Cabang gagal hanya membawa `$json.error`** (stderr, dipotong 10 MB terakhir). stdout
  tahap-tahap yang sempat sukses **tidak** ikut ke cabang itu — lihat di riwayat eksekusi UI
  (node "Run ETL Pipeline" tetap menyimpan outputnya).
- **`N8N_SECURE_COOKIE=false`** diset supaya login n8n jalan lewat `http://localhost` biasa.
  Jangan biarkan menyala di lingkungan yang bisa diakses publik lewat http.
- **`load_isokron.py` dan `load_supabase.py` sengaja tidak dipanggil** `run_pipeline.py` — lihat
  komentar di kepala `etl/run_pipeline.py`. `load_supabase.py` khususnya adalah kode mati/duplikat
  (pakai library `supabase` yang tidak ada di `requirements.txt`, env var `SUPABASE_KEY` yang
  sudah tidak dipakai skrip lain, baca dari berkas fixture lama) — layak dihapus di sesi terpisah.
- **`etl/` masih punya berkas duplikat tidak sengaja** (`cek_koneksi 2.py`, `db 2.py`, dst —
  identik byte-per-byte dengan versi tanpa " 2"). Root `.dockerignore` menyaringnya dari image,
  tapi duplikatnya sendiri masih ada di repo dan layak dibersihkan terpisah.

## Status verifikasi (12 September 2026)

Diverifikasi dengan build & eksekusi sungguhan di Docker Desktop (macOS, arm64), n8n 2.38.7:

- Image terbangun; `python3` (3.12.14) + `psycopg2`/`dotenv`/`requests` jalan sebagai user `node`;
  `/app/etl` bersih dari dupe/`data/`; konteks build < 2 kB.
- `NODES_EXCLUDE=[]` membuat Execute Command bisa dipakai; workflow terimpor lewat CLI dengan id
  `sigmaps-etl-pipeline`.
- Cabang Error terbukti: perintah yang exit ≠ 0 mendarat di "Pipeline FAILED" dengan `$json.error`
  = stderr, lalu "Tandai eksekusi gagal" membuat eksekusi berstatus `error` (dan `n8n execute`
  keluar dengan exit code 1).
- **Pipeline penuh sukses lewat n8n, dua kali berturut-turut** (eksekusi tercatat `success`,
  mendarat di "Pipeline OK", `exitCode: 0`, stderr kosong): **~45 detik** total —
  `cek_koneksi` 1s, `tarik_mapid` 2s, `load_mapid` 8s, `load_activity` 33s (1.542 baris,
  `executemany` lewat pooler — bagian paling lambat), `pipeline_scoring` <1s. Hasil sama dengan
  angka rujukan di [etl-pipeline.md](etl-pipeline.md): 176 `menu_go`, 191 `properti_go`,
  1.542 `community_activity`, 11 dari 43 kawasan `is_rankable`, D 0,333–0,545.
- Catatan saat pertama kali dites: `DATABASE_URL` yang salah password langsung ketahuan di tahap
  1 dan mendarat di cabang FAILED dengan petunjuk dari `db.py` — jadi kalau jadwal harian gagal,
  pesan di eksekusi merah n8n sudah cukup untuk tahu tahap & sebabnya. Setelah `.env` diubah,
  **wajib `docker compose up -d n8n`** supaya env baru termuat (restart saja tidak cukup untuk
  `env_file`).
