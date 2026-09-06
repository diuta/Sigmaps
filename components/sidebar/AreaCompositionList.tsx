import type { AreaCompositionRow } from "@/lib/fixtures/station";

interface Props {
  rows: readonly AreaCompositionRow[];
}

export default function AreaCompositionList({ rows }: Props) {
  const total = rows.reduce((sum, row) => sum + row.jumlah, 0);

  return (
    <section className="flex flex-col gap-[var(--space-md)]">
      <div className="flex flex-col gap-[var(--space-xs)]">
        <h2 className="t-heading-2">Isi kawasan sekarang</h2>
        <p className="t-micro font-normal text-[var(--color-text-sub)]">
          {total} tempat makan tercatat di kawasan ini
        </p>
      </div>

      <dl className="flex flex-col">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between border-b border-[var(--color-border)] py-[var(--space-sm)] last:border-b-0"
          >
            <dt className="t-body text-[var(--color-text-sub)]">{row.label}</dt>
            <dd className="t-tabular text-right text-[var(--color-text)]">{row.jumlah}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
