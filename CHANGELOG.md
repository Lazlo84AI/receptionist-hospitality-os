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