import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Camera, BookOpen, Music, Network, Play, TrendingUp, Disc3 } from 'lucide-react'
import { useRecords } from '@/hooks/useRecords'
import { useAuth } from '@/hooks/useAuth'
import { formatDuration } from '@/lib/discogs'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AuthModal } from '@/components/auth/AuthModal'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useState } from 'react'

const quickLinks = [
  { to: '/scanner', label: 'Adicionar disco', icon: Camera, desc: 'Por foto ou busca' },
  { to: '/shelf', label: 'Minha estante', icon: BookOpen, desc: 'Acervo completo' },
  { to: '/sessions/new', label: 'Nova sessão', icon: Music, desc: 'Plano de escuta' },
  { to: '/graph', label: 'Vitrola Graph', icon: Network, desc: 'Relações entre discos' },
]

export function Home() {
  const { data: records = [] } = useRecords()
  const { user } = useAuth()
  const [showAuth, setShowAuth] = useState(false)

  const totalDuration = records.reduce((acc, r) => acc + (r.total_duration_seconds || 0), 0)
  const mostPlayed = [...records].sort((a, b) => b.play_count - a.play_count)[0]
  const neverPlayed = records.filter((r) => r.play_count === 0).length
  const lastAdded = records[0]

  const genres = records.flatMap((r) => r.genres || [])
  const genreCounts: Record<string, number> = {}
  genres.forEach((g) => { genreCounts[g] = (genreCounts[g] || 0) + 1 })
  const topGenres = Object.entries(genreCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold text-[#F5F0E8]">Bem-vindo de volta</h1>
        <p className="text-[#9A9080] mt-1">
          {records.length} disco{records.length !== 1 ? 's' : ''} na sua coleção
          {totalDuration > 0 && ` · ${formatDuration(totalDuration)} de música`}
        </p>
      </motion.div>

      {/* Last added */}
      {lastAdded && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <p className="text-xs text-[#5A5248] uppercase tracking-wider mb-3">Último adicionado</p>
          <Link to={`/shelf/${lastAdded.id}`}>
            <Card className="overflow-hidden hover:border-[#C9A84C]/40 transition-colors">
              <div className="flex items-center gap-4 p-4">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-[#2A2A2A] flex-shrink-0">
                  {lastAdded.cover_image_url ? (
                    <img
                      src={lastAdded.cover_image_url}
                      alt={lastAdded.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Disc3 className="w-8 h-8 text-[#5A5248]" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-xl font-semibold text-[#F5F0E8] truncate">
                    {lastAdded.title}
                  </p>
                  <p className="text-[#9A9080] truncate">{lastAdded.artist}</p>
                  {lastAdded.year && (
                    <p className="text-xs font-mono text-[#5A5248] mt-1">{lastAdded.year}</p>
                  )}
                </div>
              </div>
            </Card>
          </Link>
        </motion.div>
      )}

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {[
          { label: 'Total de discos', value: records.length, icon: Disc3 },
          {
            label: 'Horas de música',
            value: totalDuration > 0 ? formatDuration(totalDuration) : '—',
            icon: Music,
          },
          {
            label: 'Mais tocado',
            value: mostPlayed ? mostPlayed.title.slice(0, 12) + '…' : '—',
            icon: TrendingUp,
          },
          { label: 'Nunca ouvidos', value: neverPlayed, icon: Play },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4 text-[#C9A84C]" />
              <span className="text-xs text-[#5A5248]">{label}</span>
            </div>
            <p className="font-mono text-lg font-semibold text-[#F5F0E8] truncate">{value}</p>
          </Card>
        ))}
      </motion.div>

      {/* Quick links */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
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

      {/* Top genres */}
      {topGenres.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-xs text-[#5A5248] uppercase tracking-wider mb-3">Top gêneros</p>
          <div className="flex gap-2 flex-wrap">
            {topGenres.map(([genre, count]) => (
              <div
                key={genre}
                className="flex items-center gap-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-full px-3 py-1.5"
              >
                <span className="text-sm text-[#F5F0E8]">{genre}</span>
                <span className="text-xs font-mono text-[#C9A84C]">{count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

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
