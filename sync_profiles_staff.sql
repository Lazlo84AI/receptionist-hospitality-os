-- FONCTION DE SYNCHRONISATION profiles → staff_directory
-- Met à jour staff_directory quand profiles change

CREATE OR REPLACE FUNCTION sync_profiles_to_staff_directory()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour staff_directory avec les données de profiles
    UPDATE public.staff_directory 
    SET 
        hierarchy = NEW.hierarchy,
        first_name = COALESCE(NEW.first_name, first_name),
        last_name = COALESCE(NEW.last_name, last_name),
        email = COALESCE(NEW.email, email),
        updated_at = NOW()
    WHERE auth_user_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger sur profiles
CREATE OR REPLACE TRIGGER trigger_sync_profiles_to_staff
    AFTER INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_profiles_to_staff_directory();
