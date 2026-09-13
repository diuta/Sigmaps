"use client";

import { useRef, useEffect, useState } from "react";
import { useComparison } from "@/hooks/comparison/useComparison";
import { useCommunitySentiment } from "@/hooks/sentiment/useCommunitySentiment";
import { formatJalanKaki } from "@/helper/format-jalan-kaki";
import { useSidebarOpen } from "@/hooks/sidebar/useSidebarOpen";
import { useBriefResult } from "@/hooks/brief/useBriefResult";
import { useStations } from "@/hooks/station/useStations";
import type { CompareItem, CompareSlot } from "@/hooks/comparison/useComparison.types";
import { getSlotLabel, getSlotNumber } from "@/hooks/comparison/useComparison.types";
import type { CommunitySentimentResponse } from "@/types/sentiment";
import PropertyPickerModal from "@/components/comparison/PropertyPickerModal";

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
        <div className="flex aspect-[4/3] w-full items-center justify-center rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface-muted)]">
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
  slot,
  onChangeList,
  onChangeMap,
  onRemove,
}: {
  item: CompareItem;
  slot: CompareSlot;
  onChangeList: () => void;
  onChangeMap: () => void;
  onRemove: () => void;
}) {
  const { sentiment, loading } = useCommunitySentiment(item.stationId);
  const jalanKaki = formatJalanKaki(item.unit.jarak_jalan_m, item.unit.waktu_jalan_s);
  const isSewa = (item.unit.jenis_properti || "").toLowerCase().includes("sewa");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-y-1 border-b border-[var(--color-border)] pb-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-brand)] text-xs font-bold text-white shadow-xs">
            {getSlotNumber(slot)}
          </span>
          <span className="t-heading-2 text-xs font-bold text-[var(--color-text)]">
            {getSlotLabel(slot)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onChangeMap}
            title="Kecilkan panel dan pilih pin di peta"
            className="cursor-pointer whitespace-nowrap rounded px-2 py-1 text-[11px] font-bold text-[var(--color-brand)] bg-[var(--color-accent-surface)] hover:bg-[var(--color-brand)] hover:text-white transition-colors"
          >
            📍 Ganti<span className="hidden xl:inline"> via Peta</span>
          </button>
          <button
            type="button"
            onClick={onChangeList}
            className="cursor-pointer rounded px-2 py-1 text-[11px] font-bold text-[var(--color-brand)] hover:underline"
          >
            📋 Daftar
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

      {item.unit.alamat ? (
        <p className="t-body text-xs text-[var(--color-text-sub)] leading-relaxed">{item.unit.alamat}</p>
      ) : (
        <p className="t-body text-xs text-[var(--color-muted)] italic">Alamat tidak tersedia</p>
      )}

      {jalanKaki && (
        <p className="t-micro flex items-center gap-1.5 font-bold text-[var(--color-brand)]">
          <span aria-hidden>🚶</span>
          <span>{jalanKaki} ke {item.stationName}</span>
        </p>
      )}

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

      <InsightBlock
        sentiment={sentiment}
        loading={loading}
        stationName={item.stationName}
      />
    </div>
  );
}

