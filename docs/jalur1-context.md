# Context: Jalur 1 — Data, Basis Data & Backend (Anggota 1)

Dokumen ini isinya keputusan, hasil riset, dan status kerja **Anggota 1 (Jalur 1)** untuk
SIGMAPS, sesuai jobdesk di "Jalur Riset Stack" (`jalur-riset-sigmaps.pdf`). Tujuannya:
supaya saat sesi sinkronisasi tim (Jalur 1 + Jalur 2 + Jalur 3), semua orang bisa baca
status masing-masing tanpa perlu re-explain dari nol.

**Dokumen pasangan yang perlu dibuat anggota lain (format sama, isi beda):**
- `docs/jalur2-context.md` — Anggota 2, Analisis Spasial & Mesin Skoring (Python)
- `docs/jalur3-context.md` — Anggota 3, Frontend Mapping & Interaksi AI

## ATURAN UTAMA dokumen ini (berlaku untuk semua jalur)

**Kalau ada yang tidak pasti, tulis sebagai pertanyaan terbuka — jangan ditulis seolah-olah
sudah diputuskan.** Jangan menebak jawaban orang lain, jangan asumsikan format data/skema
dari jalur lain hanya karena "kelihatannya masuk akal". Setiap poin di bawah ditandai salah
satu status:

- ✅ **DIPUTUSKAN** — sudah final, dikerjakan, atau dikonfirmasi lewat bukti (kode/hasil test).
- 🔶 **REKOMENDASI (belum final)** — hasil riset & pendapat Jalur 1, tapi perlu persetujuan
  tim/jalur lain sebelum dikunci.
- ❓ **PERTANYAAN TERBUKA** — belum diketahui, tidak boleh diasumsikan, harus ditanyakan ke
  tim/panitia/dicek langsung.

Saat sintesis nanti, hal pertama yang harus dicek adalah semua item berstatus ❓ dari
ketiga dokumen — itu prioritas utama, bukan detail yang sudah ✅.

---

## 1. Status kerja yang sudah dibuat (per 29 Agustus 2026)

✅ **ETL Extract — `etl/script.py`**
Script berhasil menarik data dari API MAPID (bukan cuma sample 15 titik dari dokumen
proposal — API akses penuh **sudah bisa dipakai**, lihat detail endpoint di bagian 2).
Ditulis pakai `requests`, load API key dari `.env` (`MAPID_API_KEY`), auth via header
`x-api-key`. Menangani 2 pola pagination berbeda tergantung jenis endpoint (lihat bagian 2).
Output disimpan sebagai file `.geojson` lokal di `etl/`:
- `etl/cisauk-propertigo.geojson`
- `etl/isauk-strukgo.geojson`
- `etl/cisauk-menugo.geojson`
- `etl/cisauk-activity.geojson`

✅ **ETL Transform + Load — `etl/load_supabase.py`**
Baca `cisauk-propertigo.geojson`, ekstrak kolom yang relevan (kategori_properti,
jenis_properti, alamat, foto_tampak_depan, foto_spanduk, lat, lng), upsert ke tabel
Supabase `properti_go` pakai `supabase-py` client (service dari `SUPABASE_URL` +
`SUPABASE_KEY` di `.env`).

✅ **Database — Supabase project sudah jalan, tabel `properti_go` sudah dibuat**
DDL aktual (sudah dieksekusi):
```sql
create extension if not exists postgis;

create table properti_go (
    id text primary key,
    kategori_properti text,
    jenis_properti text,
    alamat text,
    lat numeric,
    lng numeric,
    geom geometry(Point, 4326) generated always as (ST_SetSRID(ST_MakePoint(lng, lat), 4326)) stored,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

create index properti_go_geom_idx on properti_go using gist (geom);

alter table properti_go
  add column foto_tampak_depan text,
  add column foto_spanduk text;
```
Kolom `geom` **generated column** (otomatis dihitung dari `lat`/`lng`, SRID 4326/WGS84),
sudah ada spatial index (GiST) untuk query `ST_Within`/`ST_DWithin` nanti. Data Properti Go
area Cisauk **sudah ter-upload** ke tabel ini.

