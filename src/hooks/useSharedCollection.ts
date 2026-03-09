import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { VinylRecord } from '@/lib/supabase'

/** Fetch the current user's share token (if any) */
export function useShareToken() {
  return useQuery({
    queryKey: ['share-token'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data } = await supabase
        .from('shared_collections')
        .select('share_token')
        .eq('user_id', user.id)
        .single()
      return data?.share_token as string | null
    },
  })
}

/** Create a share token for the current user */
export function useCreateShareToken() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('shared_collections')
        .insert({ user_id: user.id })
        .select('share_token')
        .single()
      if (error) throw error
      return data.share_token as string
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['share-token'] }),
  })
}

/** Delete the share token (stop sharing) */
export function useDeleteShareToken() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('shared_collections')
        .delete()
        .eq('user_id', user.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['share-token'] }),
  })
}

/** Fetch a public shared collection by token (no auth required) */
export function usePublicCollection(token: string | undefined) {
  return useQuery({
    queryKey: ['shared-collection', token],
    queryFn: async () => {
      if (!token) return []
      const { data, error } = await supabase.rpc('get_shared_collection', { token })
      if (error) throw error
      return (data ?? []) as VinylRecord[]
    },
    enabled: !!token,
  })
}
