'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Pub } from '@/types/pub'

// Dynamically import marker cluster
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import MarkerClusterGroup from 'react-leaflet-cluster'

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom price marker icon
const createPriceIcon = (price: number, isHappyHour: boolean) => {
  const color = isHappyHour ? '#22c55e' : (price <= 7 ? '#22c55e' : price <= 8 ? '#84cc16' : price <= 9 ? '#f59e0b' : '#ef4444')
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: ${color};
        border: 2px solid rgba(0,0,0,0.3);
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 11px;
        color: white;
        text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        ${isHappyHour ? 'animation: pulse 2s infinite;' : ''}
      ">$${Math.round(price)}</div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  })
}

// Custom cluster icon
const createClusterCustomIcon = (cluster: any) => {
  const count = cluster.getChildCount()
  const markers = cluster.getAllChildMarkers()
  
  // Calculate average price in cluster
  let totalPrice = 0
  markers.forEach((marker: any) => {
    const price = marker.options.price || 8
    totalPrice += price
  })
  const avgPrice = Math.round(totalPrice / count)
  
  return L.divIcon({
    html: `
      <div style="
        background: linear-gradient(135deg, #f59e0b, #d97706);
        border: 3px solid rgba(255,255,255,0.9);
        border-radius: 50%;
        width: 44px;
        height: 44px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      ">
        <span style="font-size: 12px;">${count}</span>
        <span style="font-size: 9px;">pubs</span>
      </div>
    `,
    className: 'custom-cluster-icon',
    iconSize: L.point(44, 44),
    iconAnchor: L.point(22, 22)
  })
}

// Component to fit map bounds to markers
function FitBounds({ pubs }: { pubs: Pub[] }) {
  const map = useMap()
  
  useEffect(() => {
    if (pubs.length > 0) {
      const bounds = L.latLngBounds(pubs.map(pub => [pub.lat, pub.lng]))
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
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
    <div className="h-[400px] md:h-[550px] rounded-2xl overflow-hidden border-2 border-slate-700/50 shadow-2xl">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        <FitBounds pubs={pubs} />
        
        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterCustomIcon}
          maxClusterRadius={50}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          disableClusteringAtZoom={16}
        >
          {pubs.map(pub => {
            const happyNow = isHappyHour(pub)
            const marker = (
              <Marker 
                key={pub.id} 
                position={[pub.lat, pub.lng]}
                icon={createPriceIcon(pub.price, happyNow)}
                // @ts-ignore - custom property for cluster averaging
                price={pub.price}
              >
                <Popup className="pub-popup" maxWidth={280}>
                  <div className="min-w-[220px] p-1">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className="font-bold text-base leading-tight text-slate-800">{pub.name}</h3>
                      <span className="text-xl font-black text-amber-600">${pub.price}</span>
                    </div>
                    
                    {happyNow && (
                      <div className="mb-2">
                        <span className="inline-flex items-center gap-1 text-xs font-bold bg-green-500 text-white px-2 py-1 rounded-full">
                          🍺 HAPPY HOUR NOW
                        </span>
                      </div>
                    )}
                    
                    <p className="text-slate-500 text-sm mb-2">{pub.address}</p>
                    
                    <div className="space-y-1 text-xs mb-3">
                      <div className="flex items-center gap-2 text-amber-600 font-medium">
                        <span>🍺</span>
                        <span>{pub.description}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <span>🕐</span>
                        <span>{pub.happyHour}</span>
                      </div>
                    </div>
                    
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${pub.lat},${pub.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
                    >
                      📍 Get Directions
                    </a>
                  </div>
                </Popup>
              </Marker>
            )
            return marker
          })}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  )
}
