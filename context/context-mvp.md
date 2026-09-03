# Context: SIGMAPS MVP — 5 Hari

Dokumen ini turunan dari `context/context-final.md` (tetap berlaku untuk semua keputusan
yang tidak disebut ulang di sini), khusus mendefinisikan **scope MVP 5 hari** supaya semua
anggota kerja dari pemahaman yang sama saat mengerjakan jobdesk masing-masing secara
individual.

## Aturan utama (sama seperti dokumen lain)

✅ **DIPUTUSKAN**, 🔶 **REKOMENDASI/ASUMSI EKSPLISIT (perlu dikonfirmasi cepat)**, ❓
**PERTANYAAN TERBUKA (masih di-research, jangan diasumsikan)**. Kalau ada ❓ di bawah,
**jangan ditulis kode seolah-olah sudah ada jawabannya** — tunggu konfirmasi.

---

## 1. Alur end-to-end MVP (4 langkah)

```
1. User buka app
   → muncul basemap MAPID + titik-titik stasiun

2. User ketik kebutuhan properti di sidebar (Business Brief)
   → AI translate teks jadi parameter terstruktur (Zod)
   → backend hitung skor kesesuaian per stasiun (deterministik, BUKAN AI)
   → tampil Top 5 stasiun + skor + dekomposisi komponen (angka, TANPA narasi AI)

3. User klik satu titik stasiun
   → muncul DUA panel:
     a. Ringkasan sentimen dari data Community Activity kawasan itu (AI, BARU)
     b. Katalog properti dalam kawasan isokron stasiun itu

4. User klik satu properti di katalog
   → muncul property card (deskripsi dari Properti Go)
```

## 2. Detail tiap langkah

### Langkah 1 — Basemap + titik stasiun

✅ Sama seperti fondasi yang sudah didiskusikan: `components/map/BaseMap.tsx` (map instance,
style MAPID MAPS), titik stasiun sebagai layer terpisah (`components/map/layers/
StationLayer.tsx`), diambil lewat Server Component (`app/page.tsx`) dari Supabase, di-passing
sebagai props — bukan di-fetch sendiri oleh Client Component.

❓ **Daftar stasiun yang ditampilkan** — belum ada daftar final "12 simpul" (lihat
`context-final.md` bagian 2). Untuk MVP, perlu dikonfirmasi: pakai 5 stasiun survey
(Cisauk, Serpong, Rawa Buntu, Sudimara, Jurangmangu) dulu, atau daftar lain?

### Langkah 2 — Business Brief → Top 5 (ONE-SHOT, tanpa layar edit bobot)

✅ **Diputuskan untuk MVP:** alurnya **one-shot** — user ketik → langsung dapat Top 5, **tidak
ada** layar review/edit chip parameter & slider bobot (beda dari desain PRD versi lengkap
yang punya langkah edit manual). Ini bisa berubah setelah MVP, dicatat eksplisit supaya
tidak dianggap keputusan permanen.

**Alur teknis:**
```
Sidebar (Client Component)
  → POST /api/prompt-request { teks: "..." }
      → Gemini + Zod (IntentSchema: kategori_usaha, target_jam, segmen, skala, weights, confidence)
  → POST /api/score { weights }
      → baca scored_areas/scored_cells dari Supabase
      → hitung WLC live (lib/scoring.ts) — DETERMINISTIK, bukan AI
      → urutkan, ambil Top 5
  → tampilkan daftar Top 5 + skor + dekomposisi komponen mentah (angka/chart)
```

