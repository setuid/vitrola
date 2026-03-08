import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ListeningSession, SessionRecord, VinylRecord } from '@/lib/supabase'

export function useSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listening_sessions')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as ListeningSession[]
    },
  })
}

export function useSession(id: string) {
  return useQuery({
    queryKey: ['sessions', id],
    queryFn: async () => {
      const { data: session, error: se } = await supabase
        .from('listening_sessions')
        .select('*')
        .eq('id', id)
        .single()
      if (se) throw se

      const { data: records, error: re } = await supabase
        .from('session_records')
        .select('*, record:records(*)')
        .eq('session_id', id)
        .order('order', { ascending: true })
      if (re) throw re

      return {
        session: session as ListeningSession,
        records: records as (SessionRecord & { record: VinylRecord })[],
      }
    },
    enabled: !!id,
  })
}

export function useCreateSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (session: Omit<ListeningSession, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('listening_sessions')
        .insert(session)
        .select()
        .single()
      if (error) throw error
      return data as ListeningSession
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  })
}

export function useUpdateSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ListeningSession> & { id: string }) => {
      const { data, error } = await supabase
        .from('listening_sessions')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as ListeningSession
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['sessions'] })
      qc.invalidateQueries({ queryKey: ['sessions', data.id] })
    },
  })
}

export function useDeleteSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('listening_sessions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  })
}

export function useAddRecordToSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      sessionId,
      recordId,
      order,
      side,
      notes,
    }: {
      sessionId: string
      recordId: string
      order: number
      side?: string
      notes?: string
    }) => {
      const { data, error } = await supabase
        .from('session_records')
        .insert({ session_id: sessionId, record_id: recordId, order, side, notes })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['sessions', vars.sessionId] }),
  })
}

export function useRemoveRecordFromSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ sessionId, id }: { sessionId: string; id: string }) => {
      const { error } = await supabase.from('session_records').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['sessions', vars.sessionId] }),
  })
}

export function useReorderSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      sessionId,
      items,
    }: {
      sessionId: string
      items: { id: string; order: number }[]
    }) => {
      const updates = items.map(({ id, order }) =>
        supabase.from('session_records').update({ order }).eq('id', id)
      )
      await Promise.all(updates)
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['sessions', vars.sessionId] }),
  })
}
