/**
 * Pin stasiun 36×44 sesuai DESIGN.md §5A — shield/teardrop dengan ujung runcing bawah.
 *
 * Fungsi murni: seluruh warna diterima sebagai argumen supaya tidak ada satu pun hex
 * yang ditulis di sini. Pemanggil membaca CSS variable dari :root.
 */

export interface StationPinColors {
  /** Warna badan pin. */
  fill: string;
  /** Warna piktogram transit di dalam pin. */
  icon: string;
  /** Warna border 1.5px. */
  border: string;
  /** Bila diisi, pin mendapat outer glow (dipakai untuk stasiun terpilih). */
  glow?: string;
}

/** Sisi kanvas SVG. Ujung pin menyentuh tepi bawah, jadi icon-anchor: "bottom". */
export const STATION_PIN_SIZE = { width: 48, height: 48 } as const;

export function stationPinSvg({ fill, icon, border, glow }: StationPinColors): string {
  const halo = glow
    ? `<circle cx="24" cy="20" r="23" fill="${glow}" fill-opacity="0.2"/>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
${halo}
<path d="M24 47C24 47 42 26 42 20A18 18 0 1 0 6 20C6 26 24 47 24 47Z" fill="${fill}" stroke="${border}" stroke-width="1.5"/>
<rect x="17" y="11" width="14" height="14" rx="3" fill="${icon}"/>
<rect x="19.5" y="13.5" width="9" height="5" rx="1" fill="${fill}"/>
<rect x="19.5" y="20.5" width="3" height="2" rx="1" fill="${fill}"/>
<rect x="25.5" y="20.5" width="3" height="2" rx="1" fill="${fill}"/>
</svg>`;
}

export function stationPinDataUri(colors: StationPinColors): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(stationPinSvg(colors))}`;
}
