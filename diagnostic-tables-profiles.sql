-- DIAGNOSTIC COMPLET DES TABLES PROFILES
-- Exécuter ce script pour comprendre la structure et le contenu

-- ========================================
-- 1. STRUCTURE DES TABLES
-- ========================================

-- PROFILES
SELECT 
    'PROFILES' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- PROFILES_ORDERED
SELECT 
    'PROFILES_ORDERED' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles_ordered'
ORDER BY ordinal_position;

-- USER_PROFILES
SELECT 
    'USER_PROFILES' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- ========================================
-- 2. CONTRAINTES ET INDEX
-- ========================================

-- Foreign Keys pour chaque table
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('profiles', 'profiles_ordered', 'user_profiles')
  AND tc.table_schema = 'public';

-- ========================================
-- 3. COMPTAGE DES DONNÉES
-- ========================================

-- Nombre d'enregistrements par table
SELECT 'profiles' as table_name, COUNT(*) as record_count FROM profiles
UNION ALL
SELECT 'profiles_ordered' as table_name, COUNT(*) as record_count FROM profiles_ordered
UNION ALL
SELECT 'user_profiles' as table_name, COUNT(*) as record_count FROM user_profiles;

-- ========================================
-- 4. ANALYSE DES DONNÉES PROFILES
-- ========================================

-- PROFILES: Structure des données
SELECT 
    'PROFILES - Sample Data' as info,
    id,
    first_name,
    last_name,
    email,
    role,
    department,
    job_role,
    hierarchy,
    is_active,
    created_at
FROM profiles 
ORDER BY created_at DESC
LIMIT 10;

-- PROFILES: Analyse des rôles et départements
SELECT 
    'PROFILES - Roles Distribution' as info,
    role,
    COUNT(*) as count
FROM profiles 
GROUP BY role
ORDER BY count DESC;

SELECT 
    'PROFILES - Departments Distribution' as info,
    department,
    COUNT(*) as count
FROM profiles 
WHERE department IS NOT NULL
GROUP BY department
ORDER BY count DESC;

-- ========================================
-- 5. ANALYSE DES DONNÉES PROFILES_ORDERED
-- ========================================

-- PROFILES_ORDERED: Structure des données
SELECT 
    'PROFILES_ORDERED - Sample Data' as info,
    *
FROM profiles_ordered 
ORDER BY created_at DESC
LIMIT 10;

-- ========================================
-- 6. ANALYSE DES DONNÉES USER_PROFILES
-- ========================================

-- USER_PROFILES: Structure des données
SELECT 
    'USER_PROFILES - Sample Data' as info,
    *
FROM user_profiles 
ORDER BY created_at DESC
LIMIT 10;

-- ========================================
-- 7. COMPARAISON DES IDs
-- ========================================

-- Vérifier si les IDs dans profiles correspondent à auth.users
SELECT 
    'ID_ANALYSIS' as analysis_type,
    'profiles_in_auth' as check_type,
    COUNT(*) as count
FROM profiles p
WHERE EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = p.id
);

SELECT 
    'ID_ANALYSIS' as analysis_type,
    'profiles_not_in_auth' as check_type,
    COUNT(*) as count
FROM profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = p.id
);

-- Lister les profiles qui n'ont pas de correspondance auth
SELECT 
    'ORPHAN_PROFILES' as info,
    id,
    first_name,
    last_name,
    email,
    role
FROM profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = p.id
)
LIMIT 20;

-- ========================================
-- 8. ANALYSE DES DOUBLONS
-- ========================================

-- Doublons par email dans profiles
SELECT 
    'PROFILES_DUPLICATES_EMAIL' as info,
    email,
    COUNT(*) as count
FROM profiles 
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1;

-- Doublons par nom complet
SELECT 
    'PROFILES_DUPLICATES_NAME' as info,
    first_name,
    last_name,
    COUNT(*) as count
FROM profiles 
GROUP BY first_name, last_name
HAVING COUNT(*) > 1 AND first_name IS NOT NULL;

-- ========================================
-- 9. RELATIONS UTILISÉES
-- ========================================

-- Tables qui référencent profiles
SELECT 
    'TABLES_REFERENCING_PROFILES' as info,
    tc.table_name,
    kcu.column_name,
    COUNT(*) as constraint_count
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND ccu.table_name = 'profiles'
  AND ccu.column_name = 'id'
  AND tc.table_schema = 'public'
GROUP BY tc.table_name, kcu.column_name
ORDER BY tc.table_name;

-- ========================================
-- 10. VÉRIFICATION AUTH UTILISATEURS RÉELS
-- ========================================

-- Auth users actuels
SELECT 
    'AUTH_USERS' as info,
    id,
    email,
    created_at,
    CASE 
        WHEN raw_user_meta_data IS NOT NULL THEN 'Has metadata'
        ELSE 'No metadata'
    END as metadata_status
FROM auth.users 
ORDER BY created_at DESC
LIMIT 10;

-- Correspondance auth.users <-> profiles
SELECT 
    'AUTH_PROFILES_MAPPING' as info,
    u.email as auth_email,
    p.email as profile_email,
    p.first_name,
    p.last_name,
    p.role,
    CASE 
        WHEN u.id = p.id THEN 'MATCHED'
        ELSE 'MISMATCHED'
    END as id_status
FROM auth.users u
FULL OUTER JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC;
