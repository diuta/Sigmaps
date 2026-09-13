"use client";

import React, { createContext, useContext, ReactNode } from "react";
import type { MapInstanceContextValue } from "./useMapInstance.types";

const MapInstanceContext = createContext<MapInstanceContextValue>({
  map: null,
});

export function MapInstanceProvider({
  map,
  children,
}: {
  map: MapInstanceContextValue["map"];
  children: ReactNode;
}) {
  return (
    <MapInstanceContext.Provider value={{ map }}>
      {children}
    </MapInstanceContext.Provider>
  );
}

export function useMapInstance(): MapInstanceContextValue {
  const context = useContext(MapInstanceContext);
  return context;
}
