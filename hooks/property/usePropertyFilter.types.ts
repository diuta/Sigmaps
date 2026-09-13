export type StationTierFilter = "all" | "recommended" | "ready" | "minimal";

export interface PropertyFilterValues {
  /** Daftar tipe properti yang dipilih (multi-select, e.g. ["rumah", "kos"]) */
  propertyTypes: string[];
  /** Daftar jenis transaksi yang dipilih (multi-select, e.g. ["sewa", "jual"]) */
  transactionTypes: string[];
  /** Tingkatan stasiun KRL (Semua, Top AI, Data Lengkap, Data Minim) */
  stationTier: StationTierFilter;
  /** Hanya tampilkan properti yang memiliki foto tampak depan atau spanduk */
  hasPhotoOnly: boolean;
}

export interface PropertyFilterContextValue extends PropertyFilterValues {
  setPropertyTypes: (types: string[]) => void;
  togglePropertyType: (type: string) => void;
  setTransactionTypes: (types: string[]) => void;
  toggleTransactionType: (type: string) => void;
  setStationTier: (tier: StationTierFilter) => void;
  toggleStationTier: (tier: StationTierFilter) => void;
  setHasPhotoOnly: (val: boolean) => void;
  toggleHasPhotoOnly: () => void;
  resetFilters: () => void;
  activeFilterCount: number;
}
