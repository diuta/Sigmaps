"use client";

import { useComparison } from "@/hooks/comparison/useComparison";

/**
 * components/map/MapBrandBadge.tsx
 *
 * Co-branding floating glass pill di sudut kanan-bawah peta:
 * - Logo / Identitas SIGMAPS (disediakan slot siap ganti file logo)
 * - Divider vertikal halus
 * - Powered by MAPID logo (tautan resmi ke mapid.io)
 *
 * Mengikuti prinsip desain GIS:
 * - Posisi bottom-right adalah standar platform attribution & watermark (Mapbox, CARTO, Felt).
 * - Glassmorphism (white/90 + backdrop blur + subtle border + shadow-card) agar menyatu elegan dengan peta.
 */

interface MapBrandBadgeProps {
  /** Path logo kustom SIGMAPS jika nanti dimasukkan (opsional) */
  sigmapsLogoSrc?: string;
}

export default function MapBrandBadge({ sigmapsLogoSrc }: MapBrandBadgeProps) {
  const { isPanelOpen, isPanelMinimized } = useComparison();
  const isDockVisible = isPanelOpen && isPanelMinimized;
  const translateY = isDockVisible ? -68 : 0;

  return (
    <div
      className="absolute bottom-3 right-3 z-30 flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/90 px-3 py-1.5 shadow-[var(--shadow-card)] backdrop-blur-md transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] select-none hover:bg-[var(--color-surface)]"
      style={{
        transform: `translateY(${translateY}px)`,
      }}
      role="region"
      aria-label="Atribusi dan kemitraan platform"
    >
      {/* ── 1. SLOT LOGO SIGMAPS ────────────────────────────────────────── */}
      {sigmapsLogoSrc ? (
        <img
          src={sigmapsLogoSrc}
          alt="SIGMAPS"
          className="h-[16px] w-auto object-contain"
          draggable={false}
        />
      ) : (
        /* Default Stylized Badge SIGMAPS — siap diganti begitu file logo tersedia */
        <div className="flex items-center gap-1.5">
          <span className="flex h-[18px] w-[18px] items-center justify-center rounded-[4px] bg-[var(--color-brand)] text-[11px] font-black text-white shadow-xs">
            Σ
          </span>
          <span className="text-[12px] font-bold tracking-tight text-[var(--color-text)]">
            SIGMAPS
          </span>
        </div>
      )}

      {/* ── 2. DIVIDER HALUS ────────────────────────────────────────────── */}
      <div className="h-3.5 w-[1px] bg-[var(--color-border)]" aria-hidden="true" />

      {/* ── 3. POWERED BY MAPID ─────────────────────────────────────────── */}
      <a
        href="https://mapid.io"
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-1.5 transition-opacity hover:opacity-80"
        title="Platform & Basemap powered by MAPID (mapid.io)"
      >
        <span className="text-[10px] font-medium text-[var(--color-muted)]">
          powered by
        </span>
        <img
          src="/assets/logos/mapid_logo_black.webp"
          alt="MAPID"
          className="h-[13px] w-auto object-contain transition-transform duration-150 group-hover:scale-105"
          draggable={false}
        />
      </a>
    </div>
  );
}
