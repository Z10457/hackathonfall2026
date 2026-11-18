"use client";

import { AdvancedMarker, APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { useEffect } from "react";
import { BRAND } from "@/lib/constants";
import { CAMPUSES, ROUTE_BOUNDS, ROUTE_WAYPOINTS } from "@/lib/routes";
import type { Campus, Van } from "@/lib/types";
import { VanMarker } from "./VanMarker";

interface GoogleRouteMapProps {
  apiKey: string;
  vans: Van[];
  selectedId: string | null;
  onSelect: (vanId: string) => void;
  onReady: () => void;
  onFail: () => void;
}

function RouteLine() {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const path = ROUTE_WAYPOINTS.map((w) => ({ lat: w.lat, lng: w.lng }));
    const casing = new google.maps.Polyline({ path, strokeColor: "#ffffff", strokeOpacity: 0.95, strokeWeight: 9, clickable: false, zIndex: 1 });
    const line = new google.maps.Polyline({ path, strokeColor: BRAND.maroon, strokeOpacity: 0.9, strokeWeight: 5, clickable: false, zIndex: 2 });
    casing.setMap(map);
    line.setMap(map);
    return () => {
      casing.setMap(null);
      line.setMap(null);
    };
  }, [map]);
  return null;
}

function CampusPin({ campus }: { campus: Campus }) {
  const info = CAMPUSES[campus];
  return (
    <AdvancedMarker position={info.position} zIndex={5} title={info.name}>
      <div className="flex flex-col items-center">
        <span className="rounded-full border-2 border-white bg-maroon-700 px-2.5 py-1 text-xs font-bold whitespace-nowrap text-white shadow-lift">
          {info.name}
        </span>
        <span className="-mt-0.5 h-3 w-3 rounded-full border-[3px] border-gold-500 bg-maroon-700 ring-2 ring-white" />
      </div>
    </AdvancedMarker>
  );
}

function FitRoute() {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    map.fitBounds(
      { north: ROUTE_BOUNDS.north, south: ROUTE_BOUNDS.south, east: ROUTE_BOUNDS.east, west: ROUTE_BOUNDS.west },
      32,
    );
  }, [map]);
  return null;
}

/** Real Google Map. VanMap falls back to the SVG map if this reports a failure. */
export function GoogleRouteMap({ apiKey, vans, selectedId, onSelect, onReady, onFail }: GoogleRouteMapProps) {
  return (
    <APIProvider apiKey={apiKey} onError={onFail}>
      <Map
        mapId="DEMO_MAP_ID"
        defaultCenter={{ lat: 40.816, lng: -73.94 }}
        defaultZoom={12}
        gestureHandling="greedy"
        disableDefaultUI
        zoomControl
        clickableIcons={false}
        onTilesLoaded={onReady}
        style={{ width: "100%", height: "100%" }}
      >
        <FitRoute />
        <RouteLine />
        <CampusPin campus="rose-hill" />
        <CampusPin campus="lincoln-center" />
        {vans.map((van) => (
          <AdvancedMarker key={van.id} position={van.position} zIndex={van.id === selectedId ? 30 : 10}>
            <VanMarker van={van} selected={van.id === selectedId} onSelect={onSelect} />
          </AdvancedMarker>
        ))}
      </Map>
    </APIProvider>
  );
}
