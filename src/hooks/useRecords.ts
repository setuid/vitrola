import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { VinylRecord } from '@/lib/supabase'

export function useRecords() {
  return useQuery({
    queryKey: ['records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('records')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as VinylRecord[]
    },
  })
}

export function useRecord(id: string) {
  return useQuery({
    queryKey: ['records', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('records')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as VinylRecord
    },
    enabled: !!id,
  })
}

export function useCreateRecord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (record: Omit<VinylRecord, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('records').insert(record).select().single()
      if (error) throw error
      return data as VinylRecord
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['records'] }),
  })
}

export function useUpdateRecord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<VinylRecord> & { id: string }) => {
      const { data, error } = await supabase
        .from('records')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as VinylRecord
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['records'] })
      qc.invalidateQueries({ queryKey: ['records', data.id] })
    },
  })
}

export function useDeleteRecord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('records').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['records'] }),
  })
}

export function usePlayRecord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ recordId, sessionId }: { recordId: string; sessionId?: string }) => {
      const { error: historyError } = await supabase.from('play_history').insert({
        record_id: recordId,
        session_id: sessionId || null,
      })
      if (historyError) throw historyError

      const { data: rec } = await supabase
        .from('records')
        .select('play_count')
        .eq('id', recordId)
        .single()

      const { error: updateError } = await supabase
        .from('records')
        .update({
          play_count: ((rec?.play_count || 0) + 1),
          last_played_at: new Date().toISOString(),
        })
        .eq('id', recordId)
      if (updateError) throw updateError
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['records'] }),
  })
}

export function useUploadCover() {
  return useMutation({
    mutationFn: async ({
      file,
      recordId,
      userId,
    }: {
      file: File
      recordId: string
      userId: string
    }) => {
      const path = `covers/${userId}/${recordId}.jpg`
      const { error } = await supabase.storage.from('covers').upload(path, file, { upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from('covers').getPublicUrl(path)
      return { url: data.publicUrl, path }
    },
  })
}

export function useCheckDuplicate() {
  return async (discogsId: string): Promise<boolean> => {
    const { data } = await supabase
      .from('records')
      .select('id')
      .eq('discogs_id', discogsId)
      .single()
    return !!data
  }
}
