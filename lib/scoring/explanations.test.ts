import assert from "node:assert/strict";
import {
  explainComponent,
  explainNeutralPull,
  observedRange,
} from "./explanations.ts";

assert.match(explainComponent("competitive_headroom", 0), /belum bisa dibedakan/);
assert.match(explainComponent("competitive_headroom", 0.34), /belum bisa dibedakan/);
assert.match(explainComponent("competitive_headroom", 0.35), /masih menyisakan ruang/);
assert.match(explainComponent("competitive_headroom", 0.64), /masih menyisakan ruang/);
assert.match(explainComponent("competitive_headroom", 0.65), /mendekati titik paling ideal/);
assert.match(explainComponent("competitive_headroom", 1), /mendekati titik paling ideal/);

for (const value of [0, 0.2, 0.5, 0.8, 1]) {
  const kalimat = explainComponent("competitive_headroom", value);
  assert.doesNotMatch(kalimat, /pesaing (sejenis )?(masih )?sedikit/i);
  assert.doesNotMatch(kalimat, /ruang untuk pemain baru lebar/i);
}
const cRendah = explainComponent("competitive_headroom", 0.1);
assert.match(cRendah, /sesak/);
assert.match(cRendah, /belum punya pesaing/);

for (const value of [0, 0.5, 1]) {
  assert.doesNotMatch(explainComponent("demand", value), /belanja/i);
}
assert.match(explainComponent("demand", 0.9), /ramai/i);
assert.match(explainComponent("demand", 0.1), /sepi/i);

assert.match(explainComponent("segment_match", 0.9), /Harga yang Anda rencanakan/);

assert.equal(explainComponent("demand", 0.5), explainComponent("demand", 0.5));

assert.match(explainNeutralPull(3) ?? "", /3 pengamatan/);
assert.match(explainNeutralPull(8) ?? "", /8 pengamatan/);
assert.equal(explainNeutralPull(9), null);
assert.equal(explainNeutralPull(38), null);

assert.deepEqual(observedRange([0.45, 0.54, 0.49]), { min: 0.45, max: 0.54 });
assert.equal(observedRange([]), null);

console.log("score-explanations: ok");
