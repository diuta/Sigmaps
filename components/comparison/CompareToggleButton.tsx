"use client";

import { useComparison } from "@/hooks/comparison/useComparison";
import { getSlotLabel } from "@/hooks/comparison/useComparison.types";
import type { CompareItem } from "@/hooks/comparison/useComparison.types";

interface Props {
  item: CompareItem;
}

export default function CompareToggleButton({ item }: Props) {
  const {
    activeTargetSlot,
    assignToActiveSlot,
    clearSlot,
    getSlotFor,
    isInCompare,
    isPanelOpen,
    openPanel,
  } = useComparison();

  const inCompare = isInCompare(item.unit.id);
  const currentSlot = getSlotFor(item.unit.id);

  function handleClick() {
    if (inCompare && currentSlot) {
      clearSlot(currentSlot);
      return;
    }
    assignToActiveSlot(item);
    if (!isPanelOpen) {
      openPanel();
    }
  }

  if (inCompare && currentSlot) {
    const slotLabel = getSlotLabel(currentSlot);
    return (
      <button
        type="button"
        onClick={handleClick}
        className="t-button flex w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-card)] border border-[var(--color-brand)] bg-[var(--color-brand)] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-rose-600 hover:border-rose-600 focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
        aria-label={`Hapus dari perbandingan (${slotLabel})`}
      >
        <span aria-hidden>✓</span>
        Terpilih di {slotLabel} · Klik untuk Hapus
      </button>
    );
  }

  if (isPanelOpen) {
    const targetLabel = getSlotLabel(activeTargetSlot);
    return (
      <button
        type="button"
        onClick={handleClick}
        className="t-button flex w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-card)] border-2 border-[var(--color-brand)] bg-[var(--color-accent-surface)] px-4 py-2.5 text-xs font-bold text-[var(--color-brand)] shadow-xs transition-all hover:bg-[var(--color-brand)] hover:text-white focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
        aria-label={`Masukkan ke ${targetLabel}`}
      >
        <span aria-hidden>⚖️</span>
        Masukkan ke {targetLabel}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="t-button flex w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-card)] border-2 border-[var(--color-brand)] bg-[var(--color-accent-surface)] px-4 py-2.5 text-xs font-bold text-[var(--color-brand)] shadow-xs transition-all hover:bg-[var(--color-brand)] hover:text-white focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
      aria-label="Tambah properti ke perbandingan"
    >
      <span aria-hidden>⚖️</span>
      Bandingkan Properti Ini
    </button>
  );
}
