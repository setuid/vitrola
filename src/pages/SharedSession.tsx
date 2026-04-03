import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Disc3, Music, Clock, Calendar, Loader2 } from 'lucide-react'
import { usePublicSession } from '@/hooks/useSharedSession'
import { formatDuration } from '@/lib/discogs'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function SharedSession() {
  const { token } = useParams<{ token: string }>()
  const { data, isLoading, isError } = usePublicSession(token)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C9A84C]" />
      </div>
    )
  }

  if (isError || !data?.session) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-4">
        <Music className="w-16 h-16 text-[#2A2A2A] mb-4" />
        <p className="text-[#9A9080] text-lg">Sessão não encontrada.</p>
        <p className="text-[#5A5248] text-sm mt-1">Este link pode estar expirado ou inválido.</p>
      </div>
    )
  }

  const { session, records } = data
  const totalDuration = records.reduce(
    (acc, item) => acc + (item.record.total_duration_seconds || 0),
    0
  )

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <header className="border-b border-[#2A2A2A] glass">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#C9A84C] flex items-center justify-center">
            <Disc3 className="w-4 h-4 text-[#0A0A0A]" />
          </div>
          <span className="font-display font-bold text-lg text-gradient-gold">Vitrola</span>
          <span className="text-[#5A5248] text-sm ml-2">Sessão compartilhada</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Session Hero */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
                <Music className="w-7 h-7 text-[#C9A84C]" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F5F0E8] mb-2">
                  {session.name}
                </h1>
                {session.description && (
                  <p className="text-sm text-[#9A9080] mb-3">{session.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-3">
                  {session.occasion && (
                    <Badge variant="secondary" className="text-xs">
                      {session.occasion}
                    </Badge>
                  )}
                  <span className="text-xs text-[#5A5248] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {totalDuration > 0 ? formatDuration(totalDuration) : 'Duração desconhecida'}
                  </span>
                  <span className="text-xs text-[#5A5248] flex items-center gap-1">
                    <Disc3 className="w-3 h-3" />
                    {records.length} disco{records.length !== 1 ? 's' : ''}
                  </span>
                  <span className="text-xs text-[#5A5248] flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(session.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Records */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <p className="text-xs text-[#5A5248] uppercase tracking-wider mb-3">
            Discos na sessão
          </p>

          {records.length === 0 ? (
            <Card className="p-8 text-center text-[#5A5248]">
              <Disc3 className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Nenhum disco nesta sessão.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {records.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.03 }}
                >
                  <Card>
                    <div className="flex items-center gap-3 p-3">
                      <span className="text-xs font-mono text-[#5A5248] w-6 text-right flex-shrink-0">
                        {i + 1}.
                      </span>
                      <div className="w-12 h-12 rounded-md overflow-hidden bg-[#1A1A1A] flex-shrink-0">
                        {item.record.cover_image_url ? (
                          <img
                            src={item.record.cover_image_url}
                            alt={item.record.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Disc3 className="w-5 h-5 text-[#5A5248]" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#F5F0E8] truncate">
                          {item.record.title}
                        </p>
                        <p className="text-xs text-[#9A9080] truncate">
                          {item.record.artist}
                        </p>
                      </div>
                      {item.side && item.side !== 'AB' && (
                        <Badge variant="outline" className="text-[10px] flex-shrink-0">
                          Lado {item.side}
                        </Badge>
                      )}
                      {item.record.total_duration_seconds ? (
                        <span className="text-xs text-[#5A5248] flex-shrink-0">
                          {formatDuration(item.record.total_duration_seconds)}
                        </span>
                      ) : null}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Duration footer */}
        {totalDuration > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="flex justify-end"
          >
            <div className="text-xs text-[#5A5248] flex items-center gap-1.5 font-mono">
              <Clock className="w-3 h-3" />
              Duração total: {formatDuration(totalDuration)}
            </div>
          </motion.div>
        )}

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
