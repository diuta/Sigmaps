"use client";

interface Props {
  kategori: readonly string[];
  ringkasan: string;
  onPrefill: (text: string) => void;
}

/** Blok keluaran AI. Seluruh warna di sini memakai accent, bukan warna skor. */
export default function AiCategoryBlock({ kategori, ringkasan, onPrefill }: Props) {
  return (
    <section className="flex flex-col gap-[var(--space-md)] border-l-2 border-[var(--color-accent)] bg-[var(--color-accent-surface)] p-[var(--space-md)]">
      <h2 className="t-heading-2 text-[var(--color-accent)]">Kategori yang belum banyak di sini</h2>

      <div className="flex flex-wrap gap-[var(--space-sm)]">
        {kategori.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onPrefill(item)}
            className="t-micro rounded-[var(--radius-pill)] border border-[var(--color-accent)] bg-[var(--color-surface)] px-[var(--space-md)] py-[var(--space-xs)] text-[var(--color-accent)] transition-all duration-[var(--motion-fast)] hover:bg-[var(--color-accent)] hover:text-[var(--color-surface)] active:translate-y-[1px]"
          >
            {item}
          </button>
        ))}
      </div>

      <p className="t-body text-[var(--color-text-sub)]">{ringkasan}</p>
      <p className="t-micro font-normal text-[var(--color-accent)]">
        Tekan salah satu kategori untuk memakainya sebagai rencana usaha.
      </p>
    </section>
  );
}
