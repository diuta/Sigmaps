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
- `lib/sentiment/index.ts` — `getCommunitySentiment(stationId)`: query view + Gemini + cache per
  stasiun. Route hanya memanggil fungsi ini dan memetakan galatnya ke kode status.
- `lib/ai/summarizeSentiment.ts` — prompt + validasi Zod hasil Gemini (dipanggil `lib/sentiment`).
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
- **Cache per stasiun ada di `lib/sentiment` (sejak 12 September 2026)**, memenuhi
  `context-mvp.md` §6.8b. Terukur: panggilan pertama sebuah stasiun 1,3–2,5 detik (Gemini),
  panggilan berikutnya ~5 ms; dua permintaan bersamaan untuk stasiun yang sama berbagi satu
  panggilan Gemini (`helper/memo-ttl.ts`, yang di-cache promise-nya). TTL 6 jam, di memori proses — per instance di
  Vercel, hilang saat cold start. Kalau `community_activity` dimuat ulang lewat
  `etl/load_activity.py`, ringkasan lama bisa bertahan sampai TTL habis atau redeploy.
- Pemanggilnya dua: `ScoredPanel` (setelah brief) dan `StationNoBriefPanel` (klik pin di peta).
  Dengan cache, menjelajah peta hanya membayar Gemini sekali per stasiun per instance.
  `middleware.ts` rate-limit (`CLAUDE.md`) tetap perlu sebelum publik.
- **Rencana field `kategori_jarang` belum dikerjakan.** Sidebar sudah punya `AreaGapBlock`
  ("Kategori yang belum banyak di sini") dengan isi dummy. Sumber aslinya direncanakan menumpang
  panggilan Gemini di endpoint ini — tambah satu field ke `CommunitySentimentSchema` dan satu
  baris di system prompt `lib/ai/summarizeSentiment.ts`, lalu filter hasilnya ke daftar
  `tipe3_values` (`lib/tipe3/index.ts`) supaya kosakatanya sama dengan yang dimengerti
  `/api/score`. Sengaja **bukan** endpoint baru: menambah endpoint AI berarti titik sentuh AI
  ketiga, sesuatu yang dibatasi `docs/fe/ARCHITECTURE.md`.