function EmptySlotCard({
  slot,
  onPickFromMap,
  onPickFromList,
}: {
  slot: CompareSlot;
  onPickFromMap: () => void;
  onPickFromList: () => void;
}) {
  const slotLabel = getSlotLabel(slot);
  const slotNumber = getSlotNumber(slot);
  return (
    <div className="flex h-full min-h-[380px] flex-col items-center justify-center p-8 text-center">
      {/* Slot number badge */}
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand)]/10 text-2xl font-black text-[var(--color-brand)]">
        {slotNumber}
      </div>

      <h3 className="t-heading-1 mb-2 text-sm font-bold text-[var(--color-text)]">
        {slotLabel} Belum Dipilih
      </h3>
      <p className="t-body mb-6 max-w-[240px] text-xs text-[var(--color-muted)] leading-relaxed">
        Tap langsung pin di peta atau pilih dari daftar unit untuk membandingkan.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-2 w-full max-w-[260px]">
        <button
          type="button"
          onClick={onPickFromMap}
          className="t-button flex-1 w-full h-10 flex items-center justify-center gap-1.5 cursor-pointer rounded-[var(--radius-card)] bg-[var(--color-brand)] px-4 text-xs font-bold text-white shadow-xs transition-all hover:bg-[var(--color-brand-hover)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
        >
          <span>📍</span>
          <span>Pilih di Peta</span>
        </button>
        <button
          type="button"
          onClick={onPickFromList}
          className="t-button flex-1 w-full h-10 flex items-center justify-center gap-1.5 cursor-pointer rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-xs font-semibold text-[var(--color-text)] shadow-xs transition-all hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
        >
          <span>📋</span>
          <span>Daftar Unit</span>
        </button>
      </div>
    </div>
  );
}

