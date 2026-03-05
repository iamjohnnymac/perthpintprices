/**
 * Converts lat/lng to a static map tile URL from CartoDB (light theme).
 * Used for decorative faded map backgrounds on pub cards.
 * CartoDB basemaps are free and CDN-backed with relaxed usage policies.
 */
export function getMapTileUrl(lat: number, lng: number, zoom: number = 15): string {
  const n = Math.pow(2, zoom)
  const x = Math.floor(((lng + 180) / 360) * n)
  const latRad = (lat * Math.PI) / 180
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  )
  // CartoDB Voyager No Labels — street grid without text for clean card backgrounds
  return `https://basemaps.cartocdn.com/rastertiles/voyager_nolabels/${zoom}/${x}/${y}@2x.png`
}
