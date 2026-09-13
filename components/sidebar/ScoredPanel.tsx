"use client";

import { useState } from "react";
import AiLoadingBlock from "@/components/sidebar/AiLoadingBlock";
import AreaInsightBlock from "@/components/sidebar/AreaInsightBlock";
import ExportPdfButton from "@/components/sidebar/ExportPdfButton";
import PropertyList from "@/components/sidebar/PropertyList";
import RankStrip from "@/components/sidebar/RankStrip";
import ScoreComponentBar from "@/components/sidebar/ScoreComponentBar";
import UnrankableNotice from "@/components/sidebar/UnrankableNotice";
import {
  COMPONENT_LABELS,
  COMPONENT_ORDER,
  explainComponent,
  explainNeutralPull,
  observedRange,
} from "@/lib/scoring/explanations";
import { useSelectedStation } from "@/hooks/station/useSelectedStation";
import { useBriefResult } from "@/hooks/brief/useBriefResult";
import { useStations } from "@/hooks/station/useStations";
import { useProperties } from "@/hooks/property/useProperties";
import { useCommunitySentiment } from "@/hooks/sentiment/useCommunitySentiment";
import type { PropertyUnit } from "@/types/property";

interface Props {
  brief: string;
  onSelectProperty: (unit: PropertyUnit, stationId: string, stationName: string) => void;
}

export default function ScoredPanel({ brief, onSelectProperty }: Props) {
  const { setSelectedStation } = useSelectedStation();
  const { intent, scoreResult } = useBriefResult();
  const { stations } = useStations();

  const rankedAreas = scoreResult?.areas ?? [];

  const [activeAreaId, setActiveAreaId] = useState<string | null>(rankedAreas[0]?.area_id ?? null);

  const [prevScoreResult, setPrevScoreResult] = useState(scoreResult);
  if (scoreResult !== prevScoreResult) {
    setPrevScoreResult(scoreResult);
    setActiveAreaId(rankedAreas[0]?.area_id ?? null);
  }

  const unrankableStations = (stations?.features ?? [])
    .filter((feature) => feature.properties.is_rankable === false)
    .map((feature) => ({
      station_id: feature.properties.station_id,
      station_name: feature.properties.nama,
    }));

  const demandObservedRange = observedRange(rankedAreas.map((area) => area.komponen.demand));

  const area = rankedAreas.find((a) => a.area_id === activeAreaId) ?? rankedAreas[0] ?? null;
  const { sentiment, loading: sentimentLoading } = useCommunitySentiment(area?.station_id ?? null);

  const { properties, loading: propertiesLoading } = useProperties(area?.station_id ?? null);

  const [tab, setTab] = useState<"skor" | "unit">("skor");

  if (!area) {
    return (
      <section className="flex flex-col gap-[var(--space-sm)] rounded-[var(--radius-card)] border border-[var(--color-warning)] bg-[var(--color-warning-bg)] p-[var(--space-md)]">
        <h2 className="t-heading-2 text-[var(--color-warning-tx)]">Belum ada kawasan yang bisa dinilai</h2>
        <p className="t-body text-[var(--color-warning-tx)]">
          Semua kawasan untuk kategori usaha ini belum punya cukup data pengamatan.
        </p>
      </section>
    );
  }

  const peringkat = rankedAreas.findIndex((a) => a.area_id === area.area_id) + 1;

  function selectArea(areaId: string) {
    setActiveAreaId(areaId);
    const target = rankedAreas.find((a) => a.area_id === areaId);
    const feature = stations?.features.find((f) => f.properties.station_id === target?.station_id);
    if (target && feature?.geometry) {
      setSelectedStation({
        area_id: target.area_id,
        station_name: target.station_name,
        lng: feature.geometry.coordinates[0],
        lat: feature.geometry.coordinates[1],
        is_rankable: true,
      });
    }
  }

  return (
    <div className="flex flex-col gap-[var(--space-xl)]">
      <div className="flex flex-col gap-[var(--space-md)]">
        <nav aria-label="Lokasi" className="t-micro font-normal text-[var(--color-text-sub)]">
          Peringkat › {area.station_name}
        </nav>

        <RankStrip areas={rankedAreas} activeAreaId={area.area_id} onSelect={selectArea} />

        <div className="flex items-baseline gap-[var(--space-md)]">
          <div className="flex min-w-0 flex-1 flex-col gap-[var(--space-xs)]">
            <h1 className="t-heading-1">{area.station_name}</h1>
            <p className="t-micro font-normal text-[var(--color-text-sub)]">
              Peringkat {peringkat} dari {rankedAreas.length} · {area.n_observations} pengamatan
            </p>
          </div>
          <span className="t-display-score text-right tabular-nums text-[var(--color-opportunity-tx)]">
            {area.skor.toLocaleString("id-ID", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}
          </span>
        </div>

        {intent && (
          <ExportPdfButton
            brief={brief}
            intent={intent}
            areas={rankedAreas}
            activeArea={area}
            properties={properties}
          />
        )}
      </div>

      <div role="tablist" aria-label="Tampilan kawasan" className="flex gap-[var(--space-xs)] border-b border-[var(--color-border)]">
        {(
          [
            { id: "skor", label: "Skor" },
            { id: "unit", label: `Unit properti (${properties.length})` },
          ] as const
        ).map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            onClick={() => setTab(id)}
            className={`t-button -mb-px border-b-2 px-[var(--space-sm)] py-[var(--space-sm)] transition-colors duration-[var(--motion-fast)] ${
              tab === id
                ? "border-[var(--color-brand)] text-[var(--color-brand)]"
                : "border-transparent text-[var(--color-text-sub)] hover:text-[var(--color-text)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "skor" ? (
        <div
          role="tabpanel"
          id="panel-skor"
          aria-labelledby="tab-skor"
          className="flex flex-col gap-[var(--space-xl)]"
        >
          {COMPONENT_ORDER.map(({ key, bobot }) => (
            <ScoreComponentBar
              key={key}
              label={COMPONENT_LABELS[key]}
              value={area.komponen[key]}
              weight={area.bobot[bobot]}
              explanation={explainComponent(key, area.komponen[key])}
              caveat={key === "demand" ? explainNeutralPull(area.n_observations) : null}
              range={key === "demand" ? demandObservedRange : null}
            />
          ))}

          {sentimentLoading ? (
            <AiLoadingBlock judul="Gambaran kawasan" />
          ) : (
            sentiment?.ringkasan && <AreaInsightBlock paragraf={sentiment.ringkasan} />
          )}

          <UnrankableNotice stations={unrankableStations} />
        </div>
      ) : (
        <div role="tabpanel" id="panel-unit" aria-labelledby="tab-unit">
          <PropertyList
            properties={properties}
            loading={propertiesLoading}
            onSelect={(unit) => onSelectProperty(unit, area.station_id, area.station_name)}
          />
        </div>
      )}
    </div>
  );
}
