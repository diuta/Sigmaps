"use client";

import { useState } from "react";
import type { BusinessPlanPdfData } from "@/lib/pdf/businessPlanDocument";

type Props = BusinessPlanPdfData;

/**
 * Tombol "Unduh PDF" di ScoredPanel. `@react-pdf/renderer` di-import dinamis di dalam
 * onClick (bukan di top-level) supaya bundle-nya (lumayan besar, punya font/layout engine
 * sendiri) tidak ikut ke initial load — cuma diambil browser saat tombol ini benar-benar
 * dipakai.
 */
export default function ExportPdfButton(props: Props) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setGenerating(true);
    setError(null);

    try {
      const { generateBusinessPlanPdfBlob } = await import("@/lib/pdf/businessPlanDocument");
      const blob = await generateBusinessPlanPdfBlob(props);

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `sigmaps-${props.activeArea.station_name.toLowerCase().replace(/\s+/g, "-")}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Ditunda, bukan langsung sesudah click(): revoke sebelum browser sempat memulai
      // unduhan di beberapa browser (Safari lama) membatalkan unduhannya.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("Gagal membuat PDF ringkasan rencana usaha", err);
      setError("Gagal membuat PDF, coba lagi.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-[var(--space-xs)]">
      <button
        type="button"
        onClick={handleClick}
        disabled={generating}
        className="t-button rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--space-md)] py-[var(--space-xs)] text-[var(--color-text)] transition-all duration-[var(--motion-fast)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {generating ? "Menyiapkan PDF..." : "Unduh PDF"}
      </button>
      {error && <p className="t-micro text-[var(--color-warning-tx)]">{error}</p>}
    </div>
  );
}
