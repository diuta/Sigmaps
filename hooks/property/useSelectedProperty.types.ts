import type { Dispatch, SetStateAction } from "react";
import type { PropertyUnit } from "@/types/property";

export interface SelectedPropertyContextValue {
  /** Properti yang halaman detailnya dibuka (klik kartu di sidebar / "Lihat detail" di popup). */
  selectedProperty: PropertyUnit | null;
  setSelectedProperty: (property: PropertyUnit | null) => void;
  /**
   * Properti yang popup pin-nya sedang terbuka di peta — tahap sebelum detail.
   * Ditulis PropertyLayer (klik marker → isi, popup ditutup → null), dibaca RouteLayer
   * supaya rute sudah tergambar begitu titik diklik, tanpa harus buka detail.
   */
  previewProperty: PropertyUnit | null;
  setPreviewProperty: Dispatch<SetStateAction<PropertyUnit | null>>;
}
