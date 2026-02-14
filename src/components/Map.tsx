'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Pub } from '@/types/pub'

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom marker icons
const createPriceIcon = (price: number, isHappyHour: boolean) => {
  const color = isHappyHour ? '#22c55e' : (price <= 8 ? '#22c55e' : price <= 9 ? '#f59e0b' : '#ef4444')
  const borderColor = isHappyHour ? '#16a34a' : (price <= 8 ? '#16a34a' : price <= 9 ? '#d97706' : '#dc2626')
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: ${color};
        border: 3px solid ${borderColor};
        border-radius: 50%;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 12px;
        color: white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        ${isHappyHour ? 'animation: pulse 2s infinite;' : ''}
      ">
        $${price % 1 === 0 ? price : price.toFixed(0)}
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      </style>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20]
  })
}

// Component to fit map bounds to markers
function FitBounds({ pubs }: { pubs: Pub[] }) {
  const map = useMap()
  
  useEffect(() => {
    if (pubs.length > 0) {
      const bounds = L.latLngBounds(pubs.map(pub => [pub.lat, pub.lng]))
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 })
    }
  }, [pubs, map])
  
  return null
}

interface MapProps {
  pubs: Pub[]
  isHappyHour: (pub: Pub) => boolean
}

export default function Map({ pubs, isHappyHour }: MapProps) {
  // Perth center coordinates
  const center: [number, number] = [-31.9505, 115.8605]

  return (
    <div className="h-[400px] md:h-[600px] rounded-2xl overflow-hidden border-2 border-slate-700/50 shadow-2xl">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        <FitBounds pubs={pubs} />
        
        {pubs.map(pub => (
          <Marker 
            key={pub.id} 
            position={[pub.lat, pub.lng]}
            icon={createPriceIcon(pub.price, isHappyHour(pub))}
          >
            <Popup>
              <div className="min-w-[200px]">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3 className="font-bold text-base text-white leading-tight">{pub.name}</h3>
                  <span className="text-xl font-black text-beer-gold">${pub.price}</span>
                </div>
                
                {isHappyHour(pub) && (
                  <div className="mb-2">
                    <span className="inline-flex items-center gap-1 text-xs font-bold bg-green-500 text-white px-2 py-1 rounded-full">
                      🍺 HAPPY HOUR NOW
                    </span>
                  </div>
                )}
                
                <p className="text-slate-400 text-sm mb-2">{pub.address}</p>
                
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2 text-amber-400">
                    <span>🍺</span>
                    <span>{pub.description}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span>🕐</span>
                    <span>{pub.happyHour}</span>
                  </div>
                </div>
                
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${pub.lat},${pub.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block text-center bg-beer-gold hover:bg-amber-500 text-black font-medium py-2 px-4 rounded-lg text-sm transition-colors"
                >
                  📍 Get Directions
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
