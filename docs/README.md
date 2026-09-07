# docs/

Folder ini isinya dokumentasi **cara pakai** tiap fitur (bukan keputusan produk — itu di
`context/`, dan bukan aturan arsitektur — itu di `CLAUDE.md` root).

**Aturan lengkap ada di `CLAUDE.md` bagian "Dokumentasi fitur"** — ringkasnya:

- Wajib ada begitu fitur baru (endpoint API, komponen, modul `lib/`) selesai dibuat.
- Isi minimal: apa fungsinya, cara pakai (contoh nyata), dependency/prasyarat, batasan/gotcha.
- Nama file kebab-case mengikuti path fiturnya. Permukaan frontend yang komponennya banyak dan
  selalu dibaca bersamaan digabung jadi satu dokumen (sidebar, layer peta, hooks) — supaya tidak
  ada 25 file yang harus dijaga sinkron satu per satu.

## Daftar isi

### Endpoint (`app/api/*`)

| Dokumen | Endpoint |
|---|---|
| [api-stations.md](api-stations.md) | `GET /api/stations` |
| [api-prompt-request.md](api-prompt-request.md) | `POST /api/prompt-request` (AI #3) |
| [api-score.md](api-score.md) | `POST /api/score` |
| [api-properties.md](api-properties.md) | `GET /api/properties` |
| [api-community-sentiment.md](api-community-sentiment.md) | `GET /api/community-sentiment` (AI #5) |

### Modul `lib/`

| Dokumen | Modul |
|---|---|
| [lib-scoring.md](lib-scoring.md) | `lib/scoring/index.ts` — mesin skor deterministik |
| [lib-scoring-explanations.md](lib-scoring-explanations.md) | `lib/scoring/explanations.ts` — kalimat komponen (+ test) |
| [lib-stations.md](lib-stations.md) | `lib/station/index.ts` |
| [lib-properties.md](lib-properties.md) | `lib/property/index.ts` |
| [lib-tipe3.md](lib-tipe3.md) | `lib/tipe3/index.ts` |
| [lib-supabase-server.md](lib-supabase-server.md) | `lib/supabase/server.ts` |
| [lib-ai-gemini.md](lib-ai-gemini.md) | `lib/ai/gemini.ts` |
| [lib-ai-parseintent.md](lib-ai-parseintent.md) | `lib/ai/parseIntent.ts` |
| [lib-ai-summarize-sentiment.md](lib-ai-summarize-sentiment.md) | `lib/ai/summarizeSentiment.ts` |
| [lib-fixtures.md](lib-fixtures.md) | `lib/fixtures/*` — konstanta tampilan |

### Frontend

| Dokumen | Isi |
|---|---|
| [component-base-map.md](component-base-map.md) | `components/map/BaseMap.tsx` |
| [component-map-layers.md](component-map-layers.md) | layer peta, `LayerPanel`, dev tools |
| [component-sidebar.md](component-sidebar.md) | 13 komponen `components/sidebar/*` |
| [hooks.md](hooks.md) | seluruh `hooks/*` (context & fetch) |
| [fe/ARCHITECTURE.md](fe/ARCHITECTURE.md) | struktur direktori, zona kepemilikan, kontrak antar zona |
| [fe/DESIGN.md](fe/DESIGN.md) | token desain, tipografi, spesifikasi visual |

### Arsip

| Dokumen | Catatan |
|---|---|
| [jalur1-context.md](jalur1-context.md) | 🗄️ status Jalur 1 per 29 Agustus 2026, sebagian sudah dicabut — jangan dipakai sebagai acuan |
