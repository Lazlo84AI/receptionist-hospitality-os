-- DIAGNOSTIC 4: ÉCHANTILLON DE DONNÉES PROFILES
-- Pour voir le contenu réel

SELECT 
    id,
    first_name,
    last_name,
    email,
    role,
    department,
    job_role,
    is_active,
    created_at
FROM profiles 
ORDER BY created_at DESC
LIMIT 5;
