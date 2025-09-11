-- Trigger pour créer automatiquement un profil utilisateur lors de l'inscription
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Fonction qui crée le profil utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    email,
    role,
    department,
    phone,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'job_role', 'staff'),
    COALESCE(NEW.raw_user_meta_data->>'department', 'Front Desk'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    TRUE,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger qui se déclenche lors de la création d'un utilisateur
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Créer manuellement le profil pour cyrielle (utilisateur existant)
INSERT INTO public.profiles (
  id,
  first_name,
  last_name,
  email,
  role,
  department,
  phone,
  is_active,
  created_at,
  updated_at
)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'first_name', 'cyrielle'),
  COALESCE(raw_user_meta_data->>'last_name', 'Test'),
  email,
  COALESCE(raw_user_meta_data->>'job_role', 'a receptionist'),
  COALESCE(raw_user_meta_data->>'department', 'Front Desk'),
  COALESCE(raw_user_meta_data->>'phone', ''),
  TRUE,
  created_at,
  NOW()
FROM auth.users 
WHERE email = 'cyrielle.gonetz@gmail.com'
AND id NOT IN (SELECT id FROM public.profiles);
