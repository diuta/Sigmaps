import assert from "node:assert/strict";
import { kategoriJarang, type GapRow } from "./index.ts";

function kawasan(key: string, counts: Record<string, number>, km2 = 1): GapRow {
  return { key, area_km2: km2, competitor_counts: counts };
}

// Enam kawasan: SEAFOOD ada di lima, kosong di A -> celah nyata di A.
// RESTORAN AFRIKA hanya ada di satu kawasan -> di bawah ambang, tidak pernah
// disebut sebagai celah walau A memang tidak punya.
const rows = [
  kawasan("A", { SEAFOOD: 0 }),
  kawasan("B", { SEAFOOD: 10, "RESTORAN AFRIKA": 4 }),
  kawasan("C", { SEAFOOD: 10 }),
  kawasan("D", { SEAFOOD: 10 }),
  kawasan("E", { SEAFOOD: 10 }),
  kawasan("F", { SEAFOOD: 10 }),
];

assert.deepEqual(kategoriJarang(rows, "A"), ["SEAFOOD"]);
assert.deepEqual(kategoriJarang(rows, "B"), []);
assert.ok(!kategoriJarang(rows, "A").includes("RESTORAN AFRIKA"));

// Ambang sebaran: kelompok yang cuma ada di empat kawasan belum dianggap pasar.
const sedikit = [
  kawasan("A", {}),
  kawasan("B", { "RESTORAN KOREA": 10 }),
  kawasan("C", { "RESTORAN KOREA": 10 }),
  kawasan("D", { "RESTORAN KOREA": 10 }),
  kawasan("E", { "RESTORAN KOREA": 10 }),
  kawasan("F", {}),
];
assert.deepEqual(kategoriJarang(sedikit, "A"), []);

// Kepadatan, bukan jumlah mentah: A punya pesaing paling banyak, tapi luasnya
// dua belas kali lipat, jadi tetap lebih jarang daripada kawasan lain.
const perLuas = [
  kawasan("A", { SEAFOOD: 12 }, 12),
  kawasan("B", { SEAFOOD: 10 }),
  kawasan("C", { SEAFOOD: 10 }),
  kawasan("D", { SEAFOOD: 10 }),
  kawasan("E", { SEAFOOD: 10 }),
  kawasan("F", { SEAFOOD: 10 }),
];
assert.deepEqual(kategoriJarang(perLuas, "A"), ["SEAFOOD"]);

// Urutan: kekurangan paling dalam dulu (relatif, bukan absolut), maksimal tiga.
const penuh = { SEAFOOD: 10, "MIE DAN BAKSO": 10, "NASI GORENG": 10, "RESTORAN PADANG": 10 };
const banyak = [
  kawasan("A", { SEAFOOD: 5, "MIE DAN BAKSO": 1, "NASI GORENG": 3, "RESTORAN PADANG": 4 }),
  kawasan("B", penuh),
  kawasan("C", penuh),
  kawasan("D", penuh),
  kawasan("E", penuh),
  kawasan("F", penuh),
];
assert.deepEqual(kategoriJarang(banyak, "A"), ["MIE DAN BAKSO", "NASI GORENG", "RESTORAN PADANG"]);

// Data kawasan tidak lengkap -> tidak menebak.
assert.deepEqual(kategoriJarang([{ key: "A", area_km2: null, competitor_counts: {} }], "A"), []);
assert.deepEqual(kategoriJarang([{ key: "A", area_km2: 1, competitor_counts: null }], "A"), []);
assert.deepEqual(kategoriJarang(rows, "TIDAK-ADA"), []);

console.log("score-gap: ok");
