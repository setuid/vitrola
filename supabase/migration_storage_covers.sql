-- ============================================================
-- Migration: Storage RLS policies for the "covers" bucket
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
--
-- Fixes: cover uploads failing with
--   "new row violates row-level security policy"
-- The bucket was public (read) but had no INSERT/UPDATE policy, so
-- uploads were blocked by RLS.
--
-- NOTE: the bucket upsert is wrapped in a DO block with exception
-- handling so that, if your role can't write storage.buckets, it does
-- NOT roll back the policy creation below (the SQL Editor runs the whole
-- script as one transaction). The policies are what actually matter.
-- ============================================================

-- 1. Best-effort: ensure the bucket exists and is public (read).
--    If this fails (restricted role), we skip it and still create the
--    policies — the bucket already exists when you've been using covers.
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('covers', 'covers', true)
  ON CONFLICT (id) DO UPDATE SET public = true;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped bucket upsert (%). The bucket must already exist and be public.', SQLERRM;
END $$;

-- 2. Authenticated users can upload covers.
DROP POLICY IF EXISTS "covers authenticated insert" ON storage.objects;
CREATE POLICY "covers authenticated insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'covers');

-- 3. Authenticated users can overwrite (needed for upsert: true).
DROP POLICY IF EXISTS "covers authenticated update" ON storage.objects;
CREATE POLICY "covers authenticated update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'covers')
  WITH CHECK (bucket_id = 'covers');

-- 4. Authenticated users can delete covers.
DROP POLICY IF EXISTS "covers authenticated delete" ON storage.objects;
CREATE POLICY "covers authenticated delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'covers');

-- 5. Verify the policies exist (should return 3 rows):
--    SELECT policyname, cmd FROM pg_policies
--    WHERE schemaname = 'storage' AND tablename = 'objects'
--      AND policyname LIKE 'covers%';

-- Note: a public bucket already allows public SELECT (read) without a
-- policy. Covers are not sensitive and are namespaced per user by the
-- app (covers/<user_id>/...).
