'use client'

import { useEffect, useRef } from 'react'
import { Pub } from '@/types/pub'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface MapProps {
  pubs: Pub[]
  selectedPub?: Pub | null
  onPubSelect?: (pub: Pub) => void
}

export default function Map({ pubs, selectedPub, onPubSelect }: MapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<L.Marker[]>([])

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    // Initialize map centered on Perth
    mapRef.current = L.map(mapContainerRef.current, {
      center: [-31.9505, 115.8605],
      zoom: 13,
      zoomControl: true,
    })

    // Dark theme tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }).addTo(mapRef.current)

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    // Add markers for each pub
    pubs.forEach(pub => {
      // Color based on price
      const color = pub.price <= 7 ? '#22c55e' : pub.price <= 8 ? '#eab308' : '#f97316'
      
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background: ${color}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">$${pub.price}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      })

      const marker = L.marker([pub.coordinates.lat, pub.coordinates.lng], { icon })
        .addTo(mapRef.current!)
        .bindPopup(`
          <div style="min-width: 150px;">
            <h3 style="font-weight: bold; margin-bottom: 4px;">${pub.name}</h3>
            <p style="color: #22c55e; font-weight: bold;">$${pub.price} pint</p>
            <p style="font-size: 12px; color: #666;">${pub.beerType}</p>
          </div>
        `)

      if (onPubSelect) {
        marker.on('click', () => onPubSelect(pub))
      }

      markersRef.current.push(marker)
    })
  }, [pubs, onPubSelect])

  useEffect(() => {
    if (!mapRef.current || !selectedPub) return
    mapRef.current.setView([selectedPub.coordinates.lat, selectedPub.coordinates.lng], 15)
  }, [selectedPub])

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full rounded-xl overflow-hidden"
      style={{ minHeight: '400px' }}
    />
  )
}
