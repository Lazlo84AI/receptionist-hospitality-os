-- DIAGNOSTIC 6: CORRESPONDANCE AUTH <-> PROFILES
-- Pour voir quels profils sont liés à auth.users

SELECT 
    'auth_with_profile' as type,
    COUNT(*) as count
FROM auth.users u
WHERE EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id)

UNION ALL

SELECT 
    'auth_without_profile' as type,
    COUNT(*) as count
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id)

UNION ALL

SELECT 
    'profile_without_auth' as type,
    COUNT(*) as count
FROM profiles p
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.id);
