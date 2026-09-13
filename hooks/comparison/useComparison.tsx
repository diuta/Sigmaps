"use client";

/**
 * hooks/comparison/useComparison.tsx
 *
 * Global state for the property comparison feature.
 * - Slot A and Slot B hold a CompareItem each (unit + stationId + stationName)
 * - activeTargetSlot tracks which slot the user is currently targeting ("A" or "B")
 * - isPanelOpen: whether the comparison feature is active
 * - isPanelMinimized: whether the panel is collapsed to a compact dock allowing full map interaction
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import type {
  CompareItem,
  CompareSlot,
  ComparisonContextValue,
} from "./useComparison.types";

const ComparisonContext = createContext<ComparisonContextValue | undefined>(undefined);

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [slotA, setSlotA] = useState<CompareItem | null>(null);
  const [slotB, setSlotB] = useState<CompareItem | null>(null);
  const [activeTargetSlot, setActiveTargetSlot] = useState<CompareSlot>("A");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isPanelMinimized, setIsPanelMinimized] = useState(false);

  // Auto-open panel when both slots are filled
  useEffect(() => {
    if (slotA !== null && slotB !== null) {
      setIsPanelOpen(true);
      setIsPanelMinimized(false);
    }
  }, [slotA, slotB]);

  const setSlot = useCallback((slot: CompareSlot, item: CompareItem) => {
    if (slot === "A") {
      setSlotA(item);
      if (!slotB) setActiveTargetSlot("B");
    } else {
      setSlotB(item);
      if (!slotA) setActiveTargetSlot("A");
    }
  }, [slotA, slotB]);

  const clearSlot = useCallback((slot: CompareSlot) => {
    if (slot === "A") {
      setSlotA(null);
      setActiveTargetSlot("A");
    } else {
      setSlotB(null);
      setActiveTargetSlot("B");
    }
  }, []);

  const clearAll = useCallback(() => {
    setSlotA(null);
    setSlotB(null);
    setActiveTargetSlot("A");
    setIsPanelOpen(false);
    setIsPanelMinimized(false);
  }, []);

  const openPanel = useCallback(() => {
    setIsPanelOpen(true);
    setIsPanelMinimized(false);
  }, []);

  const closePanel = useCallback(() => {
    setIsPanelOpen(false);
    setIsPanelMinimized(false);
  }, []);

  const minimizePanel = useCallback(() => {
    setIsPanelMinimized(true);
  }, []);

  const expandPanel = useCallback(() => {
    setIsPanelOpen(true);
    setIsPanelMinimized(false);
  }, []);

  const assignToActiveSlot = useCallback(
    (item: CompareItem): CompareSlot => {
      const target = activeTargetSlot;
      if (target === "A") {
        setSlotA(item);
        if (!slotB) {
          setActiveTargetSlot("B");
        }
        return "A";
      } else {
        setSlotB(item);
        if (!slotA) {
          setActiveTargetSlot("A");
        }
        return "B";
      }
    },
    [activeTargetSlot, slotA, slotB]
  );

  const addToCompare = useCallback(
    (item: CompareItem): "added-A" | "added-B" | "full" => {
      const chosen = assignToActiveSlot(item);
      return chosen === "A" ? "added-A" : "added-B";
    },
    [assignToActiveSlot]
  );

  const isInCompare = useCallback(
    (unitId: string) =>
      slotA?.unit.id === unitId || slotB?.unit.id === unitId,
    [slotA, slotB]
  );

  const getSlotFor = useCallback(
    (unitId: string): CompareSlot | null => {
      if (slotA?.unit.id === unitId) return "A";
      if (slotB?.unit.id === unitId) return "B";
      return null;
    },
    [slotA, slotB]
  );

  return (
    <ComparisonContext.Provider
      value={{
        slotA,
        slotB,
        activeTargetSlot,
        setActiveTargetSlot,
        isPanelOpen,
        isPanelMinimized,
        setIsPanelMinimized,
        minimizePanel,
        expandPanel,
        setSlot,
        clearSlot,
        clearAll,
        openPanel,
        closePanel,
        addToCompare,
        assignToActiveSlot,
        isInCompare,
        getSlotFor,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison(): ComparisonContextValue {
  const context = useContext(ComparisonContext);
  if (!context) {
    throw new Error("useComparison must be used within a ComparisonProvider");
  }
  return context;
}
