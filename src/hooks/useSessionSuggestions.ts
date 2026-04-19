import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface CollectionRecord {
  id: string
  title: string
  artist: string
  year: number | null
  cover_image_url: string | null
  genres: string[] | null
  styles: string[] | null
  total_duration_seconds: number | null
}

interface SuggestionRecord {
  id: string
  title: string
  artist: string
  cover_image_url: string | null
}

export interface SessionSuggestion {
  id: string
  record_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  record: SuggestionRecord
}

export interface PublicRecordDetail {
  id: string
  title: string
  artist: string
  year: number | null
  label: string | null
  catalog_number: string | null
  country: string | null
  genres: string[] | null
  styles: string[] | null
  tracklist: { position: string; title: string; duration: string }[] | null
  total_duration_seconds: number | null
  format: string
  rpm: number
  condition: string
  notes: string | null
  cover_image_url: string | null
  play_count: number
  rating: number | null
  tags: string[] | null
  discogs_id: string | null
}

/** Fetch full record detail via share token (public, no auth) */
export function usePublicRecordDetail(token: string | undefined, recordId: string | undefined) {
  return useQuery({
    queryKey: ['shared-record-detail', token, recordId],
    queryFn: async () => {
      if (!token || !recordId) return null
      const { data, error } = await supabase.rpc('get_shared_session_record', {
        token,
        target_record_id: recordId,
      })
      if (error) throw error
      return data as PublicRecordDetail | null
    },
    enabled: !!token && !!recordId,
  })
}

/** Fetch the session owner's full collection via share token (public, no auth) */
export function useSessionOwnerCollection(token: string | undefined) {
  return useQuery({
    queryKey: ['session-owner-collection', token],
    queryFn: async () => {
      if (!token) return []
      const { data, error } = await supabase.rpc('get_session_owner_collection', { token })
      if (error) throw error
      return (data as CollectionRecord[]) || []
    },
    enabled: !!token,
  })
}

/** Fetch suggestions for a shared session by token (public, no auth) */
export function usePublicSessionSuggestions(token: string | undefined) {
  return useQuery({
    queryKey: ['session-suggestions-public', token],
    queryFn: async () => {
      if (!token) return []
      const { data, error } = await supabase.rpc('get_session_suggestions', { token })
      if (error) throw error
      return (data as SessionSuggestion[]) || []
    },
    enabled: !!token,
  })
}

/** Submit a suggestion (public, no auth) */
export function useSubmitSuggestion(token: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (recordId: string) => {
      if (!token) throw new Error('No token')
      const { data, error } = await supabase.rpc('submit_session_suggestion', {
        token,
        suggested_record_id: recordId,
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['session-suggestions-public', token] })
    },
  })
}

/** Fetch suggestions for a session the owner owns (authenticated, with record details) */
export function useOwnerSessionSuggestions(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['session-suggestions-owner', sessionId],
    queryFn: async () => {
      if (!sessionId) return []
      const { data, error } = await supabase
        .from('session_suggestions')
        .select('id, record_id, status, created_at, records:record_id (id, title, artist, cover_image_url)')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data || []).map((row: any) => ({
        id: row.id as string,
        record_id: row.record_id as string,
        status: row.status as 'pending' | 'accepted' | 'rejected',
        created_at: row.created_at as string,
        record: row.records as SuggestionRecord,
      }))
    },
    enabled: !!sessionId,
  })
}

/** Update suggestion status (accept/reject) — authenticated owner only */
export function useUpdateSuggestionStatus(sessionId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ suggestionId, status }: { suggestionId: string; status: 'accepted' | 'rejected' }) => {
      const { error } = await supabase
        .from('session_suggestions')
        .update({ status })
        .eq('id', suggestionId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['session-suggestions-owner', sessionId] })
    },
  })
}
