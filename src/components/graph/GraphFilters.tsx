import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, SlidersHorizontal, X, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FilterCategory, GraphFilterState } from '@/hooks/useGraph'

interface FilterOptions {
  genres: string[]
  styles: string[]
  decades: number[]
  countries: string[]
}

interface GraphFiltersProps {
  options: FilterOptions
  filters: GraphFilterState
  activeFilterCount: number
  onToggle: (category: FilterCategory, value: string | number) => void
  onFavoritesOnly: (v: boolean) => void
  onClear: () => void
}

interface SectionProps {
  title: string
  values: (string | number)[]
  active: (string | number)[]
  onToggle: (v: string | number) => void
  format?: (v: string | number) => string
}

function FilterSection({ title, values, active, onToggle, format }: SectionProps) {
  const [open, setOpen] = useState(false)
  if (values.length === 0) return null
  const selectedHere = active.length

  return (
    <div className="border-t border-[#2A2A2A] pt-2.5 mt-2.5 first:border-t-0 first:pt-0 first:mt-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-[11px] font-semibold text-[#9A9080] uppercase tracking-wider"
      >
        <span className="flex items-center gap-1.5">
          {title}
          {selectedHere > 0 && (
            <span className="text-[9px] bg-[#C9A84C]/20 text-[#C9A84C] rounded-full px-1.5 py-0.5 font-mono normal-case">
              {selectedHere}
            </span>
          )}
        </span>
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-1.5 pt-2 max-h-40 overflow-y-auto pr-0.5">
              {values.map((v) => {
                const on = active.includes(v)
                return (
                  <button
                    key={String(v)}
                    onClick={() => onToggle(v)}
                    className={cn(
                      'text-[11px] rounded-full px-2 py-0.5 border transition-colors',
                      on
                        ? 'bg-[#C9A84C]/15 text-[#C9A84C] border-[#C9A84C]/40'
                        : 'text-[#9A9080] border-[#2A2A2A] hover:text-[#F5F0E8] hover:border-[#3A3A3A]'
                    )}
                  >
                    {format ? format(v) : String(v)}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function GraphFilters({
  options,
  filters,
  activeFilterCount,
  onToggle,
  onFavoritesOnly,
  onClear,
}: GraphFiltersProps) {
  const [open, setOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass border border-[#2A2A2A] rounded-xl p-3 sm:p-4 w-44 sm:w-48"
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-xs font-semibold text-[#9A9080] uppercase tracking-wider"
      >
        <span className="flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filtros
        </span>
        <div className="flex items-center gap-1.5">
          {activeFilterCount > 0 && (
            <span className="text-[#C9A84C] normal-case font-mono text-[10px] bg-[#C9A84C]/15 rounded-full px-1.5 py-0.5">
              {activeFilterCount}
            </span>
          )}
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3">
              <FilterSection
                title="Gênero"
                values={options.genres}
                active={filters.genres}
                onToggle={(v) => onToggle('genres', v)}
              />
              <FilterSection
                title="Estilo"
                values={options.styles}
                active={filters.styles}
                onToggle={(v) => onToggle('styles', v)}
              />
              <FilterSection
                title="Década"
                values={options.decades}
                active={filters.decades}
                onToggle={(v) => onToggle('decades', v)}
                format={(v) => `${v}s`}
              />
              <FilterSection
                title="País"
                values={options.countries}
                active={filters.countries}
                onToggle={(v) => onToggle('countries', v)}
              />

              {/* Favorites toggle */}
              <div className="border-t border-[#2A2A2A] pt-2.5 mt-2.5">
                <button
                  onClick={() => onFavoritesOnly(!filters.favoritesOnly)}
                  className={cn(
                    'flex items-center gap-1.5 w-full px-2 py-1.5 rounded-lg text-[11px] transition-colors border',
                    filters.favoritesOnly
                      ? 'bg-[#C9A84C]/15 text-[#C9A84C] border-[#C9A84C]/40'
                      : 'text-[#9A9080] border-[#2A2A2A] hover:text-[#F5F0E8]'
                  )}
                >
                  <Star className={cn('w-3 h-3', filters.favoritesOnly && 'fill-[#C9A84C]')} />
                  Só favoritos
                </button>
              </div>

              {activeFilterCount > 0 && (
                <button
                  onClick={onClear}
                  className="flex items-center justify-center gap-1 w-full mt-3 px-2 py-1.5 rounded-lg text-[11px] text-[#C94C4C] border border-[#C94C4C]/30 hover:bg-[#C94C4C]/10 transition-colors"
                >
                  <X className="w-3 h-3" /> Limpar filtros
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
