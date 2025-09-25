-- ===============================================
-- AJOUT CATÉGORIE TRAINING À LA TABLE TASK  
-- Date: 2025-09-25
-- ===============================================

-- 1. Ajouter "training" à l'ENUM task_category existant
ALTER TYPE public.task_category ADD VALUE 'training';

-- 2. Vérifier que l'ajout a fonctionné
SELECT enum_range(NULL::task_category) as available_categories;

-- 3. Test : Créer une training task example
INSERT INTO task (
    title,
    description,
    category,
    priority,
    status,
    service,
    origin_type,
    created_by
) VALUES (
    'Formation Sécurité Hôtelière',
    'Module d''apprentissage des procédures de sécurité en milieu hôtelier',
    'training',
    'normal',
    'pending', 
    'reception',
    'team',
    (SELECT id FROM profiles LIMIT 1) -- Utiliser le premier profile disponible
);

-- 4. Vérifier que la training task a été créée
SELECT 
    id,
    title,
    category,
    status,
    created_at
FROM task 
WHERE category = 'training'
ORDER BY created_at DESC;
