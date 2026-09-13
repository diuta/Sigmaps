"use client";

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
