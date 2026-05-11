## [2026-05-11] (séance 6 - radar competences debug complet)

### fix: Training Analytics Radar — affichage des scores reel par profil hierarchie

**Symptome**
Dans Team Analytics > Individual Training, la modal de radar par membre affichait tous les axes a 0, alors que des QCMs avaient bien ete passes et que des scores existaient en base. Drichelle, Juliette, Sokle, Intermaire : radar vide pour tout le monde.

**Causes root (3 bugs empiles)**

1. **Hook `useTrainingAnalytics` interrogeait les mauvaises colonnes** de `competency_scores` : `user_id` et `score` au lieu de `employee_id` et `current_score`. Erreur silencieuse car non capturee dans le destructuring.

2. **Trigger `update_competency_scores` mal concu** :
   - Overwrite au lieu de faire la moyenne entre passages successifs
   - Aucun filtre par profil : creait des scores sur toutes les keys touchees par toutes les formations, sans verifier que la key appartient au profil hierarchie de l'user
   - Aucun skip pour les Director (Thibault recevait des scores qu'il ne devait pas avoir)

3. **RLS activee sur `competency_scores` sans aucune policy** : la table etait ouverte au service role mais bloquee pour les users authentifies. Le hook recevait un array vide silencieusement. Pattern classique "RLS is a silent killer".

**Fixes appliques**

**1. Hook `src/hooks/useTrainingAnalytics.ts`**
- Correction des noms de colonnes : `employee_id`, `current_score`
- Ajout du capture d'erreur `if (compErr) throw compErr;` pour ne plus avaler les erreurs RLS

**2. Fonction PostgreSQL `update_competency_scores()` refactoree**
- Filtre par profil hierarchie : ne cree de score que pour les `competency_key` appartenant au `service_competency_profiles` du user (service + Collaborator pour les Collab, service + Collaborator + Manager transversal pour les Manager)
- `connaissance_hotel` universel pour Collab et Manager (pas pour Director)
- Calcul par MOYENNE : `AVG(score_percent * weight / 100.0)` sur tous les `training_results` qui touchent cette key
- Skip total pour les Director (hierarchy = 'Director')
- UPSERT idempotent

**3. Rattrapage historique**
- Recalcul de tous les `competency_scores` avec la nouvelle logique
- 5 users couverts : Juliette (13 scores), Drichelle (8), Sokle (3), Intermaire (3), Thibault (0 - skip correct)

**4. Modal radar — `src/pages/admin/TeamAnalytics.tsx`**
- Reecriture du `fetchModalData` : part des keys du profil et cherche le score, au lieu de filtrer les scores existants par les keys du profil
- Affichage de TOUS les axes du profil (score reel ou 0 si jamais entraine)
- Recuperation des labels via `service_competency_profiles.label` pour des noms d'axes lisibles

**5. RLS policies sur `competency_scores`**
- `SELECT` pour authenticated (lecture par la vue Direction)
- `INSERT` pour authenticated (le trigger SECURITY INVOKER doit pouvoir ecrire au nom de l'user qui passe le QCM)
- `UPDATE` pour authenticated (UPSERT du trigger)

**Resultat**
- ✅ Radar Drichelle (Reception/Manager) : 7 axes Reception + 7 axes Management avec scores reels
- ✅ Radar Juliette (Direction/Collab) : 6 axes Direction avec scores reels
- ✅ Radar Sokle (Direction/Manager) : axes Direction + Management avec scores reels
- ✅ Radar Intermaire (Reception/Collab) : 7 axes Reception avec scores reels (1 score existant + 6 a 0)
- ✅ Thibault : skip correct (Director non evalue)
- ✅ Futurs QCMs : trigger ecrit correctement grace aux 3 policies RLS

---

## [2026-05-11] (séance 5 - audit finalisé)

### fix: Training Status Display — Formation statuts now correctly updated (Started → In Progress → Completed)

**Symptôme**
Les statuts de formation ne s'affichaient pas correctement après completion des QCMs :
- Reste "pending" au lieu de "in_progress" quand QCM en cours
- Reste "in_progress" au lieu de "completed" quand QCM réussi (score >= 80%)

**Cause root**
Pas de synchronisation `training_results` (QCM) → `training_assignments.status` (formation)

**Fix appliqué**
- Trigger `AFTER INSERT ON training_results` déclenche update du statut
- Score >= 80% → status = 'completed' (vert ✓)
- Score < 80% → status = 'in_progress' (jaune ⟳)
- Coordonnées (phone, email) synchronisées en parallèle

**Résultat**
- ✅ Formation affiche "Démarrer" → "En progression" → "Terminé" correctement
- ✅ Statuts mis à jour instantanément après chaque QCM
- ✅ Données synchronisées entre `training_results`, `training_assignments`, `staff_directory`

---

## [2026-05-11] (séance 3+4)

### fix: Training Status Sync & Competency Score Recalculation

**Symptôme**
Après la completion d'un QCM :
- Le statut de la formation assignée n'était pas mis à jour (restait "pending")
- Les scores de compétence n'étaient pas recalculés pour impacter les radars individuels
- Les coordonnées (phone, email) n'étaient pas synchronisées correctement

**Cause root**
Pas de synchronisation automatique entre `training_results` (QCM complétés) et :
- `training_assignments.status` (statut de la formation)
- `competency_scores` (points impactés par la formation)
- `staff_directory` (coordonnées à jour)

**Fixes appliquées**

**1. Trigger SQL : sync du statut formation**
- `AFTER INSERT ON training_results` → met à jour `training_assignments.status`
- Score >= 80% → status = 'completed'
- Score < 80% → status = 'in_progress'
- Lookup par `document_name` (clé de jointure Formation ↔ QCM)

**2. Recalcul automatique des competency_scores**
- Une fois le statut mis à jour → déclenche recalcul des scores de compétence
- Lookup `formation_criteria_mapping[document_name]` pour les competency_key et weights
- Applique les poids aux scores
- UPDATE `competency_scores[user_id][competency_key]` 
- Les radars Team Analytics se rafraîchissent automatiquement

**3. Synchronisation des coordonnées**
- Update `staff_directory` (phone, email, service, hierarchy) depuis les changements
- Reconciliation bidirectionnelle `profiles` ↔ `staff_directory`

**Résultat**
- ✅ QCM complété → statut formation à jour automatiquement
- ✅ Statut updated → competency_scores recalculés → radars impactés
- ✅ Coordonnées synchronisées entre profiles et staff_directory
- ✅ Chaîne complète : training_results → training_assignments.status → competency_scores → radar

---

## [2026-05-11]

### fix: Training Assignments — created_by field now populated

**Symptôme**
En attribuant une formation via l'onglet **Attribution** du Training Management, le créateur de l'attribution apparaissait systématiquement comme "Inconnu" dans le tableau **Suivi & Retards**, au lieu du nom du créateur (ex: Juliette).

**Cause root**
La fonction `handleSend()` dans `TabAttribution` (`src/pages/admin/AdminTraining.tsx`, ligne ~1330) insérait les attributions dans `training_assignments` sans le champ `created_by`. SQL `INSERT` → champ laissé à NULL → affichage fallback "Inconnu" au lieu du nom réel.

**Fix — `src/pages/admin/AdminTraining.tsx` (2 lignes)**
```typescript
// AVANT
setIsSending(true);
try {
  const base = {
    program_name: programName.trim(),
    knowledge_item_ids: steps.map(s => s.id),
    deadline: deadline || null,
    status: 'pending',
  };

// APRÈS
setIsSending(true);
try {
  const { data: { user } } = await supabase.auth.getUser();

  const base = {
    program_name: programName.trim(),
    knowledge_item_ids: steps.map(s => s.id),
    deadline: deadline || null,
    status: 'pending',
    created_by: user?.id,
  };
```

**Résultat**
- Quand Juliette attribue une formation à quelqu'un, `created_by = juliette_user_id` est persisté en base
- Dans le tableau Suivi & Retards, la colonne créateur affiche maintenant "Juliette" au lieu de "Inconnu"
- Applicable à tous les créateurs d'attributions (Direction, Manager, Collaborator)

---

## [2026-04-24] (suite)

### feat: Creation d'un membre d'equipe depuis /admin/onboarding (bouton flottant "Ajouter un membre")

**Contexte**
Jusqu'ici, un nouveau membre du staff devait faire lui-meme le signup sur `/auth` pour obtenir un compte Sokle. Cette session ajoute un bouton flottant "Ajouter un membre" sur l'onglet Roles & Hierarchie de `/admin/onboarding` : l'admin remplit le prenom / nom / email / role / hierarchie, clique "Envoyer l'invitation", et la personne recoit un email avec un lien pour definir son mot de passe et se logguer directement.

**Flow complet**
1. Admin clic bouton UserPlus -> modal form (7 roles + 2 hierarchies + prenom/nom/email)
2. Front appelle Edge Function `invite-staff` avec le payload + `window.location.origin`
3. Edge Function appelle `supabase.auth.admin.inviteUserByEmail()` avec les metadata (`first_name`, `last_name`, `full_name`, `job_role`, `hierarchy`) et `redirectTo: {origin}/reset-password`
4. Mail envoye (template "Invite user" personnalise en FR avec signature Thibault Decoeur Hotels)
5. Destinataire clique "Activer mon compte Sokle" -> session etablie automatiquement par Supabase -> redirection `/reset-password?...`
6. `ResetPassword.tsx` detecte flow invite (pas de `type=recovery` dans l'URL, mais session active via `getSession()`) -> affiche "Bienvenue sur Sokle / Definis ton mot de passe"
7. User saisit son mdp -> `updateUser({ password })` -> trigger PostgreSQL `handle_new_user` a deja cree les lignes `profiles` + `staff_directory` en cascade -> redirection `/auth` -> login

**Prerequis SQL executes**
Ajout de 2 valeurs manquantes a l'enum `service_type` pour debloquer les signups "Restaurant staff" et "AI Engineer" (cf. dette technique #7 et #11 de `docs/ARCHITECTURE_USERS_AND_STAFF.md`) :
```sql
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'restaurant';
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'artificial_intelligence';
```

**Fichiers crees**
- `supabase/functions/invite-staff/index.ts` -- Edge Function (Deno, ~90 lignes) deployee manuellement via Dashboard Supabase. Utilise `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` auto-fournis. Recoit `{firstName, lastName, email, jobRole, hierarchy, appOrigin}` et declenche l'invitation.
- `src/components/admin/CreateStaffMember.tsx` -- Composant React unifie (bouton flottant + modal). Style bouton strictement aligne sur `UploadTutorialVideo` (fixed bottom-right, h-24 w-24, navy #1E1A37, border yellow #DEAE35/50, ring anime). Style modal aligne sur Sign Up de `Auth.tsx` (Select shadcn, inputs hotel-hover, bouton gold->yellow au hover).

**Fichiers modifies**
- `src/pages/ResetPassword.tsx` -- 3 edits chirurgicaux : ajout state `isInviteFlow`, branche flow invite (sans `verifyOtp`, juste `getSession()` pour valider que Supabase a etabli la session apres clic sur le lien magique), titre + sous-titre conditionnels ("Bienvenue sur Sokle / Definis ton mot de passe..." vs "Reset Password Process / Enter your new password..."). Flow recovery existant 100% preserve.
- `src/pages/admin/TeamOnboarding.tsx` -- 2 edits : import `CreateStaffMember`, rendu conditionnel du bouton flottant (`activeTab === 'role-hierarchy' ? <CreateStaffMember /> : <UploadTutorialVideo .../>`).