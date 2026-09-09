> ⚠️ **Duplikat kedaluwarsa.** Versi yang berlaku ada di `docs/lib-ai-gemini.md` — berkas ini masih
> menyebut path sebelum refactor (`lib/scoring.ts`, `lib/tipe3.ts`, `lib/stations.ts`) dan
> belum diperbarui untuk perubahan skoring di merge `bb4c280`. Belum dihapus karena
> pembagian `docs/` vs `context/` masih menunggu keputusan tim — lihat `docs/README.md`.

# lib/ai/gemini.ts

Inisialisasi client Gemini (Google AI Studio) lewat Vercel AI SDK. Modul ini cuma
menyediakan instance model siap pakai — tidak ada prompt/logic bisnis di sini.

## Cara pakai

```ts
import { generateObject } from 'ai'
import { geminiFlashLite } from '@/lib/ai/gemini'
import { z } from 'zod'

const { object } = await generateObject({
  model: geminiFlashLite,
  schema: z.object({ kategori_usaha: z.string() }),
  prompt: 'toko roti pagi buat pekerja kantoran',
})
```

- `geminiFlashLite` — untuk task terstruktur/ringan (contoh: parse intent).
- `geminiFlash` — untuk task yang butuh narasi lebih panjang (contoh: AI Area Insight).

## Dependency/prasyarat

- Env var `GEMINI_API_KEY` (wajib, server-only, tanpa prefix `NEXT_PUBLIC_`).
- Env var opsional `GEMINI_MODEL_FLASH_LITE` / `GEMINI_MODEL_FLASH` untuk override nama
  model tanpa ubah kode (lihat `.env.example`).
- Package `ai` + `@ai-sdk/google`.

## Batasan/gotcha

- **Server-only.** Jangan pernah import file ini dari Client Component (`'use client'`) —
  akan bocorkan alur ke `GEMINI_API_KEY` yang seharusnya tidak pernah sampai ke browser.
  Panggil lewat `app/api/*` route handler.
- File ini cuma inisialisasi client, bukan tempat prompt/skema. Prompt & Zod schema untuk
  tiap use case (prompt-request, insight, dll) taruh di `app/api/<endpoint>/route.ts` dan
  `lib/schemas/`, bukan di sini.
