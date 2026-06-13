import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import anime from 'animejs';
import useAppStore from '../../store/useAppStore';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default marker icon issue (optional but good practice)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Icons
const createTrainIcon = () => {
  return L.divIcon({
    className: 'custom-train-marker',
    html: `<div style="width: 12px; height: 12px; background-color: #3b82f6; border-radius: 50%; box-shadow: 0 0 15px #3b82f6;"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
};

const createIncidentIcon = () => {
  return L.divIcon({
    className: 'custom-incident-marker',
    html: `
      <div style="width: 24px; height: 24px; background-color: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; position: relative;">
         <div class="sonar-ring" style="position: absolute; inset: 0; border-radius: 50%; border: 2px solid #ef4444;"></div>
         <div class="sonar-ring-delayed" style="position: absolute; inset: 0; border-radius: 50%; border: 1px solid #ef4444;"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

export default function MapCanvas() {
  const { isEmergencyMode, trains, dispatchPlan } = useAppStore();
  const [showAmbulances, setShowAmbulances] = useState(false);
  const vignetteRef = useRef(null);

  useEffect(() => {
    if (isEmergencyMode && dispatchPlan) {
      // Trigger ambulance routes after LangGraph terminal is done typing
      const timer = setTimeout(() => setShowAmbulances(true), 8500);
      
      // Animate emergency vignette
      if (vignetteRef.current) {
        anime({
          targets: vignetteRef.current,
          opacity: [0, 1],
          duration: 1000,
          easing: 'easeInOutQuad'
        });
      }

      // Start custom animejs sonar
      anime({
        targets: '.sonar-ring',
        scale: [1, 3],
        opacity: [1, 0],
        duration: 2000,
        easing: 'easeOutCubic',
        loop: true
      });
      anime({
        targets: '.sonar-ring-delayed',
        scale: [1, 3],
        opacity: [1, 0],
        duration: 2000,
        delay: 500,
        easing: 'easeOutCubic',
        loop: true
      });

      return () => clearTimeout(timer);
    } else {
      setShowAmbulances(false);
      if (vignetteRef.current) {
        vignetteRef.current.style.opacity = 0;
      }
    }
  }, [isEmergencyMode, dispatchPlan]);

  const center = [26.4499, 80.3319]; // Kanpur approx

  // Convert GeoJSON LineStrings to Leaflet LatLng arrays
  const ambulancePaths = showAmbulances && dispatchPlan && dispatchPlan.ambulance_routes ? 
    dispatchPlan.ambulance_routes.map(route => {
      // route.geometry.coordinates is typically [lon, lat][]
      return route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
    }) : [];

  return (
    <div className="absolute inset-0 w-full h-full bg-slate-900 z-0 overflow-hidden">
      
      {/* Red Vignette Overlay for Emergency */}
      <div 
        ref={vignetteRef}
        className="absolute inset-0 pointer-events-none z-[1000] mix-blend-multiply opacity-0"
        style={{ background: 'radial-gradient(circle at center, transparent 0%, rgba(239,68,68,0.4) 100%)' }}
      />

      <MapContainer 
        center={center} 
        zoom={10} 
        scrollWheelZoom={true} 
        zoomControl={false}
        className="w-full h-full bg-slate-900"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {/* Train Markers */}
        {!isEmergencyMode && trains.map(train => {
          if (!train.path || train.path.length === 0 || train.current_index === undefined) return null;
          const pos = train.path[train.current_index];
          // Backend sends path as [lon, lat], Leaflet wants [lat, lon]
          return (
            <Marker 
              key={train.train_id || train.id} 
              position={[pos[1], pos[0]]} 
              icon={createTrainIcon()} 
            />
          );
        })}

        {/* Emergency Incident Marker */}
        {isEmergencyMode && dispatchPlan && (
          <Marker 
            position={[
              dispatchPlan.incident_location?.lat || (trains[0]?.path ? trains[0].path[trains[0].current_index][1] : center[0]),
              dispatchPlan.incident_location?.lon || (trains[0]?.path ? trains[0].path[trains[0].current_index][0] : center[1])
            ]} 
            icon={createIncidentIcon()} 
          />
        )}

        {/* Ambulance Routes */}
        {ambulancePaths.map((path, index) => (
          <Polyline 
            key={index} 
            positions={path} 
            pathOptions={{ color: '#facc15', weight: 4, dashArray: '2 6' }} 
            className="ambulance-route"
          />
        ))}

      </MapContainer>
    </div>
  );
}