✅ **Diputuskan 2 September 2026: "summary kenapanya" TIDAK termasuk MVP.** AI Area Insight
(narasi dari skor, titik sentuh AI #4) **di luar scope 5 hari ini** — MVP fokus cuma ke
titik sentuh AI #3 (Business Brief) dan #5 (sentimen Community Activity, Langkah 3a). Hasil
Top 5 cukup tampilkan angka skor + dekomposisi komponen mentah (`demand: 0.72`, dst, bisa
divisualisasikan chart), **tanpa** kalimat naratif buatan AI. Ini membatalkan asumsi
sebelumnya di versi dokumen ini — dicatat di sini supaya jelas ini perubahan sadar, bukan
kelupaan.

❓ **Sumber data skor komponen (`scored_areas`/`scored_cells`) — MASIH DI-RESEARCH oleh
Jalur 2.** Belum ada kejelasan: skor apa persis yang dihitung, data apa saja yang jadi
sumbernya, dan bagaimana skema tabelnya di database. **Jangan diasumsikan** sudah final
mengikuti draft lama di `context-final.md` bagian 5 — tunggu hasil terbaru dari Jalur 2
sebelum bikin DDL final. Untuk sementara, `app/api/score` boleh dibangun dengan **data
dummy/seed** yang meniru bentuk skema terakhir yang disepakati, supaya alur UI bisa
dikerjakan paralel tanpa menunggu — tapi field/nama kolom final harus disesuaikan lagi
begitu Jalur 2 selesai.

### Langkah 3 — Klik stasiun → dua panel

#### 3a. Ringkasan sentimen Community Activity — titik sentuh AI #5

✅ **Detail lengkap fitur ini sudah dipindah ke `context-final.md` bagian 7.2 (titik #5)** —
baca di sana untuk alur teknis, skema field, dan alasan field identitas dibuang. Di sini
cuma ringkasan status untuk konteks MVP:

- ✅ Masuk scope MVP 5 hari.
- ❓ Skema Zod output (schema baru vs generalisasi) belum diputuskan — lihat `context-final.md` §7.2.
- ❓ Tabel Community Activity belum ada di Supabase — perlu dibuat + loader baru.
- ✅ **Update sudah dilakukan** (2 September 2026): jumlah titik sentuh AI di `context-
  final.md` sudah resmi jadi 5, dengan detail penuh — tidak lagi jadi item terbuka.

#### 3b. Katalog properti dalam kawasan isokron

❓ **MASIH PERLU RESEARCH LEBIH LANJUT** (dikonfirmasi langsung) — poligon isokron asli dari
MAPID Isochrone Tool (kerjaan Jalur 2) **belum dipastikan siap**. **Jangan diasumsikan** ada
fallback radius sederhana atau pendekatan lain — itu belum diputuskan. Rencana yang sudah
dikonfirmasi: **polygon akan dibuat untuk semua titik stasiun** (bukan cuma 5 kawasan
survey), tapi status kesiapannya menunggu progres Jalur 2.

**Yang sudah pasti dari sisi kontrak data (tidak berubah dari `context-final.md`):**
```
GET /api/properties?station_id=... → FeatureCollection Properti Go
  (sudah difilter dalam isokron — begitu isokron asli siap)
```

### Langkah 4 — Klik properti → property card

✅ Sesuai PRD, kolom yang ditampilkan: `kategori_properti`, `jenis_properti` (Sewa/Jual),
alamat, foto (`foto_tampak_depan`, `foto_spanduk`), jarak jalan kaki ke stasiun (kalau
isokron/routing sudah ada). **Dilarang** tampilkan filter/field luas, harga, kontak pemilik
— Properti Go tidak punya kolom itu (aturan lama, tidak berubah).

---

## 3. Titik sentuh AI — MVP fokus HANYA ke #3 dan #5

✅ **Diputuskan 2 September 2026:** dari 5 titik sentuh AI (detail lengkap di
`context-final.md` §7.2), MVP 5 hari ini **cuma** mengerjakan **titik #3 dan #5**. Titik #1,
#2 (batch, milik Jalur 2) dan **#4 (AI Area Insight) tidak dikerjakan sama sekali** di MVP
ini — bukan cuma ditunda ke belakang alur, tapi memang tidak ada di scope 5 hari.

| # | Nama | Kapan jalan | Status MVP |
|---|---|---|---|
| 1 | Normalisasi kategori merchant | Batch (Jalur 2) | ❌ Di luar scope |
| 2 | Klasifikasi Community Activity individual → tag | Batch (Jalur 2) | ❌ Di luar scope |
| 3 | Parse Business Brief → arketipe+bobot | Runtime | ✅ **Masuk MVP** (Langkah 2) |
| 4 | AI Area Insight (narasi skor) | Runtime | ❌ **Di luar scope** — Top 5 tampil tanpa narasi AI |
| 5 | Ringkasan sentimen Community Activity | Runtime | ✅ **Masuk MVP** (Langkah 3a) |

**Prinsip yang TIDAK berubah:** skor akhir (0–100) tetap 100% dihitung `lib/scoring.ts`,
tidak pernah oleh AI — ini berlaku terlepas titik AI mana yang masuk/tidak masuk MVP.

---

## 4. Yang SENGAJA di luar scope MVP 5 hari

Supaya tidak melar — ini semua **tidak** dikerjakan dalam 5 hari ini:
- Layar edit bobot manual (chip + slider) — one-shot dulu (Langkah 2).
- **AI Area Insight** (titik sentuh AI #4, narasi dari skor Top 5) — Top 5 tampil cukup
  angka + dekomposisi komponen mentah, tanpa kalimat naratif AI.
- Filter percakapan AI ("tunjukkan kawasan risiko rendah...") — fitur terpisah, belum digarap.
- Matriks perbandingan 2–3 properti berdampingan.
- Export ringkasan ke PDF.
- Rate limiting per-IP yang matang (`middleware.ts`) — dicatat perlu ada sebelum publik,
  tapi bukan blocker untuk demo internal 5 hari.
- Resolusi penuh 12+ simpul stasiun (termasuk MRT/LRT) — tunggu daftar final.

---

## 5. Pemetaan kerja per jalur (siapa kerjain apa untuk MVP ini)

- **Jalur 1 (Data/Backend):** `app/api/prompt-request`, `app/api/score`, `app/api/properties`,
  `app/api/community-sentiment` (baru, untuk Langkah 3a), skema tabel sementara (dummy/seed)
  sambil nunggu Jalur 2, tabel Community Activity di Supabase (belum ada, cuma di ETL).
- **Jalur 2 (Analisis Spasial/Skoring):** **blocking item** — skema & isi `scored_areas`/
  `scored_cells` final, status poligon isokron semua stasiun. MVP Langkah 2 & 3b menunggu ini.
- **Jalur 3 (Frontend/AI):** `components/map/*`, sidebar Business Brief (UI one-shot), panel
  hasil Top 5 + dekomposisi komponen (angka/chart, **tanpa** narasi AI — titik #4 di luar
  scope), panel klik stasiun (2 tab: sentimen + katalog), property card. Zod schema yang
  dipakai MVP cuma dua: `IntentSchema` (titik #3, wajib pakai nama final Jalur 2 — lihat
  `context-final.md` §7.2) dan schema output titik #5 (nama masih ❓, lihat §7.2).
  `InsightSchema` (titik #4) **tidak perlu dikerjakan** untuk MVP ini.

---

## 6. Referensi

- `context/context-final.md` — keputusan arsitektur & data lengkap (tetap berlaku).
- `CLAUDE.md` — aturan struktur folder & kode (tetap berlaku, termasuk larangan hardcode key,
  batas Server/Client Component, dll).
- ETL: `etl/script.py` — sumber field Community Activity yang dikutip di bagian 3a.
