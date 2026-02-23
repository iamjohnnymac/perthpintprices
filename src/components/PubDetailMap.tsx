'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

function getPriceMarkerColor(price: number | null): string {
  if (price === null) return '#78716c'
  if (price <= 7) return '#059669'
  if (price <= 9) return '#D4A017'
  if (price <= 11) return '#d97706'
  return '#dc2626'
}

interface PubDetailMapProps {
  lat: number
  lng: number
  name: string
  price: number | null
}

export default function PubDetailMap({ lat, lng, name, price }: PubDetailMapProps) {
  const color = getPriceMarkerColor(price)
  const priceLabel = price !== null ? `$${price.toFixed(0)}` : '?'

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
    iconSize: [40, 28],
    iconAnchor: [20, 14],
  })

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={16}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
      <Marker position={[lat, lng]} icon={markerIcon}>
        <Popup>
          <strong>{name}</strong><br />
          {price !== null ? `$${price.toFixed(2)}` : 'Price TBC'}
        </Popup>
      </Marker>
    </MapContainer>
  )
}
