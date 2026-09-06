import assert from "node:assert/strict";
import { findStation, stationsGeoJson } from "./stations-geojson.ts";

const stations = [
  { area_id: "st_juanda", station_name: "Stasiun Juanda", lng: 106.83, lat: -6.16, is_rankable: true },
  { area_id: "st_karet", station_name: "Stasiun Karet", lng: 106.81, lat: -6.2, is_rankable: false },
];

const fc = stationsGeoJson(stations);
assert.equal(fc.type, "FeatureCollection");
assert.equal(fc.features.length, 2);

// Urutan koordinat GeoJSON adalah [lng, lat], bukan [lat, lng].
assert.deepEqual(fc.features[0].geometry.coordinates, [106.83, -6.16]);

// is_rankable harus ikut terbawa: paint peta membedakan pin dari properti ini.
assert.equal(fc.features[0].properties.is_rankable, true);
assert.equal(fc.features[1].properties.is_rankable, false);

assert.equal(stationsGeoJson([]).features.length, 0);

assert.equal(findStation(stations, "st_karet")?.station_name, "Stasiun Karet");
assert.equal(findStation(stations, "st_tidak_ada"), null);

console.log("stations-geojson: ok");
