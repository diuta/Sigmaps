"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import AiLoadingBlock from "@/components/sidebar/AiLoadingBlock";
import PriceAssumptionNotice from "@/components/sidebar/PriceAssumptionNotice";
import PropertyDetail from "@/components/sidebar/PropertyDetail";
import ScoredPanel from "@/components/sidebar/ScoredPanel";
import StaleOutputNotice from "@/components/sidebar/StaleOutputNotice";
import StationNoBriefPanel from "@/components/sidebar/StationNoBriefPanel";
import { useSelectedStation } from "@/hooks/station/useSelectedStation";
import { useStations } from "@/hooks/station/useStations";
import { useBriefResult } from "@/hooks/brief/useBriefResult";
import { useSelectedProperty } from "@/hooks/property/useSelectedProperty";
import { areaForStation } from "@/lib/scoring";
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

  // Arahkan peta + panel ke kawasan peringkat #1. Dipakai dua kali: saat hasil skor
  // baru datang, dan saat detail properti ditutup.
  const focusTopArea = useCallback(() => {
    const top = scoreResult?.areas[0];
    if (!top) return;
    const feature = stations?.features.find((f) => f.properties.station_id === top.station_id);
    if (!feature?.geometry) return;
    setSelectedStation({
      area_id: top.station_id,
      station_name: top.station_name,
      lng: feature.geometry.coordinates[0],
      lat: feature.geometry.coordinates[1],
      is_rankable: true,
    });
  }, [scoreResult, stations, setSelectedStation]);

  // Hasil skor baru: samakan peta dengan panel. Tanpa ini panel menampilkan
  // peringkat #1 sementara peta masih di kawasan sebelumnya dan belum menggambar
  // isokron apa pun. Ref-nya menjaga ini jalan SEKALI per hasil skor — tanpa itu,
  // setiap pergantian identitas `focusTopArea` akan menarik pengguna balik ke #1.
  const syncedResult = useRef(scoreResult);
  useEffect(() => {
    if (syncedResult.current === scoreResult) return;
    syncedResult.current = scoreResult;
    focusTopArea();
  }, [scoreResult, focusTopArea]);

  function closeDetail() {
    const triggerId = detail && `unit-${detail.unit.id}`;
    setDetail(null);
    setSelectedProperty(null);

    focusTopArea();

    // Kembalikan fokus ke kartu asalnya. Elemennya masih ada di DOM karena panel di balik
    // detail cuma disembunyikan, bukan dilepas — tanpa ini fokus jatuh ke <body> dan
    // pengguna keyboard harus menelusuri sidebar dari awal.
    if (triggerId) {
      requestAnimationFrame(() => document.getElementById(triggerId)?.focus());
    }
  }

  if (!scored && !selectedStation && !loading && !detail && !selectedProperty) return null;

  const perkiraanHarga = scoreResult?.catatan.harga_sumber === "perkiraan";

  // Stasiun di luar Top 5 tetap bisa dibuka setelah ada hasil skor: panelnya jatuh
  // ke gambaran kawasan, karena ScoredPanel hanya tahu lima kawasan berperingkat dan
  // akan diam-diam menampilkan kawasan lain daripada yang dipilih pengguna.
  const showScored =
    scored &&
    (selectedStation === null || areaForStation(scoreResult?.areas ?? [], selectedStation.area_id) !== null);

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
        {showScored ? (
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
    </div>
  );
}
