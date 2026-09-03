"use client";

import PriceAssumptionNotice from "@/components/sidebar/PriceAssumptionNotice";
import ScoredPanel from "@/components/sidebar/ScoredPanel";
import StaleOutputNotice from "@/components/sidebar/StaleOutputNotice";
import StationNoBriefPanel from "@/components/sidebar/StationNoBriefPanel";
import { useSelectedStation } from "@/hooks/useSelectedStation";
import { INTENT_OUTPUT } from "@/lib/fixtures/brief";
import { SCORE_RESPONSE } from "@/lib/fixtures/scored";

interface Props {
  /** Ada brief yang sudah dinilai. */
  scored: boolean;
  /** Rencana sedang disunting, jadi hasil di bawah belum tentu cocok lagi. */
  stale: boolean;
  onEditBrief: () => void;
  onPrefill: (text: string) => void;
}

/**
 * Bagian bawah sidebar. Berdiri sendiri dari bagian rencana di atasnya: membuka
 * penyunting rencana hanya meredupkan bagian ini, tidak melepasnya dari layar.
 */
export default function OutputSection({ scored, stale, onEditBrief, onPrefill }: Props) {
  const { selectedStation } = useSelectedStation();

  // Tampilan awal: hanya bagian rencana. Belum ada kawasan yang dipilih di peta.
  if (!scored && !selectedStation) return null;

  const perkiraanHarga = SCORE_RESPONSE.catatan.harga_sumber === "perkiraan";

  return (
    <div className="flex flex-col gap-[var(--space-xl)]">
      <hr className="border-0 border-t border-[var(--color-border)]" />

      {stale && <StaleOutputNotice />}

      <div
        className={`motion-rise-in flex flex-col gap-[var(--space-xl)] transition-opacity duration-[var(--motion-base)] ${
          stale ? "opacity-65" : "opacity-100"
        }`}
      >
        {scored ? (
          <>
            {perkiraanHarga && (
              <PriceAssumptionNotice
                hargaTarget={INTENT_OUTPUT.harga_target}
                onEdit={onEditBrief}
              />
            )}
            <ScoredPanel />
          </>
        ) : (
          <StationNoBriefPanel onPrefill={onPrefill} />
        )}
      </div>
    </div>
  );
}
