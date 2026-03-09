import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Disc3, Music, Loader2 } from 'lucide-react'
import { usePublicCollection } from '@/hooks/useSharedCollection'
import { formatDuration } from '@/lib/discogs'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatYear } from '@/lib/utils'

export function SharedCollection() {
  const { token } = useParams<{ token: string }>()
  const { data: records = [], isLoading, isError } = usePublicCollection(token)

  const totalDuration = records.reduce((acc, r) => acc + (r.total_duration_seconds || 0), 0)

  const topGenres = useMemo(() => {
    const counts: Record<string, number> = {}
    records.flatMap((r) => r.genres || []).forEach((g) => {
      counts[g] = (counts[g] || 0) + 1
    })
    return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 5)
  }, [records])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C9A84C]" />
      </div>
    )
  }

  if (isError || records.length === 0) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-4">
        <Disc3 className="w-16 h-16 text-[#2A2A2A] mb-4" />
        <p className="text-[#9A9080] text-lg">Coleção não encontrada.</p>
        <p className="text-[#5A5248] text-sm mt-1">Este link pode estar expirado ou inválido.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <header className="border-b border-[#2A2A2A] glass">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#C9A84C] flex items-center justify-center">
            <Disc3 className="w-4 h-4 text-[#0A0A0A]" />
          </div>
          <span className="font-display font-bold text-lg text-gradient-gold">Vitrola</span>
          <span className="text-[#5A5248] text-sm ml-2">Coleção compartilhada</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Analytics */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
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

        {/* Genre badges */}
        {topGenres.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="flex flex-wrap gap-2"
          >
            {topGenres.map(([g, c]) => (
              <Badge key={g} variant="secondary" className="text-xs">
                {g} ({c})
              </Badge>
            ))}
          </motion.div>
        )}

        {/* Album grid */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {records.map((r) => (
              <div key={r.id} className="group">
                <div className="relative aspect-square rounded-lg overflow-hidden bg-[#1A1A1A] border border-[#2A2A2A]">
                  {r.cover_image_url ? (
                    <img
                      src={r.cover_image_url}
                      alt={r.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center vinyl-ring">
                      <div className="w-16 h-16 rounded-full bg-[#2A2A2A] border-4 border-[#0A0A0A] flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-[#5A5248]" />
                      </div>
                    </div>
                  )}
                  {r.rating && r.rating > 0 && (
                    <div className="absolute top-2 left-2">
                      <span className="text-[10px] font-mono bg-[#0A0A0A]/70 text-[#C9A84C] px-1.5 py-0.5 rounded">
                        {'★'.repeat(r.rating)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-2 px-0.5">
                  <p className="text-sm font-medium text-[#F5F0E8] truncate">{r.title}</p>
                  <p className="text-xs text-[#9A9080] truncate">
                    {r.artist}
                    {r.year ? ` · ${formatYear(r.year)}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <div className="text-center py-8 border-t border-[#2A2A2A]">
          <p className="text-xs text-[#5A5248]">
            Compartilhado via <span className="text-[#C9A84C]">Vitrola</span>
          </p>
        </div>
      </div>
    </div>
  )
}
