import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Music, Trash2, Calendar, Loader2 } from 'lucide-react'
import { useSessions, useDeleteSession } from '@/hooks/useSessions'
import { toast } from '@/hooks/useToast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function Sessions() {
  const { data: sessions = [], isLoading } = useSessions()
  const deleteSession = useDeleteSession()

  const handleDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.preventDefault()
    if (!confirm(`Remover sessão "${name}"?`)) return
    deleteSession.mutate(id, {
      onSuccess: () => toast({ title: 'Sessão removida', variant: 'success' }),
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[#C9A84C]" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#F5F0E8]">Sessões de Escuta</h1>
          <p className="text-[#9A9080] mt-1">{sessions.length} sessão{sessions.length !== 1 ? 'ões' : ''} salva{sessions.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/sessions/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" /> Nova sessão
          </Button>
        </Link>
      </div>

      {sessions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 text-[#5A5248]"
        >
          <Music className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Nenhuma sessão criada ainda.</p>
          <Link to="/sessions/new">
            <Button className="mt-4">
              <Plus className="w-4 h-4 mr-2" /> Criar primeira sessão
            </Button>
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session, i) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={`/sessions/${session.id}`}>
                <Card className="card-hover cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
                      <Music className="w-5 h-5 text-[#C9A84C]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#F5F0E8] truncate">{session.name}</p>
                      {session.description && (
                        <p className="text-sm text-[#9A9080] truncate">{session.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {session.occasion && (
                          <Badge variant="secondary" className="text-xs">{session.occasion}</Badge>
                        )}
                        <span className="text-xs text-[#5A5248] flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(session.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-[#5A5248] hover:text-red-400 flex-shrink-0"
                      onClick={(e) => handleDelete(session.id, session.name, e)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
