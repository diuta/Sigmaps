import type React from "react";
import type { IsochroneOptions } from "@/lib/map/isochrone-generator";

export interface IsochroneConfigContextValue {
  options: IsochroneOptions;
  setOptions: React.Dispatch<React.SetStateAction<IsochroneOptions>>;
  calculatedAreaKm2: number;
  setCalculatedAreaKm2: (area: number) => void;
}
