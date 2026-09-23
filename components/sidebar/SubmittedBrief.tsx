"use client";

interface Props {
  value: string;
  onEdit: () => void;
  onReset: () => void;
}

export default function SubmittedBrief({ value, onEdit, onReset }: Props) {
  return (
    <section className="flex flex-col gap-[var(--space-md)]">
      <div className="flex flex-col gap-[var(--space-xs)]">
        <h1 className="t-heading-1">Rencana usaha</h1>
        <p className="t-body text-[var(--color-text-sub)]">Rencana yang sedang dinilai</p>
      </div>

      <textarea
        rows={3}
        value={value}
        readOnly
        tabIndex={-1}
        aria-label="Rencana usaha yang sedang dinilai"
        className="t-body pointer-events-none w-full cursor-not-allowed resize-none rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-[var(--space-md)] text-[var(--color-text-sub)] transition-colors duration-[var(--motion-base)] focus:outline-none"
      />

      <button
        type="button"
        onClick={onEdit}
        className="t-button w-full rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] py-[10px] text-[var(--color-text)] transition-all duration-[var(--motion-fast)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] active:translate-y-[1px]"
      >
        Edit rencana
      </button>

      <button
        type="button"
        onClick={onReset}
        className="t-button w-full rounded-[var(--radius-card)] border border-transparent py-[6px] text-[var(--color-text-sub)] transition-colors duration-[var(--motion-fast)] hover:text-[var(--color-brand)] hover:underline"
      >
        Hapus penilaian, jelajahi peta lagi
      </button>
    </section>
  );
}
