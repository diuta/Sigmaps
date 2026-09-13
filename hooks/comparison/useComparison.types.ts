/**
 * hooks/comparison/useComparison.types.ts
 * Type definitions for the property comparison feature.
 * Max 2 items (Slot A and Slot B).
 */

import type { PropertyUnit } from "@/types/property";

export interface CompareItem {
  unit: PropertyUnit;
  /** station_id used to fetch AI insight via useCommunitySentiment */
  stationId: string;
  stationName: string;
}

export type CompareSlot = "A" | "B";

export interface ComparisonContextValue {
  /** Slot A — null if empty */
  slotA: CompareItem | null;
  /** Slot B — null if empty */
  slotB: CompareItem | null;
  /** Currently active target slot that user is picking for (defaults to "A" if A is empty, else "B") */
  activeTargetSlot: CompareSlot;
  setActiveTargetSlot: (slot: CompareSlot) => void;
  /** Whether the bottom comparison panel is open */
  isPanelOpen: boolean;
  /** Add or replace a specific slot */
  setSlot: (slot: CompareSlot, item: CompareItem) => void;
  /** Clear a specific slot */
  clearSlot: (slot: CompareSlot) => void;
  /** Clear both slots */
  clearAll: () => void;
  /** Open the comparison panel */
  openPanel: () => void;
  /** Close the comparison panel */
  closePanel: () => void;
  /**
   * Smart add: fills the active target slot (or first empty slot).
   */
  addToCompare: (item: CompareItem) => "added-A" | "added-B" | "full";
  /** Explicitly assigns item to activeTargetSlot and rotates to the other slot if empty */
  assignToActiveSlot: (item: CompareItem) => CompareSlot;
  /** Check whether a unit is already in compare queue */
  isInCompare: (unitId: string) => boolean;
  /** Which slot a unit occupies, null if not in compare */
  getSlotFor: (unitId: string) => CompareSlot | null;
}
