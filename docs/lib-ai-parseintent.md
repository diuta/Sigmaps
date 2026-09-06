# lib/ai/parseIntent.ts

Titik sentuh AI #3 (`context/context-final.md` §7.2, `context/context-mvp.md` §6.6): ubah
kalimat bebas rencana usaha (Business Brief) jadi `Intent` terstruktur lewat Gemini. Dipakai
satu-satunya oleh [app/api/prompt-request/route.ts](api-prompt-request.md).

## Cara pakai

```ts
import { parseIntent, NonCulinaryError, IntentValidationError, GeminiUnavailableError } from '@/lib/ai/parseIntent'
import { getTipe3Values } from '@/lib/tipe3'

const tipe3Values = await getTipe3Values()

try {
  const intent = await parseIntent('mau buka warung nasi padang harga sekitar 20000 per porsi', tipe3Values)
  // { tipe_3: 'RESTORAN PADANG', harga_target: 20000, harga_sumber: 'pengguna', confidence: 0.9 }
} catch (error) {
  if (error instanceof NonCulinaryError) { /* -> 400 */ }
  if (error instanceof IntentValidationError) { /* -> 422 */ }
  if (error instanceof GeminiUnavailableError) { /* -> 503 */ }
}
```

`tipe3Values` sengaja **diterima sebagai parameter**, bukan di-fetch sendiri di dalam fungsi
ini — pemanggilnya (`route.ts`) yang mengambilnya lebih dulu dari `getTipe3Values()`, supaya
kegagalan Supabase bisa dipetakan ke `503` secara eksplisit **sebelum** Gemini dipanggil sama
sekali (pola yang sama seperti `app/api/score/route.ts`).

## Dependency/prasyarat

- [lib/ai/gemini.ts](lib-ai-gemini.md) — `geminiFlashLite`, butuh `GEMINI_API_KEY`.
- `lib/schemas/prompt-request.ts` — `buildGeminiRawSchema(tipe3Values)`.

## Batasan/gotcha

- **Server-only** (transitif lewat `lib/ai/gemini.ts`) — jangan import dari Client Component.
- Pakai `generateText` + `JSON.parse` manual + validasi Zod, **bukan** `generateObject`
  (keputusan tim eksplisit, bukan library deprecation — lihat `docs/api-prompt-request.md`).
- **Tiga kelas error, wajib ditangkap dengan `instanceof` di pemanggil** (`route.ts` memetakan
  ke kode HTTP sesuai `context/context-mvp.md` §6.8b):
  - `GeminiUnavailableError` — panggilan `generateText` sendiri gagal (network, auth, kuota,
    dll — tidak dibedakan, semua dianggap "AI tidak tersedia").
  - `IntentValidationError` — teks balasan Gemini bukan JSON valid, atau tidak lolos
    `buildGeminiRawSchema`. **Tidak ada retry otomatis** di sini (beda dari
    `generateObject` yang punya retry bawaan AI SDK) — begitu gagal sekali, langsung throw.
  - `NonCulinaryError` — JSON valid, tapi Gemini menandai `is_kuliner: false`. `'SEMUA'`
    sengaja **tidak** dipakai sebagai sinyal ini — `'SEMUA'` tetap berarti "jenis kuliner
    tidak disebut jelas" (valid, tetap diproses), beda dari "usaha ini bukan kuliner sama
    sekali" (`is_kuliner: false`, ditolak). Kalau keduanya disatukan lewat `'SEMUA'` saja,
    usaha non-kuliner tidak pernah bisa ditolak eksplisit (`context-mvp.md` §6.8b:
    "'SEMUA' bukan tempat pembuangan").
- **`is_kuliner` bukan bagian kontrak publik `Intent`/`IntentSchema`** — field ini cuma ada
  di `buildGeminiRawSchema` (superset internal), dan dibuang (destructuring) sebelum
  `parseIntent` mengembalikan hasil. Jangan expose field ini ke response API.
- Sistem prompt yang dikirim ke Gemini **wajib** menyertakan daftar `tipe3Values` dari
  pemanggil supaya Gemini cuma memilih kategori yang benar-benar ada di database — jangan
  hardcode daftar kategori di prompt.
