import type { Dispatch, SetStateAction } from "react";
import type { PropertyUnit } from "@/types/property";

export interface SelectedPropertyContextValue {
  selectedProperty: PropertyUnit | null;
  setSelectedProperty: (property: PropertyUnit | null) => void;
  previewProperty: PropertyUnit | null;
  setPreviewProperty: Dispatch<SetStateAction<PropertyUnit | null>>;
}
