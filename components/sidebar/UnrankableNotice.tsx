import type { AreaScore } from "@/types/scoring";

interface Props {
  areas: readonly AreaScore[];
}

/** Kawasan tanpa data cukup: tidak diberi skor dan tidak diberi nomor peringkat. */
export default function UnrankableNotice({ areas }: Props) {
  if (areas.length === 0) return null;

  return (
    <section className="flex flex-col gap-[var(--space-sm)] rounded-[var(--radius-card)] border border-[var(--color-warning)] bg-[var(--color-warning-bg)] p-[var(--space-md)]">
      <h2 className="t-heading-2 text-[var(--color-warning-tx)]">Data belum cukup</h2>
      <p className="t-body text-[var(--color-warning-tx)]">
        Kawasan berikut tidak dinilai dan tidak masuk peringkat karena jumlah pengamatannya
        terlalu sedikit.
      </p>
      <ul className="flex flex-col gap-[var(--space-xs)]">
        {areas.map((area) => (
          <li key={area.area_id} className="t-body text-[var(--color-warning-tx)]">
            {area.station_name} — {area.n_observations} pengamatan
          </li>
        ))}
      </ul>
    </section>
  );
}
