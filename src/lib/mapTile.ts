const CARTO_BASEMAP_KEY = process.env.NEXT_PUBLIC_CARTO_BASEMAP_KEY ?? ''

function addCartoKey(url: string, key: string): string {
  return key ? `${url}?key=${encodeURIComponent(key)}` : url
}

export function getCartoTileTemplate(
  style: string,
  key: string = CARTO_BASEMAP_KEY
): string {
  return addCartoKey(
    `https://{s}.basemaps.cartocdn.com/${style}/{z}/{x}/{y}{r}.png`,
    key
  )
}

/** Converts lat/lng to a static CARTO tile used for decorative map backgrounds. */
export function getMapTileUrl(
  lat: number,
  lng: number,
  zoom: number = 15,
  key: string = CARTO_BASEMAP_KEY
): string {
  const n = Math.pow(2, zoom)
  const x = Math.floor(((lng + 180) / 360) * n)
  const latRad = (lat * Math.PI) / 180
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  )
  // CartoDB Voyager No Labels - street grid without text for clean card backgrounds
  return addCartoKey(
    `https://basemaps.cartocdn.com/rastertiles/voyager_nolabels/${zoom}/${x}/${y}@2x.png`,
    key
  )
}
