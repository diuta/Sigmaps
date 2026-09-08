"use client";

/**
 * hooks/property/usePropertyPopupConfig.tsx
 * 🟡 DEV / EXPERIMENTAL ONLY — State Controller untuk Eksplorasi Desain Property Popup
 *
 * Mendukung opsi style:
 * - 'sleek': Sesuai referensi Figma (horizontal compact 200x72 mini thumbnail + badge)
 * - 'slender-detail': Horizontal sleek dengan alamat jalan ringkas & kategori
 * - 'vertical-card': Desain kartu vertikal awal
 */

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { PropertyPopupStyle, PropertyPopupConfigContextValue } from "./usePropertyPopupConfig.types";

const PropertyPopupConfigContext = createContext<
  PropertyPopupConfigContextValue | undefined
>(undefined);

export function PropertyPopupConfigProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [popupStyle, setPopupStyle] = useState<PropertyPopupStyle>("vertical-card-v2");
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");

  return (
    <PropertyPopupConfigContext.Provider
      value={{ popupStyle, setPopupStyle, themeMode, setThemeMode }}
    >
      {children}
    </PropertyPopupConfigContext.Provider>
  );
}

export function usePropertyPopupConfig(): PropertyPopupConfigContextValue {
  const context = useContext(PropertyPopupConfigContext);
  if (!context) {
    throw new Error(
      "usePropertyPopupConfig must be used within a PropertyPopupConfigProvider"
    );
  }
  return context;
}
