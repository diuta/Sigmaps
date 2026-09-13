"use client";

import { useState, useEffect } from "react";
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
import type { PropertyUnit } from "@/types/property";
import CompareBar from "@/components/comparison/CompareBar";

interface Props {
  /** Teks rencana usaha yang sudah disubmit — null sebelum brief pertama dinilai. Diteruskan
   *  ke ScoredPanel untuk ExportPdfButton, tidak dipakai bagian lain di sini. */
  brief: string | null;
  /** Rencana sedang dinilai: /api/prompt-request lalu /api/score. */
  loading: boolean;
  /** Ada brief yang sudah dinilai. */
  scored: boolean;
  /** Rencana sedang disunting, jadi hasil di bawah belum tentu cocok lagi. */
  stale: boolean;
  onEditBrief: () => void;
}

/**
 * Bagian bawah sidebar. Berdiri sendiri dari bagian rencana di atasnya: membuka
 * penyunting rencana hanya meredupkan bagian ini, tidak melepasnya dari layar.
 */
export default function OutputSection({ brief, loading, scored, stale, onEditBrief }: Props) {
  const { selectedStation, setSelectedStation } = useSelectedStation();
  const { stations } = useStations();
  const { intent, scoreResult } = useBriefResult();
  const { selectedProperty, setSelectedProperty } = useSelectedProperty();

  // Unit yang sedang dibuka halaman detailnya. Dipegang di sini karena halaman detail
  // mengambil alih SELURUH panel hasil — panel di baliknya tidak perlu tahu apa-apa.
  const [detail, setDetail] = useState<{ unit: PropertyUnit; stationId: string; stationName: string } | null>(null);

  // Sinkronisasi saat properti dipilih dari luar (misal dari kartu popup di peta)
  useEffect(() => {
    if (selectedProperty) {
      setDetail({
        unit: selectedProperty,
        stationId: selectedStation?.area_id ?? "",
        stationName: selectedStation?.station_name ?? "",
      });
    }
  }, [selectedProperty, selectedStation?.area_id, selectedStation?.station_name]);

  // Reset detail & selectedProperty jika stasiun yang dipilih berganti
  const [prevStationId, setPrevStationId] = useState(selectedStation?.area_id);
  if (selectedStation?.area_id !== prevStationId) {
    setPrevStationId(selectedStation?.area_id);
    if (detail && selectedProperty?.station_id !== selectedStation?.area_id) {
      setDetail(null);
      setSelectedProperty(null);
    }
  }

  // Brief baru dinilai selagi halaman detail terbuka: tutup detailnya, karena daftar di
  // baliknya sudah berganti kawasan dan tombol "Kembali" akan mendarat di hasil yang lain.
  // Disesuaikan saat render (pola React "adjusting state when a prop changes"), bukan efek.
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

  // Tampilan awal: hanya bagian rencana. Belum ada kawasan yang dipilih di peta.
  // `loading` ikut dicek: pada penilaian pertama belum ada stasiun terpilih MAUPUN skor, jadi
  // tanpa ini penanda tunggu di bawah tidak akan pernah sempat tampil.
  if (!scored && !selectedStation && !loading && !detail && !selectedProperty) return null;

  const perkiraanHarga = scoreResult?.catatan.harga_sumber === "perkiraan";

  return (
    <div className="flex flex-col gap-[var(--space-xl)]">
      <hr className="border-0 border-t border-[var(--color-border)]" />

      {!detail && stale && <StaleOutputNotice />}

      {/* Di ATAS isi lama, bukan menggantikannya: selama menunggu, user tetap bisa membaca
          kawasan yang sedang dilihatnya. Hasil lama yang sudah tidak cocok sudah diredupkan
          lewat mekanisme `stale`. */}
      {!detail && loading && <AiLoadingBlock judul="Menilai kawasan" />}

      {detail && (
        <PropertyDetail
          property={detail.unit}
          stationId={detail.stationId}
          stationName={detail.stationName}
          onBack={closeDetail}
        />
      )}

      {/*
        Panel di balik halaman detail tetap TER-MOUNT, cuma disembunyikan. Melepasnya akan
        mereset pilihan tab di ScoredPanel (kembali dari detail harus mendarat lagi di tab
        "Unit properti"). (Dulu ini juga mencegah panggilan Gemini ulang; sekarang
        /api/community-sentiment di-cache per stasiun di server — lib/sentiment.) Pola yang
        sama dipakai Sidebar saat panelnya ditutup.
      */}
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

      {/* Bandingkan Properti — selalu tampil di bagian bawah, independen dari detail/scoring */}
      <CompareBar />
    </div>
  );
}
