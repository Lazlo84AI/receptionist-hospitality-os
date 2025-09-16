-- DIAGNOSTIC 5: VÉRIFIER AUTH USERS
-- Pour voir les utilisateurs authentifiés

SELECT 
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 5;
