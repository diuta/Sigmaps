export const DEFAULT_BASEMAP_ID = "street-v2.0";

export function basemapStyleUrl(styleId: string): string {
  // NEXT_PUBLIC_MAPID_MAPS_KEY, bukan nama lain — lihat CLAUDE.md bagian 4 soal kenapa nama
  // ini tidak boleh disamakan dengan MAPID_API_KEY (server-only) atau ditulis beda ejaan.
  // Sempat salah jadi NEXT_PUBLIC_MAPID_MAPS_KEY (variabel yang tidak pernah didefinisikan
  // di .env.example), bikin basemap gagal total (?key=undefined) — diperbaiki di sini.
  const key = process.env.NEXT_PUBLIC_MAPID_MAPS_KEY ?? "";
  return `https://v2.basemap.mapid.io/styles/${styleId}/style.json?key=${key}`;
}
