"use client";

import React, { useEffect, useRef, useState, ReactNode } from "react";
import MapLegend from "@/components/map/MapLegend";
import MapNavigationControl from "@/components/map/MapNavigationControl";
import MapBrandBadge from "@/components/map/MapBrandBadge";
import StationSearchBar from "@/components/map/StationSearchBar";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapInstanceProvider } from "@/hooks/map/useMapInstance";
import { useSelectedStation } from "@/hooks/station/useSelectedStation";
import { useSelectedProperty } from "@/hooks/property/useSelectedProperty";
import { basemapStyleUrl, DEFAULT_BASEMAP_ID } from "@/lib/fixtures/layers";

interface BaseMapProps {
  children?: ReactNode;
}

export default function BaseMap({ children }: BaseMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);

  const { selectedStation } = useSelectedStation();
  const { selectedProperty } = useSelectedProperty();

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const mapInstance = new maplibregl.Map({
      container: mapContainerRef.current,
      style: basemapStyleUrl(DEFAULT_BASEMAP_ID),
      center: [106.8271129, -6.1754398],
      zoom: 13,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
    });

    const resizeObserver = new ResizeObserver(() => mapInstance.resize());
    resizeObserver.observe(mapContainerRef.current);

    const scaleControl = new maplibregl.ScaleControl({ maxWidth: 100, unit: "metric" });
    mapInstance.addControl(scaleControl, "bottom-left");

    mapInstance.on("load", () => {
      setMap(mapInstance);
    });

    return () => {
      resizeObserver.disconnect();
      mapInstance.remove();
      setMap(null);
    };
  }, []);

  useEffect(() => {
    if (!map || !selectedStation) return;

    map.flyTo({
      center: [selectedStation.lng, selectedStation.lat],
      zoom: 15.5,
      speed: 1.2,
      curve: 1.4,
      essential: true,
    });
  }, [map, selectedStation]);

  useEffect(() => {
    if (!map || !selectedProperty) return;

    map.flyTo({
      center: [selectedProperty.lng, selectedProperty.lat],
      zoom: Math.max(map.getZoom(), 16.5),
      speed: 1.2,
      curve: 1.4,
      essential: true,
    });
  }, [map, selectedProperty]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full relative z-0" />
      {map && (
        <MapInstanceProvider map={map}>
          {children}
          <MapNavigationControl />
        </MapInstanceProvider>
      )}
      <StationSearchBar />
      <MapLegend />
      <MapBrandBadge />
    </div>
  );
}
