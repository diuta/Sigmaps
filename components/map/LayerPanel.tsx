"use client";

import { useState } from "react";
import { useMapInstance } from "@/hooks/map/useMapInstance";
import { BASEMAPS, MAP_LAYERS } from "@/lib/fixtures/layers";

interface Props {
  styleId: string;
  onStyleChange: (styleId: string) => void;
}

const DEFAULT_VISIBILITY = Object.fromEntries(
  MAP_LAYERS.map((layer) => [layer.id, layer.defaultOn]),
);

/** Panel tampilan peta: visibilitas layer, opasitas, dan peta dasar. */
export default function LayerPanel({ styleId, onStyleChange }: Props) {
  const { map } = useMapInstance();
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState<Record<string, boolean>>(DEFAULT_VISIBILITY);
  const [opacity, setOpacity] = useState(100);

  function toggleLayer(layerId: string, on: boolean) {
    setVisible((prev) => ({ ...prev, [layerId]: on }));
    if (map?.getLayer(layerId)) {
      map.setLayoutProperty(layerId, "visibility", on ? "visible" : "none");
    }
  }

  function changeOpacity(nextValue: number) {
    setOpacity(nextValue);
    const alpha = nextValue / 100;
    if (map?.getLayer("station-pins")) map.setPaintProperty("station-pins", "icon-opacity", alpha);
    if (map?.getLayer("station-labels")) map.setPaintProperty("station-labels", "text-opacity", alpha);
  }

  return (
    <div className="absolute right-[var(--space-lg)] bottom-[var(--space-lg)] z-40 flex flex-col items-end gap-[var(--space-sm)]">
      {open && (
        <div
          role="dialog"
          aria-label="Tampilan peta"
          className="motion-pop-in flex w-[280px] origin-bottom-right flex-col gap-[var(--space-lg)] rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-lg)] shadow-[var(--shadow-float)]"
        >
          <section className="flex flex-col gap-[var(--space-md)]">
            <h3 className="t-micro text-[var(--color-text-sub)]">Layer</h3>
            {MAP_LAYERS.map((layer) => (
              <label key={layer.id} className="flex cursor-pointer items-center gap-[var(--space-sm)]">
                <input
                  type="checkbox"
                  checked={visible[layer.id] ?? false}
                  onChange={(e) => toggleLayer(layer.id, e.target.checked)}
                  className="h-[14px] w-[14px] shrink-0 accent-[var(--color-brand)]"
                />
                <span className="t-body font-medium text-[var(--color-text)]">{layer.label}</span>
              </label>
            ))}
          </section>

          <section className="flex flex-col gap-[var(--space-sm)]">
            <div className="flex items-baseline justify-between">
              <h3 className="t-micro text-[var(--color-text-sub)]">Opasitas</h3>
              <span className="t-tabular text-[var(--color-text-sub)]">{opacity}%</span>
            </div>
            <input
              type="range"
              min={20}
              max={100}
              step={5}
              value={opacity}
              onChange={(e) => changeOpacity(Number(e.target.value))}
              aria-label="Opasitas layer"
              className="w-full accent-[var(--color-brand)]"
            />
          </section>

          <section className="flex flex-col gap-[var(--space-sm)] border-t border-[var(--color-border)] pt-[var(--space-md)]">
            <h3 className="t-micro text-[var(--color-text-sub)]">Peta dasar</h3>
            <div className="grid grid-cols-2 gap-[var(--space-xs)]">
              {BASEMAPS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onStyleChange(option.id)}
                  aria-pressed={styleId === option.id}
                  className={`t-micro rounded-[var(--radius-card)] border py-[var(--space-sm)] transition-all duration-[var(--motion-fast)] active:translate-y-[1px] ${
                    styleId === option.id
                      ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-[var(--color-surface)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-sub)] hover:border-[var(--color-brand)]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="t-button rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--space-lg)] py-[var(--space-md)] text-[var(--color-text)] shadow-[var(--shadow-float)] transition-all duration-[var(--motion-fast)] hover:border-[var(--color-brand)] active:translate-y-[1px]"
      >
        Tampilan peta
      </button>
    </div>
  );
}
