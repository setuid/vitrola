import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type TracklistItem = {
  position: string
  title: string
  duration: string
}

export type VinylRecord = {
  id: string
  user_id: string
  discogs_id: string | null
  title: string
  artist: string
  year: number | null
  label: string | null
  catalog_number: string | null
  country: string | null
  genres: string[] | null
  styles: string[] | null
  tracklist: TracklistItem[] | null
  total_duration_seconds: number | null
  format: string
  rpm: number
  condition: string
  notes: string | null
  cover_image_url: string | null
  cover_storage_path: string | null
  play_count: number
  last_played_at: string | null
  rating: number | null
  tags: string[] | null
  created_at: string
  updated_at: string
}

export type ListeningSession = {
  id: string
  user_id: string
  name: string
  description: string | null
  occasion: string | null
  created_at: string
  updated_at: string
}

export type SessionRecord = {
  id: string
  session_id: string
  record_id: string
  order: number
  side: string | null
  notes: string | null
}

export type PlayHistory = {
  id: string
  user_id: string
  record_id: string
  session_id: string | null
  played_at: string
}

export type SessionWithRecords = {
  session: ListeningSession
  records: (SessionRecord & { record: VinylRecord })[]
}
