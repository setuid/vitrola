import { useState, useRef, useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getMarketplaceStats, fetchPricesBatch, RecordPriceInfo } from '@/lib/discogs-marketplace'
import type { VinylRecord } from '@/lib/supabase'

const STALE_TIME = 24 * 60 * 60 * 1000 // 24h

export function useRecordPrice(discogsId: string | null) {
  return useQuery({
    queryKey: ['discogs', 'marketplace', discogsId],
    queryFn: async (): Promise<RecordPriceInfo> => {
      const stats = await getMarketplaceStats(Number(discogsId))
      return {
        discogsId: discogsId!,
        lowestPrice: stats.lowest_price?.value ?? null,
        currency: stats.lowest_price?.currency ?? 'USD',
        numForSale: stats.num_for_sale,
        fetchedAt: Date.now(),
      }
    },
    staleTime: STALE_TIME,
    enabled: discogsId !== null,
  })
}

export function useCollectionValue(records: VinylRecord[]) {
  const queryClient = useQueryClient()
  const [isFetching, setIsFetching] = useState(false)
  const [progress, setProgress] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  const recordsWithDiscogs = useMemo(
    () => records.filter((r) => r.discogs_id !== null),
    [records]
  )

  // Compute totals from cached data
  const { totalValue, currency, pricedCount } = useMemo(() => {
    let total = 0
    let count = 0
    let curr = 'USD'

    for (const r of recordsWithDiscogs) {
      const cached = queryClient.getQueryData<RecordPriceInfo>([
        'discogs', 'marketplace', r.discogs_id,
      ])
      if (cached?.lowestPrice !== null && cached?.lowestPrice !== undefined) {
        total += cached.lowestPrice
        curr = cached.currency
        count++
      }
    }

    return {
      totalValue: count > 0 ? total : null,
      currency: curr,
      pricedCount: count,
    }
  }, [recordsWithDiscogs, queryClient, isFetching]) // isFetching triggers recompute as cache updates

  const refresh = useCallback(async () => {
    if (isFetching) return

    // Filter to only records that need refreshing
    const now = Date.now()
    const idsToFetch = recordsWithDiscogs
      .filter((r) => {
        const state = queryClient.getQueryState(['discogs', 'marketplace', r.discogs_id])
        return !state?.dataUpdatedAt || now - state.dataUpdatedAt > STALE_TIME
      })
      .map((r) => r.discogs_id!)

    if (idsToFetch.length === 0) return

    const controller = new AbortController()
    abortRef.current = controller
    setIsFetching(true)
    setProgress(0)

    try {
      await fetchPricesBatch(
        idsToFetch,
        (completed, total, latest) => {
          setProgress(Math.round((completed / total) * 100))
          // Update individual cache entry
          queryClient.setQueryData(
            ['discogs', 'marketplace', latest.discogsId],
            latest
          )
        },
        controller.signal
      )
    } finally {
      setIsFetching(false)
      abortRef.current = null
    }
  }, [isFetching, recordsWithDiscogs, queryClient])

  const cancel = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  return {
    totalValue,
    currency,
    pricedCount,
    totalWithDiscogs: recordsWithDiscogs.length,
    isFetching,
    progress,
    refresh,
    cancel,
  }
}
