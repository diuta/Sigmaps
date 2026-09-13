/**
 * hooks/comparison/useComparison.types.ts
 * Type definitions for the property comparison feature.
 * Max 2 items (Properti 1 and Properti 2).
 */

import type { PropertyUnit } from "@/types/property";

export interface CompareItem {
  unit: PropertyUnit;
  /** station_id used to fetch AI insight via useCommunitySentiment */
  stationId: string;
  stationName: string;
}

export type CompareSlot = "A" | "B";

/** Professional user-facing naming: Properti 1 & Properti 2 */
export function getSlotLabel(slot: CompareSlot | null | undefined): string {
  if (slot === "A") return "Properti 1";
  if (slot === "B") return "Properti 2";
  return "";
}

export function getSlotNumber(slot: CompareSlot | null | undefined): string {
  if (slot === "A") return "1";
  if (slot === "B") return "2";
  return "";
}

export interface ComparisonContextValue {
  /** Properti 1 (Slot A) — null if empty */
  slotA: CompareItem | null;
  /** Properti 2 (Slot B) — null if empty */
  slotB: CompareItem | null;
  /** Currently active target slot ("A" -> Properti 1, "B" -> Properti 2) */
  activeTargetSlot: CompareSlot;
  setActiveTargetSlot: (slot: CompareSlot) => void;
  /** Whether the bottom comparison panel is active (open or collapsed) */
  isPanelOpen: boolean;
  /** Whether the comparison panel is collapsed into a compact bottom dock */
  isPanelMinimized: boolean;
  minimizePanel: () => void;
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
  /** Isi activeTargetSlot; mengembalikan slot yang diisi */
  assignToActiveSlot: (item: CompareItem) => CompareSlot;
  /** Check whether a unit is already in compare queue */
  isInCompare: (unitId: string) => boolean;
  /** Which slot a unit occupies, null if not in compare */
  getSlotFor: (unitId: string) => CompareSlot | null;
}
