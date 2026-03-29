const DISCOGS_BASE_URL = 'https://api.discogs.com'

function getApiKey() {
  return import.meta.env.VITE_DISCOGS_API_KEY || ''
}

export interface MarketplaceStats {
  lowest_price: { value: number; currency: string } | null
  num_for_sale: number
  blocked_from_sale: boolean
}

export interface RecordPriceInfo {
  discogsId: string
  lowestPrice: number | null
  currency: string
  numForSale: number
  fetchedAt: number
}

export async function getMarketplaceStats(releaseId: number): Promise<MarketplaceStats> {
  const response = await fetch(
    `${DISCOGS_BASE_URL}/marketplace/stats/${releaseId}?token=${getApiKey()}`,
    { headers: { 'User-Agent': 'Vitrola/2.0 +https://github.com/vitrola' } }
  )

  if (response.status === 429) {
    throw new RateLimitError(
      Number(response.headers.get('Retry-After') || '60')
    )
  }

  if (!response.ok) throw new Error('Failed to fetch marketplace stats')
  return response.json()
}

export class RateLimitError extends Error {
  retryAfter: number
  constructor(retryAfter: number) {
    super('Rate limited by Discogs')
    this.retryAfter = retryAfter
  }
}

function toRecordPriceInfo(discogsId: string, stats: MarketplaceStats): RecordPriceInfo {
  return {
    discogsId,
    lowestPrice: stats.lowest_price?.value ?? null,
    currency: stats.lowest_price?.currency ?? 'USD',
    numForSale: stats.num_for_sale,
    fetchedAt: Date.now(),
  }
}

export async function fetchPricesBatch(
  discogsIds: string[],
  onProgress: (completed: number, total: number, latest: RecordPriceInfo) => void,
  signal?: AbortSignal
): Promise<RecordPriceInfo[]> {
  const results: RecordPriceInfo[] = []

  for (let i = 0; i < discogsIds.length; i++) {
    if (signal?.aborted) break

    const id = discogsIds[i]

    try {
      const stats = await getMarketplaceStats(Number(id))
      const info = toRecordPriceInfo(id, stats)
      results.push(info)
      onProgress(i + 1, discogsIds.length, info)
    } catch (err) {
      if (err instanceof RateLimitError) {
        // Wait for the retry-after period then retry this same record
        await new Promise((r) => setTimeout(r, err.retryAfter * 1000))
        i-- // retry
        continue
      }
      // For other errors, store null price and continue
      const fallback: RecordPriceInfo = {
        discogsId: id,
        lowestPrice: null,
        currency: 'USD',
        numForSale: 0,
        fetchedAt: Date.now(),
      }
      results.push(fallback)
      onProgress(i + 1, discogsIds.length, fallback)
    }

    // Throttle: 1 second between requests
    if (i < discogsIds.length - 1 && !signal?.aborted) {
      await new Promise((r) => setTimeout(r, 1000))
    }
  }

  return results
}
