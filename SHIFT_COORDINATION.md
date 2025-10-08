# Shift Coordination Implementation

**Date:** 02/10/2025  
**Status:** Ready for testing  
**Branch:** feat/shift-coordination

---

## 🎯 OBJECTIF

Coordonner Start Shift et End Shift pour assurer la continuité des tâches entre shifts avec liaison via `shift_id`.

---

## 📊 CHANGEMENTS SQL

### Ajout de la colonne shift_id

```sql
-- Exécuté dans Supabase le 02/10/2025
ALTER TABLE task 
ADD COLUMN shift_id uuid REFERENCES shifts(id) ON DELETE SET NULL;

CREATE INDEX idx_task_shift_id ON task(shift_id);

COMMENT ON COLUMN task.shift_id IS 'ID du shift actuel qui gère cette tâche. Mis à jour à chaque nouveau shift qui reprend la tâche.';
```

---

## 📁 FICHIERS MODIFIÉS

### 1. shiftContinuityManager-v2.ts

**Changements:**
- ✂️ Supprimé les règles complexes (alwaysTransfer, conditionalTransfer)
- 🔄 Simplifié `getShiftHandover()` avec:
  - Filtrage par status: in_progress + pending uniquement
  - Critère 1: Cartes créées par mon service
  - Critère 2: Cartes assignées à mon service
  - Une requête vers profiles pour récupérer les services des UUIDs
- ➕ Ajouté `linkTasksToShift()` pour lier les cartes au nouveau shift

**Fonction clé:**
```typescript
export const linkTasksToShift = async (taskIds: string[], newShiftId: string): Promise<void>
```

---

### 2. ShiftManagement.tsx

**Changements:**
- Ajouté imports: `useStartShift`, `getShiftHandover`, `linkTasksToShift`
- Refactorisé `handleShiftStarted()` pour:
  1. Créer le shift en base avec useStartShift()
  2. Récupérer les cartes filtrées avec getShiftHandover(userService)
  3. Lier ces cartes au nouveau shift avec linkTasksToShift()
  4. Envoyer le webhook
  5. Recharger les données

---

### 3. ShiftCloseModal.tsx

**Changements:**
- Ajouté imports: `useCurrentShift`, `useEndShift`
- Supprimé l'INSERT qui créait un faux shift
- Utilise `useCurrentShift()` pour récupérer le shift actif
- Utilise `useEndShift()` pour le mettre à jour (UPDATE)
- Crée le snapshot avec `saveShiftHandover()`

---

## 🧪 PLAN DE TESTS

### TEST 1: Start Shift (Premier)

**Actions:**
1. Cliquer "Start Shift"
2. Passer les cartes du modal (s'il y en a)

**Vérifications SQL:**
```sql
-- Le shift doit être créé
SELECT id, user_id, start_time, end_time, status, service
FROM shifts
WHERE status = 'active'
ORDER BY start_time DESC
LIMIT 1;
```

**Résultat attendu:**
- status = 'active'
- end_time = null
- start_time = maintenant

---

### TEST 2: Créer des cartes

**Actions:**
1. Créer 2-3 cartes
2. Mettre différents status: pending, in_progress, completed

**Vérifications SQL:**
```sql
-- Vérifier que les cartes ont le shift_id du shift actif
SELECT 
  t.id, 
  t.title, 
  t.status, 
  t.shift_id,
  s.status as shift_status
FROM task t
LEFT JOIN shifts s ON t.shift_id = s.id
WHERE t.created_at > NOW() - INTERVAL '10 minutes'
ORDER BY t.created_at DESC;
```

**Résultat attendu:**
- shift_id = l'ID du shift actif
- Toutes les nouvelles cartes ont ce shift_id

---

### TEST 3: End Shift

**Actions:**
1. Cliquer "End Shift"
2. Passer les cartes
3. Laisser note vocale OU texte
4. Cliquer "Register Your End of Shift"

**Vérifications SQL:**
```sql
-- 1. Le shift doit être completed
SELECT id, start_time, end_time, status, voice_note_url, handover_notes
FROM shifts
ORDER BY end_time DESC NULLS LAST
LIMIT 1;

-- 2. Un handover doit être créé
SELECT 
  id, 
  from_shift_id,
  jsonb_array_length(handover_data->'all_tasks') as total_tasks,
  handover_data->'tasks_by_status'
FROM shift_handovers
ORDER BY created_at DESC
LIMIT 1;
```

**Résultat attendu:**
- status = 'completed'
- end_time = maintenant
- voice_note_url ou handover_notes rempli
- Un handover avec toutes les cartes archivées

---

### TEST 4: Start Shift (Deuxième) - LE PLUS IMPORTANT

**Actions:**
1. Cliquer "Start Shift" à nouveau
2. Observer quelles cartes apparaissent

**Console attendue:**
```
🚀 Starting shift...
👤 User service: reception
✅ Shift created: <nouveau-uuid>
📦 X cartes archivées trouvées
✅ Carte "XXX" transférée (pending)
✅ Carte "YYY" transférée (in_progress)
📦 Carte "ZZZ" archivée (completed)
📊 2/3 cartes transférées à reception
🔗 Liaison de 2 tâches au shift <nouveau-uuid>
✅ Shift start complete!
```

**Vérifications SQL:**
```sql
-- Les cartes transférées doivent avoir le nouveau shift_id
SELECT 
  t.id,
  t.title,
  t.status,
  t.shift_id,
  s.status as shift_status,
  s.start_time
FROM task t
JOIN shifts s ON t.shift_id = s.id
WHERE t.status IN ('pending', 'in_progress')
ORDER BY s.start_time DESC;
```

**Résultat attendu:**
- Les cartes pending/in_progress ont le nouveau shift_id
- La carte completed garde l'ancien shift_id
- Toast: "X tasks transferred from previous shift"

---

## ❌ PROBLÈMES POSSIBLES

### "User service not found"
```sql
-- Vérifier que le user a un service
SELECT id, email, service FROM profiles WHERE id = '<user-id>';

-- Si null, mettre à jour:
UPDATE profiles SET service = 'reception' WHERE id = '<user-id>';
```

### "No active shift found"
- Faire Start Shift avant End Shift

### Aucune carte transférée
```sql
-- Vérifier le dernier handover
SELECT handover_data->'all_tasks' 
FROM shift_handovers 
ORDER BY created_at DESC 
LIMIT 1;

-- Vérifier que les cartes ont un created_by
SELECT id, title, created_by FROM task WHERE created_by IS NOT NULL;
```

---

## 🎯 CHECKLIST FINALE

Avant de dire que ça marche, vérifie :
- [ ] Premier Start Shift crée un shift avec status='active'
- [ ] Nouvelles cartes ont le shift_id du shift actif
- [ ] End Shift met à jour le shift avec status='completed'
- [ ] End Shift crée un snapshot dans shift_handovers
- [ ] Deuxième Start Shift crée un NOUVEAU shift
- [ ] Les cartes pending et in_progress sont transférées
- [ ] Les cartes completed ne sont PAS transférées
- [ ] Les cartes transférées ont le shift_id du nouveau shift

---

## 📞 ACCÈS CLAUDE

Lien direct: https://claude.ai/share/44d2e8c3-4a81-4bd2-9bf4-55c78dacea23

---

*Document créé le 02/10/2025 - Prêt pour tests*