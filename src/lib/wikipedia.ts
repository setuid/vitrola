const WIKI_API = 'https://en.wikipedia.org/api/rest_v1'

export interface WikiSummary {
  title: string
  extract: string
  description?: string
  thumbnail?: { source: string }
  content_urls?: { desktop: { page: string } }
}

async function fetchSummary(title: string): Promise<WikiSummary | null> {
  const encoded = encodeURIComponent(title.replace(/ /g, '_'))
  const res = await fetch(`${WIKI_API}/page/summary/${encoded}`, {
    headers: { 'Api-User-Agent': 'Vitrola/2.0 (https://github.com/vitrola)' },
  })
  if (!res.ok) return null
  const data = await res.json()
  if (data.type === 'disambiguation' || !data.extract) return null
  return data
}

async function searchAndFetch(query: string): Promise<WikiSummary | null> {
  const params = new URLSearchParams({
    action: 'query',
    list: 'search',
    srsearch: query,
    srlimit: '3',
    format: 'json',
    origin: '*',
  })
  const res = await fetch(`https://en.wikipedia.org/w/api.php?${params}`)
  if (!res.ok) return null
  const data = await res.json()
  const results = data.query?.search || []
  for (const r of results) {
    const summary = await fetchSummary(r.title)
    if (summary) return summary
  }
  return null
}

export async function getAlbumWikiInfo(
  title: string,
  artist: string
): Promise<{ album: WikiSummary | null; artist: WikiSummary | null }> {
  // Clean artist name (remove " (2)" suffixes from Discogs)
  const cleanArtist = artist.replace(/\s*\(\d+\)\s*$/, '').trim()

  // Try album article first: "Album (album)" or "Album (Artist album)"
  let album =
    (await fetchSummary(`${title} (album)`)) ||
    (await fetchSummary(`${title} (${cleanArtist} album)`)) ||
    (await searchAndFetch(`${title} ${cleanArtist} album`))

  // Fetch artist article
  const artistSummary =
    (await fetchSummary(cleanArtist)) ||
    (await fetchSummary(`${cleanArtist} (band)`)) ||
    (await fetchSummary(`${cleanArtist} (musician)`))

  return { album, artist: artistSummary }
}
