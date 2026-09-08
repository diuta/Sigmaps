"use client";

/**
 * hooks/isochrone/useIsochroneConfig.tsx
 * Menyimpan luas kawasan isokron yang sedang aktif, supaya DevToolsOverlay dapat
 * menampilkannya tanpa menghitung ulang.
 *
 * Diisi IsochroneLayer dari `properties.area_km2` (/api/stations), yang berasal
 * dari `ST_Area(geom::geography)` di database — angka yang sama persis dipakai
 * sebagai penyebut rumus C.
 *
 * Dulu hook ini juga memegang parameter bentuk isokron (mode, radiusMeter) untuk
 * generator sintetis. Generatornya sudah dihapus; poligon sekarang datang asli
 * dari MAPID Isochrone Tool dan tidak dapat diubah dari klien.
 */

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { IsochroneConfigContextValue } from "./useIsochroneConfig.types";

const IsochroneConfigContext = createContext<IsochroneConfigContextValue | undefined>(
  undefined
);

export function IsochroneConfigProvider({ children }: { children: ReactNode }) {
  const [calculatedAreaKm2, setCalculatedAreaKm2] = useState<number>(0);

  return (
    <IsochroneConfigContext.Provider value={{ calculatedAreaKm2, setCalculatedAreaKm2 }}>
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
