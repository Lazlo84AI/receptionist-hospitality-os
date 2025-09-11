-- Script SQL pour créer le bucket shift-recordings et ses permissions
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Créer le bucket shift-recordings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'shift-recordings',
  'shift-recordings', 
  true,
  10485760, -- 10MB limit
  ARRAY['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/webm']
);

-- 2. Créer les policies RLS pour permettre l'upload et la lecture
CREATE POLICY "Allow authenticated users to upload shift recordings" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'shift-recordings' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow public read access to shift recordings" ON storage.objects
FOR SELECT USING (
  bucket_id = 'shift-recordings'
);

CREATE POLICY "Allow authenticated users to delete their own recordings" ON storage.objects
FOR DELETE USING (
  bucket_id = 'shift-recordings' 
  AND auth.role() = 'authenticated'
);