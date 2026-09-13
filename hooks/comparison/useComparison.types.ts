import type { PropertyUnit } from "@/types/property";

export interface CompareItem {
  unit: PropertyUnit;
  stationId: string;
  stationName: string;
}

export type CompareSlot = "A" | "B";

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
  slotA: CompareItem | null;
  slotB: CompareItem | null;
  activeTargetSlot: CompareSlot;
  setActiveTargetSlot: (slot: CompareSlot) => void;
  isPanelOpen: boolean;
  isPanelMinimized: boolean;
  minimizePanel: () => void;
  setSlot: (slot: CompareSlot, item: CompareItem) => void;
  clearSlot: (slot: CompareSlot) => void;
  clearAll: () => void;
  openPanel: () => void;
  closePanel: () => void;
  assignToActiveSlot: (item: CompareItem) => CompareSlot;
  isInCompare: (unitId: string) => boolean;
  getSlotFor: (unitId: string) => CompareSlot | null;
}
