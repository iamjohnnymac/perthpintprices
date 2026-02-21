'use client'

import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import { Pub } from '@/types/pub'
import 'leaflet/dist/leaflet.css'
import React, { useEffect } from 'react'

// Price-coded markers using DivIcon
function getPriceIcon(price: number | null): L.DivIcon {
  if (price === null) { const bgColor = "#9ca3af"; return L.divIcon({ className: "custom-price-marker", html: `<div style="background:${bgColor};color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:10px;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid white">TBC</div>`, iconSize: [32, 32], iconAnchor: [16, 16] }); }
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
  let bgColor = '#E8A317' // gold

  if (count > 20) {
    size = 70
    fontSize = 20
    bgColor = '#C88A0F' // deeper gold for large clusters
  } else if (count > 10) {
    size = 60
    fontSize = 18
    bgColor = '#D99615' // mid gold for medium
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
function FitBounds({ pubs, userLocation }: { pubs: Pub[], userLocation?: { lat: number, lng: number } | null }) {
  const map = useMap()
  const hasZoomedToUser = React.useRef(false)

  useEffect(() => {
    // If user location available and we haven't zoomed to them yet, center on them
    if (userLocation && !hasZoomedToUser.current) {
      hasZoomedToUser.current = true
      map.setView([userLocation.lat, userLocation.lng], 14, { animate: true })
      return
    }

    // Otherwise fit to all pubs
    if (pubs.length === 0) return
    if (hasZoomedToUser.current) return // Don't override user location zoom

    const bounds = L.latLngBounds(pubs.map(pub => [pub.lat, pub.lng]))
    map.fitBounds(bounds, { 
      padding: [50, 50],
      maxZoom: 15
    })
  }, [map, pubs, userLocation])

  return null
}

interface MapProps {
  pubs: Pub[]
  isHappyHour?: (happyHour: string | null | undefined) => boolean
  userLocation?: { lat: number, lng: number } | null
}

export default function Map({ pubs, isHappyHour, userLocation }: MapProps) {
  // Center on user location if available, otherwise Perth CBD
  const center: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [-31.9505, 115.8605]

  return (
    <MapContainer
      center={center}
      zoom={12}
      className="h-[200px] sm:h-[300px] md:h-[400px] w-full"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      
      {/* Fit bounds to filtered pubs */}
      <FitBounds pubs={pubs} userLocation={userLocation} />
      
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
              <span style={{ color: '#d97706', fontWeight: 500 }}>{pub.price !== null ? `$${pub.price.toFixed(2)}` : 'TBC'}</span>
            </Tooltip>
            <Popup>
              <div style={{ padding: '8px', minWidth: '200px' }}>
                <h3 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '4px', color: '#1f2937' }}>
                  {pub.name}
                </h3>
                <p style={{ color: '#d97706', fontWeight: 600, marginBottom: '4px' }}>
                  {pub.price !== null ? `$${pub.price.toFixed(2)}` : 'TBC'} - {pub.beerType}
                </p>
                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
                  {pub.address}
                </p>
                {pub.happyHour && (
                  <p style={{ 
                    fontSize: '13px', 
                    marginTop: '4px',
                    color: isHappyHour && isHappyHour(pub.happyHour) ? '#16a34a' : '#6b7280',
                    fontWeight: isHappyHour && isHappyHour(pub.happyHour) ? 600 : 400
                  }}>
                    🕐 {pub.happyHour}
                    {isHappyHour && isHappyHour(pub.happyHour) && ' - NOW!'}
                  </p>
                )}
                {pub.website && (
                  <a
                    href={pub.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                      color: '#d97706', 
                      fontSize: '13px', 
                      marginTop: '8px', 
                      display: 'inline-block',
                      textDecoration: 'none'
                    }}
                  >
                    Visit website →
                  </a>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>

      {/* User location blue dot */}
      {userLocation && (
        <Marker
          position={[userLocation.lat, userLocation.lng]}
          icon={L.divIcon({
            className: 'user-location-marker',
            html: `<div style="width:16px;height:16px;background:#00C9A7;border-radius:50%;border:3px solid white;box-shadow:0 0 0 3px rgba(0,201,167,0.3),0 2px 6px rgba(0,0,0,0.3)"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          })}
        >
          <Tooltip direction="top" offset={[0, -12]}>
            <span style={{ fontWeight: 600, fontSize: '12px' }}>Your location</span>
          </Tooltip>
        </Marker>
      )}
    </MapContainer>
  )
}
