import type { PropertyUnit } from "@/types/property";

export interface SelectedPropertyContextValue {
  selectedProperty: PropertyUnit | null;
  setSelectedProperty: (property: PropertyUnit | null) => void;
}
