# lib/fixtures/*

Konstanta tampilan yang ditulis tangan: pilihan peta dasar, daftar layer yang bisa
dinyalakan/dimatikan, dan contoh teks Business Brief. Bukan data hasil query, bukan logic —
kalau butuh angka atau baris dari database, tempatnya bukan di sini.

| File | Isi |
|---|---|
| `layers.ts` | `DEFAULT_BASEMAP_ID`, `basemapStyleUrl()` |
| `brief.ts` | `BRIEF_PLACEHOLDER`, `SUGGESTION_CHIPS` |

## Cara pakai

```ts
import { basemapStyleUrl, DEFAULT_BASEMAP_ID } from '@/lib/fixtures/layers'

new maplibregl.Map({ style: basemapStyleUrl(DEFAULT_BASEMAP_ID), /* ... */ })
// https://v2.basemap.mapid.io/styles/street-v2.0/style.json?key=<NEXT_PUBLIC_MAPID_MAPS_KEY>

```

```ts
import { BRIEF_PLACEHOLDER, SUGGESTION_CHIPS } from '@/lib/fixtures/brief'
// placeholder textarea + chip contoh yang mengisi textarea saat diklik
```

## Dependency/prasyarat

- Env var `NEXT_PUBLIC_MAPID_MAPS_KEY` (public, sengaja dibundel ke browser).
- Gaya lain yang tersedia di `v2.basemap.mapid.io`: `light-v2.0`, `dark-v2.0`, `satellite-v2.0`
  (daftar `BASEMAPS` lama dihapus bersama `LayerPanel`; kalau pemilih peta dasar dibuat lagi,
  taruh daftarnya kembali di sini).

## Batasan/gotcha

- **Nama env var-nya `NEXT_PUBLIC_MAPID_MAPS_KEY`, bukan `MAPID_API_KEY`.** Menyamakan keduanya
  membuat key Competition API ikut ter-bundle ke browser (`CLAUDE.md` bagian 4) — pernah terjadi
  dan membuat basemap gagal total dengan `?key=undefined`. `basemapStyleUrl()` sengaja tidak
  melempar galat saat key kosong, jadi gejalanya muncul sebagai `AJAXError: Failed to fetch`
  pada `style.json`, bukan pesan yang jelas.
- Kalau nanti ada daftar toggle layer lagi: `StationLayer`/`PropertyLayer` memakai marker HTML,
  bukan layer MapLibre — hanya id hasil `map.addLayer()` (`isochrone-*`, `route-*`) yang bisa
  di-toggle lewat `setLayoutProperty`. Lihat [docs/component-map-layers.md](component-map-layers.md).
- `brief.ts` **hanya teks contoh untuk manusia**, bukan preset parameter — chip yang diklik
  tetap melewati `/api/prompt-request` seperti kalimat yang diketik sendiri, tidak ada jalur
  pintas yang melewati AI.
- Folder ini menggantikan `lib/dummy/*` di dokumen lama. Bedanya bukan sekadar nama: isi
  `lib/dummy/*` dulu berpura-pura jadi respons API (sudah dihapus, semua hook memakai endpoint
  nyata), sedangkan isi `fixtures/` memang konstanta tampilan yang akan tetap ada. **Jangan
  menaruh data palsu pengganti API di sini.**
