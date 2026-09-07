// kept as an artifact in case dibutuhin lagi

import type { FeatureCollection, Geometry } from "geojson";

export default function hexArea(
  long: number,
  lat: number,
): FeatureCollection<Geometry> {
  const lat1 = lat + (1 / 111.32) * Math.sin(((360 * 1) / 6) * (Math.PI / 180));
  const lat2 = lat + (1 / 111.32) * Math.sin(((360 * 2) / 6) * (Math.PI / 180));
  const lat3 = lat + (1 / 111.32) * Math.sin(((360 * 3) / 6) * (Math.PI / 180));
  const lat4 = lat + (1 / 111.32) * Math.sin(((360 * 4) / 6) * (Math.PI / 180));
  const lat5 = lat + (1 / 111.32) * Math.sin(((360 * 5) / 6) * (Math.PI / 180));
  const lat6 = lat + (1 / 111.32) * Math.sin(((360 * 6) / 6) * (Math.PI / 180));

  const long1 =
    long +
    (1 / (111.32 * Math.cos(lat * (Math.PI / 180)))) *
      Math.cos(((360 * 1) / 6) * (Math.PI / 180));
  const long2 =
    long +
    (1 / (111.32 * Math.cos(lat * (Math.PI / 180)))) *
      Math.cos(((360 * 2) / 6) * (Math.PI / 180));
  const long3 =
    long +
    (1 / (111.32 * Math.cos(lat * (Math.PI / 180)))) *
      Math.cos(((360 * 3) / 6) * (Math.PI / 180));
  const long4 =
    long +
    (1 / (111.32 * Math.cos(lat * (Math.PI / 180)))) *
      Math.cos(((360 * 4) / 6) * (Math.PI / 180));
  const long5 =
    long +
    (1 / (111.32 * Math.cos(lat * (Math.PI / 180)))) *
      Math.cos(((360 * 5) / 6) * (Math.PI / 180));
  const long6 =
    long +
    (1 / (111.32 * Math.cos(lat * (Math.PI / 180)))) *
      Math.cos(((360 * 6) / 6) * (Math.PI / 180));

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [long1, lat1],
              [long2, lat2],
              [long3, lat3],
              [long4, lat4],
              [long5, lat5],
              [long6, lat6],
              [long1, lat1],
            ],
          ],
        },
        properties: {},
      },
    ],
  };
}
