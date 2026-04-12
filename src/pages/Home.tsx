import { useRef, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BookOpen, Music, Network, Camera, Disc3, ChevronLeft, ChevronRight, Calendar, Clock, Tag, Loader2,
  DollarSign, RefreshCw, X,
} from 'lucide-react'
import { useRecords } from '@/hooks/useRecords'
import { useSessions } from '@/hooks/useSessions'
import { useAuth } from '@/hooks/useAuth'
import { useCollectionValue } from '@/hooks/useMarketplaceStats'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { formatDuration } from '@/lib/discogs'
import { formatPrice } from '@/lib/currency'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const quickLinks = [
  { to: '/scanner', label: 'Adicionar disco', icon: Camera, desc: 'Por foto ou busca' },
  { to: '/shelf', label: 'Minha estante', icon: BookOpen, desc: 'Acervo completo' },
  { to: '/sessions/new', label: 'Nova sessão', icon: Music, desc: 'Plano de escuta' },
  { to: '/graph', label: 'Vitrola Graph', icon: Network, desc: 'Relações entre discos' },
]

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
  const { data: records = [], refetch: refetchRecords } = useRecords()
  const { data: sessions = [], refetch: refetchSessions } = useSessions()
  const { user, signInWithGoogle } = useAuth()
  const collectionValue = useCollectionValue(records)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [refreshSeed, setRefreshSeed] = useState(0)

  const { pullDistance, isRefreshing, threshold } = usePullToRefresh({
    enabled: !!user,
    onRefresh: async () => {
      setRefreshSeed((s) => s + 1)
      await Promise.all([refetchRecords(), refetchSessions()])
    },
  })

  const totalDuration = records.reduce((acc, r) => acc + (r.total_duration_seconds || 0), 0)

  const genres = records.flatMap((r) => r.genres || [])
  const genreCounts: Record<string, number> = {}
  genres.forEach((g) => { genreCounts[g] = (genreCounts[g] || 0) + 1 })
  const topGenres = Object.entries(genreCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  const shuffledRecords = useMemo(
    () => [...records].sort(() => Math.random() - 0.5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [records, refreshSeed]
  )

  // Pick a random featured record. Re-randomizes on pull-to-refresh via refreshSeed.
  const featuredRecord = useMemo(() => {
    if (records.length === 0) return null
    // Prefer records with cover images
    const withCovers = records.filter((r) => r.cover_image_url)
    const pool = withCovers.length > 0 ? withCovers : records
    return pool[Math.floor(Math.random() * pool.length)]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records, refreshSeed])

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
    } catch {
      setGoogleLoading(false)
    }
  }

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
          <Button
            size="lg"
            className="px-8"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Entrar com Google
          </Button>
        </motion.div>
      </div>
    )
  }

  const indicatorProgress = Math.min(pullDistance / threshold, 1)
  const contentShift = isRefreshing ? threshold / 2 : pullDistance

  return (
    <>
      {/* Pull-to-refresh indicator (fixed below navbar) */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="fixed left-1/2 z-40 pointer-events-none"
          style={{
            top: `calc(3.5rem + 8px)`,
            transform: `translate(-50%, ${Math.max(0, contentShift - 48)}px)`,
            opacity: isRefreshing ? 1 : indicatorProgress,
            transition: isRefreshing ? 'opacity 0.2s' : 'none',
          }}
        >
          <div className="w-10 h-10 rounded-full bg-[#0A0A0A] border border-[#C9A84C]/40 flex items-center justify-center shadow-lg">
            <Disc3
              className={`w-5 h-5 text-[#C9A84C] ${isRefreshing ? 'animate-spin' : ''}`}
              style={{
                transform: isRefreshing ? undefined : `rotate(${pullDistance * 4}deg)`,
              }}
            />
          </div>
        </div>
      )}

      <div
        className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6"
        style={{
          transform: contentShift > 0 ? `translateY(${contentShift}px)` : undefined,
          transition: pullDistance > 0 ? 'none' : 'transform 0.25s ease-out',
          overscrollBehaviorY: 'contain',
        }}
      >

      {/* 1. Featured Record Showcase */}
      {featuredRecord && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Link to={`/shelf/${featuredRecord.id}`}>
            <Card className="overflow-hidden card-hover cursor-pointer">
              <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <div className="flex items-center gap-2">
                  <Disc3 className="w-4 h-4 text-[#C9A84C]" />
                  <span className="text-xs font-semibold text-[#9A9080] uppercase tracking-wider">
                    Disco em destaque
                  </span>
                </div>
                <span className="text-xs text-[#5A5248]">Ver disco →</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 p-4">
                {/* Cover */}
                <div className="w-full sm:w-48 aspect-square rounded-lg overflow-hidden bg-[#1A1A1A] border border-[#2A2A2A] flex-shrink-0 mx-auto sm:mx-0 max-w-[200px]">
                  {featuredRecord.cover_image_url ? (
                    <img
                      src={featuredRecord.cover_image_url}
                      alt={featuredRecord.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center vinyl-ring">
                      <Disc3 className="w-16 h-16 text-[#5A5248]" />
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-[#F5F0E8] mb-1 truncate">
                    {featuredRecord.title}
                  </h2>
                  <p className="text-sm text-[#C9A84C] mb-3">{featuredRecord.artist}</p>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {featuredRecord.year && (
                      <span className="text-xs text-[#9A9080] flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {featuredRecord.year}
                      </span>
                    )}
                    {featuredRecord.total_duration_seconds ? (
                      <span className="text-xs text-[#9A9080] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(featuredRecord.total_duration_seconds)}
                      </span>
                    ) : null}
                    {featuredRecord.label && (
                      <span className="text-xs text-[#9A9080] flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {featuredRecord.label}
                      </span>
                    )}
                  </div>
                  {(featuredRecord.genres?.length || featuredRecord.styles?.length) ? (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {featuredRecord.genres?.slice(0, 2).map((g) => (
                        <Badge key={g} variant="secondary" className="text-[10px]">{g}</Badge>
                      ))}
                      {featuredRecord.styles?.slice(0, 3).map((s) => (
                        <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                      ))}
                    </div>
                  ) : null}
                  {featuredRecord.notes && (
                    <p className="text-xs text-[#9A9080] line-clamp-2">{featuredRecord.notes}</p>
                  )}
                </div>
              </div>
            </Card>
          </Link>
        </motion.div>
      )}

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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#C9A84C]" />
                <span className="text-xs text-[#5A5248]">Valor estimado</span>
              </div>
              {collectionValue.isFetching ? (
                <button onClick={collectionValue.cancel} className="text-[#5A5248] hover:text-[#F5F0E8] transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button onClick={collectionValue.refresh} className="text-[#5A5248] hover:text-[#C9A84C] transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {collectionValue.isFetching ? (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <RefreshCw className="w-3.5 h-3.5 text-[#C9A84C] animate-spin" />
                  <span className="font-mono text-sm text-[#F5F0E8]">{collectionValue.progress}%</span>
                </div>
                <p className="text-[10px] text-[#5A5248]">Buscando cotações...</p>
              </div>
            ) : collectionValue.totalValue !== null ? (
              <div>
                <p className="font-mono text-lg font-semibold text-[#F5F0E8] truncate">
                  {formatPrice(collectionValue.totalValue, collectionValue.currency)}
                </p>
                <p className="text-[10px] text-[#5A5248]">
                  {collectionValue.pricedCount} de {collectionValue.totalWithDiscogs} cotados
                </p>
              </div>
            ) : (
              <button onClick={collectionValue.refresh} className="text-left">
                <p className="font-mono text-lg font-semibold text-[#F5F0E8]">—</p>
                <p className="text-[10px] text-[#C9A84C] hover:text-[#E8B84B] transition-colors">
                  Atualizar cotações
                </p>
              </button>
            )}
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
    </>
  )
}
