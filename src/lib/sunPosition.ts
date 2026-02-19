/**
 * Solar position calculator for Perth, WA (-31.9505°, 115.8605°)
 * Returns azimuth (0=N, 90=E, 180=S, 270=W) and altitude (degrees above horizon)
 */
export function getSunPosition(date: Date): { azimuth: number; altitude: number } {
  const lat = -31.9505
  const lng = 115.8605

  // Julian day
  const JD = date.getTime() / 86400000 + 2440587.5
  const n = JD - 2451545.0

  // Mean longitude and mean anomaly (degrees)
  const L = ((280.46 + 0.9856474 * n) % 360 + 360) % 360
  const gRad = (((357.528 + 0.9856003 * n) % 360 + 360) % 360) * (Math.PI / 180)

  // Ecliptic longitude
  const lambdaRad = (L + 1.915 * Math.sin(gRad) + 0.02 * Math.sin(2 * gRad)) * (Math.PI / 180)

  // Obliquity of ecliptic
  const eps = 23.439 * (Math.PI / 180)

  // Declination
  const dec = Math.asin(Math.sin(eps) * Math.sin(lambdaRad))

  // Right ascension (radians)
  const RA = Math.atan2(Math.cos(eps) * Math.sin(lambdaRad), Math.cos(lambdaRad))

  // Greenwich Mean Sidereal Time (hours)
  const GMST = (6.697375 + 0.0657098242 * n + date.getUTCHours() + date.getUTCMinutes() / 60) % 24

  // Local Hour Angle (radians)
  const LHA = ((GMST * 15 + lng) - (RA * 180) / Math.PI) * (Math.PI / 180)

  const latRad = lat * (Math.PI / 180)

  // Altitude
  const sinAlt =
    Math.sin(latRad) * Math.sin(dec) + Math.cos(latRad) * Math.cos(dec) * Math.cos(LHA)
  const altitude = Math.asin(Math.max(-1, Math.min(1, sinAlt))) * (180 / Math.PI)

  // Azimuth (clockwise from North)
  const cosAz =
    (Math.sin(dec) - Math.sin(latRad) * sinAlt) /
    (Math.cos(latRad) * Math.sqrt(Math.max(0, 1 - sinAlt * sinAlt)))
  let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAz))) * (180 / Math.PI)
  if (Math.sin(LHA) > 0) azimuth = 360 - azimuth

  return { azimuth, altitude }
}

/** Returns CSS x/y percentages for positioning sun at the edge of a container */
export function sunToMapPosition(azimuth: number): { x: number; y: number } {
  const rad = azimuth * (Math.PI / 180)
  return {
    x: 50 + Math.sin(rad) * 44,
    y: 50 - Math.cos(rad) * 44,
  }
}
