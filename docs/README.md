# docs/

Folder ini isinya dokumentasi **cara pakai** tiap fitur (bukan keputusan produk — itu di
`context/`, dan bukan aturan arsitektur — itu di `CLAUDE.md` root).

**Aturan lengkap ada di `CLAUDE.md` bagian "Dokumentasi fitur"** — ringkasnya:

- Wajib ada begitu fitur baru (endpoint API, komponen, modul `lib/`) selesai dibuat.
- Isi minimal: apa fungsinya, cara pakai (contoh nyata), dependency/prasyarat, batasan/gotcha.
- Nama file kebab-case mengikuti path fiturnya. Permukaan frontend yang komponennya banyak dan
  selalu dibaca bersamaan digabung jadi satu dokumen (sidebar, layer peta, hooks) — supaya tidak
  ada 25 file yang harus dijaga sinkron satu per satu.

## ⚠️ Belum diputuskan: pembagian `docs/` vs `context/`

Merge branch skoring (`bb4c280`, 8 September 2026) memindahkan sebagian dokumentasi fitur ke
`context/` — sementara `CLAUDE.md` bagian 10 masih menetapkan `docs/` sebagai tempatnya. Akibatnya
dokumentasi fitur sekarang tersebar di dua folder, dengan **enam nama yang kembar**
(`README.md`, `api-prompt-request.md`, `api-score.md`, `api-stations.md`, `lib-ai-gemini.md`,
`lib-scoring.md`).

Salinan di `context/` sudah ditandai kedaluwarsa — semuanya masih menyebut path sebelum refactor
(`lib/scoring.ts`, `lib/tipe3.ts`, `lib/stations.ts`) — tapi **belum dihapus**, karena
pembagian foldernya keputusan tim, bukan keputusan satu orang. **Yang perlu dipilih:**

1. `docs/` untuk seluruh dokumentasi fitur, `context/` khusus kebenaran produk (PRD,
   `context-final.md`, `context-mvp.md`, ERD) — sesuai `CLAUDE.md` §10 yang berlaku sekarang; atau
2. `context/` untuk semuanya, dan `CLAUDE.md` §10 ikut diperbarui.

Sampai itu diputuskan, **tulis dokumentasi fitur baru di `docs/`** (aturan yang masih tertulis),
dan tautan lintas folder ditulis relatif (`../context/<nama>.md`).

## Daftar isi

### Endpoint (`app/api/*`)

| Dokumen | Endpoint |
|---|---|
| [api-stations.md](api-stations.md) | `GET /api/stations` |
| [api-prompt-request.md](api-prompt-request.md) | `POST /api/prompt-request` (AI #3) |
| [api-score.md](api-score.md) | `POST /api/score` |
| [api-properties.md](../context/api-properties.md) | `GET /api/properties` |
| [api-community-sentiment.md](../context/api-community-sentiment.md) | `GET /api/community-sentiment` (AI #5) |

### Modul `lib/`

| Dokumen | Modul |
|---|---|
| [lib-scoring.md](lib-scoring.md) | `lib/scoring/index.ts` — mesin skor deterministik |
| [lib-scoring-explanations.md](lib-scoring-explanations.md) | `lib/scoring/explanations.ts` — kalimat komponen (+ test) |
| [lib-stations.md](../context/lib-stations.md) | `lib/station/index.ts` |
| [lib-properties.md](../context/lib-properties.md) | `lib/property/index.ts` |
| [lib-tipe3.md](../context/lib-tipe3.md) | `lib/tipe3/index.ts` |
| [lib-supabase-server.md](../context/lib-supabase-server.md) | `lib/supabase/server.ts` |
| [lib-ai-gemini.md](lib-ai-gemini.md) | `lib/ai/gemini.ts` |
| [lib-ai-parseintent.md](../context/lib-ai-parseintent.md) | `lib/ai/parseIntent.ts` |
| [lib-ai-summarize-sentiment.md](../context/lib-ai-summarize-sentiment.md) | `lib/ai/summarizeSentiment.ts` |
| [lib-fixtures.md](lib-fixtures.md) | `lib/fixtures/*` — konstanta tampilan |
| [lib-pdf-business-plan.md](lib-pdf-business-plan.md) | `lib/pdf/businessPlanDocument.tsx` — dokumen PDF ringkasan rencana usaha |

### Frontend

| Dokumen | Isi |
|---|---|
| [component-base-map.md](../context/component-base-map.md) | `components/map/BaseMap.tsx` |
| [component-map-layers.md](component-map-layers.md) | layer peta, `LayerPanel`, dev tools |
| [component-sidebar.md](component-sidebar.md) | seluruh `components/sidebar/*` |
| [hooks.md](hooks.md) | seluruh `hooks/*` (context & fetch) |
| [fe/ARCHITECTURE.md](../context/fe/ARCHITECTURE.md) | struktur direktori, zona kepemilikan, kontrak antar zona |
| [fe/DESIGN.md](../context/fe/DESIGN.md) | token desain, tipografi, spesifikasi visual |

### Pipeline batch (`etl/`)

| Dokumen | Isi |
|---|---|
| [etl-pipeline.md](etl-pipeline.md) | skrip `etl/*.py`, urutan, env var, angka rujukan |
| [etl-n8n-automation.md](etl-n8n-automation.md) | `run_pipeline.py` terjadwal lewat n8n di Docker (`docker-compose.yml`, `n8n/`) |
| [etl-github-actions.md](etl-github-actions.md) | `run_pipeline.py` terjadwal di GitHub Actions, tanpa laptop (`.github/workflows/etl-pipeline.yml`) |

### Arsip

| Dokumen | Catatan |
|---|---|
| [jalur1-context.md](../context/jalur1-context.md) | 🗄️ status Jalur 1 per 29 Agustus 2026, sebagian sudah dicabut — jangan dipakai sebagai acuan |
