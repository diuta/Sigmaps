# hooks/*

Seluruh state bersama dan pengambilan data sisi klien. Tidak ada prop drilling antara sidebar
dan peta: keduanya bertemu di hook, bukan di komponen induk (`docs/fe/ARCHITECTURE.md` §1).

Konvensi: satu folder per topik, komponen/hook di `use*.tsx`, tipe-tipenya di `use*.types.ts`
bersebelahan.

| Hook | Bentuk | Isi | Dipakai |
|---|---|---|---|
| `station/useSelectedStation` | Context | Kawasan aktif (`StationLocation \| null`) | sidebar ⇄ peta |
| `brief/useBriefResult` | Context | Hasil brief: `intent`, `scoreResult`, `loading`, `error`, `submitBrief()` | `Sidebar`, `ScoredPanel`, `StationLayer` |
| `map/useMapInstance` | Context | Instance `maplibregl.Map` | **hanya** `components/map/*` |
| `isochrone/useIsochroneConfig` | Context | 🟡 Parameter isokron sintetis + luas terhitung | `IsochroneLayer`, `DevToolsOverlay` |
| `property/usePropertyPopupConfig` | Context | 🟡 Varian & tema popup properti | `PropertyLayer`, `DevToolsOverlay` |
| `station/useStations` | Fetch | `GET /api/stations`, sekali saat mount | `StationLayer`, `ScoredPanel` |
| `property/useProperties` | Fetch | `GET /api/properties?station_id=` | `PropertyLayer`, `PropertyList` |
| `sentiment/useCommunitySentiment` | Fetch | `GET /api/community-sentiment?station_id=` | `ScoredPanel` |

## Cara pakai

### Hook fetch — pola sama ketiganya

Argumen `null` berarti "belum perlu ambil": hook tidak memanggil apa pun dan mengosongkan
hasilnya. Semua punya penjaga `cancelled` supaya respons yang datang telat tidak menimpa state
setelah argumennya berganti.

```tsx
const { stations, loading, error } = useStations();
const { properties, loading, error } = useProperties(stationId);      // null = lewati
const { sentiment, loading, error } = useCommunitySentiment(stationId); // null = lewati
```

Ketiganya membaca amplop `{ data }` / `{ error }` dari route dan mengembalikan isi `data` saja
(kecuali `useProperties`, yang **meratakan** FeatureCollection jadi `PropertyUnit[]` dengan
`lat`/`lng` sebagai field biasa, supaya komponen tidak perlu tahu bentuk GeoJSON).

### `useBriefResult` — satu aksi, dua endpoint

```tsx
const { intent, scoreResult, loading, error, submitBrief } = useBriefResult();
await submitBrief("kedai kopi kecil, harga sekitar 25000");
// 1) POST /api/prompt-request { prompt }        -> intent  { tipe_3, harga_target, harga_sumber, confidence }
// 2) POST /api/score          { tipe_3, harga_target, harga_sumber } -> scoreResult { areas, catatan }
```

Sengaja **satu** hook untuk dua endpoint (bukan `usePromptRequest` + `useScore` terpisah):
keduanya selalu dipanggil berurutan sebagai satu aksi user ("nilai kawasan"), jadi memisahkannya
hanya menambah tempat untuk lupa menyambungkan. Gagal di langkah 1 → langkah 2 tidak pernah
jalan, dan `error` diisi pesan dari server apa adanya (mis. "Usaha yang disebut bukan usaha
kuliner").

`harga_sumber` sengaja dikirim balik ke `/api/score` supaya server bisa mengisi
`catatan.harga_sumber` tanpa menebak (lihat [docs/api-score.md](api-score.md)).

### Context penyambung sidebar ⇄ peta

```tsx
const { selectedStation, setSelectedStation } = useSelectedStation();
// sidebar & StationLayer MENULIS; BaseMap MEMBACA lalu flyTo()
setSelectedStation({ area_id, station_name, lng, lat, is_rankable });
```

Bentuknya `StationLocation` (`types/station/index.ts`) — lokasi + identitas saja, **tanpa** skor.
Skor tidak perlu ikut karena pembacanya sudah punya `useBriefResult()`.

### Urutan provider (`app/page.tsx`)

```
SelectedStationProvider          ← dipakai sidebar DAN peta
└── BriefResultProvider          ← dipakai sidebar (ScoredPanel) DAN peta (StationLayer)
    └── IsochroneConfigProvider  🟡 dev
        └── PropertyPopupConfigProvider  🟡 dev
            └── <main> Sidebar + BaseMap(→ MapInstanceProvider → layers)
```

Dua provider teratas berada di atas **sidebar dan peta sekaligus** — bukan di dalam `Sidebar` —
justru karena keduanya dibaca dua-duanya. `MapInstanceProvider` beda: ia dipasang di dalam
`BaseMap`, setelah map `'load'`, sehingga hanya menjangkau layer.

## Dependency/prasyarat

- Semua file di sini `'use client'`.
- Kelima context hook **melempar galat** kalau dipakai di luar provider-nya (kecuali
  `useMapInstance`, yang memberi nilai bawaan `{ map: null }`).
- Endpoint terkait harus hidup; kalau Supabase/Gemini mati, hook mengisi `error` dan komponen
  tetap render (degradasi anggun, `context-mvp.md` §6.8b).

## Batasan/gotcha

- **`useMapInstance` hanya untuk `components/map/*`.** Sidebar tidak boleh meng-import-nya —
  itu jalan pintas menuju `map.flyTo()` langsung dari sidebar, yang dilarang
  (`docs/fe/ARCHITECTURE.md` §4.1).
- **`useCommunitySentiment` memanggil Gemini di setiap request** — `/api/community-sentiment`
  belum punya cache (lihat [docs/api-community-sentiment.md](api-community-sentiment.md)),
  dan kuota Gemini dihitung per project, dipakai bersama semua pengunjung. Jangan memanggil
  hook ini dengan `station_id` yang berubah-ubah cepat (mis. mengikuti hover), dan jangan
  memasangnya di komponen yang sering di-mount ulang.
- **`useStations` mengambil data sekali saat mount** dan tidak pernah menyegarkan. Cukup untuk
  katalog stasiun yang praktis statis; kalau nanti butuh refresh, tambahkan fungsi refetch —
  jangan menambah `stationId` ke array dependency-nya.
- **`useProperties` menganggap geometry selalu Point.** `/api/properties` memang selalu
  mengembalikan titik; kalau kelak ada poligon, perataan `coordinates[0]/[1]` di sini pecah.
- `useIsochroneConfig` dan `usePropertyPopupConfig` adalah **alat pengembangan**. Keduanya ikut
  dihapus bersama `components/map/dev/` dan `lib/map/isochrone-generator.ts` begitu poligon
  MAPID asli dipasang.
- Belum ada penanganan race antar submit brief: menekan "Nilai ulang" dua kali cepat membuat
  dua rangkaian request berjalan, dan yang selesai belakangan yang menang. Tombolnya
  dinonaktifkan selama `loading`, jadi praktis tidak terjadi lewat UI.
