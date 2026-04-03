import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Network, ChevronDown } from 'lucide-react'
import { buildGraphData, RELATION_COLORS, RELATION_LABELS, type GraphRecord, type GraphNode } from '@/lib/graph'
import { VitrolaGraph } from '@/components/graph/VitrolaGraph'

interface SessionGraphProps {
  records: GraphRecord[]
  onNodeClick?: (node: GraphNode) => void
}

export function SessionGraph({ records, onNodeClick }: SessionGraphProps) {
  const [open, setOpen] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(600)

  const graphData = useMemo(() => buildGraphData(records, 15), [records])

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.offsetWidth)
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  if (records.length < 2) return null

  // Collect which relation types are actually present
  const activeRelations = useMemo(() => {
    const types = new Set<string>()
    graphData.edges.forEach((e) => e.reasons.forEach((r) => types.add(r)))
    return types
  }, [graphData])

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
            <div ref={containerRef} className="rounded-xl border border-[#2A2A2A] overflow-hidden">
              {graphData.edges.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-[#5A5248]">
                  <Network className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-sm">Estes discos não possuem conexões fortes o suficiente.</p>
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
