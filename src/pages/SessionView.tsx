import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Music, Clock, Disc3, Pencil, Plus, Loader2, Calendar } from 'lucide-react'
import { useSession } from '@/hooks/useSessions'
import { formatDuration } from '@/lib/discogs'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function SessionView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isLoading } = useSession(id || '')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[#C9A84C]" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[#5A5248]">
        <Music className="w-12 h-12 mb-4 opacity-30" />
        <p>Sessão não encontrada.</p>
      </div>
    )
  }

  const { session, records } = data
  const totalDuration = records.reduce(
    (acc, item) => acc + (item.record.total_duration_seconds || 0),
    0
  )

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0" />
        <Link to={`/sessions/${id}/edit`}>
          <Button variant="outline" size="sm">
            <Pencil className="w-3.5 h-3.5 mr-1.5" />
            Editar
          </Button>
        </Link>
      </div>

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

      {/* Discos */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-[#5A5248] uppercase tracking-wider">
            Discos na sessão
          </p>
          <Link to={`/sessions/${id}/edit`}>
            <Button variant="ghost" size="sm" className="text-[#C9A84C] text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Adicionar discos
            </Button>
          </Link>
        </div>

        {records.length === 0 ? (
          <Card className="p-8 text-center text-[#5A5248]">
            <Disc3 className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Nenhum disco nesta sessão ainda.</p>
            <Link to={`/sessions/${id}/edit`}>
              <Button className="mt-4" size="sm">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Adicionar discos
              </Button>
            </Link>
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
                <Link to={`/shelf/${item.record.id}`}>
                  <Card className="card-hover cursor-pointer">
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
                </Link>
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
    </div>
  )
}
