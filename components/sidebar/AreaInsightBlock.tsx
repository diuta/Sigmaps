interface Props {
  paragraf: string;
}

export default function AreaInsightBlock({ paragraf }: Props) {
  return (
    <section className="flex flex-col gap-[var(--space-sm)] border-l-2 border-[var(--color-accent)] bg-[var(--color-accent-surface)] p-[var(--space-md)]">
      <h2 className="t-heading-2 text-[var(--color-accent)]">Gambaran kawasan</h2>
      <p className="t-body text-[var(--color-text-sub)]">{paragraf}</p>
      <p className="t-micro font-normal text-[var(--color-accent)]">
        Ditulis AI dari catatan kawasan. Tidak memengaruhi skor di atas.
      </p>
    </section>
  );
}
