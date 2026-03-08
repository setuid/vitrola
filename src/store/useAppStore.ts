import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ViewMode = 'grid' | 'list' | 'artist' | 'genre'
type SortBy = 'title' | 'artist' | 'year' | 'play_count' | 'rating' | 'created_at'
type SortOrder = 'asc' | 'desc'

interface AppState {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void

  searchQuery: string
  setSearchQuery: (q: string) => void

  selectedGenres: string[]
  setSelectedGenres: (genres: string[]) => void

  sortBy: SortBy
  setSortBy: (sort: SortBy) => void

  sortOrder: SortOrder
  setSortOrder: (order: SortOrder) => void

  showFavoritesOnly: boolean
  setShowFavoritesOnly: (v: boolean) => void

  yearRange: [number, number]
  setYearRange: (range: [number, number]) => void

  selectedConditions: string[]
  setSelectedConditions: (conds: string[]) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      viewMode: 'grid',
      setViewMode: (viewMode) => set({ viewMode }),

      searchQuery: '',
      setSearchQuery: (searchQuery) => set({ searchQuery }),

      selectedGenres: [],
      setSelectedGenres: (selectedGenres) => set({ selectedGenres }),

      sortBy: 'created_at',
      setSortBy: (sortBy) => set({ sortBy }),

      sortOrder: 'desc',
      setSortOrder: (sortOrder) => set({ sortOrder }),

      showFavoritesOnly: false,
      setShowFavoritesOnly: (showFavoritesOnly) => set({ showFavoritesOnly }),

      yearRange: [1950, new Date().getFullYear()],
      setYearRange: (yearRange) => set({ yearRange }),

      selectedConditions: [],
      setSelectedConditions: (selectedConditions) => set({ selectedConditions }),
    }),
    { name: 'vitrola-store' }
  )
)
