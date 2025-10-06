# 🧪 GUIDE DE TEST - Shift Management System
*Créé le : 2 Octobre 2025*

## ⚠️ RÈGLES DE TEST
1. **NE PAS PRÉCIPITER** - Une phase à la fois
2. **TOUT DOCUMENTER** - Console + SQL + Screenshots
3. **VALIDER AVANT DE CONTINUER** - Chaque phase doit être validée
4. **POUVOIR REVENIR EN ARRIÈRE** - Garder traces de tout

---

## 📊 PHASE 1 : DIAGNOSTIC INITIAL (À FAIRE EN PREMIER)

### Objectif
Comprendre l'état actuel de la base de données avant de commencer les tests.

### Actions à Réaliser

#### 1.1 Vérifier les Shifts Existants
```sql
-- Dans Supabase SQL Editor
SELECT 
  id, 
  user_id, 
  start_time, 
  end_time,
  status, 
  service 
FROM shifts 
WHERE status IN ('active', 'completed')
ORDER BY start_time DESC
LIMIT 10;
```

**✅ Questions à te poser :**
- Y a-t-il un shift actif (status='active') ?
- Y a-t-il des shifts completed récents ?

#### 1.2 Vérifier les Tâches Existantes
```sql
-- Compter les tâches par statut
SELECT 
  status, 
  COUNT(*) as count,
  COUNT(shift_id) as with_shift_id
FROM task 
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY status
ORDER BY status;
```

**✅ Questions à te poser :**
- Combien de tâches en pending/in_progress/completed ?
- Est-ce que toutes les tâches ont un shift_id ?

#### 1.3 Vérifier les Handovers
```sql
-- Dernier handover
SELECT 
  id, 
  from_shift_id,
  created_at,
  jsonb_array_length(handover_data->'all_tasks') as total_tasks,
  handover_data->'tasks_by_status' as tasks_status
FROM shift_handovers
ORDER BY created_at DESC
LIMIT 1;
```

**✅ Questions à te poser :**
- Y a-t-il déjà un handover en base ?
- Combien de tâches sont archivées dedans ?

#### 1.4 Vérifier ton Profil Utilisateur
```sql
-- Ton profil
SELECT 
  id, 
  email, 
  first_name, 
  last_name, 
  service 
FROM profiles 
WHERE email = 'TON_EMAIL_ICI';
```

**✅ Question critique :**
- Est-ce que ton champ `service` est bien renseigné ? (doit être 'reception')

### 📝 RÉSULTATS ATTENDUS PHASE 1
Note ici les résultats de tes requêtes :

```
--- À COMPLÉTER ---
Shifts actifs : 
Tâches pending : 
Tâches in_progress : 
Tâches completed : 
Dernier handover : 
Mon service : 
```

**🚦 STOP ! NE PAS CONTINUER AVANT D'AVOIR COMPLÉTÉ CETTE PHASE**

---

## 🎬 PHASE 2 : TEST START SHIFT (Premier shift)

### Pré-requis
- [ ] Phase 1 complétée et documentée
- [ ] Aucun shift actif dans la base
- [ ] Service = 'reception' configuré

### Actions

#### 2.1 Ouvrir la Console du Navigateur
1. Aller sur `/shift-management`
2. Ouvrir DevTools (F12)
3. Onglet Console
4. Cliquer sur "Start Shift"

#### 2.2 Observer les Logs Console
**✅ Logs attendus :**
```
🚀 Starting shift...
👤 User service: reception
✅ Shift created: <uuid>
📦 X tasks to transfer
✅ Shift start complete!
```

#### 2.3 Vérifier dans Supabase
```sql
-- Le nouveau shift doit apparaître
SELECT * FROM shifts 
WHERE status = 'active' 
ORDER BY start_time DESC 
LIMIT 1;
```

**✅ Résultat attendu :**
- `status = 'active'`
- `end_time = null`
- `service = 'reception'`

#### 2.4 Toast Message
**✅ Message attendu :**
```
"Shift Started Successfully"
"X tasks transferred from previous shift"
```

### 📝 RÉSULTATS PHASE 2
```
--- À COMPLÉTER ---
Shift ID créé : 
Tâches transférées : 
Erreurs rencontrées : 
```

**🚦 STOP ! VALIDE CETTE PHASE AVANT DE CONTINUER**

---

## 🎨 PHASE 3 : CRÉATION DE TÂCHES PENDANT LE SHIFT

