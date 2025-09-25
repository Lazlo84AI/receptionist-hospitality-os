-- ===============================================
-- ANALYSE COMPLÈTE STRUCTURE TABLE TASK
-- Objectif: Identifier TOUS les champs manquants
-- ===============================================

-- 1. STRUCTURE COMPLÈTE - Toutes les colonnes existantes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'task'
ORDER BY ordinal_position;

-- 2. COLONNES SPÉCIFIQUES POUR CLIENT_REQUEST
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'task'
  AND column_name IN (
    'guest_name',      -- ✅ ON VIENT DE L'AJOUTER
    'room_number',     -- ❌ PROBABLEMENT MANQUANT
    'location',        -- ✅ DEVRAIT EXISTER
    'recipient',       -- ❌ PROBABLEMENT MANQUANT (pour follow_up)
    'client_name',     -- ❌ DOUBLON ?
    'assigned_to',     -- ✅ DEVRAIT EXISTER
    'service',         -- ✅ DEVRAIT EXISTER
    'category',        -- ✅ DEVRAIT EXISTER
    'origin_type',     -- ✅ DEVRAIT EXISTER
    'priority',        -- ✅ DEVRAIT EXISTER
    'status',          -- ✅ DEVRAIT EXISTER
    'title',           -- ✅ DEVRAIT EXISTER
    'description'      -- ✅ DEVRAIT EXISTER
  )
ORDER BY column_name;

-- 3. RECHERCHER COLONNES SIMILAIRES POUR MAPPING
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'task'
  AND (
    column_name ILIKE '%room%' OR
    column_name ILIKE '%location%' OR 
    column_name ILIKE '%recipient%' OR
    column_name ILIKE '%number%' OR
    column_name ILIKE '%client%' OR
    column_name ILIKE '%guest%'
  )
ORDER BY column_name;

-- 4. ÉCHANTILLON DE DONNÉES POUR COMPRENDRE L'USAGE
SELECT 
    id,
    title,
    category,
    guest_name,           -- ✅ NOUVEAU
    location,             -- VOIR SI ÇA EXISTE
    service,
    origin_type,
    assigned_to,
    created_at
FROM task 
ORDER BY created_at DESC 
LIMIT 5;

-- 5. COMPTER LES COLONNES PAR CATÉGORIE D'IMPORTANCE
SELECT 
    'TOTAL COLONNES' as type,
    COUNT(*) as count
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'task'

UNION ALL

SELECT 
    'COLONNES CLIENT-RELATED' as type,
    COUNT(*) as count
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'task'
  AND column_name IN ('guest_name', 'room_number', 'location', 'recipient');