❓ **Belum dibuat: tabel/loader untuk Struk Go, Menu Go, Activity**
File `.geojson` sudah ada hasil extract, tapi **belum ada tabel Supabase + loader script**
untuk `struk_go`, `menu_go`, `activity` (baru `properti_go` yang selesai end-to-end).
Skema kolom tiap dataset mengikuti atribut resmi di "Ketentuan Data & WebGIS" (lihat
`context.md` induk bagian A.4), tapi belum dituangkan jadi DDL — perlu dikerjakan
selanjutnya oleh Jalur 1.

❓ **Ada file `public/geojson/krl.geojson` dan `helper/hex-area.ts` di repo** — dua file ini
tidak dibuat oleh riset Jalur 1 (kemungkinan sudah ada duluan dari basemap awal atau
kerjaan Jalur 3). **Tidak diasumsikan** ini bagian dari pipeline Jalur 1 — perlu dikonfirmasi
ke tim siapa yang membuat & untuk keperluan apa.

---

## 2. Riset — Sumber data & status akses API MAPID

✅ **API MAPID sudah bisa diakses penuh (bukan cuma sample 15 titik)** — ini beda dari
asumsi di `context.md` induk (yang bilang dokumentasi API "baru diberikan setelah lolos
kurasi, belum dikonfirmasi sudah diberikan atau belum"). Bukti: `etl/script.py` berhasil
fetch data sungguhan dari 4 endpoint berikut:

| Endpoint | URL | Bentuk response |
|---|---|---|
| Properti Go | `POST https://server.mapid.io/web/competition/propertigo` | `{ features: [...], pagination: { hasMore, limit } }` |
| Struk Go | `POST https://server.mapid.io/web/competition/struckgo` | sama pola `features`/`pagination` |
| Menu Go | `POST https://server.mapid.io/web/competition/menugo` | sama pola `features`/`pagination` |
| Activities (Community Maps) | `POST https://server.mapid.io/web/competition/activities` | `{ data: { activities: [...] }, meta: { total } }` — pola beda, dihandle cabang kode terpisah di `script.py` |

- Auth: header `x-api-key: <MAPID_API_KEY>`.
- Request body: filter area pakai GeoJSON Polygon (`feature.coordinates`) + `offset` untuk
  pagination manual.
- Pagination Mission (propertigo/struckgo/menugo): baca `pagination.hasMore` +
  `pagination.limit`, loop sampai `hasMore: false`.
- Pagination Activities: baca `meta.total`, loop sampai `offset + len(items) >= total`.

❓ **Scope area filter saat ini: satu bounding box "Cisauk" saja** (koordinat di
`POLYGON_CISAUK` dalam `script.py`, kira-kira 106.63–106.65 BT, -6.33 s/d -6.32 LS).
Ini **kemungkinan besar cuma area uji coba/pilot**, BUKAN keputusan scope final — perlu
dikonfirmasi ke tim: apakah scope final tetap "beberapa koridor prioritas" (sesuai catatan
`context.md` induk soal kepadatan data crowdsourced) dan Cisauk representatif untuk itu,
atau perlu diperluas ke area KRL + TransJakarta lain juga. **Jangan diasumsikan Cisauk =
scope final** sebelum dikonfirmasi ke tim/fasilitator.

✅ **Pola ETL yang dipakai sudah sesuai rencana Extract → Transform → Load** dari
`context.md` induk — dikonfirmasi jalan.

❓ **Rate limiting / kuota API MAPID** — belum diketahui apakah ada limit request per
menit/hari dari sisi MAPID. Belum pernah dites lewat batas. Perlu ditanyakan ke
fasilitator/Community Top 50 sebelum extract dijalankan rutin/terjadwal.

---

## 3. Riset — Database & keamanan (Supabase)

✅ **Pilihan database: Supabase (PostgreSQL + PostGIS)** — sudah dipakai, bukan lagi opsi
riset. Alasan (retroaktif, sesuai apa yang sudah jalan): managed Postgres dengan PostGIS
bawaan, REST API otomatis, cocok untuk tim tanpa pengalaman ops database mandiri.

🔶 **Row Level Security (RLS) — belum diaktifkan/dikonfigurasi.** Saat ini load ke
Supabase pakai key dari `.env` (`SUPABASE_KEY`) — **jenis key-nya (anon vs service role)
belum dipastikan/dicatat di sini**, jadi ditandai ❓, bukan diasumsikan salah satu.

❓ **Perlu dicek langsung: apakah `SUPABASE_KEY` yang dipakai sekarang itu anon key atau
service role key?** Ini penting karena:
- Kalau **service role key**: aman dipakai di `load_supabase.py` (jalan lokal/server), tapi
  **tidak boleh** pernah dipakai di kode frontend (Next.js client component) — pastikan
  tidak ada file di `app/` atau kode client-side yang mengimpor key yang sama.
  Konvensi Next.js: kalau perlu dipakai di server (API Route), taruh sebagai env var tanpa
  prefix `NEXT_PUBLIC_`. Kalau dipakai di client, harus pakai key `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  yang terpisah dan RLS aktif.
- Kalau **anon key**: berarti insert dari `load_supabase.py` bisa jalan hanya kalau RLS
  tabel `properti_go` mengizinkan `INSERT` publik — perlu dicek policy-nya, karena kalau
  belum ada RLS sama sekali, Supabase secara default **memblok** semua akses via anon key
  (RLS default: `deny all` begitu RLS diaktifkan; kalau RLS belum pernah diaktifkan sama
  sekali di tabel ini, berarti tabel masih terbuka penuh tanpa proteksi row-level).

🔶 **Rekomendasi RLS untuk tahap berikutnya** (belum diterapkan, untuk didiskusikan):
```sql
alter table properti_go enable row level security;

create policy "publik boleh baca properti_go"
  on properti_go for select
  using (true);

-- INSERT/UPDATE/DELETE tidak dibuatkan policy publik →
-- hanya bisa lewat service role key (dipakai backend/ETL, bukan browser)
```
Alasan: data Properti Go aman dibaca publik (bukan data sensitif), tapi hanya
backend/ETL yang boleh menulis.

❓ **Belum ada tabel log/audit** (untuk mencatat tiap request scoring live — input user,
bobot dipakai, skor akhir). Ini direkomendasikan di bagian riset backend live (bagian 4)
tapi belum dibuat.

---

## 4. Riset — Arsitektur backend live (WLC & orkestrasi request)

Konteks masalah: proposal (`Kamehameha_SIGMAPS.pdf` bagian 5.2) mengunci bahwa isokron,
agregasi H3, dan pencocokan kategori usaha **wajib** pra-komputasi (bukan dihitung ulang
tiap request) — itu domain Jalur 2 (Python, batch/offline), tidak berubah. Yang jadi
riset terbuka Jalur 1 adalah: di mana & bagaimana langkah **terakhir** (Weighted Linear
Combination / WLC, dan penyajian ke frontend) dijalankan saat pengguna benar-benar
mengakses web secara live.

### 🔶 Rekomendasi arsitektur (belum final — perlu persetujuan tim)

**Next.js API Routes sebagai orkestrator/gateway, dibantu Supabase Postgres RPC untuk
query & hitung berat.** Bukan backend Python terpisah (FastAPI/dsb).

Pertimbangan yang dipakai:
1. Panggilan ke LLM API **wajib** lewat server (key tidak boleh di browser) — jadi
   minimal satu backend (Next.js API Route) **tetap wajib ada** apa pun pilihan
   arsitekturnya. Menambah FastAPI berarti menambah *layanan kedua*, bukan menghilangkan
   yang pertama.
2. WLC (`skor = Σ bobot × komponen`) adalah operasi matematis sangat sederhana
   (perkalian + penjumlahan) — risiko "duplikasi logic scoring di dua bahasa" (kekhawatiran
   utama yang membuat opsi FastAPI menarik di context.md induk) rendah untuk operasi
   sesederhana ini. Ini beda dengan isokron/H3/KDE yang memang kompleks dan **tetap** harus
   100% di Python (Jalur 2), tidak berubah.
3. Survei kemampuan tim (Lampiran proposal): **tidak ada anggota yang eksplisit
   menyebut pengalaman FastAPI/Django/Flask.** Python yang disebutkan tim selama ini untuk
   pipeline analisis data, bukan untuk melayani web request. Menambah stack baru yang
   belum familiar berisiko untuk timeline kompetisi.
4. Query spasial berat (spatial join Properti Go dalam polygon isokron, Level 2 ranking)
   lebih efisien dijalankan **di dalam Postgres/PostGIS** (lewat fungsi SQL + `supabase.rpc()`)
   daripada ditarik semua baris ke JS lalu diproses manual.

**Konsekuensi desain:**
- Next.js API Route (misal `/api/rank-area`) = satu-satunya pintu masuk dari frontend.
  Tugas: terima input user → panggil LLM API (parsing) → panggil Supabase RPC (hitung
  WLC + spatial join) → panggil LLM API lagi (narasi insight) → kembalikan JSON ke frontend.
- Fungsi SQL (Postgres RPC) menjalankan hitungan WLC + `ST_Within`, dipanggil dari API
  Route via `supabase.rpc(...)`, bukan dihitung manual loop di JS.
- Python (Jalur 2) tidak pernah dipanggil secara live — dia sudah selesai kerja duluan,
  hasilnya tersimpan di tabel skor komponen.

❓ **Ini BUKAN keputusan final tim.** Context.md induk mencatat ada versi diskusi lain
(dari sesi/anggota lain) yang mengunci FastAPI untuk alasan "satu bahasa untuk seluruh
formula scoring". Rekomendasi di atas adalah hasil riset Jalur 1 dengan pertimbangan di
atas, **harus dibawa ke sesi sinkronisasi tim untuk diputuskan bersama**, bukan
diasumsikan sudah disetujui.

---

## 5. Riset — Rancangan skema tabel skor (Level 1 & Level 2)

⚠️ **Seluruh skema di bagian ini adalah PROPOSAL Jalur 1, BUKAN skema final** — kolom
persis yang keluar dari pipeline Python (Jalur 2) belum dikonfirmasi. Ditulis di sini
supaya ada titik awal diskusi saat sinkronisasi dengan Jalur 2, **bukan untuk langsung
diimplementasikan sebagai final tanpa konfirmasi Jalur 2**.

🔶 **Proposal tabel `hex_scores`** (skor komponen umum per kawasan/hex, Level 1):
```
hex_id            (PK, dari h3-py resolusi 9 — perlu konfirmasi resolusi dari Jalur 2)
stasiun_id / nama
skor_daya_beli        float  -- dari MenuGo, gravitasi ekonomi
skor_jam_pagi          float  -- dari daily peak detection StrukGo
skor_jam_siang          float
skor_jam_malam          float
geom_isokron_5min      geometry(Polygon, 4326)
geom_isokron_10min     geometry(Polygon, 4326)
updated_at
```

🔶 **Proposal tabel `kde_scores`** (skor kompetisi, spesifik per kategori usaha, Level 1):
```
hex_id           (FK ke hex_scores)
kategori_usaha   text
skor_kompetisi_kde  float
```
Alasan dipisah dari `hex_scores`: kepadatan kompetitor berbeda tergantung kategori usaha
yang ditanyakan (bakery ≠ laundry), sementara daya beli/ritme jam bersifat umum per kawasan.

🔶 **Proposal tabel `archetype_presets`** (bobot per profil bisnis, dibuat manual tim,
bukan hasil query/AI):
```
arketipe          text (PK)
bobot_daya_beli   float
bobot_jam         float
bobot_kompetisi   float
```
LLM (live) hanya memetakan input user ke salah satu baris `arketipe` di tabel ini —
**tidak** menghitung bobot sendiri, dan **tidak** mencari skor per kategori/jam ke tabel
terpisah seperti sempat disalahpahami di awal diskusi (skor tetap milik kawasan/hex, bukan
milik kategori usaha secara umum).

❓ **Yang harus dikonfirmasi ke Jalur 2 sebelum skema ini diimplementasikan:**
- Resolusi H3 yang dipakai (proposal sebut resolusi 9 — apakah tetap?).
- Nama & satuan kolom skor komponen persis apa saja yang dihasilkan Python (daya beli,
  jam berapa saja yang dipecah, format normalisasi min-max seperti apa).
- Apakah isokron disimpan sebagai polygon per hex atau per stasiun (mempengaruhi PK
  `hex_scores`).
- Apakah KDE competition score memang dipecah per kategori usaha seperti asumsi di atas,
  atau dihitung dengan cara lain.

❓ **Kasus tepi "kawasan skor tinggi, nol Properti Go"** (dicatat di context.md induk) —
skema `kde_scores`/`hex_scores` di atas belum punya kolom/flag eksplisit untuk ini.
Perlu ditambahkan (misal `properti_count` di hasil query Level 2), tapi didesain setelah
skema Level 1 dikonfirmasi, bukan sekarang.

---

## 6. Riset — Best practice yang direkomendasikan

🔶 **Secret management** — `MAPID_API_KEY`, `SUPABASE_KEY` (kalau service role), dan
LLM API key (Jalur 3, belum dipilih providernya) harus jadi env var server-side saja,
**tidak boleh** ada di kode yang di-bundle ke browser. Next.js: hanya env var berprefiks
`NEXT_PUBLIC_` yang boleh dipakai di client — pastikan konvensi ini diikuti begitu API
Route dibuat.

🔶 **Rate limiting** untuk endpoint live (`/api/rank-area`) — karena tiap request bisa
memicu 2× panggilan LLM API (parsing + narasi), perlu limit per sesi/IP supaya biaya LLM
tidak membengkak. Kandidat: Upstash Redis, atau rate limit bawaan platform hosting.

🔶 **Caching** hasil parsing LLM untuk input yang identik/mirip — belum diimplementasi,
direkomendasikan untuk tahap optimasi setelah fitur utama jalan.

🔶 **Audit log** — tabel `scoring_requests` (timestamp, input user, arketipe terpilih,
bobot dipakai, top5 hex_id + skor) untuk mendukung klaim "auditable/traceable" di proposal
(validasi Spearman/confusion matrix di Jalur 2 butuh histori ini). Belum dibuat.

❓ **Kuota/biaya LLM API** — belum ada estimasi karena provider belum dipilih (riset
Jalur 3). Perlu disinkronkan: pilihan provider LLM mempengaruhi desain rate limit &
caching di atas.

---

## 7. Pertanyaan terbuka — rekap (jangan diasumsikan, harus ditanyakan)

1. Scope area: apakah bounding box Cisauk di `script.py` adalah pilot/test saja atau sudah
   representatif untuk scope final tim (KRL + TransJakarta)? → tanya ke tim/fasilitator.
2. Jenis `SUPABASE_KEY` yang dipakai sekarang: anon key atau service role key? → cek
   langsung di dashboard Supabase (Project Settings → API), catat hasilnya di sini.
3. RLS untuk `properti_go` (dan tabel lain yang akan dibuat) belum aktif — apakah tim mau
   aktifkan sebelum atau sesudah fitur utama jalan?
4. Rate limit/kuota API MAPID dari sisi panitia — belum diketahui, tanyakan ke
   Community/fasilitator Top 50.
5. Arsitektur backend live (Next.js API Routes + Supabase RPC vs FastAPI terpisah) —
   rekomendasi Jalur 1 sudah ada (bagian 4), tapi **perlu diputuskan bersama tim**, bukan
   sepihak Jalur 1.
6. Skema kolom hasil Python (resolusi H3, nama kolom skor, cara simpan isokron) — perlu
   dikonfirmasi dari Jalur 2, bukan diasumsikan dari proposal draft di bagian 5.
7. Provider LLM API (Jalur 3) — mempengaruhi desain rate limit/caching di backend, perlu
   info begitu Jalur 3 memutuskan.
8. File `public/geojson/krl.geojson` dan `helper/hex-area.ts` — dibuat oleh siapa dan untuk
   keperluan apa? Perlu dikonfirmasi supaya tidak ada pipeline data ganda yang tidak
   sinkron dengan hasil ETL Jalur 1.
9. Apakah dokumen ini (dan API MAPID yang sudah bisa diakses penuh) berarti open question
   #1 di `context.md` induk ("apakah dokumentasi API sudah diberikan setelah Top 50?")
   sudah terjawab "ya"? Perlu dikonfirmasi ke tim supaya `context.md` induk bisa diupdate.

---

## 8. Referensi

- `context.md` (di root `MAPID/`, satu folder di atas repo ini) — context induk seluruh
  kompetisi, proposal, ketentuan lomba, dan riset Jalur 1/2/3 versi ringkas.
- `jalur-riset-sigmaps.pdf` — pembagian jobdesk riset resmi 3 jalur.
- Kode: `etl/script.py` (Extract), `etl/load_supabase.py` (Transform+Load), tabel
  `properti_go` di Supabase project ini.
