# hooks/*

Seluruh state bersama dan pengambilan data sisi klien. Tidak ada prop drilling antara sidebar
dan peta: keduanya bertemu di hook, bukan di komponen induk (`context/fe/ARCHITECTURE.md` §1).

Konvensi: satu folder per topik, komponen/hook di `use*.tsx`, tipe-tipenya di `use*.types.ts`
bersebelahan.

| Hook | Bentuk | Isi | Dipakai |
|---|---|---|---|
| `station/useSelectedStation` | Context | Kawasan aktif (`StationLocation \| null`) | sidebar ⇄ peta |
| `brief/useBriefResult` | Context | Hasil brief: `intent`, `scoreResult`, `loading`, `error`, `submitBrief()` | `Sidebar`, `ScoredPanel`, `StationLayer` |
| `map/useMapInstance` | Context | Instance `maplibregl.Map` | **hanya** `components/map/*` |
| `api/useApiJson` | Fetch (dasar) | Mesin state bersama semua hook fetch di bawah; cache + dedup per URL lewat `helper/fetch-json-cached.ts` | hook fetch lain, bukan komponen |
| `station/useStations` | Fetch | `GET /api/stations` | `StationLayer`, `IsochroneLayer`, `StationSearchBar`, `ScoredPanel` |
| `property/useProperties` | Fetch | `GET /api/properties?station_id=` | `PropertyLayer`, `ScoredPanel`, `StationNoBriefPanel` |
| `property/useAllPropertiesSummary` | Fetch | `GET /api/properties?summary=true` → `Map` meta per stasiun | `StationSearchBar` |
| `sentiment/useCommunitySentiment` | Fetch | `GET /api/community-sentiment?station_id=` | `ScoredPanel`, `StationNoBriefPanel` |

## Cara pakai

### Hook fetch — satu mesin, empat pembungkus

Keempat hook fetch adalah pembungkus tipis di atas `useApiJson<T>(url | null, pesanGalat)`
(`hooks/api/useApiJson.ts`). Argumen `null` berarti "belum perlu ambil": tidak ada request,
hasilnya kosong. Penjaga `cancelled` ada di satu tempat, bukan disalin ke tiap hook.

Di bawahnya, `helper/fetch-json-cached.ts` memoisasi **promise** per URL: beberapa komponen
yang memanggil hook yang sama untuk URL yang sama (tiga pemanggil `useStations()` saat halaman
dimuat, dua pemanggil `useProperties(id)` tiap klik stasiun) berbagi satu request dan satu objek
hasil. Terukur: `/api/stations` 3× → 1× per muat halaman, `/api/properties` 2× → 1× per klik
stasiun. Hanya respons `ok` yang di-cache (TTL 10 menit); respons gagal dibuang supaya percobaan
berikutnya mengulang.

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
  (`context/fe/ARCHITECTURE.md` §4.1).
- **`useCommunitySentiment` memanggil Gemini sekali per stasiun** — `/api/community-sentiment`
  di-cache per `station_id` di server (`lib/sentiment`, lihat
  [api-community-sentiment.md](../context/api-community-sentiment.md)); panggilan pertama
  1–3 detik, berikutnya ~5 ms. Kuota Gemini tetap per project, jadi tetap jangan memanggil hook
  ini dengan `station_id` yang berubah-ubah cepat (mis. mengikuti hover).
- **Hook fetch tidak pernah menyegarkan sendiri** — hasil sukses bertahan di cache klien 10
  menit (`helper/fetch-json-cached.ts`). Cukup untuk data yang praktis statis (katalog stasiun,
  properti per kawasan hasil batch). Kalau nanti butuh refresh manual, panggil
  `clearFetchJsonCache()` lalu ganti `url`-nya; jangan menambah dependency palsu ke efeknya.
- **Saat `url` berganti, `data` langsung `null` dan `loading` `true`** sampai jawaban URL baru
  datang — komponen tidak sempat melihat data URL lama (dulu `useProperties` menahan daftar
  stasiun sebelumnya selama memuat). Untuk URL yang sudah di-cache jedanya satu frame.
- **`useProperties` menganggap geometry selalu Point.** `/api/properties` memang selalu
  mengembalikan titik; kalau kelak ada poligon, perataan `coordinates[0]/[1]` di sini pecah.
- Belum ada penanganan race antar submit brief: menekan "Nilai ulang" dua kali cepat membuat
  dua rangkaian request berjalan, dan yang selesai belakangan yang menang. Tombolnya
  dinonaktifkan selama `loading`, jadi praktis tidak terjadi lewat UI.
