"use client";

import { useState, useEffect } from "react";
import AiLoadingBlock from "@/components/sidebar/AiLoadingBlock";
import CompareBar from "@/components/comparison/CompareBar";
import PriceAssumptionNotice from "@/components/sidebar/PriceAssumptionNotice";
import PropertyDetail from "@/components/sidebar/PropertyDetail";
import ScoredPanel from "@/components/sidebar/ScoredPanel";
import StaleOutputNotice from "@/components/sidebar/StaleOutputNotice";
import StationNoBriefPanel from "@/components/sidebar/StationNoBriefPanel";
import { useSelectedStation } from "@/hooks/station/useSelectedStation";
import { useStations } from "@/hooks/station/useStations";
import { useBriefResult } from "@/hooks/brief/useBriefResult";
import { useSelectedProperty } from "@/hooks/property/useSelectedProperty";
import type { PropertyUnit } from "@/types/property";

interface Props {
  brief: string | null;
  loading: boolean;
  scored: boolean;
  stale: boolean;
  onEditBrief: () => void;
}

export default function OutputSection({ brief, loading, scored, stale, onEditBrief }: Props) {
  const { selectedStation, setSelectedStation } = useSelectedStation();
  const { stations } = useStations();
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

  useEffect(() => {
    if (detail && selectedProperty?.station_id !== selectedStation?.area_id) {
      setDetail(null);
      setSelectedProperty(null);
    }
  }, [selectedStation?.area_id, selectedProperty?.station_id, detail, setSelectedProperty]);

  useEffect(() => {
    if (detail) {
      setDetail(null);
      setSelectedProperty(null);
    }
  }, [scoreResult, setSelectedProperty]);

  function closeDetail() {
    const triggerId = detail && `unit-${detail.unit.id}`;
    setDetail(null);
    setSelectedProperty(null);

    // Kembali ke stasiun peringkat default (#1) jika ada hasil ranking
    if (scoreResult && scoreResult.areas.length > 0) {
      const topArea = scoreResult.areas[0];
      const topStationFeature = stations?.features.find(
        (f) => f.properties.station_id === topArea.station_id
      );
      if (topStationFeature && topStationFeature.geometry) {
        setSelectedStation({
          area_id: topStationFeature.properties.station_id,
          station_name: topStationFeature.properties.nama,
          lng: topStationFeature.geometry.coordinates[0],
          lat: topStationFeature.geometry.coordinates[1],
          is_rankable: topStationFeature.properties.is_rankable !== false,
        });
      }
    }

    // Kembalikan fokus ke kartu asalnya. Elemennya masih ada di DOM karena panel di balik
    // detail cuma disembunyikan, bukan dilepas — tanpa ini fokus jatuh ke <body> dan
    // pengguna keyboard harus menelusuri sidebar dari awal.
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
