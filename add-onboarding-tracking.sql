-- Ajouter colonne onboarding_views_count dans profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_views_count integer DEFAULT 0;

-- Fonction pour incrémenter le compteur
CREATE OR REPLACE FUNCTION increment_onboarding_views(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET onboarding_views_count = onboarding_views_count + 1
  WHERE id = user_uuid;
END;
$$;
