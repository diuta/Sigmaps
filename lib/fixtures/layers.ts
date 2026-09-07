/**
 * Isi panel layer. Panel ini HANYA mengatur tampilan peta — visibilitas layer,
 * opasitas, dan peta dasar. Tidak ada keterangan asal data atau komponen skor di sini.
 */

export interface MapLayerToggle {
  /** Harus sama dengan id layer di components/map/BaseMap.tsx. */
  id: string;
  label: string;
  defaultOn: boolean;
}

/** 🟡 FASE DUMMY — hanya layer yang benar-benar ada di peta pass ini. */
export const MAP_LAYERS: readonly MapLayerToggle[] = [
  { id: "station-pins", label: "Titik stasiun", defaultOn: true },
  { id: "station-labels", label: "Nama stasiun", defaultOn: true },
];

export interface BasemapOption {
  id: string;
  label: string;
}

/** Keempat gaya sudah diverifikasi tersedia di v2.basemap.mapid.io. */
export const BASEMAPS: readonly BasemapOption[] = [
  { id: "street-v2.0", label: "Jalan" },
  { id: "light-v2.0", label: "Terang" },
  { id: "dark-v2.0", label: "Gelap" },
  { id: "satellite-v2.0", label: "Satelit" },
];

export const DEFAULT_BASEMAP_ID = "street-v2.0";

export function basemapStyleUrl(styleId: string): string {
  // NEXT_PUBLIC_MAPID_MAPS_KEY, bukan nama lain — lihat CLAUDE.md bagian 4 soal kenapa nama
  // ini tidak boleh disamakan dengan MAPID_API_KEY (server-only) atau ditulis beda ejaan.
  // Sempat salah jadi NEXT_PUBLIC_MAPID_MAPS_KEY (variabel yang tidak pernah didefinisikan
  // di .env.example), bikin basemap gagal total (?key=undefined) — diperbaiki di sini.
  const key = process.env.NEXT_PUBLIC_MAPID_MAPS_KEY ?? "";
  return `https://v2.basemap.mapid.io/styles/${styleId}/style.json?key=${key}`;
}
