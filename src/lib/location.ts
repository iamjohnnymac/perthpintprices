const EARTH_RADIUS_KM = 6371

function degreesToRadians(degrees: number): number {
  return degrees * Math.PI / 180
}

export function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = degreesToRadians(lat2 - lat1)
  const dLng = degreesToRadians(lng2 - lng1)
  const lat1Radians = degreesToRadians(lat1)
  const lat2Radians = degreesToRadians(lat2)

  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1Radians) * Math.cos(lat2Radians) *
    Math.sin(dLng / 2) ** 2

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return haversineDistanceKm(lat1, lng1, lat2, lng2)
}

// Format distance for display
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`
  return `${km.toFixed(1)}km`
}
