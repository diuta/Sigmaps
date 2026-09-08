"use client";

import { useState } from "react";
import AreaInsightBlock from "@/components/sidebar/AreaInsightBlock";
import PropertyList from "@/components/sidebar/PropertyList";
import RankStrip from "@/components/sidebar/RankStrip";
import ScoreComponentBar from "@/components/sidebar/ScoreComponentBar";
import UnrankableNotice from "@/components/sidebar/UnrankableNotice";
import {
  COMPONENT_LABELS,
  explainComponent,
  explainNeutralPull,
  observedRange,
} from "@/lib/scoring/explanations";
import { useSelectedStation } from "@/hooks/station/useSelectedStation";
import { useBriefResult } from "@/hooks/brief/useBriefResult";
import { useStations } from "@/hooks/station/useStations";
import { useCommunitySentiment } from "@/hooks/sentiment/useCommunitySentiment";
import type { ScoreComponentKey } from "@/types/scoring";

const COMPONENT_ORDER: readonly { key: ScoreComponentKey; weight: number }[] = [
  { key: "demand", weight: 0.25 },
  { key: "competitive_headroom", weight: 0.5 },
  { key: "segment_match", weight: 0.25 },
];

export default function ScoredPanel() {
  const { setSelectedStation } = useSelectedStation();
  const { scoreResult } = useBriefResult();
  const { stations } = useStations();

  // Terurut dan dipotong Top 5 di server. Jangan menyimpulkan apa pun dari
  // ketiadaan sebuah kawasan di sini — penandanya dibaca dari /api/stations.
  const rankedAreas = scoreResult?.areas ?? [];

  const [activeAreaId, setActiveAreaId] = useState<string | null>(rankedAreas[0]?.area_id ?? null);

  // rankedAreas berubah tiap kali brief baru disubmit — reset area aktif ke #1 supaya
  // panel tidak diam-diam menunjuk kawasan dari hasil brief sebelumnya. Disesuaikan LANGSUNG
  // saat render (pola resmi React untuk "adjusting state when a prop changes"), bukan lewat
  // useEffect — tidak ada efek samping ke luar React di sini, cuma turunan dari scoreResult.
  const [prevScoreResult, setPrevScoreResult] = useState(scoreResult);
  if (scoreResult !== prevScoreResult) {
    setPrevScoreResult(scoreResult);
    setActiveAreaId(rankedAreas[0]?.area_id ?? null);
  }

  // Dari penanda asli /api/stations. `=== false` karena null berarti pipeline
  // belum jalan, bukan datanya kurang.
  const unrankableStations = (stations?.features ?? [])
    .filter((feature) => feature.properties.is_rankable === false)
    .map((feature) => ({
      station_id: feature.properties.station_id,
      station_name: feature.properties.nama,
    }));

  const demandObservedRange = observedRange(rankedAreas.map((area) => area.komponen.demand));

  const area = rankedAreas.find((a) => a.area_id === activeAreaId) ?? rankedAreas[0] ?? null;
  const { sentiment } = useCommunitySentiment(area?.station_id ?? null);

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

  /**
   * Pilih peringkat lain. Kamera peta digeser dengan mengubah stasiun aktif, bukan
   * dengan memanggil map.flyTo() dari sini — ARCHITECTURE.md §4.1.
   */
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
            range={key === "demand" ? demandObservedRange : null}
          />
        ))}
      </div>

      {sentiment?.ringkasan && <AreaInsightBlock paragraf={sentiment.ringkasan} />}
      <UnrankableNotice stations={unrankableStations} />
      <PropertyList stationId={area.station_id} />
    </div>
  );
}
