'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import { Pub } from '@/types/pub'
import 'leaflet/dist/leaflet.css'

// Price-coded markers using DivIcon
function getPriceIcon(price: number): L.DivIcon {
  let bgColor = '#22c55e' // green for cheap ($7 and under)
  if (price >= 10) bgColor = '#ef4444' // red for expensive
  else if (price >= 9) bgColor = '#f97316' // orange 
  else if (price > 7.5) bgColor = '#eab308' // yellow for mid

  return L.divIcon({
    className: 'custom-price-marker',
    html: `<div style="
      background: linear-gradient(135deg, ${bgColor} 0%, ${adjustColor(bgColor, -20)} 100%);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 11px;
      border: 3px solid white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      transition: transform 0.2s;
    ">$${price}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  })
}

// Helper to darken colors
function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '')
  const r = Math.max(0, Math.min(255, parseInt(hex.slice(0, 2), 16) + amount))
  const g = Math.max(0, Math.min(255, parseInt(hex.slice(2, 4), 16) + amount))
  const b = Math.max(0, Math.min(255, parseInt(hex.slice(4, 6), 16) + amount))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

// Custom cluster icon showing count and average price
const createClusterCustomIcon = (cluster: L.MarkerCluster) => {
  const markers = cluster.getAllChildMarkers()
  const count = markers.length
  
  // Calculate average price from markers (extract from popup content or use default)
  const prices = markers.map(m => {
    const popup = m.getPopup()
    if (popup) {
      const content = popup.getContent()
      if (typeof content === 'string') {
        const match = content.match(/\$(\d+\.?\d*)/);
        return match ? parseFloat(match[1]) : 8
      }
    }
    return 8
  })
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
  
  // Color based on average price
  let bgColor = '#22c55e'
  if (avgPrice >= 10) bgColor = '#ef4444'
  else if (avgPrice >= 9) bgColor = '#f97316'
  else if (avgPrice > 7.5) bgColor = '#eab308'

  return L.divIcon({
    html: `<div style="
      background: linear-gradient(135deg, ${bgColor} 0%, ${adjustColor(bgColor, -30)} 100%);
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      border: 4px solid white;
      box-shadow: 0 6px 20px rgba(0,0,0,0.5);
    ">
      <span style="font-size: 16px; line-height: 1;">${count}</span>
      <span style="font-size: 9px; opacity: 0.9;">pubs</span>
    </div>`,
    className: 'custom-cluster-icon',
    iconSize: L.point(50, 50),
    iconAnchor: L.point(25, 25),
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
      className="rounded-xl shadow-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MarkerClusterGroup
        chunkedLoading
        iconCreateFunction={createClusterCustomIcon}
        maxClusterRadius={60}
        spiderfyOnMaxZoom={true}
        showCoverageOnHover={false}
        zoomToBoundsOnClick={true}
        disableClusteringAtZoom={16}
      >
        {pubs.map((pub) => (
          <Marker
            key={pub.id}
            position={[pub.lat, pub.lng]}
            icon={getPriceIcon(pub.price)}
          >
            <Popup>
              <div className="p-3 min-w-[220px]">
                <h3 className="font-bold text-lg text-gray-900 mb-1">{pub.name}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl font-bold text-amber-600">${pub.price.toFixed(2)}</span>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                    🍺 {pub.beerType}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">📍 {pub.address}</p>
                {pub.happyHour && (
                  <p className={`text-sm mb-2 px-2 py-1 rounded ${
                    isHappyHour && isHappyHour(pub.happyHour)
                      ? 'bg-green-100 text-green-700 font-semibold'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    🕐 {pub.happyHour}
                    {isHappyHour && isHappyHour(pub.happyHour) && ' — HAPPY HOUR NOW!'}
                  </p>
                )}
                {pub.website && (
                  <a
                    href={pub.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-700 text-sm font-medium"
                  >
                    Visit website →
                  </a>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  )
}