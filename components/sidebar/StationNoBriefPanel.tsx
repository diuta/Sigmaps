"use client";

import { useMemo } from "react";
import AiLoadingBlock from "@/components/sidebar/AiLoadingBlock";
import AreaGapBlock from "@/components/sidebar/AreaGapBlock";
import AreaInsightBlock from "@/components/sidebar/AreaInsightBlock";
import PropertyList from "@/components/sidebar/PropertyList";
import { useSelectedStation } from "@/hooks/station/useSelectedStation";
import { useStations } from "@/hooks/station/useStations";
import { useProperties } from "@/hooks/property/useProperties";
import { useCommunitySentiment } from "@/hooks/sentiment/useCommunitySentiment";
import { kategoriJarang } from "@/lib/scoring";
import type { PropertyUnit } from "@/types/property";

interface Props {
  onSelectProperty: (unit: PropertyUnit, stationId: string, stationName: string) => void;
}

export default function StationNoBriefPanel({ onSelectProperty }: Props) {
  const { selectedStation } = useSelectedStation();
  const { stations } = useStations();

  const { properties, loading } = useProperties(
    selectedStation?.is_rankable ? selectedStation.area_id : null,
  );

  const { sentiment, loading: sentimentLoading } = useCommunitySentiment(
    selectedStation?.is_rankable ? selectedStation.area_id : null,
  );

  // selectedStation.area_id memuat station_id (lihat StationSearchBar), jadi
  // kawasan dicocokkan lewat station_id — bukan scored_areas.area_id.
  const kategori = useMemo(
    () =>
      selectedStation
        ? kategoriJarang(
            (stations?.features ?? []).map((f) => ({
              key: f.properties.station_id,
              area_km2: f.properties.area_km2,
              competitor_counts: f.properties.competitor_counts,
            })),
            selectedStation.area_id,
          )
        : [],
    [stations, selectedStation],
  );

  if (!selectedStation) return null;

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

      {selectedStation.is_rankable ? (
        <>
          <AreaGapBlock kategori={kategori} />

          {sentimentLoading ? (
            <AiLoadingBlock judul="Gambaran kawasan" />
          ) : (
            sentiment?.ringkasan && <AreaInsightBlock paragraf={sentiment.ringkasan} />
          )}

          <PropertyList
            properties={properties}
            loading={loading}
            onSelect={(unit) => onSelectProperty(unit, selectedStation.area_id, selectedStation.station_name)}
          />
        </>
      ) : (
        <section className="flex flex-col gap-[var(--space-sm)] rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-[var(--space-md)]">
          <h2 className="t-heading-2 text-[var(--color-text)]">Luar Cakupan Evaluasi</h2>
          <p className="t-body text-[var(--color-muted)]">
            Kawasan stasiun ini berfungsi sebagai titik transit referensi jaringan transportasi dan belum masuk dalam pemodelan pemeringkatan properti.
          </p>
        </section>
      )}
    </div>
  );
}
