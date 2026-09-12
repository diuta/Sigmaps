"use client";

import type { AreaScore } from "@/types/scoring";

interface Props {
  areas: readonly AreaScore[];
  activeAreaId: string;
  onSelect: (areaId: string) => void;
}

/** Hanya kawasan is_rankable yang boleh masuk strip ini. */
export default function RankStrip({ areas, activeAreaId, onSelect }: Props) {
  return (
    <div role="group" aria-label="Peringkat kawasan" className="flex gap-[var(--space-xs)]">
      {areas.map((area, index) => {
        const active = area.area_id === activeAreaId;
        return (
          <button
            key={area.area_id}
            type="button"
            aria-pressed={active}
            aria-label={`Peringkat ${index + 1}, ${area.station_name}`}
            onClick={() => onSelect(area.area_id)}
            className={`t-tabular flex h-7 w-7 items-center justify-center rounded-[var(--radius-card)] border transition-all duration-[var(--motion-fast)] active:translate-y-[1px] ${
              active
                ? "border-[var(--color-text)] bg-[var(--color-text)] text-[var(--color-surface)]"
                : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-sub)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
            }`}
          >
            {index + 1}
          </button>
        );
      })}
    </div>
  );
}
