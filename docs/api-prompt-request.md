# app/api/prompt-request/route.ts

Terima teks bebas dari user (Business Brief), kirim ke Gemini lewat `generateText`, balikin
teks mentah. Placeholder sementara untuk titik integrasi #3 — belum parse jadi objek
terstruktur (lihat Batasan/gotcha).

## Cara pakai

```
POST /api/prompt-request
Content-Type: application/json

{ "teks": "toko roti pagi buat pekerja kantoran" }
```

Respons sukses:

```json
{ "data": { "text": "..." } }
```

Respons gagal (input tidak valid → 400, error Gemini/server → 500):

```json
{ "error": "Input tidak valid" }
```

## Dependency/prasyarat

- [lib/ai/gemini.ts](lib-ai-gemini.md) — client Gemini, butuh `GEMINI_API_KEY`.
- `lib/schemas/prompt-request.ts` — `PromptRequestSchema` (validasi request).

## Batasan/gotcha

- Pakai `generateText`, **bukan** `generateObject` — `generateObject` sudah deprecated di
  Vercel AI SDK versi yang dipakai project ini. Konsekuensinya: output Gemini sekarang teks
  bebas, **tidak** divalidasi/dipaksa ke skema Zod tertentu.
- `IntentSchema` di `lib/schemas/prompt-request.ts` masih ada tapi **tidak dipakai** route
  ini sekarang (peninggalan pendekatan `generateObject`). Skema final untuk parse jadi
  arketipe+bobot (kategori_usaha, target_jam, segmen, skala, weights, confidence — lihat
  `context/context-final.md` §7.2 titik #3) belum disepakati tim — endpoint ini belum siap
  dipakai fitur Business Brief yang sesungguhnya.
- Route ini sengaja tipis (cuma validasi → panggil Gemini → format response) sesuai
  `CLAUDE.md` bagian 2 — kalau butuh logic tambahan (mis. parsing teks jadi structured data),
  taruh di `lib/`, bukan di `route.ts`.
