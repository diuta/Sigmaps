/**
 * lib/map/isochrone-generator.ts
 * 🟡 DEV / EXPERIMENTAL HELPER — Menghasilkan GeoJSON kontur isokron dinamis
 *
 * Dipakai selama poligon MAPID dari Jalur 2 (B-1) belum final.
 * Mendukung:
 * - Mode: 'organic' (kontur jalanan) atau 'radius' (euclidean circle buffer)
 * - Durasi: 5 menit (~400m) atau 10 menit (~800m) atau custom meter
 * - Menghitung luas area (km²) kasar untuk kebutuhan simulasi penyebut rumus C
 */

import type { FeatureCollection, Polygon } from "geojson";

export interface IsochroneOptions {
  mode: "organic" | "radius";
  radiusMeter: number; // e.g. 400 (5 min) atau 800 (10 min)
}

/**
 * Hitung luas poligon WGS84 kasar dalam km² (Shoelace formula di bola bumi)
 */
export function calculateAreaKm2(coords: [number, number][]): number {
  if (coords.length < 3) return 0;
  let total = 0;
  const rad = Math.PI / 180;
  const R = 6371; // km

  for (let i = 0; i < coords.length - 1; i++) {
    const [p1Lng, p1Lat] = coords[i];
    const [p2Lng, p2Lat] = coords[i + 1];
    total +=
      (p2Lng * rad - p1Lng * rad) *
      (2 + Math.sin(p1Lat * rad) + Math.sin(p2Lat * rad));
  }
  return Math.abs((total * R * R) / 2);
}

export function generateIsochroneGeoJSON(
  lng: number,
  lat: number,
  options: IsochroneOptions = { mode: "organic", radiusMeter: 800 }
): { geojson: FeatureCollection<Polygon>; areaKm2: number } {
  const points = 48;
  const coordinates: [number, number][] = [];
  const earthRadiusKm = 6371;
  const baseRadiusKm = options.radiusMeter / 1000;

  for (let i = 0; i <= points; i++) {
    const angle = (i * 360) / points;
    const rad = (angle * Math.PI) / 180;

    // Jika mode organic: tambahkan variasi deformasi jaringan jalan
    const wobble =
      options.mode === "organic"
        ? 1 +
          0.14 * Math.sin(2 * rad) -
          0.09 * Math.cos(3 * rad) +
          0.06 * Math.sin(5 * rad)
        : 1.0;

    const r = baseRadiusKm * wobble;
    const dLat = (r / earthRadiusKm) * (180 / Math.PI);
    const dLng =
      ((r / earthRadiusKm) * (180 / Math.PI)) /
      Math.cos((lat * Math.PI) / 180);

    coordinates.push([lng + dLng * Math.cos(rad), lat + dLat * Math.sin(rad)]);
  }

  // Inner core radius (~30% dari outer)
  const innerCoords: [number, number][] = [];
  const innerRadiusKm = baseRadiusKm * 0.32;
  for (let i = 0; i <= points; i++) {
    const angle = (i * 360) / points;
    const rad = (angle * Math.PI) / 180;
    const dLat = (innerRadiusKm / earthRadiusKm) * (180 / Math.PI);
    const dLng =
      ((innerRadiusKm / earthRadiusKm) * (180 / Math.PI)) /
      Math.cos((lat * Math.PI) / 180);

    innerCoords.push([lng + dLng * Math.cos(rad), lat + dLat * Math.sin(rad)]);
  }

  const areaKm2 = calculateAreaKm2(coordinates);

  const geojson: FeatureCollection<Polygon> = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { type: "outer-isochrone" },
        geometry: {
          type: "Polygon",
          coordinates: [coordinates],
        },
      },
      {
        type: "Feature",
        properties: { type: "inner-core" },
        geometry: {
          type: "Polygon",
          coordinates: [innerCoords],
        },
      },
    ],
  };

  return { geojson, areaKm2 };
}