export default function ComparisonPanel() {
  const {
    slotA,
    slotB,
    activeTargetSlot,
    setActiveTargetSlot,
    isPanelOpen,
    isPanelMinimized,
    minimizePanel,
    openPanel,
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

  useEffect(() => {
    if (isPanelOpen && !isPanelMinimized) {
      closeButtonRef.current?.focus();
    }
  }, [isPanelOpen, isPanelMinimized]);

  if (!isPanelOpen) return null;

  const sidebarWidth = "min(var(--sidebar-width), 100vw)";
  const filledCount = (slotA ? 1 : 0) + (slotB ? 1 : 0);

  function handlePickFromMap(slot: CompareSlot) {
    setActiveTargetSlot(slot);
    minimizePanel();
  }

  if (isPanelMinimized) {
    return (
      <div
        role="region"
        aria-label="Toolbar perbandingan properti"
        className="fixed bottom-3 z-[85] flex items-center justify-between gap-3 rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface)]/95 px-5 py-2.5 shadow-2xl backdrop-blur-md transition-all animate-in slide-in-from-bottom-2 duration-200"
        style={{
          left: sidebarOpen ? `calc(${sidebarWidth} + 16px)` : "16px",
          right: "16px",
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-brand)] text-sm font-bold text-white shadow-xs">
            ⚖️
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--color-text)]">
                Bandingkan Properti
              </span>
            </div>
            <p className="t-micro text-[var(--color-muted)] truncate">
              Klik pin properti di peta untuk mengisi <strong>{getSlotLabel(activeTargetSlot)}</strong>
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <div
            onClick={() => setActiveTargetSlot("A")}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold cursor-pointer transition-all ${
              activeTargetSlot === "A"
                ? "border-2 border-[var(--color-brand)] bg-[var(--color-accent-surface)] text-[var(--color-brand)] shadow-xs"
                : slotA
                ? "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
                : "border border-[var(--color-border)] bg-[var(--color-surface-muted)]/60 text-[var(--color-muted)] hover:border-[var(--color-brand)]/40"
            }`}
          >
            <span>Properti 1: {slotA ? slotA.unit.kategori_properti : "Kosong"}</span>
            {slotA && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearSlot("A");
                }}
                className="hover:text-rose-600 ml-1"
                aria-label="Hapus Properti 1"
              >
                ✕
              </button>
            )}
          </div>

          <span className="text-[10px] font-bold text-[var(--color-muted)]">VS</span>

          <div
            onClick={() => setActiveTargetSlot("B")}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold cursor-pointer transition-all ${
              activeTargetSlot === "B"
                ? "border-2 border-[var(--color-brand)] bg-[var(--color-accent-surface)] text-[var(--color-brand)] shadow-xs"
                : slotB
                ? "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
                : "border border-[var(--color-border)] bg-[var(--color-surface-muted)]/60 text-[var(--color-muted)] hover:border-[var(--color-brand)]/40"
            }`}
          >
            <span>Properti 2: {slotB ? slotB.unit.kategori_properti : "Kosong"}</span>
            {slotB && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearSlot("B");
                }}
                className="hover:text-rose-600 ml-1"
                aria-label="Hapus Properti 2"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={openPanel}
            className="t-button flex items-center gap-1.5 cursor-pointer rounded-[var(--radius-card)] bg-[var(--color-brand)] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[var(--color-brand-hover)] transition-all"
          >
            <span>▴</span>
            <span>Buka Panel ({filledCount}/2)</span>
          </button>
          <button
            type="button"
            onClick={closePanel}
            aria-label="Tutup"
            className="rounded-full p-2 text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        aria-hidden
        onClick={minimizePanel}
        className="fixed inset-0 z-[90] bg-slate-950/30 backdrop-blur-xs transition-opacity duration-[var(--motion-base)]"
        style={{
          right: 0,
          left: sidebarOpen ? sidebarWidth : 0,
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Perbandingan properti"
        className="fixed bottom-0 z-[95] flex h-[92vh] max-h-[92vh] flex-col overflow-hidden rounded-t-[16px] border border-b-0 border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl transition-transform duration-[var(--motion-base)] ease-[var(--ease-out)] sm:h-[78vh] sm:max-h-[85vh]"
        style={{
          left: sidebarOpen ? sidebarWidth : 0,
          right: 0,
        }}
      >
        <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 sm:px-6 sm:py-3.5">
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

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {filledCount > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="t-micro cursor-pointer font-medium text-[var(--color-muted)] transition-colors hover:text-rose-600 mr-1"
              >
                Hapus Semua
              </button>
            )}

            <button
              type="button"
              onClick={minimizePanel}
              title="Kecilkan panel untuk memilih pin langsung di peta"
              className="t-button flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-card)] border border-[var(--color-brand)]/40 bg-[var(--color-accent-surface)] px-3 py-1.5 text-xs font-bold text-[var(--color-brand)] transition-colors hover:bg-[var(--color-brand)] hover:text-white"
            >
              <span>▾</span>
              <span>Kecilkan<span className="hidden sm:inline"> (Pilih di Peta)</span></span>
            </button>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={closePanel}
              aria-label="Tutup perbandingan"
              className="t-button flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-sub)] transition-colors hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
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

        <div className="grid flex-1 min-h-0 grid-cols-1 grid-rows-2 divide-y lg:grid-cols-2 lg:grid-rows-1 lg:divide-x lg:divide-y-0 divide-[var(--color-border)] overflow-hidden bg-[var(--color-surface)]">
          <div className="h-full overflow-y-auto px-4 py-5 pb-28 scrollbar-thin sm:px-6">
            {slotA ? (
              <PropertyColumn
                item={slotA}
                slot="A"
                onChangeList={() => setActivePickerSlot("A")}
                onChangeMap={() => handlePickFromMap("A")}
                onRemove={() => clearSlot("A")}
              />
            ) : (
              <EmptySlotCard
                slot="A"
                onPickFromMap={() => handlePickFromMap("A")}
                onPickFromList={() => setActivePickerSlot("A")}
              />
            )}
          </div>

          <div className="relative h-full overflow-y-auto px-4 py-5 pb-28 scrollbar-thin sm:px-6">
            <span className="pointer-events-none absolute left-0 top-12 z-10 hidden -translate-x-1/2 rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-muted)] shadow-xs ring-1 ring-[var(--color-border)] lg:block">
              VS
            </span>
            {slotB ? (
              <PropertyColumn
                item={slotB}
                slot="B"
                onChangeList={() => setActivePickerSlot("B")}
                onChangeMap={() => handlePickFromMap("B")}
                onRemove={() => clearSlot("B")}
              />
            ) : (
              <EmptySlotCard
                slot="B"
                onPickFromMap={() => handlePickFromMap("B")}
                onPickFromList={() => setActivePickerSlot("B")}
              />
            )}
          </div>
        </div>
      </div>

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
