-- ÉTAPE 2: FONCTION D'AUTO-SYNC AUTH → PROFILES

-- Fonction qui s'exécute automatiquement à chaque authentification
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Vérifier si l'utilisateur existe déjà dans profiles
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    -- Créer un nouveau profil avec les données de base
    INSERT INTO public.profiles (
      id,
      email,
      first_name,
      last_name,
      full_name,
      role,
      hierarchy,
      service,
      job_title,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      SPLIT_PART(NEW.raw_user_meta_data->>'first_name', ' ', 1), -- Premier prénom
      NEW.raw_user_meta_data->>'last_name', -- Nom de famille
      CONCAT(NEW.raw_user_meta_data->>'first_name', ' ', NEW.raw_user_meta_data->>'last_name'),
      NEW.raw_user_meta_data->>'job_role', -- Role depuis le formulaire d'inscription
      NEW.raw_user_meta_data->>'hierarchy', -- Hierarchy depuis le formulaire
      CASE 
        WHEN NEW.raw_user_meta_data->>'job_role' = 'Receptionist' THEN 'reception'
        WHEN NEW.raw_user_meta_data->>'job_role' = 'Director' THEN 'direction'
        WHEN NEW.raw_user_meta_data->>'job_role' = 'Housekeeping Supervisor' THEN 'housekeeping'
        WHEN NEW.raw_user_meta_data->>'job_role' = 'Room Attendant' THEN 'housekeeping'
        WHEN NEW.raw_user_meta_data->>'job_role' = 'Tech maintenance team' THEN 'maintenance'
        WHEN NEW.raw_user_meta_data->>'job_role' = 'Restaurant staff' THEN 'restaurant'
        WHEN NEW.raw_user_meta_data->>'job_role' = 'AI Engineer' THEN 'artificial_intelligence'
        ELSE 'general'
      END,
      NEW.raw_user_meta_data->>'job_role', -- Job title = role initialement
      NOW(),
      NOW()
    );
  ELSE
    -- Si l'utilisateur existe déjà, mettre à jour l'email
    UPDATE public.profiles 
    SET 
      email = NEW.email,
      updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TRIGGER qui s'exécute à chaque nouvelle authentification
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
