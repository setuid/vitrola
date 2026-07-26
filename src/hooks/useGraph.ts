import { useMemo, useState } from 'react'
import { useRecords } from './useRecords'
import { buildGraphData, filterGraphByRelations, type RelationType } from '@/lib/graph'
import { useGraphFilters } from './useGraphFilters'

// Re-exported so existing consumers (e.g. GraphFilters) can keep importing
// these types from '@/hooks/useGraph'.
export type { FilterCategory, GraphFilterState } from './useGraphFilters'

const ALL_RELATIONS: RelationType[] = ['artist', 'genre', 'style', 'era', 'label', 'favorites']

export function useGraph() {
  const { data: records = [] } = useRecords()
  const [activeRelations, setActiveRelations] = useState<RelationType[]>(ALL_RELATIONS)
  const [minScore, setMinScore] = useState(45)
  const [highlightFavorites, setHighlightFavorites] = useState(false)
  const [highlightUnplayed, setHighlightUnplayed] = useState(false)

  const {
    filters,
    filterOptions,
    filteredRecords,
    toggleFilter,
    setFavoritesOnly,
    clearFilters,
    activeFilterCount,
  } = useGraphFilters(records)

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
