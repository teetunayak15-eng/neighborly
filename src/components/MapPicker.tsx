import React, { useEffect } from 'react';
import { View } from 'react-native';

interface MapPickerProps {
  initialLat: number;
  initialLng: number;
  onLocationSelect: (lat: number, lng: number) => void;
}

export const MapPicker = ({ initialLat, initialLng, onLocationSelect }: MapPickerProps) => {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'LOCATION_SELECTED') {
          onLocationSelect(data.lat, data.lng);
        }
      } catch (e) {}
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLocationSelect]);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { padding: 0; margin: 0; font-family: sans-serif; }
        html, body, #map { height: 100%; width: 100%; }
        .instruction {
          position: absolute;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          background: white;
          padding: 8px 16px;
          border-radius: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
          z-index: 1000;
          font-weight: bold;
          font-size: 14px;
          pointer-events: none;
          color: #1D1B20;
        }
      </style>
    </head>
    <body>
      <div class="instruction">Tap map to set location</div>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false }).setView([${initialLat}, ${initialLng}], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OSM'
        }).addTo(map);
        
        var marker = L.marker([${initialLat}, ${initialLng}]).addTo(map);
        
        map.on('click', function(e) {
          marker.setLatLng(e.latlng);
          window.parent.postMessage(JSON.stringify({
            type: 'LOCATION_SELECTED',
            lat: e.latlng.lat,
            lng: e.latlng.lng
          }), '*');
        });
      </script>
    </body>
    </html>
  `;

  return (
    <View style={{ flex: 1, borderRadius: 16, overflow: 'hidden', minHeight: 300 }}>
      {/* @ts-ignore */}
      <iframe 
        srcDoc={html} 
        style={{ width: '100%', height: '100%', border: 'none' }} 
      />
    </View>
  );
};
