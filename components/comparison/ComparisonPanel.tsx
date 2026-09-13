"use client";

/**
 * components/comparison/ComparisonPanel.tsx
 *
 * Bottom comparison workspace overlay:
 * - 100% scrollable all the way to the bottom (with generous pb-24 buffer)
 * - Complete comparison process lives here (Slot A & Slot B side-by-side)
 * - Allows picking, changing, and removing properties directly in the panel
 * - Seamlessly integrated with PropertyPickerModal
 */

import { useRef, useEffect, useState } from "react";
import { useComparison } from "@/hooks/comparison/useComparison";
import { useCommunitySentiment } from "@/hooks/sentiment/useCommunitySentiment";
import { formatJalanKaki } from "@/helper/format-jalan-kaki";
import { useSidebarOpen } from "@/hooks/sidebar/useSidebarOpen";
import { useBriefResult } from "@/hooks/brief/useBriefResult";
import { useStations } from "@/hooks/station/useStations";
import type { CompareItem, CompareSlot } from "@/hooks/comparison/useComparison.types";
import type { CommunitySentimentResponse } from "@/types/sentiment";
import PropertyPickerModal from "@/components/comparison/PropertyPickerModal";

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function PhotoBlock({ src, label, alt }: { src: string | null; label: string; alt: string }) {
  return (
    <figure className="flex flex-col gap-1">
      <figcaption className="t-micro font-medium text-[var(--color-text-sub)]">{label}</figcaption>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="aspect-[4/3] w-full rounded-[10px] border border-[var(--color-border)] object-cover shadow-xs"
        />
      ) : (
        <div className="flex aspect-[4/3] w-full items-center justify-center rounded-[10px] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)]">
          <span className="t-body text-xs text-[var(--color-muted)]">Tidak ada foto</span>
        </div>
      )}
    </figure>
  );
}

function InsightBlock({
  sentiment,
  loading,
  stationName,
}: {
  sentiment: CommunitySentimentResponse | null;
  loading: boolean;
  stationName: string;
}) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2 rounded-[10px] bg-[var(--color-surface-muted)] p-3">
        <div className="h-3 w-28 animate-pulse rounded bg-[var(--color-border)]" />
        <div className="h-2.5 w-full animate-pulse rounded bg-[var(--color-border)]" />
        <div className="h-2.5 w-4/5 animate-pulse rounded bg-[var(--color-border)]" />
      </div>
    );
  }
  if (!sentiment) return null;
  return (
    <div className="flex flex-col gap-1.5 rounded-[10px] border-l-3 border-[var(--color-accent)] bg-[var(--color-accent-surface)] p-3.5 shadow-xs">
      <p className="t-micro font-bold text-[var(--color-accent)]">💡 AI Insight Kawasan {stationName}</p>
      <p className="t-body text-xs leading-relaxed text-[var(--color-text-sub)]">{sentiment.ringkasan}</p>
    </div>
  );
}

