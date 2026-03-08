import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Save, Search, Loader2, Disc3, ArrowLeft } from 'lucide-react'
import {
  useSession,
  useCreateSession,
  useUpdateSession,
  useAddRecordToSession,
  useRemoveRecordFromSession,
  useReorderSession,
} from '@/hooks/useSessions'
import { useRecords } from '@/hooks/useRecords'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/hooks/useToast'
import { OCCASIONS } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SessionQueue } from '@/components/session/SessionQueue'
import type { VinylRecord, SessionRecord } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'

type QueueItem = SessionRecord & { record: VinylRecord }

export function SessionBuilder() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isNew = !id || id === 'new'

  const { data: records = [] } = useRecords()
  const { data: sessionData } = useSession(isNew ? '' : (id || ''))
  const createSession = useCreateSession()
  const updateSession = useUpdateSession()
  const addRecord = useAddRecordToSession()
  const removeRecord = useRemoveRecordFromSession()
  const reorderSession = useReorderSession()

  const [name, setName] = useState(sessionData?.session.name || '')
  const [description, setDescription] = useState(sessionData?.session.description || '')
  const [occasion, setOccasion] = useState(sessionData?.session.occasion || '')
  const [search, setSearch] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(isNew ? null : id || null)
  const [localQueue, setLocalQueue] = useState<QueueItem[]>(sessionData?.records || [])
  const [saving, setSaving] = useState(false)

  const filteredRecords = useMemo(() => {
    const q = search.toLowerCase()
    return records.filter(
      (r) =>
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.artist.toLowerCase().includes(q)
    )
  }, [records, search])

  const totalDuration = localQueue.reduce(
    (acc, item) => acc + (item.record.total_duration_seconds || 0),
    0
  )

  const ensureSession = async (): Promise<string> => {
    if (sessionId) return sessionId
    if (!user) throw new Error('Login required')
    const session = await createSession.mutateAsync({
      user_id: user.id,
      name: name || 'Nova sessão',
      description: description || null,
      occasion: occasion || null,
    })
    setSessionId(session.id)
    return session.id
  }

  const handleAddRecord = async (record: VinylRecord) => {
    const alreadyIn = localQueue.some((q) => q.record_id === record.id)
    if (alreadyIn) return

    try {
      const sid = await ensureSession()
      const order = localQueue.length
      await addRecord.mutateAsync({
        sessionId: sid,
        recordId: record.id,
        order,
        side: 'AB',
      })

      const { data } = await supabase
        .from('session_records')
        .select('*')
        .eq('session_id', sid)
        .eq('record_id', record.id)
        .single()

      if (data) {
        setLocalQueue((prev) => [...prev, { ...data, record }])
      }
    } catch {
      toast({ title: 'Erro ao adicionar disco', variant: 'destructive' })
    }
  }

  const handleRemove = async (itemId: string) => {
    const sid = sessionId
    if (!sid) return
    await removeRecord.mutateAsync({ sessionId: sid, id: itemId })
    setLocalQueue((prev) => prev.filter((q) => q.id !== itemId))
  }

  const handleReorder = async (items: QueueItem[]) => {
    const sid = sessionId
    if (!sid) return
    setLocalQueue(items)
    await reorderSession.mutateAsync({
      sessionId: sid,
      items: items.map((item, i) => ({ id: item.id, order: i })),
    })
  }

  const handleSideChange = (itemId: string, side: string) => {
    setLocalQueue((prev) =>
      prev.map((q) => (q.id === itemId ? { ...q, side } : q))
    )
    // Persist to DB (fire-and-forget)
    supabase.from('session_records').update({ side }).eq('id', itemId)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'Dê um nome à sessão', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      if (sessionId) {
        await updateSession.mutateAsync({
          id: sessionId,
          name,
          description: description || null,
          occasion: occasion || null,
        })
      } else {
        const sid = await ensureSession()
        navigate(`/sessions/${sid}`, { replace: true })
        toast({ title: 'Sessão salva!', variant: 'success' })
        return
      }
      toast({ title: 'Sessão salva!', variant: 'success' })
      navigate('/sessions')
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="font-display text-2xl font-bold text-[#F5F0E8]">
          {isNew ? 'Nova Sessão' : 'Editar Sessão'}
        </h1>
      </div>

      {/* Session metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Nome da sessão *</Label>
          <Input
            placeholder="Ex: Sexta à noite..."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Ocasião</Label>
          <Select value={occasion} onValueChange={setOccasion}>
            <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
            <SelectContent>
              {OCCASIONS.map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-3">
          <Label>Descrição</Label>
          <Input placeholder="Descrição opcional..." value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Explorer */}
        <div className="space-y-3">
          <h2 className="font-semibold text-[#F5F0E8]">Explorador</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A5248]" />
            <Input
              className="pl-9"
              placeholder="Buscar disco..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="space-y-1 max-h-[480px] overflow-y-auto">
            {filteredRecords.map((record) => {
              const inQueue = localQueue.some((q) => q.record_id === record.id)
              return (
                <motion.div
                  key={record.id}
                  className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                    inQueue
                      ? 'opacity-40 cursor-default'
                      : 'hover:bg-[#1A1A1A] hover:border-[#2A2A2A] border border-transparent'
                  }`}
                  onClick={() => !inQueue && handleAddRecord(record)}
                >
                  <div className="w-10 h-10 rounded-md overflow-hidden bg-[#2A2A2A] flex-shrink-0">
                    {record.cover_image_url ? (
                      <img src={record.cover_image_url} alt={record.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Disc3 className="w-4 h-4 text-[#5A5248]" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#F5F0E8] truncate">{record.title}</p>
                    <p className="text-xs text-[#9A9080] truncate">{record.artist}</p>
                  </div>
                  {inQueue && (
                    <span className="text-xs text-[#C9A84C]">Na fila</span>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Right: Queue */}
        <div className="space-y-3">
          <h2 className="font-semibold text-[#F5F0E8]">
            Fila da Sessão
            <span className="text-sm font-normal text-[#9A9080] ml-2">
              ({localQueue.length} disco{localQueue.length !== 1 ? 's' : ''})
            </span>
          </h2>
          <SessionQueue
            items={localQueue}
            onReorder={handleReorder}
            onRemove={handleRemove}
            onSideChange={handleSideChange}
            totalDuration={totalDuration}
          />
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="px-8">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar sessão
        </Button>
      </div>
    </div>
  )
}
