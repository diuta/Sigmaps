# `app/api/stations/route.ts` — GET /api/stations

## Apa fungsinya

Mengembalikan **43 stasiun commuter DKI** beserta poligon isokronnya. Satu endpoint melayani
dua layer peta sekaligus:

```
StationLayer    -> feature.geometry            titik penanda stasiun
IsochroneLayer  -> feature.properties.isokron  poligon MAPID asli
```

Tidak butuh parameter apa pun, dan tidak bergantung pada pencarian pengguna — dipanggil sekali
saat halaman dibuka.

## Cara pakai

```
GET /api/stations
```

```jsonc
{
  "data": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": { "type": "Point", "coordinates": [106.7366, -6.15997] },
        "properties": {
          "station_id": "R-1",
          "nama": "STASIUN BOJONG INDAH",
          "tipe_3": "COMMUTER",
          "kecamatan": "CENGKARENG",
          "kabkot": "KOTA ADM. JAKARTA BARAT",

          "is_rankable": false,        // null = pipeline batch belum jalan
          "area_km2": 0.721,
          "isokron": {                 // poligon MAPID asli, foot / 600 detik
            "type": "Polygon",
            "coordinates": [[[106.7356, -6.1556], /* ... */]]
          }
        }
      }
      // ... 42 stasiun lain
    ]
  }
}
```

`IsochroneLayer` merakit sumbernya sendiri dari `properties.isokron`:

```ts
const fc = {
  type: "FeatureCollection",
  features: stations
    .filter((s) => s.properties.isokron)
    .map((s) => ({
      type: "Feature",
      geometry: s.properties.isokron,
      properties: {
        station_id: s.properties.station_id,
        is_rankable: s.properties.is_rankable,
      },
    })),
}
```

Galat: Supabase tidak merespons → `503 { "error": "Gagal mengambil data stasiun" }`.

## Dependency/prasyarat

- View **`stasiun_kawasan`** (`supabase/views.sql`) — join `stasiun` ⟕ `scored_areas`.
- `lib/station/index.ts` — `toStationsFeatureCollection()`.
- `lib/supabase/server.ts` — butuh `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY`.
- Tabel `stasiun` terisi (impor CSV manual) dan `scored_areas` terisi
  ([`etl/load_isokron.py`](etl-pipeline.md)).

## Batasan/gotcha

**1. Membaca view, bukan tabel `stasiun` langsung.** Tabel `stasiun` sendiri tidak butuh view
— koordinatnya dua kolom angka biasa. Yang memaksa view adalah kolom `isokron`: dia berasal
dari `scored_areas.geom`, kolom geometry PostGIS, dan PostgREST mengembalikan kolom geometry
sebagai **WKB hex** kalau dibaca langsung. Konversinya (`ST_AsGeoJSON`) wajib di sisi database.

**2. Poligon ada di `properties`, bukan `geometry`.** Satu Feature GeoJSON hanya boleh punya
satu `geometry`, dan itu sudah dipakai titik penanda stasiun. Konsekuensinya **MapLibre tidak
bisa memakai `properties.isokron` langsung sebagai sumber** — harus dirakit dulu seperti
contoh di atas.

**3. `is_rankable: null` ≠ `false`.** `null` berarti pipeline batch belum jalan (LEFT JOIN
tidak menemukan pasangan di `scored_areas`); `false` berarti kawasannya ada tapi datanya belum
cukup untuk diperingkat. Peta perlu membedakannya: yang `null` belum diproses sama sekali.

**4. `is_rankable` sengaja di sini, BUKAN di `/api/score`.** Dia sifat kawasan, bukan hasil
pencarian — Stasiun Angke kekurangan data entah pengguna mencari sushi atau warteg. Jadi peta
dapat meredupkan kawasan miskin data sejak halaman dibuka. `/api/score` juga tidak mungkin
jadi sumbernya: endpoint itu sengaja hanya mengirim Top 5.

Per 8 September 2026: **11 dari 43** kawasan `is_rankable = true`. 32 sisanya harus diberi
label "data belum cukup" (`context-mvp.md` §6.8), bukan dibiarkan terlihat sama dengan kawasan
yang sudah dinilai tapi skornya rendah — ketiadaan data tersaji seolah penilaian negatif.

**5. `.select()` wajib satu string literal, jangan dipecah dengan `+`.** supabase-js membaca
bentuk hasilnya dari literal itu saat typecheck. Begitu digabung, tipenya jatuh ke
`GenericStringError[]` dan cast ke `StationRow[]` ditolak TypeScript.

**6. Payload ~37 KB**, naik dari ~6 KB karena 43 poligon. Ikut terkirim tiap halaman dibuka
meski layer isokron sedang dimatikan. Untuk jumlah ini tidak terasa; kalau daftar stasiun
nanti membengkak, pertimbangkan memisahnya jadi endpoint sendiri.

**7. `lib/map/isochrone-generator.ts` sudah usang.** Helper itu menggambar lingkaran sintetis
selama poligon MAPID belum ada (masa B-1 masih memblokir). Sekarang poligon aslinya tersedia
lewat endpoint ini, jadi helper tersebut — beserta `hooks/isochrone/useIsochroneConfig.tsx` —
bisa dihapus begitu `IsochroneLayer` dipindahkan. Membiarkan keduanya berdampingan berarti ada
dua sumber poligon yang berbeda di satu peta.
