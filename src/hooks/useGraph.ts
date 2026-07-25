import { useMemo, useState } from 'react'
import { useRecords } from './useRecords'
import { buildGraphData, filterGraphByRelations, type RelationType } from '@/lib/graph'

const ALL_RELATIONS: RelationType[] = ['artist', 'genre', 'style', 'era', 'label', 'favorites']

export type FilterCategory = 'genres' | 'styles' | 'decades' | 'countries'

export interface GraphFilterState {
  genres: string[]
  styles: string[]
  decades: number[]
  countries: string[]
  favoritesOnly: boolean
}

const EMPTY_FILTERS: GraphFilterState = {
  genres: [],
  styles: [],
  decades: [],
  countries: [],
  favoritesOnly: false,
}

export function useGraph() {
  const { data: records = [] } = useRecords()
  const [activeRelations, setActiveRelations] = useState<RelationType[]>(ALL_RELATIONS)
  const [minScore, setMinScore] = useState(45)
  const [highlightFavorites, setHighlightFavorites] = useState(false)
  const [highlightUnplayed, setHighlightUnplayed] = useState(false)
  const [filters, setFilters] = useState<GraphFilterState>(EMPTY_FILTERS)

  // Derive available filter options from the whole collection.
  const filterOptions = useMemo(() => {
    const genres = new Set<string>()
    const styles = new Set<string>()
    const decades = new Set<number>()
    const countries = new Set<string>()
    records.forEach((r) => {
      r.genres?.forEach((g) => g && genres.add(g))
      r.styles?.forEach((s) => s && styles.add(s))
      if (r.year) decades.add(Math.floor(r.year / 10) * 10)
      if (r.country) countries.add(r.country)
    })
    return {
      genres: [...genres].sort((a, b) => a.localeCompare(b)),
      styles: [...styles].sort((a, b) => a.localeCompare(b)),
      decades: [...decades].sort((a, b) => a - b),
      countries: [...countries].sort((a, b) => a.localeCompare(b)),
    }
  }, [records])

  // Apply the filters to the record set (AND across categories, OR within a category).
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (filters.genres.length && !r.genres?.some((g) => filters.genres.includes(g))) {
        return false
      }
      if (filters.styles.length && !r.styles?.some((s) => filters.styles.includes(s))) {
        return false
      }
      if (filters.decades.length) {
        const decade = r.year ? Math.floor(r.year / 10) * 10 : null
        if (decade === null || !filters.decades.includes(decade)) return false
      }
      if (filters.countries.length && (!r.country || !filters.countries.includes(r.country))) {
        return false
      }
      if (filters.favoritesOnly && !(r.rating && r.rating >= 4)) {
        return false
      }
      return true
    })
  }, [records, filters])

  const fullGraph = useMemo(() => buildGraphData(filteredRecords), [filteredRecords])

  const filteredGraph = useMemo(() => {
    const base = filterGraphByRelations(fullGraph, activeRelations)
    // Apply min score filter
    return {
      ...base,
      edges: base.edges.filter((e) => e.score >= minScore),
    }
  }, [fullGraph, activeRelations, minScore])

  const toggleRelation = (rel: RelationType) => {
    setActiveRelations((prev) =>
      prev.includes(rel) ? prev.filter((r) => r !== rel) : [...prev, rel]
    )
  }

  const toggleFilter = (category: FilterCategory, value: string | number) => {
    setFilters((prev) => {
      const current = prev[category] as (string | number)[]
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
      return { ...prev, [category]: next }
    })
  }

  const setFavoritesOnly = (v: boolean) =>
    setFilters((prev) => ({ ...prev, favoritesOnly: v }))

  const clearFilters = () => setFilters(EMPTY_FILTERS)

  const activeFilterCount =
    filters.genres.length +
    filters.styles.length +
    filters.decades.length +
    filters.countries.length +
    (filters.favoritesOnly ? 1 : 0)

  return {
    graphData: filteredGraph,
    activeRelations,
    toggleRelation,
    minScore,
    setMinScore,
    highlightFavorites,
    setHighlightFavorites,
    highlightUnplayed,
    setHighlightUnplayed,
    totalRecords: records.length,
    filteredCount: filteredRecords.length,
    // Filters
    filters,
    filterOptions,
    toggleFilter,
    setFavoritesOnly,
    clearFilters,
    activeFilterCount,
  }
}
