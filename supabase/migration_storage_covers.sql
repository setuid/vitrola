-- ============================================================
-- Migration: Storage RLS policies for the "covers" bucket
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
--
-- Fixes: cover uploads failing with
--   "new row violates row-level security policy"
--
-- IMPORTANT: do NOT use `TO authenticated` for storage policies — in the
-- storage service's evaluation context that role clause often fails to
-- match even for logged-in users. Instead apply the policy to the
-- default (public) role and gate on auth.uid() IS NOT NULL inside the
-- expression, which reads the request's JWT and works reliably.
-- ============================================================

-- 1. Best-effort: ensure the bucket exists and is public (read).
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('covers', 'covers', true)
  ON CONFLICT (id) DO UPDATE SET public = true;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped bucket upsert (%). The bucket must already exist and be public.', SQLERRM;
END $$;

-- 2. Logged-in users can upload covers.
DROP POLICY IF EXISTS "covers authenticated insert" ON storage.objects;
CREATE POLICY "covers authenticated insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'covers' AND auth.uid() IS NOT NULL);

-- 3. Logged-in users can overwrite (needed for upsert: true).
DROP POLICY IF EXISTS "covers authenticated update" ON storage.objects;
CREATE POLICY "covers authenticated update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'covers' AND auth.uid() IS NOT NULL)
  WITH CHECK (bucket_id = 'covers' AND auth.uid() IS NOT NULL);

-- 4. Logged-in users can delete covers.
DROP POLICY IF EXISTS "covers authenticated delete" ON storage.objects;
CREATE POLICY "covers authenticated delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'covers' AND auth.uid() IS NOT NULL);

-- 5. Verify (should return 3 rows):
--    SELECT policyname, cmd FROM pg_policies
--    WHERE schemaname = 'storage' AND tablename = 'objects'
--      AND policyname LIKE 'covers%';

-- Note: a public bucket already allows public SELECT (read). Covers are
-- not sensitive and are namespaced per user by the app (covers/<uid>/...).
