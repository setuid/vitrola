-- ============================================================
-- Migration: Session Suggestions (anonymous record suggestions)
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================

-- 1. Table to store anonymous suggestions for shared sessions
CREATE TABLE session_suggestions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES listening_sessions(id) ON DELETE CASCADE NOT NULL,
  record_id uuid REFERENCES records(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  UNIQUE (session_id, record_id)
);

-- 2. Enable RLS
ALTER TABLE session_suggestions ENABLE ROW LEVEL SECURITY;

-- 3. Session owner can manage suggestions on their sessions
CREATE POLICY "owner manages suggestions"
  ON session_suggestions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM listening_sessions ls
      WHERE ls.id = session_suggestions.session_id
        AND ls.user_id = auth.uid()
    )
  );

-- 4. Anyone can INSERT suggestions (anonymous visitors via shared link)
--    They need to go through the RPC below, but we still need the policy
--    for the SECURITY DEFINER function to work.

-- 5. SECURITY DEFINER function: submit a suggestion via share token
--    Validates the token, prevents duplicates, and inserts.
CREATE OR REPLACE FUNCTION submit_session_suggestion(token text, suggested_record_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sid uuid;
  owner_id uuid;
  result json;
BEGIN
  -- Find session from token
  SELECT ss.session_id, ss.user_id INTO sid, owner_id
  FROM shared_sessions ss
  WHERE ss.share_token = token;

  IF sid IS NULL THEN
    RETURN json_build_object('error', 'invalid_token');
  END IF;

  -- Verify the record belongs to the session owner's collection
  IF NOT EXISTS (
    SELECT 1 FROM records r
    WHERE r.id = suggested_record_id AND r.user_id = owner_id
  ) THEN
    RETURN json_build_object('error', 'record_not_found');
  END IF;

  -- Insert (ignore if already suggested)
  INSERT INTO session_suggestions (session_id, record_id)
  VALUES (sid, suggested_record_id)
  ON CONFLICT (session_id, record_id) DO NOTHING;

  RETURN json_build_object('ok', true);
END;
$$;

-- 6. SECURITY DEFINER function: fetch the owner's collection via share token
--    So public visitors can browse what records are available to suggest.
CREATE OR REPLACE FUNCTION get_session_owner_collection(token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_id uuid;
  result json;
BEGIN
  SELECT ss.user_id INTO owner_id
  FROM shared_sessions ss
  WHERE ss.share_token = token;

  IF owner_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(json_agg(
    json_build_object(
      'id', r.id,
      'title', r.title,
      'artist', r.artist,
      'year', r.year,
      'cover_image_url', r.cover_image_url,
      'genres', r.genres,
      'styles', r.styles,
      'total_duration_seconds', r.total_duration_seconds
    )
    ORDER BY r.artist, r.title
  ), '[]'::json) INTO result
  FROM records r
  WHERE r.user_id = owner_id;

  RETURN result;
END;
$$;

-- 7. SECURITY DEFINER function: fetch suggestions for a shared session by token
--    Used by the public page to show which records were already suggested.
CREATE OR REPLACE FUNCTION get_session_suggestions(token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sid uuid;
  result json;
BEGIN
  SELECT ss.session_id INTO sid
  FROM shared_sessions ss
  WHERE ss.share_token = token;

  IF sid IS NULL THEN
    RETURN '[]'::json;
  END IF;

  SELECT COALESCE(json_agg(
    json_build_object(
      'id', sg.id,
      'record_id', sg.record_id,
      'status', sg.status,
      'created_at', sg.created_at,
      'record', json_build_object(
        'id', r.id,
        'title', r.title,
        'artist', r.artist,
        'cover_image_url', r.cover_image_url
      )
    )
    ORDER BY sg.created_at DESC
  ), '[]'::json) INTO result
  FROM session_suggestions sg
  INNER JOIN records r ON r.id = sg.record_id
  WHERE sg.session_id = sid;

  RETURN result;
END;
$$;
