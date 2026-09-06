# lib/ai/summarizeSentiment.ts

Titik sentuh AI #5: kirim kumpulan laporan Community Activity (sudah bersih dari identitas
pelapor) ke Gemini, minta satu ringkasan naratif. Dipakai
[app/api/community-sentiment/route.ts](api-community-sentiment.md).

## Cara pakai

```ts
import { summarizeSentiment } from '@/lib/ai/summarizeSentiment'

const summary = await summarizeSentiment([
  { title: 'Trotoar rusak', description: 'Ada lubang di depan pintu keluar stasiun', total_comment: 3, likes: 10 },
])
// { ringkasan: '...', jumlah_laporan: 1 }
```

## Dependency/prasyarat

- [lib/ai/gemini.ts](lib-ai-gemini.md) — `geminiFlash`, butuh `GEMINI_API_KEY`.
- `lib/schemas/community-sentiment.ts` — `CommunitySentimentSchema`.

## Batasan/gotcha

- **Server-only** (transitif lewat `lib/ai/gemini.ts`) — jangan import dari Client Component.
- Pakai `generateText` + `JSON.parse` manual + validasi Zod, **bukan** `generateObject`
  (konsisten dengan `lib/ai/parseIntent.ts`) — kalau Gemini balas teks bukan JSON valid,
  fungsi ini **throw**, ditangkap caller (`route.ts`) jadi `503`.
- Jangan panggil dengan array kosong — caller (`route.ts`) wajib cek `reports.length === 0`
  dulu sebelum memanggil fungsi ini, supaya tidak memboroskan kuota Gemini untuk kawasan
  tanpa laporan.
- Payload yang dikirim ke Gemini **hanya** `title`, `description`, `total_comment`, `likes` —
  tidak ada data identitas karena kolomnya memang tidak ada di tabel sumber.