### Pré-requis
- [ ] Phase 2 validée
- [ ] Un shift actif existe

### Actions

#### 3.1 Créer 3 Tâches Test
Créer via le bouton "+" ou Voice Command :

1. **Tâche 1 - Pending**
   - Type: Client Request
   - Title: "Extra towels for room 302"
   - Status: Pending

2. **Tâche 2 - In Progress**
   - Type: Incident
   - Title: "WiFi issue room 205"
   - Status: In Progress

3. **Tâche 3 - Completed**
   - Type: Follow-up
   - Title: "Check-in Mr. Smith"
   - Status: Completed

#### 3.2 Vérifier l'Association au Shift
```sql
-- Vérifier que les tâches ont le shift_id du shift actif
SELECT 
  t.id, 
  t.title, 
  t.status, 
  t.shift_id,
  s.status as shift_status,
  s.start_time
FROM task t
LEFT JOIN shifts s ON t.shift_id = s.id
WHERE t.created_at > NOW() - INTERVAL '10 minutes'
ORDER BY t.created_at DESC;
```

**✅ Résultat attendu :**
- Les 3 tâches ont le même `shift_id`
- Le `shift_id` correspond au shift actif

### 📝 RÉSULTATS PHASE 3
```
--- À COMPLÉTER ---
Tâche 1 ID + shift_id : 
Tâche 2 ID + shift_id : 
Tâche 3 ID + shift_id : 
Shift actif ID : 
```

**🚦 STOP ! VALIDE AVANT DE PASSER À END SHIFT**

---

## 🏁 PHASE 4 : TEST END SHIFT

### Pré-requis
- [ ] Phase 3 validée
- [ ] 3 tâches créées avec différents statuts
- [ ] Un shift actif

### Actions

#### 4.1 Déclencher End Shift
1. Cliquer sur "End Shift"
2. Passer toutes les cartes du modal
3. Laisser une note vocale OU une note texte
4. Cliquer sur "Register Your End of Shift"

#### 4.2 Observer Console
**✅ Logs attendus :**
```
Starting shift save...
Found active shift: <uuid>
✅ Shift <uuid> ended successfully
Applying intelligent transfer rules...
✅ Handover sauvegardé: <uuid>
Shift completed successfully!
```

#### 4.3 Vérifier le Shift Fermé
```sql
-- Le shift doit être 'completed'
SELECT 
  id, 
  start_time, 
  end_time, 
  status, 
  voice_note_url, 
  handover_notes
FROM shifts
ORDER BY end_time DESC NULLS LAST
LIMIT 1;
```

**✅ Résultat attendu :**
- `status = 'completed'`
- `end_time` = maintenant
- `voice_note_url` OU `handover_notes` renseigné

#### 4.4 Vérifier le Handover Créé
```sql
-- Un handover doit être créé
SELECT 
  id, 
  from_shift_id,
  jsonb_array_length(handover_data->'all_tasks') as total_tasks,
  handover_data->'tasks_by_status'
FROM shift_handovers
ORDER BY created_at DESC
LIMIT 1;
```

**✅ Résultat attendu :**
- `from_shift_id` = l'ID du shift qui vient de se terminer
- `total_tasks` = 3 (toutes les cartes archivées)
- `tasks_by_status` contient les 3 statuts

### 📝 RÉSULTATS PHASE 4
```
--- À COMPLÉTER ---
Shift fermé ID : 
End time : 
Handover ID : 
Tâches archivées : 
```

**🚦 STOP ! PHASE CRITIQUE - VALIDE AVANT LE 2ÈME START SHIFT**

---

## 🔄 PHASE 5 : TEST START SHIFT #2 (Le Plus Important)

### Pré-requis
- [ ] Phase 4 validée
- [ ] Un handover existe en base
- [ ] Aucun shift actif

### Objectif
**VÉRIFIER QUE LES TÂCHES SONT BIEN TRANSFÉRÉES AU NOUVEAU SHIFT**

### Actions

#### 5.1 Déclencher Start Shift #2
1. Cliquer sur "Start Shift"
2. **NE PAS FERMER LA CONSOLE**
3. Observer attentivement les logs

