"use client";

/**
 * hooks/property/useSelectedProperty.tsx
 * Jembatan Komunikasi Sidebar → Map untuk properti yang dipilih
 *
 * Sesuai pola ARCHITECTURE.md §4.1:
 * - Sidebar (PropertyList) menulis: setSelectedProperty(unit) saat user klik property card.
 * - Map (BaseMap) membaca: untuk trigger flyTo() ke koordinat properti.
 * - Map (PropertyLayer) membaca: untuk auto-open popup pin properti yang bersangkutan.
 * - Map (PropertyLayer) menulis previewProperty saat popup pin dibuka/ditutup;
 *   Map (RouteLayer) membaca previewProperty ?? selectedProperty untuk menggambar rute.
 *
 * ⛔ PENTING: Sidebar TIDAK boleh import useMapInstance atau memanggil map.flyTo() langsung.
 */

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { PropertyUnit } from "@/types/property";
import type { SelectedPropertyContextValue } from "./useSelectedProperty.types";

const SelectedPropertyContext = createContext<SelectedPropertyContextValue | undefined>(
  undefined
);

export function SelectedPropertyProvider({ children }: { children: ReactNode }) {
  const [selectedProperty, setSelectedProperty] = useState<PropertyUnit | null>(null);
  const [previewProperty, setPreviewProperty] = useState<PropertyUnit | null>(null);

  return (
    <SelectedPropertyContext.Provider
      value={{ selectedProperty, setSelectedProperty, previewProperty, setPreviewProperty }}
    >
      {children}
    </SelectedPropertyContext.Provider>
  );
}

export function useSelectedProperty(): SelectedPropertyContextValue {
  const context = useContext(SelectedPropertyContext);
  if (!context) {
    throw new Error(
      "useSelectedProperty must be used within a SelectedPropertyProvider"
    );
  }
  return context;
}
