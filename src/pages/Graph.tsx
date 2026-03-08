import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Network, Loader2 } from 'lucide-react'
import { useGraph } from '@/hooks/useGraph'
import { useRecords } from '@/hooks/useRecords'
import { VitrolaGraph } from '@/components/graph/VitrolaGraph'
import { GraphControls } from '@/components/graph/GraphControls'

export function Graph() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const { data: records = [], isLoading } = useRecords()

  const {
    graphData,
    activeRelations,
    toggleRelation,
    minScore,
    setMinScore,
    highlightFavorites,
    setHighlightFavorites,
    highlightUnplayed,
    setHighlightUnplayed,
  } = useGraph()

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        })
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[#C9A84C]" />
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100dvh-3.5rem)] text-[#5A5248]">
        <Network className="w-12 h-12 mb-4 opacity-30" />
        <p>Adicione discos para ver o grafo.</p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-[calc(100dvh-3.5rem)] overflow-hidden">
      {/* Header overlay */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10"
      >
        <h1 className="font-display text-lg sm:text-xl font-bold text-[#F5F0E8]">Vitrola Graph</h1>
        <p className="text-[10px] sm:text-xs text-[#9A9080]">Relações entre os seus discos</p>
      </motion.div>

      {/* Controls overlay */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 max-h-[calc(100dvh-6rem)] overflow-y-auto">
        <GraphControls
          activeRelations={activeRelations}
          onToggle={toggleRelation}
          minScore={minScore}
          onMinScoreChange={setMinScore}
          highlightFavorites={highlightFavorites}
          onHighlightFavorites={setHighlightFavorites}
          highlightUnplayed={highlightUnplayed}
          onHighlightUnplayed={setHighlightUnplayed}
          nodeCount={graphData.nodes.length}
          edgeCount={graphData.edges.length}
        />
      </div>

      {/* Graph canvas */}
      <div ref={containerRef} className="w-full h-full">
        <VitrolaGraph
          data={graphData}
          highlightFavorites={highlightFavorites}
          highlightUnplayed={highlightUnplayed}
          width={dimensions.width}
          height={dimensions.height}
        />
      </div>

      {graphData.nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-[#5A5248] pointer-events-none">
          <div className="text-center">
            <Network className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Nenhuma conexão encontrada com os filtros atuais.</p>
            <p className="text-xs mt-1">Reduza o score mínimo ou ative mais tipos de relação.</p>
          </div>
        </div>
      )}
    </div>
  )
}
