'use client'

import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getSunPosition, sunToMapPosition } from '@/lib/sunPosition'

// Simple marker icon
const miniMarkerIcon = L.divIcon({
  className: 'mini-map-marker',
  html: `<div style="
    background: linear-gradient(135deg, #E8820C 0%, #D06820 100%);
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

interface MiniMapProps {
  lat: number
  lng: number
  name: string
}

export default function MiniMap({ lat, lng, name }: MiniMapProps) {
  const { azimuth, altitude } = getSunPosition(new Date())
  const sunPos = sunToMapPosition(azimuth)
  const isSunUp = altitude > 0

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        zoomControl={false}
        attributionControl={false}
      >
        {/* CartoDB Positron - soft pastel style matching main map */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <Marker position={[lat, lng]} icon={miniMarkerIcon} />
      </MapContainer>

      {/* Sun direction overlay */}
      {isSunUp && (
        <div
          className="absolute inset-0 pointer-events-none z-[400]"
          style={{
            background: `radial-gradient(circle at ${sunPos.x}% ${sunPos.y}%, rgba(251,191,36,0.22) 0%, transparent 65%)`,
          }}
        >
          {/* Sun dot */}
          <div
            className="absolute rounded-full"
            style={{
              width: 12,
              height: 12,
              left: `calc(${sunPos.x}% - 6px)`,
              top: `calc(${sunPos.y}% - 6px)`,
              background: 'radial-gradient(circle, #fde68a 0%, #E8820C 50%, #D06820 100%)',
              boxShadow: '0 0 6px 3px rgba(251,191,36,0.55)',
            }}
          />
        </div>
      )}
    </div>
  )
}