function PropertyColumn({
  item,
  label,
  onChange,
  onRemove,
}: {
  item: CompareItem;
  label: "A" | "B";
  onChange: () => void;
  onRemove: () => void;
}) {
  const { sentiment, loading } = useCommunitySentiment(item.stationId);
  const jalanKaki = formatJalanKaki(item.unit.jarak_jalan_m, item.unit.waktu_jalan_s);
  const isSewa = (item.unit.jenis_properti || "").toLowerCase().includes("sewa");

  return (
    <div className="flex flex-col gap-4">
      {/* Top Header Row with Change & Remove */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-brand)] text-xs font-bold text-white shadow-xs">
            {label}
          </span>
          <span className="t-heading-2 text-xs font-bold text-[var(--color-text)]">
            Slot {label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onChange}
            className="cursor-pointer text-xs font-bold text-[var(--color-brand)] hover:underline"
          >
            🔄 Ganti
          </button>
          <span className="text-[var(--color-border)]">·</span>
          <button
            type="button"
            onClick={onRemove}
            className="cursor-pointer text-xs font-normal text-[var(--color-muted)] hover:text-rose-600"
          >
            Hapus
          </button>
        </div>
      </div>

      {/* Property Title & Type */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1 min-w-0">
          <h3 className="t-heading-1 text-base font-bold text-[var(--color-text)] truncate">
            {item.unit.kategori_properti}
          </h3>
          <p className="t-micro font-bold text-[var(--color-brand)]">
            📍 Stasiun {item.stationName}
          </p>
        </div>
        <span
          className={`t-micro whitespace-nowrap rounded-[var(--radius-pill)] border px-2.5 py-0.5 text-[10px] font-bold flex-shrink-0 ${
            isSewa
              ? "border-amber-300 bg-amber-50 text-amber-900"
              : "border-emerald-300 bg-emerald-50 text-emerald-900"
          }`}
        >
          {item.unit.jenis_properti}
        </span>
      </div>

      {/* Alamat */}
      {item.unit.alamat ? (
        <p className="t-body text-xs text-[var(--color-text-sub)] leading-relaxed">{item.unit.alamat}</p>
      ) : (
        <p className="t-body text-xs text-[var(--color-muted)] italic">Alamat tidak tersedia</p>
      )}

      {/* Jarak jalan kaki */}
      {jalanKaki && (
        <p className="t-micro flex items-center gap-1.5 font-bold text-[var(--color-brand)]">
          <span aria-hidden>🚶</span>
          <span>{jalanKaki} ke {item.stationName}</span>
        </p>
      )}

      {/* Photos */}
      <PhotoBlock
        src={item.unit.foto_tampak_depan}
        label="Foto tampak depan"
        alt={`Tampak depan ${item.unit.kategori_properti}`}
      />
      <PhotoBlock
        src={item.unit.foto_spanduk}
        label="Foto spanduk"
        alt={`Spanduk ${item.unit.kategori_properti}`}
      />

      {/* AI Insight */}
      <InsightBlock
        sentiment={sentiment}
        loading={loading}
        stationName={item.stationName}
      />
    </div>
  );
}

function EmptySlotCard({
  label,
  onSelect,
}: {
  label: "A" | "B";
  onSelect: () => void;
}) {
  return (
    <div className="flex h-full min-h-[380px] flex-col items-center justify-center rounded-[16px] border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)]/40 p-8 text-center transition-all hover:border-[var(--color-brand)] hover:bg-[var(--color-accent-surface)]/20">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-brand)]/10 text-lg font-bold text-[var(--color-brand)]">
        {label}
      </div>
      <h3 className="t-heading-1 mb-1 text-sm font-bold text-[var(--color-text)]">
        Slot {label} Belum Dipilih
      </h3>
      <p className="t-body mb-5 max-w-xs text-xs text-[var(--color-muted)]">
        Pilih properti untuk Slot {label} dari stasiun mana pun
      </p>
      <button
        type="button"
        onClick={onSelect}
        className="t-button cursor-pointer rounded-[var(--radius-card)] bg-[var(--color-brand)] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-[var(--color-brand-hover)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
      >
        ＋ Pilih Properti Slot {label}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main panel
// ─────────────────────────────────────────────────────────────────────────────

