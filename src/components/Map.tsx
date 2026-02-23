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
  let bgColor = '#D4A017' // amber gold for cheap
  if (price > 9) bgColor = '#DC2626' // red for expensive
  else if (price > 7.5) bgColor = '#D97706' // amber for mid

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

// Custom cluster icon
function createClusterCustomIcon(cluster: L.MarkerCluster): L.DivIcon {
  const count = cluster.getChildCount()
  let size = 50
  let fontSize = 16
  let bgColor = '#D4A017'

  if (count > 20) {
    size = 70
    fontSize = 20
    bgColor = '#92400E'
  } else if (count > 10) {
    size = 60
    fontSize = 18
    bgColor = '#D4A017'
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
function FitBounds({ pubs, userLocation, totalPubCount }: { pubs: Pub[], userLocation?: { lat: number, lng: number } | null, totalPubCount: number }) {
  const map = useMap()
  const hasInitialZoom = React.useRef(false)
  const prevPubsFingerprint = React.useRef('')

  useEffect(() => {
    // Create a fingerprint of the current pub set to detect filter changes
    const fingerprint = pubs.length + ':' + (pubs.length > 0 ? pubs[0].id + '_' + pubs[pubs.length - 1].id : 'empty')
    const isFiltered = pubs.length < totalPubCount && pubs.length > 0

    // Initial load: zoom to user location if available
    if (!hasInitialZoom.current) {
      hasInitialZoom.current = true
      prevPubsFingerprint.current = fingerprint

      if (userLocation) {
        map.setView([userLocation.lat, userLocation.lng], 14, { animate: true })
        return
      }

      if (pubs.length > 0) {
        const bounds = L.latLngBounds(pubs.map(pub => [pub.lat, pub.lng]))
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 })
      } else {
        map.setView([-31.9505, 115.8605], 11)
      }
      return
    }

    // After initial load: respond to filter changes
    if (fingerprint !== prevPubsFingerprint.current) {
      prevPubsFingerprint.current = fingerprint

      if (pubs.length === 0) {
        map.setView([-31.9505, 115.8605], 11)
      } else if (isFiltered) {
        // User is searching/filtering — zoom to filtered results
        const bounds = L.latLngBounds(pubs.map(pub => [pub.lat, pub.lng]))
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 })
      } else if (userLocation) {
        // Filter cleared — return to user location
        map.setView([userLocation.lat, userLocation.lng], 14, { animate: true })
      } else {
        // Filter cleared, no user location — fit to all
        const bounds = L.latLngBounds(pubs.map(pub => [pub.lat, pub.lng]))
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 })
      }
    }
  }, [map, pubs, userLocation, totalPubCount])

  return null
}

interface MapProps {
  pubs: Pub[]
  isHappyHour?: (happyHour: string | null | undefined) => boolean
  userLocation?: { lat: number, lng: number } | null
  totalPubCount?: number
}

export default function MapComponent({ pubs, isHappyHour, userLocation, totalPubCount }: MapProps) {
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
      
      <FitBounds pubs={pubs} userLocation={userLocation} totalPubCount={totalPubCount || pubs.length} />
      
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
              <span style={{ color: '#D4A017', fontWeight: 500 }}>{pub.price !== null ? `$${pub.price.toFixed(2)}` : 'TBC'}</span>
            </Tooltip>
            <Popup>
              <div style={{ padding: '8px', minWidth: '200px' }}>
                <a href={`/pub/${pub.slug}`} style={{ fontWeight: 700, fontSize: '16px', marginBottom: '4px', color: '#1f2937', textDecoration: 'none', display: 'block' }}>
                  {pub.name}
                </a>
                <p style={{ color: '#D4A017', fontWeight: 600, marginBottom: '4px' }}>
                  {pub.price !== null ? `$${pub.price.toFixed(2)}` : 'TBC'} - {pub.beerType}
                </p>
                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
                  {pub.address}
                </p>
                {pub.happyHour && (
                  <p style={{ 
                    fontSize: '13px', 
                    marginTop: '4px',
                    color: isHappyHour && isHappyHour(pub.happyHour) ? '#D4A017' : '#6b7280',
                    fontWeight: isHappyHour && isHappyHour(pub.happyHour) ? 600 : 400
                  }}>
                    {'\u{1F550}'} {pub.happyHour}
                    {isHappyHour && isHappyHour(pub.happyHour) && ' - NOW!'}
                  </p>
                )}
                {pub.website && (
                  <a
                    href={pub.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                      color: '#D4A017', 
                      fontSize: '13px', 
                      marginTop: '8px', 
                      display: 'inline-block',
                      textDecoration: 'none'
                    }}
                  >
                    Visit website {'\u2192'}
                  </a>
                )}
                <a
                  href={`/pub/${pub.slug}`}
                  style={{
                    color: '#D4A017',
                    fontSize: '13px',
                    marginTop: '4px',
                    display: 'inline-block',
                    textDecoration: 'none',
                    fontWeight: 600,
                    marginLeft: pub.website ? '12px' : '0'
                  }}
                >
                  View Details {'\u2192'}
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>

      {userLocation && (
        <Marker
          position={[userLocation.lat, userLocation.lng]}
          icon={L.divIcon({
            className: 'user-location-marker',
            html: `<div style="width:16px;height:16px;background:#D4A017;border-radius:50%;border:3px solid white;box-shadow:0 0 0 3px rgba(8,145,178,0.3),0 2px 6px rgba(0,0,0,0.3)"></div>`,
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
