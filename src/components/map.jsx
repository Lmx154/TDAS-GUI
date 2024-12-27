import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function Map({ telemetry, defaultPosition = [26.306212, -98.174716] }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Fix for Leaflet default marker icon
  useEffect(() => {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);

  // Initialize map
  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView(defaultPosition, 15);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);

      markerRef.current = L.marker(defaultPosition)
        .bindPopup('Default Location<br>Lat: 26.306212<br>Lon: -98.174716')
        .addTo(mapInstanceRef.current);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update marker position when telemetry changes
  useEffect(() => {
    if (mapInstanceRef.current && telemetry.gps_lat && telemetry.gps_lon) {
      const position = [telemetry.gps_lat, telemetry.gps_lon];
      
      if (markerRef.current) {
        markerRef.current.setLatLng(position)
          .setPopupContent(`Lat: ${telemetry.gps_lat.toFixed(6)}<br>
                          Lon: ${telemetry.gps_lon.toFixed(6)}<br>
                          Alt: ${telemetry.gps_altitude}m`);
        
        mapInstanceRef.current.setView(position);
      }
    }
  }, [telemetry.gps_lat, telemetry.gps_lon, telemetry.gps_altitude]);

  return <div ref={mapRef} style={{ height: "300px", width: "100%" }} />;
}

export default Map;
