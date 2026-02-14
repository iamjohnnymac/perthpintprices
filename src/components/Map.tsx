'use client';

import { useEffect, useState } from 'react';
import { Pub } from '@/types/pub';

interface MapProps {
  pubs: Pub[];
  selectedPub?: Pub | null;
  onPubSelect: (pub: Pub) => void;
}

export default function Map({ pubs, selectedPub, onPubSelect }: MapProps) {
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadMap = async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      const existingMap = document.getElementById('map');
      if (!existingMap || existingMap.hasAttribute('data-initialized')) return;
      existingMap.setAttribute('data-initialized', 'true');

      const map = L.map('map').setView([-31.9505, 115.8605], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      const beerIcon = L.divIcon({
        html: '<div style="font-size: 24px;">🍺</div>',
        className: 'beer-marker',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      pubs.forEach(pub => {
        const marker = L.marker([pub.coordinates.lat, pub.coordinates.lng], { icon: beerIcon })
          .addTo(map)
          .bindPopup(`
            <div style="min-width: 150px;">
              <strong style="font-size: 14px;">${pub.name}</strong><br/>
              <span style="color: #F4A100; font-size: 18px; font-weight: bold;">$${pub.price}</span><br/>
              <span style="font-size: 12px; color: #9CA3AF;">${pub.beerType}</span>
            </div>
          `);
        
        marker.on('click', () => onPubSelect(pub));
      });

      setMapReady(true);
    };

    loadMap();
  }, [pubs, onPubSelect]);

  return (
    <div id="map" className="w-full h-[400px] md:h-[600px] rounded-xl bg-gray-800" />
  );
}