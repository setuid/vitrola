import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Network, ChevronDown } from 'lucide-react'
import {
  buildGraphData, calculateSimilarityScore, RELATION_COLORS, RELATION_LABELS,
  type GraphRecord,
} from '@/lib/graph'
import { VitrolaGraph } from '@/components/graph/VitrolaGraph'
import { GraphControls } from '@/components/graph/GraphControls'

interface RecordGraphProps {
  record: GraphRecord
  allRecords: GraphRecord[]
}

// Base build threshold; the intensity presets filter on top of this.
const BASE = 10

const PRESETS = [
  { value: 15, label: 'Amplo', desc: 'Mais discos' },
  { value: 25, label: 'Relacionados', desc: 'Bem ligados' },
  { value: 40, label: 'Próximos', desc: 'Muito parecidos' },
] as const

export function RecordGraph({ record, allRecords }: RecordGraphProps) {
  const [open, setOpen] = useState(true)
  const [minScore, setMinScore] = useState(25)
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(600)

  const graphData = useMemo(() => {
    // Neighbours: records connected to the focus record at >= minScore.
    const neighbors = allRecords.filter(
      (r) => r.id !== record.id && calculateSimilarityScore(record, r).score >= minScore
    )
    const subset = [record, ...neighbors]
    const full = buildGraphData(subset, BASE)
    const edges = full.edges.filter((e) => e.score >= minScore)
    // Keep the focus plus any node that has a surviving edge.
    const connected = new Set<string>([record.id])
    edges.forEach((e) => {
      connected.add(typeof e.source === 'string' ? e.source : e.source.id)
      connected.add(typeof e.target === 'string' ? e.target : e.target.id)
    })
    return {
      nodes: full.nodes.filter((n) => connected.has(n.id)),
      edges,
    }
  }, [record, allRecords, minScore])

  const neighborCount = Math.max(0, graphData.nodes.length - 1)

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

  const height = window.innerWidth < 640 ? 300 : 380

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mt-10"
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full group mb-2"
      >
        <Network className="w-5 h-5 text-[#C9A84C]" />
        <span className="font-display text-xl font-semibold text-[#F5F0E8]">
          Conexões
        </span>
        <span className="text-xs text-[#5A5248]">
          {neighborCount} disco{neighborCount !== 1 ? 's' : ''} relacionado{neighborCount !== 1 ? 's' : ''}
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
              className="relative rounded-xl border border-[#2A2A2A] overflow-hidden min-h-[300px]"
            >
              {/* Intensity control overlay */}
              <div className="absolute top-2 right-2 z-10 max-h-[calc(100%-1rem)] overflow-y-auto">
                <GraphControls
                  minScore={minScore}
                  onMinScoreChange={setMinScore}
                  nodeCount={graphData.nodes.length}
                  edgeCount={graphData.edges.length}
                  presets={PRESETS}
                />
              </div>

              {neighborCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-[#5A5248]">
                  <Network className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-sm">
                    Nenhum disco relacionado nesta intensidade. Experimente "Amplo".
                  </p>
                </div>
              ) : (
                <>
                  <VitrolaGraph
                    data={graphData}
                    width={width}
                    height={height}
                    focusId={record.id}
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
            <p className="text-[11px] text-[#5A5248] mt-2 px-1">
              Clique em um disco para centralizar o grafo nele.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
