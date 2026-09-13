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
 *
 * Sengaja tenang dan tertutup secara bawaan, ditaruh paling bawah panel: ini keterbatasan
 * data, bukan peringatan atas sesuatu yang pengguna lakukan, jadi tidak boleh bersaing
 * perhatian dengan hasil skor. Memakai <details> bawaan peramban — buka/tutup, fokus
 * keyboard, dan semantiknya sudah ada tanpa state React.
 */
export default function UnrankableNotice({ stations }: Props) {
  if (stations.length === 0) return null;

  return (
    <details className="group border-t border-[var(--color-border)] pt-[var(--space-md)]">
      <summary className="t-micro flex cursor-pointer list-none items-center gap-[var(--space-xs)] font-normal text-[var(--color-muted)] transition-colors duration-[var(--motion-fast)] hover:text-[var(--color-text-sub)]">
        <span aria-hidden className="transition-transform duration-[var(--motion-fast)] group-open:rotate-90">
          ›
        </span>
        {stations.length} kawasan tidak dinilai
      </summary>

      <div className="flex flex-col gap-[var(--space-xs)] pt-[var(--space-sm)] pl-[var(--space-md)]">
        <p className="t-micro font-normal text-[var(--color-muted)]">
          Pengamatannya terlalu sedikit untuk diberi skor, jadi kawasan ini tidak masuk
          peringkat.
        </p>
        <ul className="flex flex-col gap-[var(--space-xs)]">
          {stations.map((station) => (
            <li key={station.station_id} className="t-body text-[var(--color-text-sub)]">
              {station.station_name}
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
