"use client";

import AiCategoryBlock from "@/components/sidebar/AiCategoryBlock";
import AreaCompositionList from "@/components/sidebar/AreaCompositionList";
import PropertyList from "@/components/sidebar/PropertyList";
import { useSelectedStation } from "@/hooks/useSelectedStation";
import { SCORE_RESPONSE } from "@/lib/fixtures/scored";
import { STATION_OVERVIEWS } from "@/lib/fixtures/station";

interface Props {
  onPrefill: (text: string) => void;
}

/** Keadaan "kawasan dipilih di peta, rencana belum diisi" — belum ada skor apa pun. */
export default function StationNoBriefPanel({ onPrefill }: Props) {
  const { selectedStation } = useSelectedStation();
  if (!selectedStation) return null;

  const overview = STATION_OVERVIEWS[selectedStation.area_id];
  const scored = SCORE_RESPONSE.areas.find((a) => a.area_id === selectedStation.area_id);

  return (
    <div className="flex flex-col gap-[var(--space-xl)]">
      <div className="flex flex-col gap-[var(--space-xs)]">
        <nav aria-label="Lokasi" className="t-micro font-normal text-[var(--color-text-sub)]">
          Peta › {selectedStation.station_name}
        </nav>
        <h1 className="t-heading-1">{selectedStation.station_name}</h1>
        <p className="t-body text-[var(--color-text-sub)]">
          Tulis rencana usaha di atas untuk menilai kawasan ini.
        </p>
      </div>

      {overview ? (
        <>
          <AiCategoryBlock
            kategori={overview.kategori_jarang}
            ringkasan={overview.ringkasan_ai}
            onPrefill={onPrefill}
          />
          <AreaCompositionList rows={overview.komposisi} />
          <PropertyList />
        </>
      ) : (
        <section className="flex flex-col gap-[var(--space-sm)] rounded-[var(--radius-card)] border border-[var(--color-warning)] bg-[var(--color-warning-bg)] p-[var(--space-md)]">
          <h2 className="t-heading-2 text-[var(--color-warning-tx)]">Data belum cukup</h2>
          <p className="t-body text-[var(--color-warning-tx)]">
            {selectedStation.is_rankable
              ? "Ringkasan kawasan ini belum tersedia."
              : "Kawasan ini tidak dinilai dan tidak masuk peringkat karena pengamatannya terlalu sedikit."}
            {scored ? ` Baru ada ${scored.n_observations} pengamatan di sini.` : ""}
          </p>
        </section>
      )}
    </div>
  );
}
