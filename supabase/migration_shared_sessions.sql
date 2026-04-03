-- ============================================================
-- Migration: Public Share Listening Sessions
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================

-- 1. Table to store session share tokens
CREATE TABLE shared_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES listening_sessions(id) ON DELETE CASCADE NOT NULL UNIQUE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  share_token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE shared_sessions ENABLE ROW LEVEL SECURITY;

-- 3. Owner can manage their own session shares
CREATE POLICY "user manages own session shares"
  ON shared_sessions FOR ALL
  USING (auth.uid() = user_id);

-- 4. Anyone can look up a session share token (needed to validate public links)
CREATE POLICY "anyone can read session shares"
  ON shared_sessions FOR SELECT
  USING (true);

-- 5. SECURITY DEFINER function to fetch a shared session by token
--    Returns session info + records with their vinyl details
CREATE OR REPLACE FUNCTION get_shared_session(token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  sid uuid;
BEGIN
  -- Find the session id from the token
  SELECT ss.session_id INTO sid
  FROM shared_sessions ss
  WHERE ss.share_token = token;

  IF sid IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT json_build_object(
    'session', (
      SELECT json_build_object(
        'id', ls.id,
        'name', ls.name,
        'description', ls.description,
        'occasion', ls.occasion,
        'created_at', ls.created_at
      )
      FROM listening_sessions ls
      WHERE ls.id = sid
    ),
    'records', COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', sr.id,
          'order', sr."order",
          'side', sr.side,
          'notes', sr.notes,
          'record', json_build_object(
            'id', r.id,
            'title', r.title,
            'artist', r.artist,
            'year', r.year,
            'cover_image_url', r.cover_image_url,
            'total_duration_seconds', r.total_duration_seconds,
            'format', r.format,
            'genres', r.genres,
            'styles', r.styles,
            'condition', r.condition,
            'rating', r.rating
          )
        )
        ORDER BY sr."order"
      )
      FROM session_records sr
      INNER JOIN records r ON r.id = sr.record_id
      WHERE sr.session_id = sid
    ), '[]'::json)
  ) INTO result;

  RETURN result;
END;
$$;
