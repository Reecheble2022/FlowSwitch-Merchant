/*
  # Create Storage Buckets for Images

  ## Overview
  Creates Supabase Storage buckets for agent photos and merchant logos.

  ## New Buckets
  1. `agent-photos` - Profile photos for agents
  2. `merchant-logos` - Logos for merchant companies

  ## Security
  - Public access for reading (to display images)
  - Authenticated users can upload
  - File size limits enforced by client-side validation
*/

-- Create agent-photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'agent-photos',
  'agent-photos',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create merchant-logos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'merchant-logos',
  'merchant-logos',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for agent-photos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Anyone can view agent photos'
  ) THEN
    CREATE POLICY "Anyone can view agent photos"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'agent-photos');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can upload agent photos'
  ) THEN
    CREATE POLICY "Authenticated users can upload agent photos"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'agent-photos');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can update agent photos'
  ) THEN
    CREATE POLICY "Authenticated users can update agent photos"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (bucket_id = 'agent-photos')
      WITH CHECK (bucket_id = 'agent-photos');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can delete agent photos'
  ) THEN
    CREATE POLICY "Authenticated users can delete agent photos"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'agent-photos');
  END IF;
END $$;

-- Storage policies for merchant-logos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Anyone can view merchant logos'
  ) THEN
    CREATE POLICY "Anyone can view merchant logos"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'merchant-logos');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can upload merchant logos'
  ) THEN
    CREATE POLICY "Authenticated users can upload merchant logos"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'merchant-logos');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can update merchant logos'
  ) THEN
    CREATE POLICY "Authenticated users can update merchant logos"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (bucket_id = 'merchant-logos')
      WITH CHECK (bucket_id = 'merchant-logos');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can delete merchant logos'
  ) THEN
    CREATE POLICY "Authenticated users can delete merchant logos"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'merchant-logos');
  END IF;
END $$;
