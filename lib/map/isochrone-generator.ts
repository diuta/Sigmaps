import type { FeatureCollection, Polygon, MultiPolygon } from "geojson";

export interface IsochroneOptions {
  mode?: "organic" | "circle";
  radiusMeter?: number;
}

export function generateIsochroneGeoJSON(
  _lng: number,
  _lat: number,
  _options?: IsochroneOptions
): { geojson: FeatureCollection<Polygon | MultiPolygon> } {
  return {
    geojson: {
      type: "FeatureCollection",
      features: [],
    },
  };
}
