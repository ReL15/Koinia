import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Territory } from '../../types';
import { getTerritoryColors } from '../map/TerritoryMap';
import { MapPin } from 'lucide-react';

interface TerritoryMiniMapProps {
  territory: Territory;
  className?: string;
  heightClassName?: string;
}

export const TerritoryMiniMap: React.FC<TerritoryMiniMapProps> = ({
  territory,
  className = '',
  heightClassName = 'h-36',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const polyPoints = territory.polygon || [];
  const hasPolygon = polyPoints.length >= 3;

  useEffect(() => {
    if (!containerRef.current || !hasPolygon) return;

    let mapInstance: L.Map | null = null;

    try {
      const avgLat = polyPoints.reduce((sum, p) => sum + p.latitude, 0) / polyPoints.length;
      const avgLng = polyPoints.reduce((sum, p) => sum + p.longitude, 0) / polyPoints.length;

      mapInstance = L.map(containerRef.current, {
        center: [avgLat, avgLng],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
        boxZoom: false,
        keyboard: false,
      });

      L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      }).addTo(mapInstance);

      const colors = getTerritoryColors(territory.number);
      const latLngs = polyPoints.map(
        ({ latitude, longitude }) => [latitude, longitude] as L.LatLngTuple
      );

      const polygon = L.polygon(latLngs, {
        color: colors.stroke,
        fillColor: colors.fill,
        fillOpacity: 0.48,
        weight: 2.5,
        interactive: false,
      }).addTo(mapInstance);

      mapInstance.fitBounds(polygon.getBounds(), {
        padding: [12, 12],
        maxZoom: 17,
      });

      mapRef.current = mapInstance;

      const timer = setTimeout(() => {
        if (mapInstance) {
          mapInstance.invalidateSize();
        }
      }, 150);

      return () => {
        clearTimeout(timer);
        if (mapInstance) {
          mapInstance.remove();
          mapRef.current = null;
        }
      };
    } catch {
      // Ignorar fallas silenciosas en montaje
    }

    return () => {
      if (mapInstance) {
        mapInstance.remove();
        mapRef.current = null;
      }
    };
  }, [territory.id, polyPoints.length, hasPolygon]);

  if (!hasPolygon) {
    return (
      <div
        className={`w-full ${heightClassName} bg-slate-100 flex flex-col items-center justify-center text-slate-400 p-3 select-none ${className}`}
      >
        <MapPin className="w-6 h-6 stroke-1 text-slate-300 mb-1" />
        <span className="text-[11px] font-medium text-slate-400">Sin mapa configurado</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`w-full ${heightClassName} bg-slate-100 relative pointer-events-none select-none ${className}`}
      style={{ zIndex: 0 }}
    />
  );
};
