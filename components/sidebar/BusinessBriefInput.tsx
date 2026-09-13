"use client";

import { BRIEF_PLACEHOLDER, SUGGESTION_CHIPS } from "@/lib/fixtures/brief";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  submitLabel: string;
  disabled: boolean;
}

export default function BusinessBriefInput({ value, onChange, onSubmit, submitLabel, disabled }: Props) {
  const kosong = value.trim().length === 0;

  return (
    <section className="flex flex-col gap-[var(--space-md)]">
      <div className="flex flex-col gap-[var(--space-xs)]">
        <h1 className="t-heading-1">Rencana usaha</h1>
        <p className="t-body text-[var(--color-text-sub)]">Ceritakan usaha yang ingin dibuka</p>
      </div>

      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={BRIEF_PLACEHOLDER}
        aria-label="Rencana usaha"
        className="t-body w-full resize-none rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-md)] text-[var(--color-text)] transition-colors duration-[var(--motion-base)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-brand)] focus:outline-none"
      />

      <div className="flex flex-col gap-[var(--space-sm)]">
        <p className="t-micro font-normal text-[var(--color-text-sub)]">
          Atau mulai dari salah satu contoh ini
        </p>
        <div className="flex flex-wrap gap-[var(--space-sm)]">
          {SUGGESTION_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => onChange(chip)}
              className="t-micro rounded-[var(--radius-pill)] border border-[var(--color-accent-surface)] bg-[var(--color-accent-surface)] px-[var(--space-md)] py-[var(--space-xs)] text-[var(--color-accent)] transition-all duration-[var(--motion-fast)] hover:border-[var(--color-accent)] active:translate-y-[1px]"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={kosong || disabled}
        className="t-button w-full rounded-[var(--radius-card)] bg-[var(--color-text)] py-[10px] text-[var(--color-surface)] transition-all duration-[var(--motion-fast)] hover:bg-[var(--color-brand)] active:translate-y-[1px] disabled:cursor-not-allowed disabled:bg-[var(--color-muted)]"
      >
        {submitLabel}
      </button>

      {kosong && (
        <p className="t-micro font-normal text-[var(--color-muted)]">
          Tulis rencana dulu, atau pilih salah satu contoh di atas.
        </p>
      )}
    </section>
  );
}
