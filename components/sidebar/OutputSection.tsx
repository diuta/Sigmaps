"use client";

import { useState, useEffect } from "react";
import AiLoadingBlock from "@/components/sidebar/AiLoadingBlock";
import PriceAssumptionNotice from "@/components/sidebar/PriceAssumptionNotice";
import PropertyDetail from "@/components/sidebar/PropertyDetail";
import ScoredPanel from "@/components/sidebar/ScoredPanel";
import StaleOutputNotice from "@/components/sidebar/StaleOutputNotice";
import StationNoBriefPanel from "@/components/sidebar/StationNoBriefPanel";
import { useSelectedStation } from "@/hooks/station/useSelectedStation";
import { useBriefResult } from "@/hooks/brief/useBriefResult";
import { useSelectedProperty } from "@/hooks/property/useSelectedProperty";
import type { PropertyUnit } from "@/types/property";
import CompareBar from "@/components/comparison/CompareBar";

interface Props {
  brief: string | null;
  loading: boolean;
  scored: boolean;
  stale: boolean;
  onEditBrief: () => void;
}

export default function OutputSection({ brief, loading, scored, stale, onEditBrief }: Props) {
  const { selectedStation } = useSelectedStation();
  const { intent, scoreResult } = useBriefResult();
  const { selectedProperty, setSelectedProperty } = useSelectedProperty();

  const [detail, setDetail] = useState<{ unit: PropertyUnit; stationId: string; stationName: string } | null>(null);

  useEffect(() => {
    if (selectedProperty) {
      setDetail({
        unit: selectedProperty,
        stationId: selectedStation?.area_id ?? "",
        stationName: selectedStation?.station_name ?? "",
      });
    }
  }, [selectedProperty, selectedStation?.area_id, selectedStation?.station_name]);

  const [prevStationId, setPrevStationId] = useState(selectedStation?.area_id);
  if (selectedStation?.area_id !== prevStationId) {
    setPrevStationId(selectedStation?.area_id);
    if (detail) {
      setDetail(null);
      setSelectedProperty(null);
    }
  }

  const [prevScoreResult, setPrevScoreResult] = useState(scoreResult);
  if (scoreResult !== prevScoreResult) {
    setPrevScoreResult(scoreResult);
    if (detail) {
      setDetail(null);
      setSelectedProperty(null);
    }
  }

  function closeDetail() {
    const triggerId = detail && `unit-${detail.unit.id}`;
    setDetail(null);
    setSelectedProperty(null);
    if (triggerId) {
      requestAnimationFrame(() => document.getElementById(triggerId)?.focus());
    }
  }

  if (!scored && !selectedStation && !loading && !detail && !selectedProperty) return null;

  const perkiraanHarga = scoreResult?.catatan.harga_sumber === "perkiraan";

  return (
    <div className="flex flex-col gap-[var(--space-xl)]">
      <hr className="border-0 border-t border-[var(--color-border)]" />

      {!detail && stale && <StaleOutputNotice />}

      {!detail && loading && <AiLoadingBlock judul="Menilai kawasan" />}

      {detail && (
        <PropertyDetail
          property={detail.unit}
          stationId={detail.stationId}
          stationName={detail.stationName}
          onBack={closeDetail}
        />
      )}

      <div
        hidden={detail !== null}
        className={`motion-rise-in flex flex-col gap-[var(--space-xl)] transition-opacity duration-[var(--motion-base)] ${
          stale ? "opacity-65" : "opacity-100"
        }`}
      >
        {scored ? (
          <>
            {perkiraanHarga && intent && (
              <PriceAssumptionNotice
                hargaTarget={intent.harga_target}
                onEdit={onEditBrief}
              />
            )}
            <ScoredPanel
              brief={brief ?? ""}
              onSelectProperty={(unit, stationId, stationName) => {
                setSelectedProperty({ ...unit });
                setDetail({ unit, stationId, stationName });
              }}
            />
          </>
        ) : (
          <StationNoBriefPanel
            onSelectProperty={(unit, stationId, stationName) => {
              setSelectedProperty({ ...unit });
              setDetail({ unit, stationId, stationName });
            }}
          />
        )}
      </div>

      <CompareBar />
    </div>
  );
}
