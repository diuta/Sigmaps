interface Props {
  /** Nama blok yang sedang disiapkan, mis. "Gambaran kawasan". */
  judul: string;
}

/**
 * Penanda tunggu untuk keluaran AI. Sebentuk dengan AreaInsightBlock (border accent + surface
 * accent) supaya ruangnya sudah dipesan: saat teks aslinya datang, isi di bawahnya tidak
 * melompat.
 *
 * Denyutnya pakai `animate-pulse` bawaan Tailwind — sengaja tidak menambah keyframes ke
 * app/globals.css. Aturan prefers-reduced-motion di sana sudah berlaku ke `*`, jadi denyut ini
 * ikut mati untuk yang memintanya tanpa penanganan tambahan di sini.
 */
export default function AiLoadingBlock({ judul }: Props) {
  return (
    <section
      role="status"
      aria-live="polite"
      className="flex flex-col gap-[var(--space-sm)] border-l-2 border-[var(--color-accent)] bg-[var(--color-accent-surface)] p-[var(--space-md)]"
    >
      <h2 className="t-heading-2 text-[var(--color-accent)]">{judul}</h2>

      {/* Batang skeleton: dekorasi, jangan dibacakan screen reader. */}
      <div aria-hidden className="flex flex-col gap-[var(--space-xs)]">
        {["100%", "75%", "90%"].map((lebar) => (
          <div
            key={lebar}
            style={{ width: lebar }}
            className="h-[10px] animate-pulse rounded-[var(--radius-pill)] bg-[var(--color-border)]"
          />
        ))}
      </div>

      <p className="t-micro font-normal text-[var(--color-accent)]">AI sedang menulis...</p>
    </section>
  );
}
