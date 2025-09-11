-- Migration pour corriger l'inscription des utilisateurs
-- Ajout du trigger pour créer automatiquement les profils

-- D'abord, rétablir la contrainte de clé étrangère
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fonction pour créer automatiquement un profil quand un utilisateur s'inscrit
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role user_role := 'staff'; -- rôle par défaut
    user_hierarchy TEXT := 'Normal'; -- hiérarchie par défaut
    user_job_role TEXT;
    first_name_value TEXT;
    last_name_value TEXT;
BEGIN
    -- Extraire les métadonnées du nouvel utilisateur
    user_job_role := COALESCE(NEW.raw_user_meta_data->>'job_role', 'staff');
    user_hierarchy := COALESCE(NEW.raw_user_meta_data->>'hierarchy', 'Normal');
    first_name_value := NEW.raw_user_meta_data->>'first_name';
    last_name_value := NEW.raw_user_meta_data->>'last_name';
    
    -- Mapper le job_role vers le user_role enum
    CASE user_job_role
        WHEN 'a receptionist' THEN user_role := 'staff';
        WHEN 'Housekeeping Supervisor' THEN user_role := 'housekeeping';
        WHEN 'Room Attendant' THEN user_role := 'housekeeping';
        WHEN 'restaurant staff' THEN user_role := 'staff';
        WHEN 'tech maintenance team' THEN user_role := 'maintenance';
        ELSE user_role := 'staff';
    END CASE;
    
    -- Si c'est un Manager ou Director, ajuster le rôle
    IF user_hierarchy = 'Manager' THEN
        user_role := 'manager';
    ELSIF user_hierarchy = 'Director' THEN
        user_role := 'admin';
    END IF;
    
    -- Créer le profil
    INSERT INTO public.profiles (
        id,
        first_name,
        last_name,
        email,
        role,
        department,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        first_name_value,
        last_name_value,
        NEW.email,
        user_role,
        user_job_role,
        true,
        NOW(),
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Politique RLS pour permettre aux utilisateurs de voir leur propre profil
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);
