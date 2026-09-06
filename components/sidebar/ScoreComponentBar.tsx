import type { ObservedRange } from "@/lib/score-explanations";

interface Props {
  label: string;
  /** 0–1 */
  value: number;
  /** 0–1, bobot komponen dalam skor akhir. */
  weight: number;
  /** Kalimat dari lib/score-explanations.ts — bukan keluaran AI. */
  explanation: string;
  /** Klausa tambahan, mis. penjelasan tarikan ke nilai netral. */
  caveat?: string | null;
  /** Bila diisi, bar menandai rentang nilai yang teramati di seluruh kawasan. */
  range?: ObservedRange | null;
}

const clamp = (value: number) => Math.min(Math.max(value, 0), 1);
const pct = (value: number) => `${(clamp(value) * 100).toFixed(1)}%`;
const angka = (value: number, digits: number) =>
  value.toLocaleString("id-ID", { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Komponen skor deterministik — selalu warna opportunity, tidak boleh warna accent AI. */
export default function ScoreComponentBar({
  label,
  value,
  weight,
  explanation,
  caveat,
  range,
}: Props) {
  return (
    <div className="flex flex-col gap-[var(--space-sm)]">
      <div className="flex items-baseline gap-[var(--space-sm)]">
        <span className="t-heading-2 min-w-0 flex-1">{label}</span>
        <span className="t-micro whitespace-nowrap rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--space-sm)] py-[2px] text-[var(--color-text-sub)]">
          Bobot {angka(weight, 2)}
        </span>
        <span className="t-tabular text-[var(--color-opportunity-tx)]">{angka(value, 2)}</span>
      </div>

      <div
        role="meter"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuetext={angka(value, 2)}
        className="relative h-[8px] w-full overflow-hidden rounded-[var(--radius-pill)] bg-[var(--color-opportunity-bg)]"
      >
        {/*
          scaleX, bukan width: animasi lebar memicu layout tiap frame. Nilai akhir
          dipasang langsung dari props, tidak menunggu transitionend, supaya klik cepat
          antar peringkat tidak pernah meninggalkan bar di posisi setengah jalan.
        */}
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 w-full origin-left rounded-[var(--radius-pill)] bg-[var(--color-opportunity)] transition-transform duration-[var(--motion-slow)] ease-[var(--ease-out)]"
          style={{ transform: `scaleX(${clamp(value)})` }}
        />
        {/*
          Penanda rentang digambar DI ATAS isian, bukan di belakangnya: rentang selalu
          mengurung nilainya sendiri, jadi kalau ditaruh di belakang ia tertutup rapat
          oleh isian dan tidak pernah terlihat. Dibuat sebagai dua garis batas supaya
          tetap terbaca baik di atas isian maupun di atas jalur kosong.
        */}
        {range && (
          <div
            aria-hidden
            className="absolute inset-y-0 border-x-2 border-[var(--color-opportunity-tx)]"
            style={{ left: pct(range.min), width: pct(range.max - range.min) }}
          />
        )}
      </div>

      <p className="t-body text-[var(--color-text-sub)]">{explanation}</p>

      {caveat && <p className="t-micro font-normal text-[var(--color-muted)]">{caveat}</p>}

      {range && (
        <p className="t-micro font-normal text-[var(--color-muted)]">
          Dua garis pada bar menandai rentang nilai di seluruh kawasan, {angka(range.min, 2)}–
          {angka(range.max, 2)}. Rentangnya sempit, jadi komponen ini hampir tidak membedakan
          kawasan.
        </p>
      )}
    </div>
  );
}
