import { getSunPosition } from './sunPosition'

export type MapMode = 'day' | 'golden' | 'twilight' | 'night'

/**
 * Determines map visual mode based on current sun altitude in Perth.
 * - Day: sun > 6° above horizon
 * - Golden hour: sun 0°–6° (warm light near sunrise/sunset)
 * - Twilight: sun -6°–0° (civil twilight)
 * - Night: sun < -6° (full dark)
 */
export function getMapMode(date?: Date): MapMode {
  const { altitude } = getSunPosition(date ?? new Date())
  if (altitude > 6) return 'day'
  if (altitude > 0) return 'golden'
  if (altitude > -6) return 'twilight'
  return 'night'
}

export const MAP_TILES: Record<MapMode, string> = {
  day: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  golden: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  twilight: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  night: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
}

/** CSS filter applied to map tile pane for atmospheric effect */
export const MAP_FILTERS: Record<MapMode, string> = {
  day: 'none',
  golden: 'sepia(0.2) saturate(1.3) brightness(1.05)',
  twilight: 'saturate(0.85) brightness(0.95) hue-rotate(10deg)',
  night: 'none',
}

/** Overlay color for mood effect on top of map */
export const MAP_OVERLAYS: Record<MapMode, string | null> = {
  day: null,
  golden: 'rgba(251,191,36,0.08)',
  twilight: 'rgba(99,102,241,0.12)',
  night: 'rgba(30,27,75,0.15)',
}

export const MAP_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
