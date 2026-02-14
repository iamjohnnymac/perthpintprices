'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface MiniMapProps {
  lat: number
  lng: number
  name: string
}

export default function MiniMap({ lat, lng, name }: MiniMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Create mini map
    const map = L.map(mapRef.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      keyboard: false,
      attributionControl: false,
    })

    // Add dark tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map)

    // Add marker
    const icon = L.divIcon({
      className: 'mini-map-marker',
      html: `
        <div style="
          width: 20px;
          height: 20px;
          background: #f59e0b;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.5);
        "></div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    })

    L.marker([lat, lng], { icon }).addTo(map)

    mapInstanceRef.current = map

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [lat, lng])

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full"
      aria-label={`Map showing location of ${name}`}
    />
  )
}
