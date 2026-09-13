import assert from "node:assert/strict";
import { memoTtl } from "./memo-ttl.ts";

// Pemanggilan bersamaan berbagi satu eksekusi; hasil sukses bertahan; yang gagal dibuang.
let calls = 0;
const fn = memoTtl(async (k: string) => { calls++; if (k === "bad") throw new Error("x"); return { k, ok: k !== "soft" }; }, 60_000, (v) => !v.ok);

await Promise.all([fn("a"), fn("a"), fn("a")]);
assert.equal(calls, 1, "3 pemanggilan bersamaan → 1 eksekusi");
await fn("a");
assert.equal(calls, 1, "hasil sukses dilayani cache");

await fn("bad").catch(() => {});
await fn("bad").catch(() => {});
assert.equal(calls, 3, "promise ditolak dibuang → dicoba lagi");

await fn("soft"); await fn("soft");
assert.equal(calls, 5, "hasil yang dinilai gagal (isFailure) dibuang → dicoba lagi");

console.log("memo-ttl: ok");
