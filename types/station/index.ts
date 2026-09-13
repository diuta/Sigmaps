/**
 * types/station/index.ts
 * Kontrak data stasiun — jangan ubah tanpa diskusi bersama.
 * Sumber: context/context-mvp.md §2 Langkah 1 & §6.8
 *
 * Catatan bersih-bersih: tipe raw GeoJSON dari public/geojson/krl.geojson (StationFeature,
 * StationGeoJSONProperties, StationFeatureCollection versi lama) sudah dihapus dari sini —
 * tidak ada satupun konsumen nyata yang mengimpornya (dicek via grep sebelum dihapus), dan
 * namanya bentrok dengan StationFeatureCollection versi asli /api/stations di lib/station.
 * Bentuk GeoJSON yang sebenarnya dipakai sekarang ada di lib/station/index.ts.
 */

// ---------------------------------------------------------------------------
// Lokasi stasiun saja — tanpa skor
// Dipakai untuk sinkronisasi sidebar ↔ peta (useSelectedStation) dan lookup
// geografis (mis. klik ranking card di sidebar → tahu ke mana flyTo()).
// ---------------------------------------------------------------------------

export interface StationLocation {
  area_id: string;
  station_name: string;
  lng: number;
  lat: number;
  is_rankable: boolean;
}
