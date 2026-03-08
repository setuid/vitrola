import { useRef, useMemo, useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BookOpen, Music, Network, Camera, Disc3, ChevronLeft, ChevronRight, Calendar,
} from 'lucide-react'
import * as d3 from 'd3'
import { useRecords } from '@/hooks/useRecords'
import { useSessions } from '@/hooks/useSessions'
import { useAuth } from '@/hooks/useAuth'
import { useGraph } from '@/hooks/useGraph'
import { formatDuration } from '@/lib/discogs'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AuthModal } from '@/components/auth/AuthModal'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { GraphNode, GraphEdge, RelationType } from '@/lib/graph'
import { RELATION_COLORS } from '@/lib/graph'

const quickLinks = [
  { to: '/scanner', label: 'Adicionar disco', icon: Camera, desc: 'Por foto ou busca' },
  { to: '/shelf', label: 'Minha estante', icon: BookOpen, desc: 'Acervo completo' },
  { to: '/sessions/new', label: 'Nova sessão', icon: Music, desc: 'Plano de escuta' },
  { to: '/graph', label: 'Vitrola Graph', icon: Network, desc: 'Relações entre discos' },
]

/* ── Mini Graph (simplified, non-interactive) ── */
function MiniGraph({ width, height }: { width: number; height: number }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const { graphData } = useGraph()

  const draw = useCallback(() => {
    if (!svgRef.current || graphData.nodes.length === 0) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const g = svg.append('g')
    const R = 16

    const sim = d3
      .forceSimulation<GraphNode>(graphData.nodes as GraphNode[])
      .force(
        'link',
        d3.forceLink<GraphNode, GraphEdge>(graphData.edges as GraphEdge[])
          .id((d) => d.id)
          .distance(60)
          .strength(0.3)
      )
      .force('charge', d3.forceManyBody().strength(-60))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide(R + 4))

    const link = g
      .selectAll('line')
      .data(graphData.edges as GraphEdge[])
      .enter()
      .append('line')
      .attr('stroke', (d) => {
        const r = d.reasons[0] as RelationType | undefined
        return r ? RELATION_COLORS[r] : '#2A2A2A'
      })
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 0.3)

    const defs = svg.append('defs')
    graphData.nodes.forEach((n: GraphNode) => {
      defs.append('clipPath').attr('id', `mc-${n.id}`).append('circle').attr('r', R - 1)
    })

    const node = g
      .selectAll('g.node')
      .data(graphData.nodes as GraphNode[])
      .enter()
      .append('g')

    node.append('circle').attr('r', R).attr('fill', '#1A1A1A').attr('stroke', '#2A2A2A').attr('stroke-width', 1)
    node
      .append('image')
      .attr('href', (d) => d.record.cover_image_url || '')
      .attr('width', (R - 1) * 2)
      .attr('height', (R - 1) * 2)
      .attr('x', -(R - 1))
      .attr('y', -(R - 1))
      .attr('clip-path', (d) => `url(#mc-${d.id})`)
      .attr('preserveAspectRatio', 'xMidYMid slice')

    sim.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as GraphNode).x ?? 0)
        .attr('y1', (d) => (d.source as GraphNode).y ?? 0)
        .attr('x2', (d) => (d.target as GraphNode).x ?? 0)
        .attr('y2', (d) => (d.target as GraphNode).y ?? 0)
      node.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`)
    })

    return () => sim.stop()
  }, [graphData, width, height])

  useEffect(() => {
    const cleanup = draw()
    return () => { cleanup?.() }
  }, [draw])

  if (graphData.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[#5A5248]">
        <div className="text-center">
          <Network className="w-8 h-8 mx-auto mb-2 opacity-20" />
          <p className="text-xs">Adicione discos para ver o grafo</p>
        </div>
      </div>
    )
  }

  return <svg ref={svgRef} width={width} height={height} style={{ background: '#0A0A0A' }} />
}

/* ── Horizontal scroll carousel helper ── */
function Carousel({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 220, behavior: 'smooth' })
  }
  return (
    <div className="relative group/carousel">
      <button
        onClick={() => scroll(-1)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-[#0A0A0A]/80 border border-[#2A2A2A] flex items-center justify-center text-[#9A9080] opacity-0 group-hover/carousel:opacity-100 transition-opacity"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>
      <button
        onClick={() => scroll(1)}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-[#0A0A0A]/80 border border-[#2A2A2A] flex items-center justify-center text-[#9A9080] opacity-0 group-hover/carousel:opacity-100 transition-opacity"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

/* ── Home Page ── */
export function Home() {
  const { data: records = [] } = useRecords()
  const { data: sessions = [] } = useSessions()
  const { user } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const graphContainerRef = useRef<HTMLDivElement>(null)
  const [graphDims, setGraphDims] = useState({ width: 400, height: 260 })

  useEffect(() => {
    const update = () => {
      if (graphContainerRef.current) {
        setGraphDims({
          width: graphContainerRef.current.offsetWidth,
          height: graphContainerRef.current.offsetHeight,
        })
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const totalDuration = records.reduce((acc, r) => acc + (r.total_duration_seconds || 0), 0)

  const genres = records.flatMap((r) => r.genres || [])
  const genreCounts: Record<string, number> = {}
  genres.forEach((g) => { genreCounts[g] = (genreCounts[g] || 0) + 1 })
  const topGenres = Object.entries(genreCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  const shuffledRecords = useMemo(
    () => [...records].sort(() => Math.random() - 0.5),
    [records]
  )

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center mx-auto mb-6">
            <Disc3 className="w-10 h-10 text-[#C9A84C] animate-spin-slow" />
          </div>
          <h1 className="font-display text-4xl font-bold mb-3 text-gradient-gold">Vitrola</h1>
          <p className="text-[#9A9080] text-lg mb-2">Seus discos. Suas histórias. Seu som.</p>
          <p className="text-[#5A5248] text-sm mb-8">
            Gerencie sua coleção de vinil com elegância — em qualquer dispositivo.
          </p>
          <Button size="lg" className="px-8" onClick={() => setShowAuth(true)}>
            Começar agora
          </Button>
        </motion.div>

        <Dialog open={showAuth} onOpenChange={setShowAuth}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Entrar na Vitrola</DialogTitle>
            </DialogHeader>
            <AuthModal onSuccess={() => setShowAuth(false)} />
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* 1. Mini Graph Card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/graph">
          <Card className="overflow-hidden card-hover cursor-pointer">
            <div className="flex items-center justify-between px-4 pt-3 pb-1">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-[#C9A84C]" />
                <span className="text-xs font-semibold text-[#9A9080] uppercase tracking-wider">
                  Vitrola Graph
                </span>
              </div>
              <span className="text-xs text-[#5A5248]">Ver completo →</span>
            </div>
            <div ref={graphContainerRef} className="w-full h-[260px]">
              <MiniGraph width={graphDims.width} height={graphDims.height} />
            </div>
          </Card>
        </Link>
      </motion.div>

      {/* 2. Shelf Carousel (random order) */}
      {shuffledRecords.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-[#5A5248] uppercase tracking-wider">Minha Estante</p>
            <Link to="/shelf" className="text-xs text-[#C9A84C] hover:underline">Ver tudo →</Link>
          </div>
          <Carousel>
            {shuffledRecords.map((r) => (
              <Link key={r.id} to={`/shelf/${r.id}`} className="snap-start shrink-0">
                <div className="w-[140px]">
                  <div className="aspect-square rounded-lg overflow-hidden bg-[#1A1A1A] border border-[#2A2A2A] hover:border-[#C9A84C]/40 transition-colors">
                    {r.cover_image_url ? (
                      <img src={r.cover_image_url} alt={r.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center vinyl-ring">
                        <Disc3 className="w-8 h-8 text-[#5A5248]" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-medium text-[#F5F0E8] truncate mt-1.5">{r.title}</p>
                  <p className="text-[10px] text-[#9A9080] truncate">{r.artist}</p>
                </div>
              </Link>
            ))}
          </Carousel>
        </motion.div>
      )}

      {/* 3. Sessions Carousel */}
      {sessions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-[#5A5248] uppercase tracking-wider">Últimas Sessões</p>
            <Link to="/sessions" className="text-xs text-[#C9A84C] hover:underline">Ver todas →</Link>
          </div>
          <Carousel>
            {sessions.map((s) => (
              <Link key={s.id} to={`/sessions/${s.id}`} className="snap-start shrink-0">
                <Card className="w-[200px] p-3 card-hover cursor-pointer h-full">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-8 h-8 rounded-md bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center shrink-0">
                      <Music className="w-4 h-4 text-[#C9A84C]" />
                    </div>
                    <p className="text-sm font-medium text-[#F5F0E8] truncate">{s.name}</p>
                  </div>
                  {s.occasion && <Badge variant="secondary" className="text-[10px] mb-1">{s.occasion}</Badge>}
                  <p className="text-[10px] text-[#5A5248] flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(s.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </Card>
              </Link>
            ))}
          </Carousel>
        </motion.div>
      )}

      {/* 4. Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <p className="text-xs text-[#5A5248] uppercase tracking-wider mb-3">Analytics</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Disc3 className="w-4 h-4 text-[#C9A84C]" />
              <span className="text-xs text-[#5A5248]">Total de discos</span>
            </div>
            <p className="font-mono text-lg font-semibold text-[#F5F0E8]">{records.length}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Music className="w-4 h-4 text-[#C9A84C]" />
              <span className="text-xs text-[#5A5248]">Horas de música</span>
            </div>
            <p className="font-mono text-lg font-semibold text-[#F5F0E8] truncate">
              {totalDuration > 0 ? formatDuration(totalDuration) : '—'}
            </p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-[#5A5248]">Top gêneros</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {topGenres.length > 0 ? topGenres.slice(0, 3).map(([g, c]) => (
                <span key={g} className="text-[10px] bg-[#2A2A2A] text-[#F5F0E8] rounded-full px-2 py-0.5">
                  {g} <span className="text-[#C9A84C]">{c}</span>
                </span>
              )) : <span className="text-xs text-[#5A5248]">—</span>}
            </div>
          </Card>
        </div>
      </motion.div>

      {/* 5. Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-xs text-[#5A5248] uppercase tracking-wider mb-3">Ações rápidas</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickLinks.map(({ to, label, icon: Icon, desc }) => (
            <Link key={to} to={to}>
              <Card className="p-4 card-hover cursor-pointer h-full">
                <Icon className="w-6 h-6 text-[#C9A84C] mb-2" />
                <p className="text-sm font-medium text-[#F5F0E8]">{label}</p>
                <p className="text-xs text-[#5A5248] mt-0.5">{desc}</p>
              </Card>
            </Link>
          ))}
        </div>
      </motion.div>

      {records.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center py-12"
        >
          <Disc3 className="w-16 h-16 text-[#2A2A2A] mx-auto mb-4" />
          <p className="text-[#5A5248]">Sua coleção está vazia.</p>
          <Link to="/scanner">
            <Button className="mt-4">
              <Camera className="w-4 h-4 mr-2" /> Adicionar primeiro disco
            </Button>
          </Link>
        </motion.div>
      )}
    </div>
  )
}
