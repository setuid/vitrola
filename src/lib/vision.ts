const VISION_BASE_URL = 'https://vision.googleapis.com/v1/images:annotate'

function getApiKey() {
  return import.meta.env.VITE_GOOGLE_VISION_API_KEY || ''
}

interface VisionWebEntity {
  entityId?: string
  score?: number
  description?: string
}

interface VisionResponse {
  responses: Array<{
    webDetection?: {
      webEntities?: VisionWebEntity[]
      bestGuessLabels?: Array<{ label: string }>
    }
    fullTextAnnotation?: {
      text: string
    }
    error?: {
      code: number
      message: string
    }
  }>
}

export interface AlbumDetectionResult {
  query: string
  artist: string
  title: string
  source: 'web' | 'ocr'
}

export async function detectAlbumCover(base64Image: string): Promise<AlbumDetectionResult> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('Google Vision API key não configurada')

  const response = await fetch(`${VISION_BASE_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [
        {
          image: { content: base64Image },
          features: [
            { type: 'WEB_DETECTION', maxResults: 10 },
            { type: 'TEXT_DETECTION', maxResults: 1 },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    throw new Error(`Vision API error (${response.status}): ${errorBody}`)
  }

  const data: VisionResponse = await response.json()
  const result = data.responses?.[0]

  if (result?.error) {
    throw new Error(`Vision API: ${result.error.message}`)
  }

  // 1. Try WEB_DETECTION first (best for album covers)
  const webDetection = result?.webDetection
  if (webDetection) {
    const bestGuess = webDetection.bestGuessLabels?.[0]?.label || ''
    const entities = (webDetection.webEntities || [])
      .filter((e) => e.description && (e.score ?? 0) > 0.3)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .map((e) => e.description!)

    if (bestGuess || entities.length > 0) {
      const parsed = parseWebEntities(bestGuess, entities)
      if (parsed.artist || parsed.title) {
        return {
          query: [parsed.artist, parsed.title].filter(Boolean).join(' '),
          ...parsed,
          source: 'web',
        }
      }
      // Use best guess + top entities as search query
      const query = bestGuess || entities.slice(0, 3).join(' ')
      if (query) {
        return { query, artist: '', title: '', source: 'web' }
      }
    }
  }

  // 2. Fallback to OCR text
  const ocrText = result?.fullTextAnnotation?.text || ''
  if (ocrText) {
    const parsed = parseArtistAndTitle(ocrText)
    return {
      query: [parsed.artist, parsed.title].filter(Boolean).join(' ') || ocrText.slice(0, 80),
      ...parsed,
      source: 'ocr',
    }
  }

  throw new Error('Não foi possível identificar a capa. Tente com outra foto ou use a busca manual.')
}

function parseWebEntities(
  bestGuess: string,
  entities: string[]
): { artist: string; title: string } {
  // bestGuess often looks like "Songs in the Key of Life" or "Stevie Wonder Songs in the Key of Life"
  // entities often contain separate items like ["Stevie Wonder", "Songs in the Key of Life", "Album"]

  // Filter out generic terms
  const genericTerms = new Set([
    'album', 'vinyl', 'record', 'lp', 'cd', 'music', 'cover', 'disc',
    'album cover', 'vinyl record', 'phonograph record', 'compact disc',
    'long-playing record', 'gramophone record', 'disco de vinil',
  ])

  const meaningful = entities.filter(
    (e) => !genericTerms.has(e.toLowerCase())
  )

  // If we have at least 2 meaningful entities, first is often artist, second is title
  if (meaningful.length >= 2) {
    return { artist: meaningful[0], title: meaningful[1] }
  }

  if (meaningful.length === 1) {
    // Try to split "Artist - Title" from bestGuess
    const match = bestGuess.match(/^(.+?)\s*[-–—]\s*(.+)$/)
    if (match) {
      return { artist: match[1].trim(), title: match[2].trim() }
    }
    return { artist: meaningful[0], title: '' }
  }

  // Use bestGuess as-is
  if (bestGuess) {
    const match = bestGuess.match(/^(.+?)\s*[-–—]\s*(.+)$/)
    if (match) {
      return { artist: match[1].trim(), title: match[2].trim() }
    }
  }

  return { artist: '', title: '' }
}

// Keep for backward compatibility
export async function extractTextFromImage(base64Image: string): Promise<string> {
  const result = await detectAlbumCover(base64Image)
  return result.query
}

export function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function parseArtistAndTitle(text: string): { artist: string; title: string } {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 5)

  // Try to find artist - title pattern
  for (const line of lines) {
    const match = line.match(/^(.+?)\s*[-–—]\s*(.+)$/)
    if (match) {
      return { artist: match[1].trim(), title: match[2].trim() }
    }
  }

  return {
    artist: lines[0] || '',
    title: lines[1] || '',
  }
}
