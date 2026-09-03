"use client";

import { useState } from "react";
import AreaInsightBlock from "@/components/sidebar/AreaInsightBlock";
import PropertyList from "@/components/sidebar/PropertyList";
import RankStrip from "@/components/sidebar/RankStrip";
import ScoreComponentBar from "@/components/sidebar/ScoreComponentBar";
import UnrankableNotice from "@/components/sidebar/UnrankableNotice";
import {
  AREA_INSIGHTS,
  DEMAND_OBSERVED_RANGE,
  RANKED_AREAS,
  UNRANKABLE_AREAS,
} from "@/lib/fixtures/scored";
import {
  COMPONENT_LABELS,
  explainComponent,
  explainNeutralPull,
} from "@/lib/score-explanations";
import { useSelectedStation } from "@/hooks/useSelectedStation";
import { STATIONS } from "@/lib/fixtures/stations";
import { findStation } from "@/lib/map/stations-geojson";
import type { ScoreComponentKey } from "@/types/scoring";

const COMPONENT_ORDER: readonly { key: ScoreComponentKey; weight: number }[] = [
  { key: "demand", weight: 0.25 },
  { key: "competitive_headroom", weight: 0.5 },
  { key: "segment_match", weight: 0.25 },
];

export default function ScoredPanel() {
  const { setSelectedStation } = useSelectedStation();
  const [activeAreaId, setActiveAreaId] = useState(RANKED_AREAS[0].area_id);
  const area = RANKED_AREAS.find((a) => a.area_id === activeAreaId) ?? RANKED_AREAS[0];
  const peringkat = RANKED_AREAS.findIndex((a) => a.area_id === area.area_id) + 1;

  /**
   * Pilih peringkat lain. Kamera peta digeser dengan mengubah stasiun aktif, bukan
   * dengan memanggil map.flyTo() dari sini — ARCHITECTURE.md §4.1.
   */
  function selectArea(areaId: string) {
    setActiveAreaId(areaId);
    setSelectedStation(findStation(STATIONS, areaId));
  }

  return (
    <div className="flex flex-col gap-[var(--space-xl)]">
      <div className="flex flex-col gap-[var(--space-md)]">
        <nav aria-label="Lokasi" className="t-micro font-normal text-[var(--color-text-sub)]">
          Peringkat › {area.station_name}
        </nav>

        <RankStrip areas={RANKED_AREAS} activeAreaId={activeAreaId} onSelect={selectArea} />

        <div className="flex items-baseline gap-[var(--space-md)]">
          <div className="flex min-w-0 flex-1 flex-col gap-[var(--space-xs)]">
            <h1 className="t-heading-1">{area.station_name}</h1>
            <p className="t-micro font-normal text-[var(--color-text-sub)]">
              Peringkat {peringkat} dari {RANKED_AREAS.length} · {area.n_observations} pengamatan
            </p>
          </div>
          <span className="t-display-score text-right tabular-nums text-[var(--color-opportunity-tx)]">
            {area.skor.toLocaleString("id-ID", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-[var(--space-xl)]">
        {COMPONENT_ORDER.map(({ key, weight }) => (
          <ScoreComponentBar
            key={key}
            label={COMPONENT_LABELS[key]}
            value={area.komponen[key]}
            weight={weight}
            explanation={explainComponent(key, area.komponen[key])}
            caveat={key === "demand" ? explainNeutralPull(area.n_observations) : null}
            range={key === "demand" ? DEMAND_OBSERVED_RANGE : null}
          />
        ))}
      </div>

      <AreaInsightBlock paragraf={AREA_INSIGHTS[area.area_id] ?? ""} />
      <UnrankableNotice areas={UNRANKABLE_AREAS} />
      <PropertyList />
    </div>
  );
}
