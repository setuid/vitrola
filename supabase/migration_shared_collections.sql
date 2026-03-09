-- ============================================================
-- Migration: Public Share Collection
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================

-- 1. Table to store share tokens
CREATE TABLE shared_collections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  share_token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE shared_collections ENABLE ROW LEVEL SECURITY;

-- 3. Owner can manage their own share token
CREATE POLICY "user manages own shares"
  ON shared_collections FOR ALL
  USING (auth.uid() = user_id);

-- 4. Anyone can look up a share token (needed to validate public links)
CREATE POLICY "anyone can read shares"
  ON shared_collections FOR SELECT
  USING (true);

-- 5. SECURITY DEFINER function to fetch records by share token
--    This bypasses RLS safely — only returns records for a valid token
CREATE OR REPLACE FUNCTION get_shared_collection(token text)
RETURNS TABLE (
  id uuid,
  title text,
  artist text,
  year int,
  label text,
  country text,
  genres text[],
  styles text[],
  tracklist jsonb,
  total_duration_seconds int,
  format text,
  condition text,
  cover_image_url text,
  play_count int,
  rating int,
  tags text[],
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id, r.title, r.artist, r.year, r.label, r.country,
    r.genres, r.styles, r.tracklist, r.total_duration_seconds,
    r.format, r.condition, r.cover_image_url,
    r.play_count, r.rating, r.tags, r.created_at
  FROM records r
  INNER JOIN shared_collections sc ON sc.user_id = r.user_id
  WHERE sc.share_token = token
  ORDER BY r.created_at DESC;
$$;
