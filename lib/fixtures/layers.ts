export const DEFAULT_BASEMAP_ID = "street-v2.0";

export function basemapStyleUrl(styleId: string): string {
  const key = process.env.NEXT_PUBLIC_MAPID_MAPS_KEY ?? "";
  return `https://v2.basemap.mapid.io/styles/${styleId}/style.json?key=${key}`;
}
