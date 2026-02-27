'use client'

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { useEffect } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getMapMode, MAP_TILES, MAP_FILTERS } from '@/lib/mapTheme'

function getPriceMarkerColor(price: number | null): string {
  if (price === null) return '#78716c'
  if (price <= 7) return '#059669'
  if (price <= 9) return '#E8820C'
  if (price <= 11) return '#d97706'
  return '#dc2626'
}

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

interface PubDetailMapProps {
  lat: number
  lng: number
  name: string
  price: number | null
}

export default function PubDetailMap({ lat, lng, name, price }: PubDetailMapProps) {
  const color = getPriceMarkerColor(price)
  const priceLabel = price !== null ? `$${price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)}` : '?'

  const markerIcon = L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background: ${color};
      color: white;
      font-weight: 700;
      font-size: 13px;
      font-family: 'JetBrains Mono', monospace;
      padding: 4px 8px;
      border-radius: 8px;
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      white-space: nowrap;
    ">${priceLabel}</div>`,
    iconSize: [64, 28],
    iconAnchor: [32, 14],
  })

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={16}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer url={MAP_TILES[getMapMode()]} />
      <MapTheme />
      <Marker position={[lat, lng]} icon={markerIcon}>
        <Popup>
          <strong>{name}</strong><br />
          {price !== null ? `$${price.toFixed(2)}` : 'Price TBC'}
        </Popup>
      </Marker>
    </MapContainer>
  )
}
