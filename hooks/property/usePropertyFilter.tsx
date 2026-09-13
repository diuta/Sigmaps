"use client";

import React, { createContext, useContext, useState, useMemo, useCallback, ReactNode } from "react";
import type {
  StationTierFilter,
  PropertyFilterContextValue,
} from "./usePropertyFilter.types";

const PropertyFilterContext = createContext<PropertyFilterContextValue | undefined>(undefined);

export function PropertyFilterProvider({ children }: { children: ReactNode }) {
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [transactionTypes, setTransactionTypes] = useState<string[]>([]);
  const [stationTier, setStationTier] = useState<StationTierFilter>("all");
  const [hasPhotoOnly, setHasPhotoOnly] = useState(false);

  const togglePropertyType = useCallback((type: string) => {
    if (type === "all") {
      setPropertyTypes([]);
      return;
    }
    setPropertyTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }, []);

  const toggleTransactionType = useCallback((type: string) => {
    if (type === "all") {
      setTransactionTypes([]);
      return;
    }
    setTransactionTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }, []);

  const toggleStationTier = useCallback((tier: StationTierFilter) => {
    setStationTier((prev) => (prev === tier ? "all" : tier));
  }, []);

  const toggleHasPhotoOnly = useCallback(() => {
    setHasPhotoOnly((prev) => !prev);
  }, []);

  const resetFilters = useCallback(() => {
    setPropertyTypes([]);
    setTransactionTypes([]);
    setStationTier("all");
    setHasPhotoOnly(false);
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = propertyTypes.length;
    count += transactionTypes.length;
    if (stationTier !== "all") count++;
    if (hasPhotoOnly) count++;
    return count;
  }, [propertyTypes, transactionTypes, stationTier, hasPhotoOnly]);

  const value = useMemo(
    () => ({
      propertyTypes,
      transactionTypes,
      stationTier,
      hasPhotoOnly,
      setPropertyTypes,
      togglePropertyType,
      setTransactionTypes,
      toggleTransactionType,
      setStationTier,
      toggleStationTier,
      setHasPhotoOnly,
      toggleHasPhotoOnly,
      resetFilters,
      activeFilterCount,
    }),
    [
      propertyTypes,
      transactionTypes,
      stationTier,
      hasPhotoOnly,
      togglePropertyType,
      toggleTransactionType,
      toggleStationTier,
      toggleHasPhotoOnly,
      resetFilters,
      activeFilterCount,
    ]
  );

  return (
    <PropertyFilterContext.Provider value={value}>
      {children}
    </PropertyFilterContext.Provider>
  );
}

export function usePropertyFilter(): PropertyFilterContextValue {
  const context = useContext(PropertyFilterContext);
  if (!context) {
    throw new Error("usePropertyFilter must be used within a PropertyFilterProvider");
  }
  return context;
}
