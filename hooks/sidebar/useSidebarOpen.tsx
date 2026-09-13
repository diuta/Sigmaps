"use client";

/**
 * hooks/sidebar/useSidebarOpen.tsx
 *
 * Shared state untuk status buka/tutup sidebar.
 * Dibaca oleh MapLegend agar bisa menggeser posisinya mengikuti sidebar
 * dengan animasi yang sinkron.
 */

import React, { createContext, useContext, useState, ReactNode } from "react";

interface SidebarOpenContextValue {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const SidebarOpenContext = createContext<SidebarOpenContextValue | undefined>(undefined);

export function SidebarOpenProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true); // default: desktop open

  return (
    <SidebarOpenContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
      {children}
    </SidebarOpenContext.Provider>
  );
}

export function useSidebarOpen(): SidebarOpenContextValue {
  const context = useContext(SidebarOpenContext);
  if (!context) {
    throw new Error("useSidebarOpen must be used within a SidebarOpenProvider");
  }
  return context;
}
