"use client";

import { formatJalanKaki } from "@/helper/format-jalan-kaki";
import type { CompareItem, CompareSlot } from "@/hooks/comparison/useComparison.types";

interface Props {
  slot: CompareSlot;
  item: CompareItem | null;
  stationNames: Record<string, string>;
  isActiveTarget: boolean;
  onSelectAsTarget: () => void;
  onOpenPicker: () => void;
  onClear: () => void;
}

export default function CompareSlotCard({
  slot,
  item,
  stationNames: _ignored,
  isActiveTarget,
  onSelectAsTarget,
  onOpenPicker,
  onClear,
}: Props) {
  // ── Filled State ──
  if (item) {
    const photo = item.unit.foto_tampak_depan;
    const isSewa = (item.unit.jenis_properti || "").toLowerCase().includes("sewa");
    const jalanKaki = formatJalanKaki(item.unit.jarak_jalan_m, item.unit.waktu_jalan_s);

    return (
      <div
        onClick={onSelectAsTarget}
        className={`relative flex flex-col gap-1.5 rounded-[var(--radius-card)] border p-2.5 shadow-xs transition-all cursor-pointer ${
          isActiveTarget
            ? "border-[var(--color-brand)] bg-[var(--color-accent-surface)] ring-2 ring-[var(--color-brand)]/20"
            : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-brand)]/60"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="t-micro font-bold text-[var(--color-brand)]">Slot {slot}</span>
            {isActiveTarget && (
              <span className="rounded-full bg-[var(--color-brand)] px-1.5 py-0.2 text-[9px] font-bold text-white">
                Aktif
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => {
                onSelectAsTarget();
                onOpenPicker();
              }}
              className="cursor-pointer text-[11px] font-bold text-[var(--color-brand)] hover:underline"
            >
              Ganti
            </button>
            <span className="text-[var(--color-border)]">·</span>
            <button
              type="button"
              onClick={onClear}
              className="cursor-pointer text-[11px] font-normal text-[var(--color-muted)] hover:text-rose-600"
            >
              Hapus
            </button>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          {/* Thumbnail */}
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt=""
              className="h-12 w-12 flex-shrink-0 rounded-[6px] object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[6px] bg-[var(--color-pin-surface)] text-base font-bold text-[var(--color-pin)]">
              {item.unit.kategori_properti.charAt(0)}
            </div>
          )}

          {/* Details */}
          <div className="min-w-0 flex-1 flex flex-col gap-0.5">
            <div className="flex items-center justify-between gap-1">
              <p className="t-heading-2 truncate text-xs font-bold text-[var(--color-text)]">
                {item.unit.kategori_properti}
              </p>
              <span
                className={`flex-shrink-0 rounded-[var(--radius-pill)] px-1.5 py-0.2 text-[9px] font-bold ${
                  isSewa
                    ? "bg-amber-100 text-amber-900"
                    : "bg-emerald-100 text-emerald-900"
                }`}
              >
                {item.unit.jenis_properti}
              </span>
            </div>

            <p className="t-micro truncate font-semibold text-[var(--color-brand)]">
              📍 {item.stationName}
            </p>

            {item.unit.alamat && (
              <p className="t-micro line-clamp-1 font-normal text-[var(--color-text-sub)]">
                {item.unit.alamat}
              </p>
            )}

            {jalanKaki && (
              <p className="t-micro text-[10px] text-[var(--color-text-sub)]">
                🚶 {jalanKaki} ke stasiun
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Empty State ──
  return (
    <button
      type="button"
      onClick={() => {
        onSelectAsTarget();
        onOpenPicker();
      }}
      className={`group flex w-full items-center justify-between gap-2.5 rounded-[var(--radius-card)] border-2 p-3 text-left transition-all cursor-pointer ${
        isActiveTarget
          ? "border-[var(--color-brand)] bg-[var(--color-accent-surface)]/70 shadow-xs ring-2 ring-[var(--color-brand)]/20"
          : "border-dashed border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-brand)]"
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-transform ${
            isActiveTarget
              ? "bg-[var(--color-brand)] text-white scale-105"
              : "bg-[var(--color-brand)]/10 text-[var(--color-brand)]"
          }`}
        >
          {slot}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="t-body truncate text-xs font-bold text-[var(--color-text)]">
              Pilih Properti Slot {slot}
            </p>
            {isActiveTarget && (
              <span className="rounded-full bg-[var(--color-brand)] px-1.5 py-0.2 text-[9px] font-bold text-white">
                Aktif
              </span>
            )}
          </div>
          <p className="t-micro truncate text-[var(--color-muted)]">
            {isActiveTarget ? "Sedang memilih properti..." : "Klik untuk memilih slot ini"}
          </p>
        </div>
      </div>
      <span className="t-micro flex items-center gap-1 rounded-[var(--radius-pill)] border border-[var(--color-brand)] bg-[var(--color-surface)] px-2.5 py-1 text-[11px] font-bold text-[var(--color-brand)] shadow-xs">
        Pilih ▾
      </span>
    </button>
  );
}
