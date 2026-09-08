# app/api/community-sentiment/route.ts

Ringkas laporan warga (Community Activity) di kawasan sebuah stasiun jadi satu paragraf
sentimen, lewat Gemini. Titik sentuh AI #5 (`context/context-final.md` §7.2,
`context/context-mvp.md` §2 Langkah 3a).

## Cara pakai

```
GET /api/community-sentiment?station_id=st_tanah_abang
```

Respons sukses:

```json
{ "data": { "ringkasan": "Warga melaporkan area ini ramai saat jam makan siang...", "jumlah_laporan": 12 } }
```

Kawasan tanpa laporan (normal, **bukan** galat — Gemini tidak dipanggil sama sekali):

```json
{ "data": { "ringkasan": "", "jumlah_laporan": 0 } }
```

Respons gagal:

```json
{ "error": "station_id wajib diisi" }                    // 400
{ "error": "Gagal mengambil data community activity" }   // 503, Supabase
{ "error": "Gagal memproses ringkasan" }                 // 503, Gemini (termasuk kuota habis)
```

## Dependency/prasyarat

- [lib/supabase/server.ts](lib-supabase-server.md).
- [lib/ai/gemini.ts](lib-ai-gemini.md) — butuh `GEMINI_API_KEY`.
- `lib/ai/summarizeSentiment.ts` — prompt + validasi Zod hasil Gemini.
- `lib/schemas/community-sentiment.ts` — `CommunitySentimentSchema`, `CommunitySentimentQuerySchema`.
- View `community_activity_by_station` di `supabase/views.sql`.
- Tabel `community_activity` dan `scored_areas` sudah terisi.

## Batasan/gotcha

- **Skema output ini keputusan implementasi, bukan keputusan tim tertulis** —
  `context-final.md` §7.2 menandai skema titik #5 sebagai ❓ belum diputuskan (schema baru vs
  generalisasi dari `InsightSchema`). Dipilih skema baru minimal (`{ ringkasan }`, `jumlah_laporan`
  ditambahkan sebagai metadata non-AI) karena `InsightSchema` (titik #4, di luar scope MVP)
  belum ada di kode dan bentuknya untuk kasus berbeda (menjelaskan skor, bukan meringkas
  laporan warga). Tandai ke Jalur 1/3 kalau perlu diformalkan.
- **Data identitas pelapor tidak pernah sampai ke kode ini** — view `community_activity_by_station`
  cuma mengembalikan `title`, `description`, `total_comment`, `likes`. Kolom `user_name`,
  `user_full_name`, `user_profile_picture`, `community_picture` sengaja **tidak ada di tabel**
  `community_activity` sama sekali (bukan difilter di sini), supaya kebocoran ke Gemini
  mustahil, bukan sekadar tidak terjadi.
- **Pakai `generateText` + `JSON.parse` manual**, sama seperti `parseIntent.ts` — kalau
  Gemini tidak balikin JSON valid, route ini balas `503` (ditangkap generic try/catch),
  bukan melempar stack trace ke client.
- **Cache belum diimplementasikan.** `context-mvp.md` §6.8b mewajibkan cache per kawasan
  karena kuota Gemini per project dipakai bersama semua pengunjung — endpoint ini memanggil
  Gemini setiap request. Perlu ditambahkan sebelum publik (lihat juga `middleware.ts`
  rate-limit di `CLAUDE.md`).
- ⚠️ **Sejak 8 September 2026 pemanggilnya bertambah**, dan ini memperbesar dampak butir cache
  di atas. Dulu endpoint ini hanya dipanggil `ScoredPanel` (setelah user mengirim rencana
  usaha); sekarang `StationNoBriefPanel` juga memanggilnya, jadi **tiap klik pin stasiun di peta
  = satu panggilan Gemini**, termasuk oleh user yang cuma menjelajah peta. Diterima sadar demi
  gambaran kawasan sebelum brief, tapi jadikan cache prioritas pertama kalau kuota mulai terasa.
- **Rencana field `kategori_jarang` belum dikerjakan.** Sidebar sudah punya `AreaGapBlock`
  ("Kategori yang belum banyak di sini") dengan isi dummy. Sumber aslinya direncanakan menumpang
  panggilan Gemini di endpoint ini — tambah satu field ke `CommunitySentimentSchema` dan satu
  baris di system prompt `lib/ai/summarizeSentiment.ts`, lalu filter hasilnya ke daftar
  `tipe3_values` (`lib/tipe3/index.ts`) supaya kosakatanya sama dengan yang dimengerti
  `/api/score`. Sengaja **bukan** endpoint baru: menambah endpoint AI berarti titik sentuh AI
  ketiga, sesuatu yang dibatasi `docs/fe/ARCHITECTURE.md`.
