import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { searchDiscogs, getRelease } from '@/lib/discogs'

export function useDiscogsSearch(query: string) {
  return useQuery({
    queryKey: ['discogs', 'search', query],
    queryFn: () => searchDiscogs(query),
    enabled: query.trim().length >= 2,
    staleTime: 5 * 60 * 1000,
  })
}

export function useDiscogsRelease(id: number | null) {
  return useQuery({
    queryKey: ['discogs', 'release', id],
    queryFn: () => getRelease(id!),
    enabled: id !== null,
    staleTime: 60 * 60 * 1000,
  })
}

export function useDebouncedSearch() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  const setSearch = useCallback((q: string) => {
    setQuery(q)
    if (timer) clearTimeout(timer)
    const t = setTimeout(() => setDebouncedQuery(q), 400)
    setTimer(t)
  }, [timer])

  const results = useDiscogsSearch(debouncedQuery)

  return { query, setSearch, debouncedQuery, ...results }
}
