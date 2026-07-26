import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Network, ChevronDown } from 'lucide-react'
import {
  buildGraphData, RELATION_COLORS, RELATION_LABELS,
  type GraphRecord, type GraphNode,
} from '@/lib/graph'
import { VitrolaGraph } from '@/components/graph/VitrolaGraph'
import { GraphControls } from '@/components/graph/GraphControls'
import { GraphFilters } from '@/components/graph/GraphFilters'
import { useGraphFilters } from '@/hooks/useGraphFilters'

interface SessionGraphProps {
  records: GraphRecord[]
  onNodeClick?: (node: GraphNode) => void
}

// Lower base threshold than the full graph (10 vs 25) so weaker
// connections inside a small session become visible.
const SESSION_BASE = 10

const SESSION_PRESETS = [
  { value: 10, label: 'Tudo', desc: 'Todas conexões' },
  { value: 20, label: 'Médio', desc: 'Conexões médias' },
  { value: 30, label: 'Fortes', desc: 'Só as fortes' },
] as const

export function SessionGraph({ records, onNodeClick }: SessionGraphProps) {
  const [open, setOpen] = useState(true)
  const [minScore, setMinScore] = useState(SESSION_BASE)
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(600)

  const {
    filters,
    filterOptions,
    filteredRecords,
    toggleFilter,
    setFavoritesOnly,
    clearFilters,
    activeFilterCount,
  } = useGraphFilters(records)

  // Build edges above the base threshold, then apply the intensity filter.
  const graphData = useMemo(() => {
    const full = buildGraphData(filteredRecords, SESSION_BASE)
    const edges = full.edges.filter((e) => e.score >= minScore)
    // Drop isolated nodes so the canvas stays readable.
    const connected = new Set<string>()
    edges.forEach((e) => {
      connected.add(typeof e.source === 'string' ? e.source : e.source.id)
      connected.add(typeof e.target === 'string' ? e.target : e.target.id)
    })
    return {
      nodes: full.nodes.filter((n) => connected.has(n.id)),
      edges,
    }
  }, [filteredRecords, minScore])

  const activeRelations = useMemo(() => {
    const types = new Set<string>()
    graphData.edges.forEach((e) => e.reasons.forEach((r) => types.add(r)))
    return types
  }, [graphData])

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.offsetWidth)
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [open])

  if (records.length < 2) return null

  const height = window.innerWidth < 640 ? 280 : 350

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full group mb-2"
      >
        <Network className="w-5 h-5 text-[#C9A84C]" />
        <span className="font-display text-lg font-semibold text-[#F5F0E8]">
          Conexões
        </span>
        <span className="text-xs text-[#5A5248]">
          {graphData.edges.length} relação{graphData.edges.length !== 1 ? 'ões' : ''}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[#5A5248] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              ref={containerRef}
              className="relative rounded-xl border border-[#2A2A2A] overflow-hidden min-h-[280px]"
            >
              {/* Controls + filters overlay */}
              <div className="absolute top-2 right-2 z-10 flex flex-col gap-2 max-h-[calc(100%-1rem)] overflow-y-auto">
                <GraphControls
                  minScore={minScore}
                  onMinScoreChange={setMinScore}
                  nodeCount={graphData.nodes.length}
                  edgeCount={graphData.edges.length}
                  presets={SESSION_PRESETS}
                />
                <GraphFilters
                  options={filterOptions}
                  filters={filters}
                  activeFilterCount={activeFilterCount}
                  onToggle={toggleFilter}
                  onFavoritesOnly={setFavoritesOnly}
                  onClear={clearFilters}
                />
              </div>

              {graphData.edges.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-[#5A5248]">
                  <Network className="w-10 h-10 mb-3 opacity-20" />
                  {activeFilterCount > 0 ? (
                    <p className="text-sm">
                      Nenhuma conexão com os filtros atuais. Tente limpar os filtros
                      ou baixar a intensidade.
                    </p>
                  ) : (
                    <p className="text-sm">
                      Estes discos não têm conexões nesta intensidade. Experimente "Tudo".
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <VitrolaGraph
                    data={graphData}
                    width={width}
                    height={height}
                    onNodeClick={onNodeClick}
                  />
                  {/* Legend */}
                  <div className="flex flex-wrap gap-3 px-4 py-3 border-t border-[#2A2A2A] bg-[#0A0A0A]">
                    {Object.entries(RELATION_COLORS)
                      .filter(([key]) => activeRelations.has(key))
                      .map(([key, color]) => (
                        <div key={key} className="flex items-center gap-1.5">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-[10px] text-[#9A9080]">
                            {RELATION_LABELS[key as keyof typeof RELATION_LABELS]}
                          </span>
                        </div>
                      ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
