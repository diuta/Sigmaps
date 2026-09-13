"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface SidebarOpenContextValue {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const SidebarOpenContext = createContext<SidebarOpenContextValue | undefined>(undefined);

export function SidebarOpenProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