#### 5.2 Observer Logs Console (CRITIQUE)
**✅ Logs attendus :**
```
🚀 Starting shift...
👤 User service: reception
✅ Shift created: <nouveau-uuid>
🔍 Récupération handover pour service: reception
📦 3 cartes archivées trouvées
👥 X utilisateurs uniques à vérifier
🗺️ Mapping créé pour X utilisateurs
✅ Carte "Extra towels..." transférée (pending)
✅ Carte "WiFi issue..." transférée (in_progress)
📦 Carte "Check-in..." archivée (completed)
📊 2/3 cartes transférées à reception
🔗 Liaison de 2 tâches au shift <nouveau-uuid>
✅ 2 tâches liées au shift <nouveau-uuid>
✅ Shift start complete!
```

#### 5.3 Vérifier le Modal
**✅ Le modal doit afficher :**
- Les 2 cartes pending et in_progress
- NE DOIT PAS afficher la carte completed

#### 5.4 Vérifier les Tâches Transférées
```sql
-- Les tâches transférées doivent avoir le NOUVEAU shift_id
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
  AND s.status = 'active'
ORDER BY s.start_time DESC;
```

**✅ Résultat attendu :**
- 2 tâches (pending + in_progress) ont le NOUVEAU shift_id
- Le shift_id est celui du shift #2 (actif)
- La tâche completed garde l'ANCIEN shift_id du shift #1

#### 5.5 Vérifier Tâche Completed
```sql
-- La tâche completed doit garder l'ancien shift_id
SELECT 
  t.id,
  t.title,
  t.status,
  t.shift_id,
  s.status as shift_status,
  s.end_time
FROM task t
JOIN shifts s ON t.shift_id = s.id
WHERE t.title = 'Check-in Mr. Smith'
ORDER BY t.created_at DESC
LIMIT 1;
```

**✅ Résultat attendu :**
- `shift_id` = ID du shift #1 (completed)
- `status` = 'completed'
- Cette tâche N'A PAS été transférée

### 📝 RÉSULTATS PHASE 5 (LA PLUS IMPORTANTE)
```
--- À COMPLÉTER ---
Nouveau shift ID : 
Tâches transférées (IDs) : 
Tâches NON transférées (IDs) : 
Modal affiche bien 2 cartes : OUI / NON
Erreurs console : 
```

---

## ❌ PROBLÈMES POSSIBLES ET SOLUTIONS

### Erreur : "User service not found"
```sql
-- Vérifier ton profil
SELECT id, email, service FROM profiles WHERE id = 'TON_USER_ID';

-- Si service = null, mettre à jour :
UPDATE profiles SET service = 'reception' WHERE id = 'TON_USER_ID';
```

### Erreur : "No active shift found"
- Normal si tu essaies End Shift sans avoir fait Start Shift
- Faire Start Shift d'abord

### Aucune tâche transférée
```sql
-- Vérifier le dernier handover
SELECT 
  handover_data->'all_tasks' 
FROM shift_handovers 
ORDER BY created_at DESC 
LIMIT 1;

-- Vérifier que les tâches ont un created_by
SELECT 
  id, 
  title, 
  status, 
  created_by 
FROM task 
WHERE created_by IS NOT NULL;
```

### Erreur de liaison des tâches
- Vérifier que `linkTasksToShift()` est bien appelé dans les logs
- Vérifier les permissions RLS sur la table `task`

---

## ✅ CHECKLIST FINALE AVANT DÉPLOIEMENT CLIENT

Avant de dire que le système fonctionne, vérifie :

- [ ] **Premier Start Shift** crée un shift avec status='active'
- [ ] **Nouvelles tâches** ont le shift_id du shift actif
- [ ] **End Shift** met à jour le shift avec status='completed'
- [ ] **End Shift** crée un snapshot dans shift_handovers
- [ ] **Deuxième Start Shift** crée un NOUVEAU shift
- [ ] **Tâches pending/in_progress** sont transférées au nouveau shift
- [ ] **Tâches completed** ne sont PAS transférées
- [ ] **Tâches transférées** ont le shift_id du nouveau shift
- [ ] **Console** n'affiche aucune erreur
- [ ] **Modal Start Shift** affiche uniquement les tâches à traiter
- [ ] **Toast messages** sont corrects et informatifs

---

## 📞 EN CAS DE PROBLÈME

Si quelque chose ne fonctionne pas :

1. **ARRÊTE LES TESTS** - Ne continue pas sur un système cassé
2. **DOCUMENTE L'ERREUR** :
   - Capture d'écran de la console
   - Copie des logs complets
   - Résultat des requêtes SQL
3. **REVIENS ICI** et note le problème
4. **DEMANDE DE L'AIDE** avec toute la documentation

---

*Fin du Guide de Test*
