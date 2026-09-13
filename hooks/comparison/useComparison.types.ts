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
  /** Currently active target slot that user is picking for ("A" or "B") */
  activeTargetSlot: CompareSlot;
  setActiveTargetSlot: (slot: CompareSlot) => void;
  /** Whether the bottom comparison panel is active (open or collapsed) */
  isPanelOpen: boolean;
  /** Whether the comparison panel is collapsed into a compact bottom bar */
  isPanelMinimized: boolean;
  setIsPanelMinimized: (minimized: boolean) => void;
  minimizePanel: () => void;
  expandPanel: () => void;
  /** Add or replace a specific slot */
  setSlot: (slot: CompareSlot, item: CompareItem) => void;
  /** Clear a specific slot */
  clearSlot: (slot: CompareSlot) => void;
  /** Clear both slots */
  clearAll: () => void;
  /** Open the comparison panel (in expanded state) */
  openPanel: () => void;
  /** Close the comparison panel completely */
  closePanel: () => void;
  /** Smart add */
  addToCompare: (item: CompareItem) => "added-A" | "added-B" | "full";
  /** Explicitly assigns item to activeTargetSlot */
  assignToActiveSlot: (item: CompareItem) => CompareSlot;
  /** Check whether a unit is already in compare queue */
  isInCompare: (unitId: string) => boolean;
  /** Which slot a unit occupies, null if not in compare */
  getSlotFor: (unitId: string) => CompareSlot | null;
}
