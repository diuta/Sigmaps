"use client";

/**
 * components/map/MapLegend.tsx
 *
 * Legenda peta statis, mengikuti prinsip desain GIS:
 * - Posisi sudut kiri bawah, di atas ScaleControl MapLibre
 * - Bergeser mengikuti sidebar (open → offset by sidebar width, closed → offset by 0)
 * - Animasi `left` sinkron dengan transisi translate sidebar (--motion-base + --ease-out)
 * - Collapsible agar tidak menutupi konten saat tidak dibutuhkan
 */

import { useState } from "react";
import { useSidebarOpen } from "@/hooks/sidebar/useSidebarOpen";
import { useComparison } from "@/hooks/comparison/useComparison";

// Simbol: stasiun aktif — pin biru dengan ikon kereta (vektor tajam persis marker peta)
function StationActiveSymbol() {
  return (
    <svg
      width="18"
      height="21"
      viewBox="13 13 47 54"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M21.2721 46.7279C14.2427 39.6985 14.2427 28.3015 21.2721 21.2721C28.3015 14.2426 39.6985 14.2426 46.728 21.2721L50.9706 25.5147C58.7811 33.3252 58.7811 45.9885 50.9706 53.799L39.6569 65.1127L21.2721 46.7279Z"
        fill="#1E40AF"
        shapeRendering="geometricPrecision"
      />
      <path
        d="M21.6257 21.6256C28.4598 14.7915 39.5402 14.7915 46.3744 21.6256L50.6171 25.8683C58.2323 33.4835 58.2323 45.8302 50.6171 53.4454L39.6569 64.4056L21.6257 46.3744C14.7915 39.5402 14.7915 28.4598 21.6257 21.6256Z"
        stroke="white"
        strokeWidth="1.2"
        shapeRendering="geometricPrecision"
      />
      <path
        d="M30.8284 39.8286V32.7036C30.8284 32.0411 31.0002 31.513 31.344 31.1192C31.6877 30.7255 32.1409 30.4255 32.7034 30.2192C33.2659 30.013 33.9065 29.8755 34.6252 29.8067C35.344 29.738 36.0784 29.7036 36.8284 29.7036C37.6534 29.7036 38.4315 29.738 39.1627 29.8067C39.894 29.8755 40.5315 30.013 41.0753 30.2192C41.619 30.4255 42.0471 30.7255 42.3596 31.1192C42.6721 31.513 42.8284 32.0411 42.8284 32.7036V39.8286C42.8284 40.5661 42.5753 41.188 42.069 41.6942C41.5628 42.2005 40.9409 42.4536 40.2034 42.4536L41.3284 43.5786V43.9536H39.8284L38.3284 42.4536H35.3284L33.8284 43.9536H32.3284V43.5786L33.4534 42.4536C32.7159 42.4536 32.094 42.2005 31.5877 41.6942C31.0815 41.188 30.8284 40.5661 30.8284 39.8286ZM32.3284 35.7036H36.0784V33.4536H32.3284V35.7036ZM37.5784 35.7036H41.3284V33.4536H37.5784V35.7036ZM34.2034 40.2036C34.5284 40.2036 34.7971 40.0974 35.0096 39.8849C35.2221 39.6724 35.3284 39.4036 35.3284 39.0786C35.3284 38.7536 35.2221 38.4849 35.0096 38.2724C34.7971 38.0599 34.5284 37.9536 34.2034 37.9536C33.8784 37.9536 33.6096 38.0599 33.3971 38.2724C33.1846 38.4849 33.0784 38.7536 33.0784 39.0786C33.0784 39.4036 33.1846 39.6724 33.3971 39.8849C33.6096 40.0974 33.8784 40.2036 34.2034 40.2036ZM39.4534 40.2036C39.7784 40.2036 40.0471 40.0974 40.2596 39.8849C40.4721 39.6724 40.5784 39.4036 40.5784 39.0786C40.5784 38.7536 40.4721 38.4849 40.2596 38.2724C40.0471 38.0599 39.7784 37.9536 39.4534 37.9536C39.1284 37.9536 38.8596 38.0599 38.6471 38.2724C38.4346 38.4849 38.3284 38.7536 38.3284 39.0786C38.3284 39.4036 38.4346 39.6724 38.6471 39.8849C38.8596 40.0974 39.1284 40.2036 39.4534 40.2036Z"
        fill="white"
      />
    </svg>
  );
}

