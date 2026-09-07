interface UnrankableStation {
  station_id: string;
  station_name: string;
}

interface Props {
  stations: readonly UnrankableStation[];
}

/**
 * Kawasan tanpa data cukup: tidak diberi skor dan tidak diberi nomor peringkat.
 * /api/score tidak pernah mengirim kawasan is_rankable=false (lihat docs/api-score.md),
 * jadi tidak ada n_observations untuk ditampilkan di sini — hanya nama stasiunnya.
 */
export default function UnrankableNotice({ stations }: Props) {
  if (stations.length === 0) return null;

  return (
    <section className="flex flex-col gap-[var(--space-sm)] rounded-[var(--radius-card)] border border-[var(--color-warning)] bg-[var(--color-warning-bg)] p-[var(--space-md)]">
      <h2 className="t-heading-2 text-[var(--color-warning-tx)]">Data belum cukup</h2>
      <p className="t-body text-[var(--color-warning-tx)]">
        Kawasan berikut tidak dinilai dan tidak masuk peringkat karena jumlah pengamatannya
        terlalu sedikit.
      </p>
      <ul className="flex flex-col gap-[var(--space-xs)]">
        {stations.map((station) => (
          <li key={station.station_id} className="t-body text-[var(--color-warning-tx)]">
            {station.station_name}
          </li>
        ))}
      </ul>
    </section>
  );
}
