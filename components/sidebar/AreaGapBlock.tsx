interface Props {
  kategori: string[];
}

export default function AreaGapBlock({ kategori }: Props) {
  if (kategori.length === 0) return null;

  return (
    <section className="flex flex-col gap-[var(--space-sm)] border-l-2 border-[var(--color-accent)] bg-[var(--color-accent-surface)] p-[var(--space-md)]">
      <h2 className="t-heading-2 text-[var(--color-accent)]">Kategori yang belum banyak di sini</h2>
      <div className="flex flex-wrap gap-[var(--space-sm)]">
        {kategori.map((nama) => (
          <span
            key={nama}
            className="t-micro rounded-[var(--radius-pill)] border border-[var(--color-accent)] px-[var(--space-md)] py-[var(--space-xs)] lowercase first-letter:uppercase text-[var(--color-accent)]"
          >
            {nama}
          </span>
        ))}
      </div>
      <p className="t-micro font-normal text-[var(--color-accent)]">
        Dibanding kawasan stasiun lain, kelompok ini lebih jarang di sini. Tidak memengaruhi skor.
      </p>
    </section>
  );
}
