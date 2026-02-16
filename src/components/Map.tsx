'use client'

import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import { Pub } from '@/types/pub'
import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'

// Price-coded markers using DivIcon
function getPriceIcon(price: number): L.DivIcon {
  let bgColor = '#22c55e' // green for cheap
  if (price > 9) bgColor = '#f97316' // orange for expensive
  else if (price > 7.5) bgColor = '#eab308' // yellow for mid

  return L.divIcon({
    className: 'custom-price-marker',
    html: `<div style="
      background-color: ${bgColor};
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 11px;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">$${price}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

// Custom cluster icon - larger and more readable
function createClusterCustomIcon(cluster: L.MarkerCluster): L.DivIcon {
  const count = cluster.getChildCount()
  let size = 50
  let fontSize = 16
  let bgColor = '#f59e0b' // amber

  if (count > 20) {
    size = 70
    fontSize = 20
    bgColor = '#ea580c' // deeper orange for large clusters
  } else if (count > 10) {
    size = 60
    fontSize = 18
    bgColor = '#f97316' // orange for medium
  }

  return L.divIcon({
    html: `<div style="
      background-color: ${bgColor};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 800;
      font-size: ${fontSize}px;
      line-height: 1.1;
      border: 3px solid white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
    "><span style="font-size: ${fontSize + 4}px;">${count}</span><span style="font-size: ${fontSize - 4}px; opacity: 0.9;">pubs</span></div>`,
    className: 'custom-cluster-icon',
    iconSize: L.point(size, size, true),
  })
}

// Component to fit map bounds to visible markers
function FitBounds({ pubs }: { pubs: Pub[] }) {
  const map = useMap()

  useEffect(() => {
    if (pubs.length === 0) return

    // Create bounds from all pub locations
    const bounds = L.latLngBounds(pubs.map(pub => [pub.lat, pub.lng]))
    
    // Fit the map to show all markers with padding
    map.fitBounds(bounds, { 
      padding: [50, 50],
      maxZoom: 15 // Don't zoom in too far for single/few results
    })
  }, [map, pubs])

  return null
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
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      
      {/* Fit bounds to filtered pubs */}
      <FitBounds pubs={pubs} />
      
      {/* Clustered markers */}
      <MarkerClusterGroup
        chunkedLoading
        iconCreateFunction={createClusterCustomIcon}
        maxClusterRadius={60}
        spiderfyOnMaxZoom={true}
        showCoverageOnHover={false}
        zoomToBoundsOnClick={true}
      >
        {pubs.map((pub) => (
          <Marker
            key={pub.id}
            position={[pub.lat, pub.lng]}
            icon={getPriceIcon(pub.price)}
          >
            <Tooltip 
              direction="top" 
              offset={[0, -16]} 
              opacity={0.95}
              className="pub-tooltip"
            >
              <span style={{ fontWeight: 600, fontSize: '13px' }}>{pub.name}</span>
              <br />
              <span style={{ color: '#d97706', fontWeight: 500 }}>${pub.price.toFixed(2)}</span>
            </Tooltip>
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
      </MarkerClusterGroup>
    </MapContainer>
  )
}
