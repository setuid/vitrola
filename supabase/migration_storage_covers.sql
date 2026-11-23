-- ============================================================
-- Migration: Storage RLS policies for the "covers" bucket
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
--
-- Fixes: manually-uploaded cover images not appearing. The bucket was
-- public (read), but had no INSERT/UPDATE policy, so uploads were
-- silently blocked by RLS. Discogs covers masked this by falling back
-- to the external discogs.com URL; manual uploads have no fallback.
-- ============================================================

-- 1. Ensure the bucket exists and is public (read). Harmless if it
--    already exists — this just guarantees public read.
INSERT INTO storage.buckets (id, name, public)
VALUES ('covers', 'covers', true)
ON CONFLICT (id) DO UPDATE SET public = true;

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

-- Note: a public bucket already allows public SELECT (read) without a
-- policy, so no read policy is needed. Covers are not sensitive and are
-- namespaced per user by the app (covers/<user_id>/...).
