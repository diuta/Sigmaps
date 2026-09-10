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

/** Panel tampilan peta: visibilitas layer, opasitas, legenda, dan peta dasar. */
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

          {/* ── Legenda ────────────────────────────────────────────────────── */}
          <section className="flex flex-col gap-[var(--space-sm)] border-t border-[var(--color-border)] pt-[var(--space-md)]">
            <h3 className="t-micro text-[var(--color-text-sub)]">Legenda</h3>
            <ul className="flex flex-col gap-[6px] list-none m-0 p-0">

              {/* Stasiun aktif */}
              <li className="flex items-center gap-[var(--space-sm)]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0">
                  <polygon points="8,1 15,8 8,15 1,8" fill="#1E40AF" stroke="white" strokeWidth="1.2" />
                </svg>
                <span className="flex flex-col">
                  <span className="t-body font-medium text-[var(--color-text)]">Stasiun aktif</span>
                  <span className="t-micro text-[var(--color-muted)]">Stasiun yang dipilih</span>
                </span>
              </li>

              {/* Stasiun lainnya */}
              <li className="flex items-center gap-[var(--space-sm)]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0">
                  <polygon points="8,1 15,8 8,15 1,8" fill="rgba(30,64,175,0.12)" stroke="#1E40AF" strokeWidth="1.2" />
                </svg>
                <span className="flex flex-col">
                  <span className="t-body font-medium text-[var(--color-text)]">Stasiun lainnya</span>
                  <span className="t-micro text-[var(--color-muted)]">Jaringan KRL Jabodetabek</span>
                </span>
              </li>

              {/* Properti tersedia */}
              <li className="flex items-center gap-[var(--space-sm)]">
                <svg width="12" height="16" viewBox="0 0 12 16" fill="none" aria-hidden="true" className="shrink-0 ml-[2px]">
                  <path d="M6 0C2.686 0 0 2.686 0 6c0 1.427.506 2.734 1.346 3.756L6 16l4.654-6.244A5.974 5.974 0 0 0 12 6C12 2.686 9.314 0 6 0Z" fill="#EA580C" />
                  <circle cx="6" cy="6" r="2.2" fill="white" />
                </svg>
                <span className="flex flex-col">
                  <span className="t-body font-medium text-[var(--color-text)]">Properti tersedia</span>
                  <span className="t-micro text-[var(--color-muted)]">Dalam zona jalan kaki</span>
                </span>
              </li>

              {/* Zona jalan kaki 10 mnt */}
              <li className="flex items-center gap-[var(--space-sm)]">
                <svg width="20" height="12" viewBox="0 0 20 12" fill="none" aria-hidden="true" className="shrink-0">
                  <rect x="1" y="1" width="18" height="10" rx="2.5" fill="rgba(30,64,175,0.12)" stroke="#1E40AF" strokeWidth="1.2" strokeDasharray="3 2" />
                </svg>
                <span className="flex flex-col">
                  <span className="t-body font-medium text-[var(--color-text)]">Zona jalan kaki 10 mnt</span>
                  <span className="t-micro text-[var(--color-muted)]">Dari stasiun aktif</span>
                </span>
              </li>

            </ul>
          </section>
          {/* ── / Legenda ──────────────────────────────────────────────────── */}

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
