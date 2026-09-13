export type StationTierFilter = "all" | "recommended" | "ready" | "minimal";

export interface PropertyFilterValues {
  propertyTypes: string[];
  transactionTypes: string[];
  stationTier: StationTierFilter;
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
