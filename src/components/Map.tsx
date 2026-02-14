'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Pub } from '@/types/pub';
import 'leaflet/dist/leaflet.css';

const beerIcon = new Icon({
  iconUrl: 'https://cdn.jsdelivr.net/npm/@mdi/svg@7.2.96/svg/glass-mug-variant.svg',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

interface MapProps {
  pubs: Pub[];
}

export function Map({ pubs }: MapProps) {
  const center = { lat: -31.9505, lng: 115.8605 }; // Perth CBD

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      className="w-full h-[400px] rounded-xl z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {pubs.map((pub, i) => (
        pub.lat && pub.lng && (
          <Marker key={i} position={[pub.lat, pub.lng]} icon={beerIcon}>
            <Popup>
              <div className="font-sans">
                <strong className="text-lg">{pub.name}</strong>
                <div className="text-amber-600 font-bold text-xl">${pub.price}</div>
                <div className="text-gray-600 text-sm">{pub.times}</div>
              </div>
            </Popup>
          </Marker>
        )
      ))}
    </MapContainer>
  );
}
