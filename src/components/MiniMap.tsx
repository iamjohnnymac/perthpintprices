'use client'

import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'
import { getSunPosition, sunToMapPosition } from '@/lib/sunPosition'
import { getMapMode, MAP_TILES, MAP_FILTERS, MAP_OVERLAYS } from '@/lib/mapTheme'

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

/** Applies CSS filter to tile pane based on time of day */
function MapTheme() {
  const map = useMap()
  const mode = getMapMode()
  useEffect(() => {
    const pane = map.getPane('tilePane')
    if (pane) pane.style.filter = MAP_FILTERS[mode]
    return () => { if (pane) pane.style.filter = 'none' }
  }, [map, mode])
  return null
}

interface MiniMapProps {
  lat: number
  lng: number
  name: string
}

export default function MiniMap({ lat, lng, name }: MiniMapProps) {
  const { azimuth, altitude } = getSunPosition(new Date())
  const sunPos = sunToMapPosition(azimuth)
  const isSunUp = altitude > 0
  const mode = getMapMode()
  const overlay = MAP_OVERLAYS[mode]

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
        <TileLayer url={MAP_TILES[mode]} />
        <MapTheme />
        <Marker position={[lat, lng]} icon={miniMarkerIcon} />
      </MapContainer>

      {/* Time-of-day atmospheric overlay */}
      {overlay && (
        <div
          className="absolute inset-0 pointer-events-none z-[400]"
          style={{ background: overlay }}
        />
      )}

      {/* Sun direction overlay (daytime/golden hour only) */}
      {isSunUp && (
        <div
          className="absolute inset-0 pointer-events-none z-[401]"
          style={{
            background: `radial-gradient(circle at ${sunPos.x}% ${sunPos.y}%, rgba(251,191,36,0.22) 0%, transparent 65%)`,
          }}
        >
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