// Simbol: stasiun lain — pin abu-abu dengan ikon kereta (vektor tajam persis marker peta)
function StationInactiveSymbol() {
  return (
    <svg
      width="18"
      height="21"
      viewBox="4.5 4.5 47 54"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <g opacity="0.85">
        <path
          d="M12.7279 38.184C5.69848 31.1545 5.69848 19.7576 12.7279 12.7281C19.7574 5.69869 31.1543 5.6987 38.1838 12.7281L42.4264 16.9708C50.2369 24.7813 50.2369 37.4446 42.4264 45.255L31.1127 56.5688L12.7279 38.184Z"
          fill="#94A3B8"
          shapeRendering="geometricPrecision"
        />
        <path
          d="M13.0815 13.0817C19.9157 6.24751 30.996 6.24751 37.8302 13.0817L42.0729 17.3243C49.6881 24.9395 49.6881 37.2863 42.0729 44.9015L31.1127 55.8617L13.0815 37.8304C6.2473 30.9963 6.2473 19.9159 13.0815 13.0817Z"
          stroke="white"
          strokeOpacity="0.7"
          strokeWidth="1.2"
          shapeRendering="geometricPrecision"
        />
        <path
          d="M22.2842 31.2847V24.1597C22.2842 23.4972 22.4561 22.969 22.7998 22.5753C23.1436 22.1815 23.5967 21.8815 24.1592 21.6753C24.7217 21.469 25.3623 21.3315 26.0811 21.2628C26.7998 21.194 27.5342 21.1597 28.2842 21.1597C29.1092 21.1597 29.8873 21.194 30.6186 21.2628C31.3498 21.3315 31.9873 21.469 32.5311 21.6753C33.0748 21.8815 33.5029 22.1815 33.8154 22.5753C34.1279 22.969 34.2842 23.4972 34.2842 24.1597V31.2847C34.2842 32.0222 34.0311 32.644 33.5248 33.1503C33.0186 33.6566 32.3967 33.9097 31.6592 33.9097L32.7842 35.0347V35.4097H31.2842L29.7842 33.9097H26.7842L25.2842 35.4097H23.7842V35.0347L24.9092 33.9097C24.1717 33.9097 23.5498 33.6566 23.0436 33.1503C22.5373 32.644 22.2842 32.0222 22.2842 31.2847ZM23.7842 27.1597H27.5342V24.9097H23.7842V27.1597ZM29.0342 27.1597H32.7842V24.9097H29.0342V27.1597ZM25.6592 31.6597C25.9842 31.6597 26.2529 31.5534 26.4654 31.3409C26.6779 31.1284 26.7842 30.8597 26.7842 30.5347C26.7842 30.2097 26.6779 29.9409 26.4654 29.7284C26.2529 29.5159 25.9842 29.4097 25.6592 29.4097C25.3342 29.4097 25.0654 29.5159 24.8529 29.7284C24.6404 29.9409 24.5342 30.2097 24.5342 30.5347C24.5342 30.8597 24.6404 31.1284 24.8529 31.3409C25.0654 31.5534 25.3342 31.6597 25.6592 31.6597ZM30.9092 31.6597C31.2342 31.6597 31.5029 31.5534 31.7154 31.3409C31.9279 31.1284 32.0342 30.8597 32.0342 30.5347C32.0342 30.2097 31.9279 29.9409 31.7154 29.7284C31.5029 29.5159 31.2342 29.4097 30.9092 29.4097C30.5842 29.4097 30.3154 29.5159 30.1029 29.7284C29.8904 29.9409 29.7842 30.2097 29.7842 30.5347C29.7842 30.8597 29.8904 31.1284 30.1029 31.3409C30.3154 31.5534 30.5842 31.6597 30.9092 31.6597Z"
          fill="white"
        />
      </g>
    </svg>
  );
}

// Simbol: properti — oranye (aktif) dan peach (stasiun lainnya)
function PropertySymbol() {
  return (
    <div className="flex items-center gap-1 shrink-0">
      <svg width="10" height="14" viewBox="0 0 12 16" fill="none" aria-hidden="true" aria-label="Stasiun terpilih">
        <path
          d="M6 0C2.686 0 0 2.686 0 6c0 1.427.506 2.734 1.346 3.756L6 16l4.654-6.244A5.974 5.974 0 0 0 12 6C12 2.686 9.314 0 6 0Z"
          fill="#EA580C"
        />
        <circle cx="6" cy="6" r="2.2" fill="white" />
      </svg>
      <svg width="10" height="14" viewBox="0 0 12 16" fill="none" aria-hidden="true" aria-label="Stasiun lainnya">
        <path
          d="M6 0C2.686 0 0 2.686 0 6c0 1.427.506 2.734 1.346 3.756L6 16l4.654-6.244A5.974 5.974 0 0 0 12 6C12 2.686 9.314 0 6 0Z"
          fill="#F0AC89"
        />
        <circle cx="6" cy="6" r="2.2" fill="white" />
      </svg>
    </div>
  );
}

