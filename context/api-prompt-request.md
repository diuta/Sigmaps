# app/api/prompt-request/route.ts

Terima `prompt` bebas dari user (Business Brief), parse jadi objek terstruktur lewat
`lib/ai/parseIntent.ts` — dipakai downstream oleh `POST /api/score` (`lib/scoring.ts`).

## Cara pakai

```
POST /api/prompt-request
Content-Type: application/json

{ "prompt": "mau buka warung nasi padang harga sekitar 20000 per porsi" }
```

Respons sukses:

```json
{ "data": { "tipe_3": "RESTORAN PADANG", "harga_target": 20000, "harga_sumber": "pengguna", "confidence": 1 } }
```

Respons gagal — kode galat mengikuti `context/context-mvp.md` §6.8b:

```json
{ "error": "Input tidak valid" }                                    // 400, body request tidak sesuai PromptRequestSchema
{ "error": "Gagal mengambil daftar kategori usaha" }                // 503, Supabase/view tipe3_values tidak merespons
{ "error": "Usaha yang disebut bukan usaha kuliner" }               // 400, Gemini menandai is_kuliner = false
{ "error": "Gagal memahami hasil AI, coba ulangi dengan kalimat lain" } // 422, JSON Gemini tidak sesuai skema
{ "error": "Layanan AI sedang tidak tersedia, coba lagi nanti" }    // 503, panggilan ke Gemini gagal (termasuk kuota habis)
{ "error": "Gagal memproses permintaan" }                           // 500, fallback murni untuk kegagalan tak terduga
```

## Dependency/prasyarat

- [lib/ai/gemini.ts](lib-ai-gemini.md) — client Gemini, butuh `GEMINI_API_KEY`.
- [lib/ai/parseIntent.ts](lib-ai-parseintent.md) — fungsi yang memanggil Gemini & memvalidasi hasilnya.
- `lib/schemas/prompt-request.ts` — `PromptRequestSchema` (validasi request),
  `buildIntentSchema(tipe3Values)` (kontrak publik), `buildGeminiRawSchema(tipe3Values)`
  (skema internal parsing output Gemini, lihat `lib-ai-parseintent.md`).
- [lib/tipe3.ts](lib-tipe3.md) — sumber `tipe_3` yang sah, dibaca dari Supabase.

## Batasan/gotcha

- Pakai `generateText`, **bukan** `generateObject` (keputusan tim, bukan library
  deprecation). Karena `generateText` cuma balikin teks bebas, `parseIntent` menyusun
  instruksi JSON eksplisit di system prompt, lalu `JSON.parse` + skema Zod dinamis divalidasi
  manual.
- **Kode galat 400/422/503 sekarang diimplementasikan penuh** (sebelumnya route ini cuma
  punya 400 untuk body kosong dan 500 untuk semua kegagalan lain — sudah diperbaiki 6
  September 2026, lihat `lib-ai-parseintent.md` untuk detail tiga kelas error yang dipakai).
  ⚠️ **Satu deviasi yang masih terbuka dari kontrak**: `context-mvp.md` §6.8b menyebut 422
  terjadi "setelah retry AI SDK" — tidak ada retry otomatis di sini karena `generateText`
  (bukan `generateObject`) tidak membawa fitur retry AI SDK. 422 langsung dibalas begitu
  parsing/validasi gagal sekali, tanpa percobaan ulang.
- **`is_kuliner` dari Gemini dipakai sekali** untuk menolak usaha non-kuliner sebelum hasil
  dikembalikan — field ini **tidak** masuk kontrak publik `IntentSchema`/`Intent` (tetap
  cuma `tipe_3`, `harga_target`, `harga_sumber`, `confidence`), jadi tidak mengubah bentuk
  respons sukses.
- `/api/prompt-request` tidak lagi mendistingsikan "kuota Gemini habis" dari kegagalan
  panggilan Gemini lainnya (network, auth, dll) — semuanya dipetakan ke `503`
  (`GeminiUnavailableError`). Ini simplifikasi sengaja, bukan kelalaian: membaca kode status
  internal AI SDK untuk membedakan jenis kegagalan dianggap terlalu rapuh untuk MVP.
- **`tipe_3` sudah dinamis**, dibaca dari view `tipe3_values` (`supabase/views.sql`) lewat
  `getTipe3Values()`, dipanggil **di `route.ts`** (bukan di `parseIntent.ts` lagi) supaya
  kegagalannya bisa dipetakan ke `503` secara eksplisit sebelum Gemini dipanggil sama sekali
  — pola yang sama seperti `app/api/score/route.ts`.
- Route ini sengaja tipis (cuma validasi → panggil `lib/ai/parseIntent.ts` → format
  response, dengan pemetaan kode galat eksplisit) sesuai `CLAUDE.md` bagian 2 — logic
  Gemini/prompt-building **tidak** boleh pindah ke `route.ts`.
