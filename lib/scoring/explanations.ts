import type { ScoreComponentKey } from "@/types/scoring";

interface Band {
  below: number;
  kalimat: string;
}

const BANDS: Record<ScoreComponentKey, readonly Band[]> = {
  demand: [
    {
      below: 0.35,
      kalimat:
        "Tempat makan yang tercatat di kawasan ini lebih sering terpantau sepi daripada ramai.",
    },
    {
      below: 0.65,
      kalimat:
        "Tingkat keramaian tempat makan di kawasan ini berada di sekitar tengah, setara kawasan lain.",
    },
    {
      below: Infinity,
      kalimat:
        "Tempat makan yang tercatat di kawasan ini lebih sering terpantau ramai daripada sepi.",
    },
  ],
  competitive_headroom: [
    {
      below: 0.35,
      kalimat:
        "Kepadatan pesaing jauh dari titik paling ideal. Dari angka ini saja belum bisa dibedakan apakah kawasannya sudah terlalu sesak atau justru belum punya pesaing sehingga pasarnya belum terbukti.",
    },
    {
      below: 0.65,
      kalimat:
        "Kepadatan pesaing sudah bergeser dari titik paling ideal, tapi masih menyisakan ruang untuk pemain baru.",
    },
    {
      below: Infinity,
      kalimat:
        "Kepadatan pesaing mendekati titik paling ideal: cukup ramai untuk menunjukkan pasarnya hidup, belum sesak sampai menutup pemain baru.",
    },
  ],
  segment_match: [
    {
      below: 0.35,
      kalimat: "Harga yang Anda rencanakan jauh dari harga yang biasa dibayar di kawasan ini.",
    },
    {
      below: 0.65,
      kalimat: "Harga yang Anda rencanakan agak berbeda dari harga yang biasa dibayar di kawasan ini.",
    },
    {
      below: Infinity,
      kalimat: "Harga yang Anda rencanakan dekat dengan harga yang biasa dibayar di kawasan ini.",
    },
  ],
};

export const COMPONENT_LABELS: Record<ScoreComponentKey, string> = {
  demand: "Permintaan",
  competitive_headroom: "Ruang kompetisi",
  segment_match: "Kecocokan segmen harga",
};

export const COMPONENT_ORDER: readonly { key: ScoreComponentKey; bobot: "wD" | "wC" | "wS" }[] = [
  { key: "demand", bobot: "wD" },
  { key: "competitive_headroom", bobot: "wC" },
  { key: "segment_match", bobot: "wS" },
];

const NEUTRAL_PULL_K = 8;

export function explainComponent(key: ScoreComponentKey, value: number): string {
  const bands = BANDS[key];
  const band = bands.find((b) => value < b.below);
  return band ? band.kalimat : bands[bands.length - 1].kalimat;
}

export function explainNeutralPull(nObservations: number): string | null {
  if (nObservations > NEUTRAL_PULL_K) return null;

  return `Angka ini ditarik ke nilai tengah karena baru ada ${nObservations} pengamatan, kurang dari ${NEUTRAL_PULL_K} yang dipakai rumus sebagai penyeimbang.`;
}

export interface ObservedRange {
  min: number;
  max: number;
}

export function observedRange(values: readonly number[]): ObservedRange | null {
  if (values.length === 0) return null;
  return { min: Math.min(...values), max: Math.max(...values) };
}
