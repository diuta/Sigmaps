"use client";

import { useComparison } from "@/hooks/comparison/useComparison";

export default function CompareBar() {
  const { slotA, slotB, openPanel, isPanelOpen } = useComparison();

  const count = (slotA ? 1 : 0) + (slotB ? 1 : 0);

  return (
    <section aria-label="Bandingkan properti" className="pt-1">
      <button
        type="button"
        onClick={openPanel}
        className={`group flex w-full cursor-pointer items-center justify-between gap-3 rounded-[var(--radius-card)] border p-3 text-left transition-all shadow-xs ${
          isPanelOpen
            ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white shadow-md ring-2 ring-[var(--color-brand)]/30"
            : count > 0
            ? "border-[var(--color-brand)] bg-[var(--color-accent-surface)] text-[var(--color-text)] hover:border-[var(--color-brand)] hover:shadow-md"
            : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-brand)] hover:shadow-sm"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold transition-transform group-hover:scale-105 ${
              isPanelOpen
                ? "bg-white text-[var(--color-brand)]"
                : count > 0
                ? "bg-[var(--color-brand)] text-white"
                : "bg-[var(--color-surface-muted)] text-[var(--color-text-sub)]"
            }`}
          >
            ⚖️
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="t-heading-2 text-xs font-bold truncate">
                Bandingkan Properti
              </span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                  isPanelOpen
                    ? "bg-white/20 text-white"
                    : count === 2
                    ? "bg-emerald-100 text-emerald-900"
                    : count === 1
                    ? "bg-[var(--color-brand)] text-white"
                    : "bg-[var(--color-surface-muted)] text-[var(--color-muted)]"
                }`}
              >
                {count}/2
              </span>
            </div>
            <p
              className={`t-micro truncate font-normal ${
                isPanelOpen
                  ? "text-white/80"
                  : "text-[var(--color-muted)]"
              }`}
            >
              {count === 2
                ? "2 properti terpilih — Klik untuk melihat"
                : count === 1
                ? "1 properti terpilih — Buka panel"
                : "Buka panel perbandingan side-by-side"}
            </p>
          </div>
        </div>

        <span
          className={`flex-shrink-0 text-xs font-bold transition-transform group-hover:translate-x-0.5 ${
            isPanelOpen
              ? "text-white"
              : "text-[var(--color-brand)]"
          }`}
        >
          {isPanelOpen ? "Aktif ✓" : "Buka →"}
        </span>
      </button>
    </section>
  );
}
