"use client";

import PropertyList from "@/components/sidebar/PropertyList";
import { useSelectedStation } from "@/hooks/station/useSelectedStation";

/**
 * Keadaan "kawasan dipilih di peta, rencana belum diisi" — belum ada skor apa pun.
 *
 * Sebelumnya menampilkan "gambaran kawasan" hasil AI (kategori jarang, komposisi usaha)
 * lewat AiCategoryBlock/AreaCompositionList — dihapus di sini karena tidak ada endpoint
 * yang pernah menghasilkan data itu. docs/fe/ARCHITECTURE.md secara eksplisit menandai
 * "narasi AI area insight" di luar scope MVP, jadi bukan sesuatu yang perlu disambungkan.
 */
export default function StationNoBriefPanel() {
  const { selectedStation } = useSelectedStation();
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
        <PropertyList stationId={selectedStation.area_id} />
      ) : (
        <section className="flex flex-col gap-[var(--space-sm)] rounded-[var(--radius-card)] border border-[var(--color-warning)] bg-[var(--color-warning-bg)] p-[var(--space-md)]">
          <h2 className="t-heading-2 text-[var(--color-warning-tx)]">Data belum cukup</h2>
          <p className="t-body text-[var(--color-warning-tx)]">
            Kawasan ini tidak dinilai dan tidak masuk peringkat karena pengamatannya terlalu sedikit.
          </p>
        </section>
      )}
    </div>
  );
}
