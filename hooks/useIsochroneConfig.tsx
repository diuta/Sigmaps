"use client";

/**
 * hooks/useIsochroneConfig.tsx
 * 🟡 DEV / EXPERIMENTAL ONLY — Pengaturan Parameter Isokron
 *
 * Dipakai oleh IsochroneDevTool dan dibaca oleh IsochroneLayer.
 * Dapat dengan mudah dihapus setelah poligon MAPID final dari Jalur 2 siap.
 */

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { IsochroneOptions } from "@/lib/map/isochrone-generator";

interface IsochroneConfigContextValue {
  options: IsochroneOptions;
  setOptions: React.Dispatch<React.SetStateAction<IsochroneOptions>>;
  calculatedAreaKm2: number;
  setCalculatedAreaKm2: (area: number) => void;
}

const IsochroneConfigContext = createContext<IsochroneConfigContextValue | undefined>(
  undefined
);

export function IsochroneConfigProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<IsochroneOptions>({
    mode: "organic",
    radiusMeter: 800, // Default 10 Menit (~800m)
  });
  const [calculatedAreaKm2, setCalculatedAreaKm2] = useState<number>(0);

  return (
    <IsochroneConfigContext.Provider
      value={{
        options,
        setOptions,
        calculatedAreaKm2,
        setCalculatedAreaKm2,
      }}
    >
      {children}
    </IsochroneConfigContext.Provider>
  );
}

export function useIsochroneConfig(): IsochroneConfigContextValue {
  const context = useContext(IsochroneConfigContext);
  if (!context) {
    throw new Error(
      "useIsochroneConfig must be used within an IsochroneConfigProvider"
    );
  }
  return context;
}
