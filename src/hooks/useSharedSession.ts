import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { VinylRecord } from '@/lib/supabase'

interface SharedSessionRecord {
  id: string
  order: number
  side: string | null
  notes: string | null
  record: Pick<VinylRecord,
    'id' | 'title' | 'artist' | 'year' | 'cover_image_url' |
    'total_duration_seconds' | 'format' | 'genres' | 'styles' |
    'condition' | 'rating'
  >
}

interface SharedSessionData {
  session: {
    id: string
    name: string
    description: string | null
    occasion: string | null
    created_at: string
  }
  records: SharedSessionRecord[]
}

/** Fetch the share token for a specific session */
export function useSessionShareToken(sessionId: string) {
  return useQuery({
    queryKey: ['session-share-token', sessionId],
    queryFn: async () => {
      const { data } = await supabase
        .from('shared_sessions')
        .select('share_token')
        .eq('session_id', sessionId)
        .single()
      return data?.share_token as string | null
    },
    enabled: !!sessionId,
  })
}

/** Create a share token for a session */
export function useCreateSessionShare() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('shared_sessions')
        .insert({ session_id: sessionId, user_id: user.id })
        .select('share_token')
        .single()
      if (error) throw error
      return data.share_token as string
    },
    onSuccess: (_, sessionId) =>
      qc.invalidateQueries({ queryKey: ['session-share-token', sessionId] }),
  })
}

/** Delete a session share token (stop sharing) */
export function useDeleteSessionShare() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('shared_sessions')
        .delete()
        .eq('session_id', sessionId)
      if (error) throw error
    },
    onSuccess: (_, sessionId) =>
      qc.invalidateQueries({ queryKey: ['session-share-token', sessionId] }),
  })
}

/** Fetch a public shared session by token (no auth required) */
export function usePublicSession(token: string | undefined) {
  return useQuery({
    queryKey: ['shared-session', token],
    queryFn: async () => {
      if (!token) return null
      const { data, error } = await supabase.rpc('get_shared_session', { token })
      if (error) throw error
      return data as SharedSessionData | null
    },
    enabled: !!token,
  })
}
