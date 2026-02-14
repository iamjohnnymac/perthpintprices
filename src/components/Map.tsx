'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { Pub } from '@/types/pub'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in Next.js
const icon = L.icon({
  iconUrl: '/marker-icon.png',
  iconRetinaUrl: '/marker-icon-2x.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// Price-coded markers
function getPriceIcon(price: number): L.Icon {
  let color = 'green'
  if (price > 9) color = 'orange'
  else if (price > 7.5) color = 'yellow'
  
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color === 'green' ? '#22c55e' : color === 'yellow' ? '#eab308' : '#f97316'};
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 10px;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">$${price}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  })
}

interface MapProps {
  pubs: Pub[]
  isHappyHour?: (happyHour: string | null | undefined) => boolean
}

export default function Map({ pubs, isHappyHour }: MapProps) {
  // Center on Perth CBD
  const center: [number, number] = [-31.9505, 115.8605]
  
  return (
    <MapContainer
      center={center}
      zoom={12}
      style={{ height: '400px', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {pubs.map((pub) => (
        <Marker
          key={pub.id}
          position={[pub.lat, pub.lng]}
          icon={getPriceIcon(pub.price)}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-bold text-lg">{pub.name}</h3>
              <p className="text-amber-600 font-semibold">
                ${pub.price.toFixed(2)} - {pub.beerType}
              </p>
              <p className="text-sm text-gray-600">{pub.address}</p>
              {pub.happyHour && (
                <p className={`text-sm mt-1 ${
                  isHappyHour && isHappyHour(pub.happyHour) 
                    ? 'text-green-600 font-semibold' 
                    : 'text-gray-500'
                }`}>
                  🕐 {pub.happyHour}
                  {isHappyHour && isHappyHour(pub.happyHour) && ' - NOW!'}
                </p>
              )}
              {pub.website && (
                <a
                  href={pub.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-600 hover:text-amber-700 text-sm mt-2 inline-block"
                >
                  Visit website →
                </a>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
