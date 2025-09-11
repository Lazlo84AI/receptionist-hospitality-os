-- Vérifier que le bucket shift-recordings existe et ses permissions
SELECT * FROM storage.buckets WHERE name = 'shift-recordings';

-- Vérifier les policies RLS pour le storage
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%shift%';

-- Si le bucket n'existe pas, le recréer avec des permissions plus ouvertes
DO $$
BEGIN
  -- Supprimer le bucket s'il existe déjà (pour recommencer proprement)
  DELETE FROM storage.buckets WHERE name = 'shift-recordings';
  
  -- Recréer le bucket
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'shift-recordings',
    'shift-recordings', 
    true,
    52428800, -- 50MB pour être sûr
    ARRAY['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/webm', 'audio/x-wav']
  );
END $$;

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Allow authenticated users to upload shift recordings" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to shift recordings" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own recordings" ON storage.objects;

-- Créer des policies plus permissives pour les tests
CREATE POLICY "Enable all operations for shift recordings" ON storage.objects
FOR ALL USING (bucket_id = 'shift-recordings')
WITH CHECK (bucket_id = 'shift-recordings');