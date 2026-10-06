/** Public Google Maps views and Maps URLs. No Google Maps Platform API key is used. */
export function hasCoordinates(lat?: number | null, lng?: number | null) {
  return lat != null && lng != null && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))
    && Math.abs(Number(lat)) <= 90 && Math.abs(Number(lng)) <= 180
    && !(Number(lat) === 0 && Number(lng) === 0)
}

export function mapLocationQuery(lat?: number | null, lng?: number | null, address?: string) {
  return hasCoordinates(lat, lng) ? `${Number(lat)},${Number(lng)}` : (address || '').trim()
}

// This is the public iframe view, not the key-based Maps Embed API /embed/v1.
// Keep a Maps URL beside the iframe because Google/browser policies can block embedding.
export function googleMapEmbed(lat?: number, lng?: number, address?: string, zoom = 15) {
  const query = mapLocationQuery(lat, lng, address)
  if (!query) return ''
  const level = Number.isFinite(zoom) ? Math.max(1, Math.min(20, Math.round(zoom))) : 15
  return `https://maps.google.com/maps?${new URLSearchParams({ q: query, z: String(level), hl: 'vi', output: 'embed' })}`
}

export function googleMapExternal(lat?: number, lng?: number, address?: string) {
  const query = mapLocationQuery(lat, lng, address) || 'Việt Nam'
  return `https://www.google.com/maps/search/?${new URLSearchParams({ api: '1', query })}`
}

export function googleMapDirections(lat?: number, lng?: number, address?: string) {
  const destination = mapLocationQuery(lat, lng, address) || 'Việt Nam'
  // Omit origin: Google Maps lets the user select their starting location.
  return `https://www.google.com/maps/dir/?${new URLSearchParams({ api: '1', destination, travelmode: 'driving' })}`
}

export function mapLinksFromEmbed(src: string) {
  try {
    const url = new URL(src)
    if (url.protocol !== 'https:' || url.hostname !== 'maps.google.com' || url.pathname !== '/maps' || url.searchParams.get('output') !== 'embed') return null
    const query = url.searchParams.get('q') || ''
    if (!query.trim()) return null
    return { view: googleMapExternal(undefined, undefined, query), directions: googleMapDirections(undefined, undefined, query) }
  } catch { return null }
}
