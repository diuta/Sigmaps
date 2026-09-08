# lib/ai/gemini.ts

Inisialisasi client Gemini (Google AI Studio) lewat Vercel AI SDK. Modul ini cuma
menyediakan instance model siap pakai — tidak ada prompt/logic bisnis di sini.

## Cara pakai

```ts
import { generateText } from 'ai'
import { geminiFlashLite } from '@/lib/ai/gemini'

const { text } = await generateText({
  model: geminiFlashLite,
  system: 'Balas HANYA dengan JSON valid, tanpa markdown/backtick, persis bentuk ini: {...}',
  prompt: 'toko roti pagi buat pekerja kantoran',
})
// lalu JSON.parse(text) + validasi Zod di pemanggil
```

- `geminiFlashLite` — task terstruktur/ringan; dipakai `lib/ai/parseIntent.ts` (titik AI #3).
- `geminiFlash` — task yang butuh narasi lebih panjang; dipakai `lib/ai/summarizeSentiment.ts`
  (titik AI #5).

Nama modelnya diambil dari env var dengan default `gemini-3.5-flash-lite` /
`gemini-3.5-flash`.

## Dependency/prasyarat

- Env var `GEMINI_API_KEY` (wajib, server-only, tanpa prefix `NEXT_PUBLIC_`).
- Env var opsional `GEMINI_MODEL_FLASH_LITE` / `GEMINI_MODEL_FLASH` untuk override nama
  model tanpa ubah kode (lihat `.env.example`).
- Package `ai` + `@ai-sdk/google`.

## Batasan/gotcha

- **Server-only.** Jangan pernah import file ini dari Client Component (`'use client'`) —
  akan bocorkan alur ke `GEMINI_API_KEY` yang seharusnya tidak pernah sampai ke browser.
  Panggil lewat `app/api/*` route handler.
- File ini cuma inisialisasi client, bukan tempat prompt/skema. Prompt tiap use case ada di
  modul `lib/ai/<useCase>.ts` (`parseIntent.ts`, `summarizeSentiment.ts`) dan Zod schema-nya di
  `lib/schemas/` — bukan di sini, dan bukan juga di `route.ts` (route wajib tipis,
  `CLAUDE.md` bagian 2).
- **Kedua pemakai memakai `generateText` + `JSON.parse` manual, bukan `generateObject`** —
  keputusan tim, bukan library deprecation (lihat [lib-ai-parseintent.md](../context/lib-ai-parseintent.md)).
  Konsekuensinya tidak ada retry bawaan AI SDK saat keluaran model bukan JSON valid.
- Modul ini **`throw` saat di-import** kalau `GEMINI_API_KEY` belum diset — sama seperti
  `lib/supabase/server.ts`, jadi `next dev`/`next build` gagal total, bukan cuma endpoint AI-nya.
