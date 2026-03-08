const VISION_BASE_URL = 'https://vision.googleapis.com/v1/images:annotate'

function getApiKey() {
  return import.meta.env.VITE_GOOGLE_VISION_API_KEY || ''
}

export async function extractTextFromImage(base64Image: string): Promise<string> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('Google Vision API key não configurada')

  const response = await fetch(`${VISION_BASE_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [
        {
          image: { content: base64Image },
          features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
        },
      ],
    }),
  })

  if (!response.ok) throw new Error('Vision API request failed')
  const data = await response.json()
  return data.responses?.[0]?.fullTextAnnotation?.text || ''
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