// Simbol: isochrone — area dengan border dashed biru
function IsochroneSymbol() {
  return (
    <svg width="20" height="12" viewBox="0 0 20 12" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="18" height="10" rx="2.5" fill="rgba(30,64,175,0.12)" stroke="#1E40AF" strokeWidth="1.2" strokeDasharray="3 2" />
    </svg>
  );
}

interface LegendItem {
  symbol: React.ReactNode;
  label: string;
  sub?: string;
}

const LEGEND_ITEMS: LegendItem[] = [
  { symbol: <StationActiveSymbol />, label: "Stasiun Teranalisis", sub: "Tercakup dalam evaluasi & ranking" },
  { symbol: <StationInactiveSymbol />, label: "Jaringan Sekunder", sub: "Titik transit tanpa penilaian" },
  { symbol: <PropertySymbol />, label: "Listing Properti", sub: "Oranye: aktif · Peach: lainnya" },
  { symbol: <IsochroneSymbol />, label: "Zona Jalan Kaki 10 Mnt", sub: "Jangkauan dari stasiun terpilih" },
];

/** px of the toggle tab that sticks out when sidebar is closed */
const SIDEBAR_CLOSED_PX = 24;
/** gap between sidebar edge and legend */
const GAP_PX = 16;
/** Base left offset when sidebar is closed (24 + 16 = 40px) */
const BASE_LEFT_PX = SIDEBAR_CLOSED_PX + GAP_PX;
/** Horizontal translate distance when sidebar is open (380 - 24 = 356px) */
const TRANSLATE_OPEN_PX = 380 - SIDEBAR_CLOSED_PX;

export default function MapLegend() {
  const { sidebarOpen } = useSidebarOpen();
  const { isPanelOpen, isPanelMinimized } = useComparison();
  const [collapsed, setCollapsed] = useState(false);

  const isDockVisible = isPanelOpen && isPanelMinimized;

  const translateX = sidebarOpen ? TRANSLATE_OPEN_PX : 0;
  // When comparison dock is active at the bottom, animate legend up by 68px to avoid collision
  const translateY = isDockVisible ? -68 : 0;

  return (
    <div
      className="absolute bottom-[52px] z-40 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
      role="region"
      aria-label="Legenda peta"
      style={{
        left: BASE_LEFT_PX,
        transform: `translate(${translateX}px, ${translateY}px)`,
        maxWidth: `calc(100vw - ${BASE_LEFT_PX + translateX + GAP_PX}px)`,
      }}
    >
      <div
        className="flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]/95 shadow-[var(--shadow-float)] backdrop-blur-sm"
        style={{ minWidth: 200, maxWidth: "100%" }}
      >
        {/* Header / Toggle */}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-expanded={!collapsed}
          className={`flex h-11 w-full items-center justify-between gap-[var(--space-md)] px-3.5 bg-[var(--color-surface-muted)] transition-colors duration-[var(--motion-fast)] hover:bg-[var(--color-border)] ${
            collapsed ? "" : "border-b border-[var(--color-border)]"
          }`}
        >
          <span className="t-micro text-[var(--color-text-sub)] tracking-wider uppercase select-none">
            Legenda
          </span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
            className="transition-transform duration-[var(--motion-base)] ease-[var(--ease-out)]"
            style={{
              transform: collapsed ? "rotate(0deg)" : "rotate(180deg)",
              transformOrigin: "center",
            }}
          >
            <path
              d="M2.5 7.5L6 4L9.5 7.5"
              stroke="#94A3B8"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Items: collapsible with smooth transition matching sidebar motion tokens */}
        <div
          className={`grid transition-[grid-template-rows,opacity] duration-[var(--motion-base)] ease-[var(--ease-out)] ${
            collapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
          }`}
        >
          <div className="overflow-hidden">
            <ul className="flex flex-col gap-0 list-none m-0 p-0" role="list">
              {LEGEND_ITEMS.map((item, i) => (
                <li
                  key={i}
                  className="flex items-center gap-[var(--space-sm)] px-[var(--space-md)] py-[9px] border-b border-[var(--color-border)] last:border-b-0"
                >
                  <span className="flex items-center justify-center shrink-0" style={{ width: 24 }}>
                    {item.symbol}
                  </span>
                  <span className="flex flex-col gap-0">
                    <span className="t-body font-medium text-[var(--color-text)] leading-snug">
                      {item.label}
                    </span>
                    {item.sub && (
                      <span className="t-micro text-[var(--color-muted)] font-normal">
                        {item.sub}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
