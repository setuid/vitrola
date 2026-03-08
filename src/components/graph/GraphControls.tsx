import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { RelationType } from '@/lib/graph'
import { RELATION_COLORS, RELATION_LABELS } from '@/lib/graph'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

interface GraphControlsProps {
  activeRelations: RelationType[]
  onToggle: (rel: RelationType) => void
  minScore: number
  onMinScoreChange: (v: number) => void
  highlightFavorites: boolean
  onHighlightFavorites: (v: boolean) => void
  highlightUnplayed: boolean
  onHighlightUnplayed: (v: boolean) => void
  nodeCount: number
  edgeCount: number
}

const ALL_RELATIONS: RelationType[] = ['artist', 'genre', 'style', 'era', 'label', 'favorites']

export function GraphControls({
  activeRelations,
  onToggle,
  minScore,
  onMinScoreChange,
  highlightFavorites,
  onHighlightFavorites,
  highlightUnplayed,
  onHighlightUnplayed,
  nodeCount,
  edgeCount,
}: GraphControlsProps) {
  const [relationsOpen, setRelationsOpen] = useState(true)

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass border border-[#2A2A2A] rounded-xl p-3 sm:p-4 space-y-3 sm:space-y-4 w-48 sm:w-56"
    >
      <div>
        <button
          onClick={() => setRelationsOpen(!relationsOpen)}
          className="flex items-center justify-between w-full text-xs font-semibold text-[#9A9080] uppercase tracking-wider mb-2"
        >
          <span>Tipos de relação</span>
          {relationsOpen ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
        <AnimatePresence initial={false}>
          {relationsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-1.5">
                {ALL_RELATIONS.map((rel) => {
                  const active = activeRelations.includes(rel)
                  return (
                    <button
                      key={rel}
                      onClick={() => onToggle(rel)}
                      className={cn(
                        'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm transition-colors',
                        active ? 'text-[#F5F0E8]' : 'text-[#5A5248]'
                      )}
                    >
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0 transition-opacity"
                        style={{
                          backgroundColor: RELATION_COLORS[rel],
                          opacity: active ? 1 : 0.3,
                        }}
                      />
                      {RELATION_LABELS[rel]}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div>
        <p className="text-xs font-semibold text-[#9A9080] uppercase tracking-wider mb-2">
          Score mínimo: <span className="text-[#C9A84C] font-mono">{minScore}</span>
        </p>
        <Slider
          value={[minScore]}
          min={10}
          max={80}
          step={5}
          onValueChange={([v]) => onMinScoreChange(v)}
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-[#9A9080] uppercase tracking-wider">
          Destaque
        </p>
        <button
          onClick={() => onHighlightFavorites(!highlightFavorites)}
          className={cn(
            'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm transition-colors',
            highlightFavorites ? 'text-[#C9A84C] bg-[#C9A84C]/10' : 'text-[#5A5248] hover:text-[#9A9080]'
          )}
        >
          <span className="w-3 h-3 rounded-full bg-[#C94C4C]" />
          Favoritos
        </button>
        <button
          onClick={() => onHighlightUnplayed(!highlightUnplayed)}
          className={cn(
            'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm transition-colors',
            highlightUnplayed ? 'text-[#C9A84C] bg-[#C9A84C]/10' : 'text-[#5A5248] hover:text-[#9A9080]'
          )}
        >
          <span className="w-3 h-3 rounded-full bg-[#4C8BC9]" />
          Nunca ouvidos
        </button>
      </div>

      <div className="pt-2 border-t border-[#2A2A2A] text-xs text-[#5A5248] font-mono">
        <p>{nodeCount} discos · {edgeCount} conexões</p>
      </div>
    </motion.div>
  )
}
