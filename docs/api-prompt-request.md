# app/api/prompt-request/route.ts

Terima `prompt` bebas dari user (Business Brief), parse jadi objek terstruktur lewat
`lib/ai/parseIntent.ts` — dipakai downstream untuk mesin skoring (`lib/scoring.ts`, belum
dibuat).

## Cara pakai

```
POST /api/prompt-request
Content-Type: application/json

{ "prompt": "mau buka warung nasi padang harga sekitar 20000 per porsi" }
```

Respons sukses:

```json
{ "data": { "tipe_3": "Restoran Padang", "harga_target": 20000, "harga_sumber": "pengguna", "confidence": 1 } }
```

Respons gagal (input tidak valid → 400, error Gemini/server → 500):

```json
{ "error": "Input tidak valid" }
```

## Dependency/prasyarat

- [lib/ai/gemini.ts](lib-ai-gemini.md) — client Gemini, butuh `GEMINI_API_KEY`.
- `lib/ai/parseIntent.ts` — fungsi yang memanggil Gemini & memvalidasi hasilnya.
- `lib/schemas/prompt-request.ts` — `PromptRequestSchema` (validasi request) dan
  `buildIntentSchema(tipe3Values)` (skema hasil parsing, dipaksakan lewat prompt + divalidasi
  manual).
- [lib/tipe3.ts](lib-tipe3.md) — sumber `tipe_3` yang sah, dibaca dari Supabase.

## Batasan/gotcha

- Pakai `generateText`, **bukan** `generateObject` (keputusan tim, bukan library
  deprecation). Karena `generateText` cuma balikin teks bebas, `parseIntent` menyusun
  instruksi JSON eksplisit di system prompt, lalu `JSON.parse` + skema Zod dinamis divalidasi
  manual — kalau Gemini tidak balikin JSON valid sesuai skema, ini akan **throw** dan endpoint
  balikin `500`.
- **`tipe_3` sudah dinamis**, dibaca dari view `tipe3_values` (`supabase/views.sql`, sumbernya
  `select distinct tipe_3 from katalog_restoran`) lewat [lib/tipe3.ts](lib-tipe3.md), bukan
  daftar hardcode lagi (lihat `context/context-mvp.md` §6.6 & §6.8b). Enum yang dipakai
  Gemini di system prompt dan enum yang dipakai Zod untuk validasi hasilnya **selalu** daftar
  yang sama persis, diambil sekali per pemanggilan `parseIntent`. Kalau Supabase/view ini
  belum ada, `getTipe3Values()` throw dan endpoint balas `500` (via `catch` yang sudah ada di
  `route.ts`).
- Route ini sengaja tipis (cuma validasi → panggil `lib/ai/parseIntent.ts` → format
  response) sesuai `CLAUDE.md` bagian 2 — logic Gemini/prompt-building **tidak** boleh
  pindah ke `route.ts`.
