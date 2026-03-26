const DISCOGS_BASE_URL = 'https://api.discogs.com'

function getApiKey() {
  return import.meta.env.VITE_DISCOGS_API_KEY || ''
}

export interface DiscogsSearchResult {
  id: number
  title: string
  thumb: string
  cover_image: string
  year: string
  country: string
  label: string[]
  genre: string[]
  style: string[]
  catno: string
  format: string[]
  barcode: string[]
  type: string
  master_id: number
}

export interface DiscogsTrack {
  position: string
  title: string
  duration: string
}

export interface DiscogsRelease {
  id: number
  title: string
  artists: { name: string }[]
  year: number
  labels: { name: string; catno: string }[]
  genres: string[]
  styles: string[]
  country: string
  tracklist: DiscogsTrack[]
  images: { uri: string; type: string }[]
  formats: { name: string; descriptions: string[] }[]
  notes?: string
}

export async function searchDiscogs(query: string, type = 'release'): Promise<DiscogsSearchResult[]> {
  const params = new URLSearchParams({
    q: query,
    type,
    per_page: '20',
    token: getApiKey(),
  })
  const response = await fetch(`${DISCOGS_BASE_URL}/database/search?${params}`, {
    headers: { 'User-Agent': 'Vitrola/2.0 +https://github.com/vitrola' },
  })
  if (!response.ok) throw new Error('Discogs search failed')
  const data = await response.json()
  return data.results || []
}

export async function searchByBarcode(barcode: string): Promise<DiscogsSearchResult[]> {
  const params = new URLSearchParams({
    barcode,
    token: getApiKey(),
  })
  const response = await fetch(`${DISCOGS_BASE_URL}/database/search?${params}`, {
    headers: { 'User-Agent': 'Vitrola/2.0 +https://github.com/vitrola' },
  })
  if (!response.ok) throw new Error('Discogs barcode search failed')
  const data = await response.json()
  return data.results || []
}

export async function getRelease(id: number): Promise<DiscogsRelease> {
  const response = await fetch(`${DISCOGS_BASE_URL}/releases/${id}?token=${getApiKey()}`, {
    headers: { 'User-Agent': 'Vitrola/2.0 +https://github.com/vitrola' },
  })
  if (!response.ok) throw new Error('Failed to fetch release details')
  return response.json()
}

export function parseDuration(duration: string): number {
  if (!duration) return 0
  const parts = duration.split(':').map(Number)
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  return 0
}

export function formatDuration(seconds: number): string {
  if (!seconds) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatTotalDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}min`
  return `${m}min`
}
