import { motion } from 'framer-motion'
import { Check, Disc3, Loader2 } from 'lucide-react'
import type { DiscogsSearchResult } from '@/lib/discogs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface SearchResultsProps {
  results: DiscogsSearchResult[]
  loading?: boolean
  onSelect: (result: DiscogsSearchResult) => void
  selectedId?: number | null
}

export function SearchResults({ results, loading, onSelect, selectedId }: SearchResultsProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-[#C9A84C]" />
        <span className="ml-2 text-[#9A9080]">Buscando na Discogs...</span>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-[#5A5248]">
        <Disc3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p>Nenhum resultado encontrado.</p>
        <p className="text-xs mt-1">Tente outro título ou artista.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
      {results.map((result, i) => {
        const isSelected = selectedId === result.id
        const titleParts = result.title.split(' - ')
        const artist = titleParts[0]
        const title = titleParts.slice(1).join(' - ') || result.title

        return (
          <motion.div
            key={result.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
              isSelected
                ? 'border-[#C9A84C]/60 bg-[#C9A84C]/5'
                : 'border-[#2A2A2A] bg-[#1A1A1A] hover:border-[#C9A84C]/30 hover:bg-[#1A1A1A]'
            }`}
            onClick={() => onSelect(result)}
          >
            {/* Cover thumb */}
            <div className="w-14 h-14 rounded-md overflow-hidden bg-[#2A2A2A] flex-shrink-0">
              {result.thumb ? (
                <img src={result.thumb} alt={title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Disc3 className="w-5 h-5 text-[#5A5248]" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#F5F0E8] truncate">{title}</p>
              <p className="text-xs text-[#9A9080] truncate">{artist}</p>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {result.year && (
                  <span className="text-xs font-mono text-[#5A5248]">{result.year}</span>
                )}
                {result.country && (
                  <span className="text-xs text-[#5A5248]">{result.country}</span>
                )}
                {result.genre?.slice(0, 2).map((g) => (
                  <Badge key={g} variant="secondary" className="text-[10px] px-1 py-0">
                    {g}
                  </Badge>
                ))}
              </div>
            </div>

            {isSelected && (
              <div className="w-6 h-6 rounded-full bg-[#C9A84C] flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-[#0A0A0A]" />
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