export default function ComparisonPanel() {
  const {
    slotA,
    slotB,
    isPanelOpen,
    closePanel,
    setSlot,
    clearSlot,
    clearAll,
  } = useComparison();
  const { sidebarOpen } = useSidebarOpen();
  const { scoreResult } = useBriefResult();
  const { stations } = useStations();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const [activePickerSlot, setActivePickerSlot] = useState<CompareSlot | null>(null);

  // Build a stationId → stationName map
  const stationNames: Record<string, string> = {};
  for (const area of scoreResult?.areas ?? []) {
    stationNames[area.station_id] = area.station_name;
  }
  for (const feature of stations?.features ?? []) {
    const id = feature.properties.station_id;
    const name = feature.properties.nama;
    if (id && name && !stationNames[id]) {
      stationNames[id] = name;
    }
  }

  // Move focus to close button when panel opens
  useEffect(() => {
    if (isPanelOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isPanelOpen]);

  const sidebarWidth = "var(--sidebar-width)";
  const filledCount = (slotA ? 1 : 0) + (slotB ? 1 : 0);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={closePanel}
        className={`fixed inset-0 z-[90] bg-slate-950/25 backdrop-blur-xs transition-opacity duration-[var(--motion-base)] ${
          isPanelOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{
          right: 0,
          left: sidebarOpen ? sidebarWidth : 0,
        }}
      />

      {/* Main Panel Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Perbandingan properti"
        className={`fixed bottom-0 z-[95] flex h-[78vh] max-h-[85vh] flex-col overflow-hidden rounded-t-[16px] border border-b-0 border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl transition-transform duration-[var(--motion-base)] ease-[var(--ease-out)] ${
          isPanelOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{
          left: sidebarOpen ? sidebarWidth : 0,
          right: 0,
        }}
      >
        {/* ── Panel header ── */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3.5">
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="text-xl">⚖️</span>
            <div className="flex items-center gap-2">
              <h2 className="t-heading-1 text-base font-bold text-[var(--color-text)]">
                Bandingkan Properti
              </h2>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  filledCount === 2
                    ? "bg-emerald-100 text-emerald-900"
                    : filledCount === 1
                    ? "bg-[var(--color-accent-surface)] text-[var(--color-brand)]"
                    : "bg-[var(--color-surface-muted)] text-[var(--color-muted)]"
                }`}
              >
                {filledCount}/2 Properti
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {filledCount > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="t-micro cursor-pointer font-medium text-[var(--color-muted)] transition-colors hover:text-rose-600"
              >
                Hapus Semua
              </button>
            )}
            <button
              ref={closeButtonRef}
              type="button"
              onClick={closePanel}
              aria-label="Tutup perbandingan"
              className="t-button flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-text-sub)] transition-colors hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Tutup
            </button>
          </div>
        </div>

        {/* ── 2-Column Area with smooth full scrolling all the way to the bottom ── */}
        <div className="grid flex-1 min-h-0 grid-cols-2 divide-x divide-[var(--color-border)] overflow-hidden bg-[var(--color-surface)]">
          {/* Col A */}
          <div className="h-full overflow-y-auto px-6 py-5 pb-28 scrollbar-thin">
            {slotA ? (
              <PropertyColumn
                item={slotA}
                label="A"
                onChange={() => setActivePickerSlot("A")}
                onRemove={() => clearSlot("A")}
              />
            ) : (
              <EmptySlotCard
                label="A"
                onSelect={() => setActivePickerSlot("A")}
              />
            )}
          </div>

          {/* Col B */}
          <div className="relative h-full overflow-y-auto px-6 py-5 pb-28 scrollbar-thin">
            {/* VS divider badge in center */}
            <span className="pointer-events-none absolute left-0 top-12 z-10 -translate-x-1/2 rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-muted)] shadow-xs ring-1 ring-[var(--color-border)]">
              VS
            </span>
            {slotB ? (
              <PropertyColumn
                item={slotB}
                label="B"
                onChange={() => setActivePickerSlot("B")}
                onRemove={() => clearSlot("B")}
              />
            ) : (
              <EmptySlotCard
                label="B"
                onSelect={() => setActivePickerSlot("B")}
              />
            )}
          </div>
        </div>
      </div>

      {/* In-Panel Interactive Property Picker Modal */}
      {activePickerSlot && (
        <PropertyPickerModal
          slot={activePickerSlot}
          isOpen={true}
          onClose={() => setActivePickerSlot(null)}
          onSelect={(item) => {
            setSlot(activePickerSlot, item);
            if (activePickerSlot === "A" && !slotB) {
              setActivePickerSlot("B");
            } else {
              setActivePickerSlot(null);
            }
          }}
          stationNames={stationNames}
          otherSlotUnitId={activePickerSlot === "A" ? slotB?.unit.id : slotA?.unit.id}
          otherSlotName={activePickerSlot === "A" ? "B" : "A"}
        />
      )}
    </>
  );
}
