"use client";

interface MapBrandBadgeProps {
  sigmapsLogoSrc?: string;
}

export default function MapBrandBadge({ sigmapsLogoSrc }: MapBrandBadgeProps) {
  return (
    <div
      className="absolute bottom-3 right-3 z-30 flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/90 px-3 py-1.5 shadow-[var(--shadow-card)] backdrop-blur-md transition-all duration-[var(--motion-fast)] select-none hover:bg-[var(--color-surface)]"
      role="region"
      aria-label="Atribusi dan kemitraan platform"
    >
      {sigmapsLogoSrc ? (
        <img
          src={sigmapsLogoSrc}
          alt="SIGMAPS"
          className="h-[16px] w-auto object-contain"
          draggable={false}
        />
      ) : (
        <div className="flex items-center gap-1.5">
          <span className="flex h-[18px] w-[18px] items-center justify-center rounded-[4px] bg-[var(--color-brand)] text-[11px] font-black text-white shadow-xs">
            Σ
          </span>
          <span className="text-[12px] font-bold tracking-tight text-[var(--color-text)]">
            SIGMAPS
          </span>
        </div>
      )}

      <div className="h-3.5 w-[1px] bg-[var(--color-border)]" aria-hidden="true" />

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
