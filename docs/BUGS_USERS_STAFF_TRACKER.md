# 🐛 BUGS & CHANGES — Architecture Users / Profiles / Staff Directory

**Document de référence multi-session**
**Créé le** : 2026-05-27 (séance 8)
**Dernière mise à jour** : 2026-05-27
**Auteur audit** : Wilfried + Claude (CTO/architect)
**Périmètre** : tout ce qui touche à `auth.users`, `public.profiles`, `public.staff_directory`, les triggers de sync, et l'UI `/admin/onboarding`

---

## 📑 Comment utiliser ce document

- Chaque bug a un **ID stable** (B-01, B-02, etc.) qui ne change jamais
- Chaque ID a un **statut** : `🔴 OUVERT` / `🟢 RÉSOLU` / `🟡 EN COURS` / `⚪ DIFFÉRÉ`
- Chaque fix résolu pointe vers le **commit Git** qui le contient
- Les bugs sont **groupés par couche** (formulaire → trigger → UI) puis par criticité décroissante
- À la fin : **roadmap des sessions** restantes avec dépendances

---

## 🗂️ Index rapide

| ID | Titre | Couche | Criticité | Statut |
|----|-------|--------|-----------|--------|
| B-01 | Trigger 2 matche par `last_name` seul, non déterministe | Trigger | 🔴 Critique | 🔴 OUVERT |
| B-02 | Récursion infinie potentielle du trigger 2 | Trigger | 🔴 Critique | 🔴 OUVERT |
| B-03 | `EXCEPTION WHEN OTHERS THEN RAISE WARNING` (silent killer) | Trigger | 🔴 Critique | 🔴 OUVERT |
| B-04 | Trigger 2 `UPDATE staff_directory SET id = NEW.id` casse PK | Trigger | 🔴 Critique | 🔴 OUVERT |
| B-05 | FK orphelines : seules task.created_by/assigned_to mises à jour | Trigger | 🔴 Critique | 🔴 OUVERT |
| B-06 | Trigger 2 INSERT hardcode `role='receptionist'` | Trigger | 🟠 Élevé | 🔴 OUVERT |
| B-07 | `COALESCE(NEW.service, sd.service)` garde la valeur polluée | Trigger | 🟠 Élevé | 🔴 OUVERT |
| B-08 | Fallback `ELSE 'reception'` quand job_role absent du metadata | Trigger 1 | 🟠 Élevé | 🔴 OUVERT |
| B-09 | `profiles.updated_at` ne se met pas à jour automatiquement | Trigger | 🟡 Moyen | 🔴 OUVERT |
| B-10 | Espaces parasites dans first_name/last_name (pas de trim au signup) | Trigger 1 | 🟢 Faible | 🔴 OUVERT |
| B-11 | Dropdown SERVICES UI incompatible avec enum service_type | UI | 🔴 Critique | 🟢 **RÉSOLU** (commit 45e5697) |
| B-12 | Badge "Accès Sokle" ment pour comptes email non confirmé | UI | 🟠 Élevé | 🟢 **RÉSOLU** (commit 45e5697) |
| B-13 | Bouton "Supprimer" ne supprime que staff_directory | UI/Backend | 🔴 Critique | 🔴 OUVERT |
| B-14 | Pas de bouton "Valider l'email" dans l'admin | UI/Backend | 🟠 Élevé | 🔴 OUVERT |
| B-15 | TabAttribution écrit labels FR pollués dans video_assignments | UI | 🟡 Moyen | 🔴 OUVERT |
| B-16 | TabSuivi a son propre `<select>` hardcodé avec valeurs polluées | UI | 🟡 Moyen | 🔴 OUVERT |
| B-17 | Pas d'UI de rattachement assisté au signup | UX | 🟠 Élevé | 🔴 OUVERT |
| B-18 | Pas de validation côté front (longueur mdp, regex email) | UX | 🟢 Faible | 🔴 OUVERT |
| B-19 | Message post-signup trompeur ("vous pouvez vous connecter") | UX | 🟡 Moyen | 🔴 OUVERT |
| B-20 | Pas de détection de collision last_name au signup | UX | 🟡 Moyen | 🔴 OUVERT |

| ID données | Titre | Statut |
|------------|-------|--------|
| D-01 | Mois Dumitrita : profile.service = `reception` au lieu de `housekeeping` | 🟢 **RÉSOLU** |
| D-02 | Kyungu Ebongo : email_confirmed_at = NULL | 🔴 OUVERT |
| D-03 | Sandra Mangudi : email_confirmed_at = NULL | 🔴 OUVERT |
| D-04 | Léonie Doua : profile sans staff_directory (trigger planté) | 🔴 OUVERT |
| D-05 | Mélanie Tavares : doublon sd (fantôme 70418d66 + auth 9d20cf22) avec 11 tasks orphelines | 🔴 OUVERT |
| D-06 | Remy Gervais : staff parti, impossible à supprimer aujourd'hui | 🔴 OUVERT |
| D-07 | Shami Martin : compte test mailinator à supprimer | 🔴 OUVERT |
| D-08 | Pierre Test : compte test sans sd, statut à clarifier | 🔴 OUVERT |
| D-09 | sd.service polluées (`Réception`, `Petit Dejeuner`, capitales) sur ~7 lignes | 🔴 OUVERT |
| D-10 | sd.role hardcodé `receptionist` sur ~18 lignes (faux pour Room Attendant etc.) | 🔴 OUVERT |
| D-11 | Tsira Batsikadze (arrêt maladie) : sd seed sans auth, à conserver | ⚪ DIFFÉRÉ |
| D-12 | Patrick Castagne (arrêt maladie) : sd seed sans auth, à conserver | ⚪ DIFFÉRÉ |
| D-13 | Natia Shvirtaridze (arrêt maladie longue) : sd seed sans auth, à conserver | ⚪ DIFFÉRÉ |
| D-14 | Rachida Zarrouki (arrêt maladie) : sd seed sans auth, à conserver | ⚪ DIFFÉRÉ |
| D-15 | Wilfried/Will/W de R : 3 comptes auth avec last_name 'de Renty' → risque collision trigger 2 | 🟡 LATENT |

---

# 🔴 PARTIE 1 — BUGS STRUCTURELS

## B-01 — Trigger `sync_profiles_to_staff_directory` matche par `last_name` seul

**Statut** : 🔴 OUVERT
**Criticité** : Critique
**Couche** : Trigger PostgreSQL

**Description**
La fonction `public.sync_profiles_to_staff_directory()` cherche une ligne sd correspondante via :
```sql
WHERE lower(trim(last_name)) = lower(trim(NEW.last_name)) LIMIT 1
```
Pas d'utilisation de `first_name`, pas d'`unaccent`, `LIMIT 1` sans `ORDER BY` → résultat **non déterministe**.

**Symptômes observés**
- 3 lignes sd ont `last_name = 'de Renty'` (Wilfried, Will, W) → tout signup d'un "de Renty" matcherait au hasard
- Cas Léonie : matche correctement mais d'autres scénarios peuvent matcher la mauvaise ligne
- Cas hypothétique : un nouvel embauché s'appelant "Doua" prendrait l'identité de "Monne Leonie Doua"

**Fix proposé**
1. Privilégier matching par `auth_user_id` (déjà existant) ou par `email` canonical (lowercase trim)
2. Si fallback nom : utiliser `unaccent(lower(trim(first_name)))` + `unaccent(lower(trim(last_name)))` ensemble
3. Si plusieurs candidats : ne matcher AUCUN et marquer le profile en `link_status = 'pending_review'` (voir B-17)

**Dépendances** : aucune
**Fichier concerné** : SQL — fonction `public.sync_profiles_to_staff_directory()`
**À traiter en** : session "Refonte trigger 2"

---

## B-02 — Récursion infinie potentielle du trigger 2

**Statut** : 🔴 OUVERT
**Criticité** : Critique
**Couche** : Trigger PostgreSQL

**Description**
À la fin du trigger, le code fait :
```sql
UPDATE public.profiles SET staff_directory_id = NEW.id WHERE id = NEW.id;
```
Cet UPDATE déclenche **à nouveau le trigger 2** (qui est `AFTER INSERT OR UPDATE`). PostgreSQL limite à 16 niveaux de récursion, après quoi il plante avec `stack depth limit exceeded`.

**Symptômes observés**
- Cas Léonie Doua : son trigger 2 a probablement épuisé la pile et planté silencieusement. Résultat : aucune ligne sd liée à son auth_user_id `70bcf914` aujourd'hui.

**Fix proposé**
Garde-fou en début de fonction :
```sql
IF pg_trigger_depth() > 1 THEN
  RETURN NEW;  -- on est dans une récursion, on sort
END IF;
```

**Dépendances** : aucune (peut être fait isolément)
**Fichier concerné** : SQL — fonction `public.sync_profiles_to_staff_directory()`
**À traiter en** : session "Refonte trigger 2"

---

## B-03 — `EXCEPTION WHEN OTHERS THEN RAISE WARNING` (silent killer)

**Statut** : 🔴 OUVERT
**Criticité** : Critique
**Couche** : Trigger PostgreSQL

**Description**
Toute la logique du trigger 2 est enveloppée dans un bloc :
```sql
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '...';
  RETURN NEW;
```
**Toute erreur** (PK violation, type mismatch, contrainte FK, etc.) devient un simple WARNING **invisible côté front**. Le signup réussit côté auth mais la sync sd peut planter sans notification.

**Symptômes observés**
- Cas Léonie : trigger planté = aucune trace côté UI
- Cas hypothétiques : tous les futurs signups qui font planter le trigger seront silencieux

**Fix proposé**
1. Remplacer `RAISE WARNING` par insertion dans une table d'audit `system_events`
2. Ou : raise une `EXCEPTION` typée qui propage côté front et le UI affiche un message "erreur de sync, contacter l'admin"
3. Garder un mécanisme de non-rollback du signup auth (ne pas bloquer la création du compte si la sync sd échoue)

**Dépendances** : table `system_events` à vérifier qu'elle existe (déjà mentionnée dans la mémoire projet)
**Fichier concerné** : SQL — fonction `public.sync_profiles_to_staff_directory()`
**À traiter en** : session "Refonte trigger 2"

---

## B-04 — Trigger 2 réécrit la PK de staff_directory (UPDATE SET id = NEW.id)

**Statut** : 🔴 OUVERT
**Criticité** : Critique
**Couche** : Trigger PostgreSQL

**Description**
Quand le trigger trouve une ligne sd matchant par last_name, il fait :
```sql
UPDATE staff_directory SET id = NEW.id WHERE id = old_staff_id;
```
Cette opération **change la PK**. Si NEW.id existe déjà comme PK dans staff_directory → violation contrainte → trigger plante → catch silencieux (B-03).

**Symptômes observés**
- Cas Mélanie Tavares : 2 lignes sd (fantôme 70418d66 + auth 9d20cf22). Toute modification de profile Mélanie déclenche le trigger, qui tente de mettre l'id de la ligne fantôme à 9d20cf22 → conflit PK → silence (B-03)

**Fix proposé**
Architecturer le système pour que la PK de `staff_directory` ne soit **JAMAIS modifiée**. Au lieu de changer l'id :
1. Conserver la ligne sd existante avec son id d'origine
2. Mettre à jour seulement `auth_user_id`, `email`, et autres champs profile-driven
3. Stocker la PK sd dans `profiles.staff_directory_id` (déjà existant) pour la liaison

**Dépendances** : B-05 (FK propagation)
**Fichier concerné** : SQL — fonction `public.sync_profiles_to_staff_directory()`
**À traiter en** : session "Refonte trigger 2"

---

## B-05 — FK orphelines : seules task.created_by et task.assigned_to sont propagées

**Statut** : 🔴 OUVERT
**Criticité** : Critique
**Couche** : Trigger PostgreSQL + schéma DB

**Description**
Quand le trigger change la PK sd (B-04), il met à jour uniquement `task.created_by` et `task.assigned_to`. Mais d'autres tables référencent sd.id ou profiles.id :
- `shifts.user_id`
- `training_results.user_id`
- `training_assignments.assigned_to`, `.created_by`
- `comments.user_id`
- `task_comments.user_id`
- `notifications.user_id`
- `activity_logs.user_id`
- `incidents.assigned_to`, `.created_by`, `.assigned_member_ids`
- `internal_tasks.assigned_to`, `.created_by`, `.assigned_member_ids`
- `follow_ups.assigned_to`, `.assigned_member_ids`
- `client_requests.assigned_to`, `.assigned_member_ids`
- `task_members.user_id`
- `task_updates.user_id`

**Symptômes observés**
Pas de symptôme visible aujourd'hui (parce que B-04 plante avant d'arriver là), mais latent dans tous les cas où le trigger réussit son UPDATE id.

**Fix proposé**
Solution architecturale : ne plus changer la PK (B-04). Si malgré tout on doit gérer des FK orphelines historiques, créer une fonction de migration `migrate_user_references(old_id uuid, new_id uuid)` qui update toutes les tables référençantes en une transaction.

**Dépendances** : B-04 doit être résolu en amont
**Fichier concerné** : SQL — schéma + fonctions
**À traiter en** : session "Refonte trigger 2"

---

## B-06 — Branche INSERT du trigger 2 hardcode `role='receptionist'`

**Statut** : 🔴 OUVERT
**Criticité** : Élevé
**Couche** : Trigger PostgreSQL

**Description**
Quand le trigger ne trouve pas de ligne sd matchant, il INSERT une nouvelle ligne avec :
```sql
INSERT INTO staff_directory (..., role, department, job_title)
VALUES (..., 'receptionist', 'Reception', 'Receptionist')
```
Ces 3 valeurs sont hardcodées, **peu importe le job_role réel** (Room Attendant, AI Engineer, etc.).

**Symptômes observés**
- Euridece, Kyungu, Rebecca, Sandra ont signup avec `job_role = 'Room Attendant'` → sd.role est `'receptionist'` (faux) (cas D-10)
- Amelie Trengan signup avec `'Restaurant staff'` → sd.role `'receptionist'` (faux)

**Fix proposé**
Mapper `job_role` du metadata vers `sd.role` via le même CASE que `handle_new_user` :
```sql
INSERT INTO staff_directory (..., role, department, job_title)
VALUES (..., 
  NEW.raw_user_meta_data->>'job_role',
  CASE WHEN NEW.service = 'housekeeping' THEN 'Housekeeping' ELSE 'Reception' END,
  ...
)
```

**Dépendances** : aucune
**Fichier concerné** : SQL — fonction `public.sync_profiles_to_staff_directory()`
**À traiter en** : session "Refonte trigger 2"

---

## B-07 — `COALESCE(NEW.service, sd.service)` garde la valeur polluée

**Statut** : 🔴 OUVERT
**Criticité** : Élevé
**Couche** : Trigger PostgreSQL

**Description**
Le trigger fait :
```sql
UPDATE staff_directory SET 
  service = COALESCE(NEW.service, staff_directory.service),
  hierarchy = COALESCE(NEW.hierarchy, staff_directory.hierarchy)
```
La logique COALESCE **garde l'ancienne valeur** si NEW est non-NULL. Mais ici la sémantique attendue est l'**inverse** : NEW est la source de vérité (profiles), il devrait écraser sd même si sd a déjà une valeur.

**Symptômes observés**
- Cas Mois (D-01) : profiles.service passé à `housekeeping` via UI admin. Trigger tourne. Mais sd.service reste `'Housekeeping'` (capitale polluée) parce que COALESCE garde la vieille valeur. A nécessité un UPDATE SQL manuel pour normaliser.

**Fix proposé**
```sql
UPDATE staff_directory SET 
  service = NEW.service,
  hierarchy = NEW.hierarchy
```
(Sans COALESCE. profiles fait foi.)

**Dépendances** : aucune
**Fichier concerné** : SQL — fonction `public.sync_profiles_to_staff_directory()`
**À traiter en** : session "Refonte trigger 2"

---

## B-08 — Fallback `ELSE 'reception'` quand job_role absent du metadata

**Statut** : 🔴 OUVERT
**Criticité** : Élevé
**Couche** : Trigger PostgreSQL `handle_new_user`

**Description**
La fonction `handle_new_user` mappe `raw_user_meta_data->>'job_role'` vers `profiles.service` via un CASE. Le ELSE final retourne `'reception'`. Donc tout user créé sans `job_role` dans metadata atterrit en service `reception` par défaut.

**Symptômes observés**
- Cas Mois (D-01) : explication probable de pourquoi son profile est en reception alors qu'elle a signup avec `job_role = 'Housekeeping Supervisor'`. Le CASE ne contenait peut-être pas encore cette valeur en février 2026.

**Fix proposé**
1. Au lieu de fallback à `reception`, fallback à `NULL` → impose à l'admin de définir explicitement le service via UI
2. Logger un WARNING dans system_events si job_role inconnu
3. Couvrir toutes les valeurs job_role actuelles du formulaire dans le CASE

**Dépendances** : aucune
**Fichier concerné** : SQL — fonction `public.handle_new_user()`
**À traiter en** : session "Refonte trigger 2"

---

## B-09 — `profiles.updated_at` ne se met pas à jour automatiquement

**Statut** : 🔴 OUVERT
**Criticité** : Moyen
**Couche** : Schéma DB

**Description**
Quand `profiles` est modifié (via UI ou via trigger), la colonne `updated_at` reste à sa valeur initiale. `staff_directory` a un trigger BEFORE UPDATE qui force `updated_at = now()`, mais `profiles` n'en a pas.

**Symptômes observés**
- Cas Mois (D-01 résolu) : après son UPDATE via UI, `profiles.updated_at` affichait toujours 18/02/2026 alors que la valeur avait changé.

**Fix proposé**
Créer un trigger :
```sql
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_profiles_updated_at();
```

**Dépendances** : aucune
**Fichier concerné** : SQL — schéma profiles
**À traiter en** : session "Refonte trigger 2" (par cohérence)

---

## B-10 — Espaces parasites dans first_name/last_name (pas de trim au signup)

**Statut** : 🔴 OUVERT
**Criticité** : Faible
**Couche** : Trigger PostgreSQL `handle_new_user`

**Description**
Quand `handle_new_user` insère le profile depuis `raw_user_meta_data`, aucun `trim()` n'est appliqué. Si l'utilisateur a saisi "Mois " avec un espace en fin (ou que le formulaire ajoute un espace), c'est stocké tel quel.

**Symptômes observés**
- Cas Mois (D-01) : profiles.first_name = `"Mois "` (avec espace), profiles.last_name = `"Dumitrita "` (avec espace). Visible en debug SQL.

**Fix proposé**
Dans `handle_new_user` :
```sql
trim(NEW.raw_user_meta_data->>'first_name'),
trim(NEW.raw_user_meta_data->>'last_name'),
trim(NEW.raw_user_meta_data->>'full_name')
```

**Dépendances** : aucune
**Fichier concerné** : SQL — fonction `public.handle_new_user()`
**À traiter en** : session "Refonte trigger 2" (en même temps que B-08)
**Note** : on peut aussi cleanup les espaces existants en UPDATE one-shot.

---

## B-11 — ✅ RÉSOLU — Dropdown SERVICES UI incompatible avec enum service_type

**Statut** : 🟢 RÉSOLU
**Résolu dans** : commit `45e5697` (2026-05-27)
**Criticité** : Critique
**Couche** : UI

**Description (pour mémoire)**
Le constant `SERVICES = ['Réception', 'Housekeeping', 'Petit Dejeuner', 'Maintenance', 'Direction']` dans `TeamOnboarding.tsx` (ligne 67) ne correspondait pas aux valeurs acceptées par l'enum `service_type`. Toute modification via UI plantait avec `invalid input value for enum`.

**Fix appliqué**
Ajout d'un nouveau constant `SERVICE_OPTIONS` aligné sur l'enum (value = stockage BDD, label = affichage UI). Limité à 4 services (`reception, housekeeping, maintenance, direction`). `TabRoleHierarchy` utilise `SERVICE_OPTIONS`. `TabAttribution` et `TabSuivi` continuent d'utiliser le constant `SERVICES` legacy.

**Validation**
- Modification du service de Mois via UI : ✅ aucune erreur
- Affichage en français : "Réception", "Housekeeping" etc.
- Stockage BDD : `reception`, `housekeeping` etc.

---

## B-12 — ✅ RÉSOLU — Badge "Accès Sokle" ment pour comptes email non confirmé

**Statut** : 🟢 RÉSOLU
**Résolu dans** : commit `45e5697` (2026-05-27)
**Criticité** : Élevé
**Couche** : UI

**Description (pour mémoire)**
Le badge "✓ Accès Sokle" s'affichait dès qu'un user avait `auth_user_id`, sans vérifier `email_confirmed_at`. Cas Kyungu et Sandra : compte créé mais email non confirmé → impossible de se connecter → mais badge vert affirmait le contraire.

**Fix appliqué**
1. Création de la vue `public.v_staff_auth_status` qui expose `email_confirmed_at` + un champ dérivé `access_status` (`'not_registered' | 'pending_email' | 'active'`)
2. `GRANT SELECT ... TO authenticated` sur la vue
3. Front : type `StaffRow` étendu, query enrichie, badge à 3 états (vert / orange / rouge)

**Validation**
- Kyungu et Sandra : badge orange "A créé son compte mais pas validé son mail"
- Mélanie fantôme, Monne Leonie, Tsira, Patrick, Natia, Rachida, Remy : badge rouge "Pas encore inscrit"
- Tous les autres : badge vert "Inscrit sur Sokle"

**Limitation V1 — voir B-14**
Pas de bouton "Valider manuellement" → la confirmation de Kyungu/Sandra nécessite encore un UPDATE SQL.

---

## B-13 — Bouton "Supprimer" ne supprime que staff_directory

**Statut** : 🔴 OUVERT
**Criticité** : Critique
**Couche** : UI / Backend

**Description**
Dans `/admin/onboarding > Rôles & Hiérarchie`, le bouton corbeille rouge fait actuellement :
```typescript
await supabase.from('staff_directory').delete().eq('id', sdId);
```
Donc auth.users et profiles restent intacts → le compte est toujours utilisable côté login → demi-fantôme. C'est pour ça que la cliente affirme "on n'arrive pas à supprimer Remy".

**Symptômes observés**
- Remy Gervais (D-06) : a quitté l'hôtel, mais le compte ne peut pas être totalement supprimé via l'UI actuelle (et il n'a pas d'auth de toute façon → ce cas-là devrait marcher mais déclenche peut-être un autre bug)
- Shami Martin (D-07) : compte test à supprimer

**Fix proposé**
Edge Function `delete-staff` avec :
1. Vérification que l'appelant est Direction OU Manager (via JWT)
2. Pre-check : combien de FK actives (shifts ouverts, tasks assignées, etc.) ?
   - Si non-zéro → retour `{ warning: "X shifts, Y tasks affectés" }`
   - Front demande seconde confirmation "détacher quand même ?"
3. Log dans `system_events`
4. `supabase.auth.admin.deleteUser(auth_user_id)` (cascade vers profiles via FK, cascade vers sd via FK SET NULL)
5. Si pas d'auth (cas Remy) : `DELETE FROM staff_directory WHERE id = ...` avec FK checks

**Pré-requis avant déploiement**
- Configurer les FK CASCADE / SET NULL sur toutes les tables (audit listé en B-05)
- Décider : si shifts ouverts, on bloque ou on détache ?

**Dépendances** : B-05 (audit FK), B-04/B-05 idéalement résolus
**Fichier concerné** : nouvelle Edge Function + modif `TeamOnboarding.tsx`
**À traiter en** : session "Bouton supprimer fonctionnel" (4-6h)

---

## B-14 — Pas de bouton "Valider l'email" dans l'admin

**Statut** : 🔴 OUVERT
**Criticité** : Élevé
**Couche** : UI / Backend

**Description**
Le badge orange (B-12 résolu) montre qu'un compte est en attente de confirmation email. Mais l'admin ne peut PAS débloquer la situation depuis SOCLE → doit passer par Wilfried + SQL Editor.

**Symptômes observés**
- Kyungu et Sandra (D-02, D-03) : statut visible, mais non résolvable par Juliette/Thibault

**Fix proposé**
Edge Function `confirm-staff-email` :
1. Prend un `auth_user_id`
2. Vérifie que l'appelant est Direction/Manager via JWT
3. `UPDATE auth.users SET email_confirmed_at = NOW(), confirmed_at = NOW() WHERE id = ?`
4. Log dans `system_events`
5. Front : bouton "Valider l'email" visible uniquement si badge orange

**Dépendances** : aucune (peut être fait sans le reste)
**Fichier concerné** : nouvelle Edge Function + modif `TeamOnboarding.tsx`
**À traiter en** : session courte dédiée (1h30 - 2h)

---

## B-15 — TabAttribution écrit labels FR pollués dans video_assignments

**Statut** : 🔴 OUVERT
**Criticité** : Moyen
**Couche** : UI

**Description**
Le composant `TabAttribution` (mode "par service") utilise le constant `SERVICES` legacy (Réception, Housekeeping, Petit Dejeuner...). Quand l'admin assigne une formation à un service, la valeur du label FR est écrite directement dans `video_assignments.service` (text libre).

**Symptômes observés**
- Coexistence dans `video_assignments.service` de valeurs polluées (`Réception` capitale, `Petit Dejeuner`) et valeurs propres si on assigne via une autre voie
- Cohérence cross-table compromise

**Fix proposé**
1. Convertir le constant `SERVICES` en `SERVICE_OPTIONS` (déjà fait pour TabRoleHierarchy)
2. Adapter TabAttribution pour utiliser `value` (stockage) vs `label` (affichage)
3. Migration one-shot des `video_assignments` existantes : `UPDATE video_assignments SET service = lower(unaccent(service))` avec mapping manuel pour "Petit Dejeuner" → "restaurant"

**Dépendances** : B-11 (déjà résolu — pattern à reproduire)
**Fichier concerné** : `TeamOnboarding.tsx` + migration SQL
**À traiter en** : session "Cleanup données polluées"

---

## B-16 — TabSuivi a son propre `<select>` hardcodé avec valeurs polluées

**Statut** : 🔴 OUVERT
**Criticité** : Moyen
**Couche** : UI

**Description**
Dans `TabSuivi` (filtre de service pour l'historique des formations), le `<select>` a ses options hardcodées en dur avec les valeurs polluées (Réception, Petit Dejeuner...).

**Symptômes observés**
- Si on cleanup `video_assignments.service` (B-15), ce filtre ne trouvera plus les valeurs canonicalisées tant qu'il filtre sur les labels FR

**Fix proposé**
Idem B-15 : remplacer par `SERVICE_OPTIONS` avec value/label séparés.

**Dépendances** : B-15 (à faire ensemble)
**Fichier concerné** : `TeamOnboarding.tsx`
**À traiter en** : session "Cleanup données polluées"

---

## B-17 — Pas d'UI de rattachement assisté au signup

**Statut** : 🔴 OUVERT
**Criticité** : Élevé
**Couche** : UX / Trigger / Backend

**Description**
Quand un nouveau user signup, le trigger 2 tente un rattachement automatique par last_name (B-01 — non déterministe). Pas d'UI pour que l'admin valide ou corrige ce rattachement.

**Symptômes observés**
- Cas Mélanie Tavares (D-05) : doublon créé parce que le matching automatique a fait n'importe quoi
- Cas hypothétiques futurs : tout nouveau signup avec last_name déjà connu dans sd a un risque

**Fix proposé**
1. Ajouter colonne `profiles.link_status` : `'pending_review' | 'validated'`
2. Refonte trigger 2 : ne tente PAS le rattachement automatique. Crée toujours une nouvelle ligne sd ou laisse `staff_directory_id` à NULL avec `link_status = 'pending_review'`
3. UI admin : bandeau jaune "🔔 N nouveau(x) membre(s) à valider" en haut de `/admin/onboarding > Rôles & Hiérarchie`
4. Clic sur le bandeau → modal "Rattacher Leonie Doua ?"
   - Bouton "Nouvelle entrée" (par défaut)
   - Liste des candidats sd par similarité (pg_trgm sur first+last_name avec unaccent)
   - "Monne Leonie Doua (94% similarité)" — "Joana Doua (52%)"...
5. Admin choisit. Si rattachement : on fusionne (auth_user_id sur la ligne sd existante, on supprime la nouvelle).
6. Flag passe à `validated`.

**Dépendances** : B-01, B-04 résolus en amont (trigger 2 refondu)
**Fichier concerné** : SQL (colonne + trigger refondu) + nouveau composant `PendingLinkBanner` + extension `TabRoleHierarchy`
**À traiter en** : session "UI rattachement assisté" (3-4h)

---

## B-18 — Pas de validation côté front (longueur mdp, regex email)

**Statut** : 🔴 OUVERT
**Criticité** : Faible
**Couche** : UX

**Description**
Le formulaire `Auth.tsx` n'a pas de validation visible côté front (longueur minimum du mot de passe, regex email, force du mdp). Supabase impose les règles côté serveur mais l'UX est dégradée.

**Fix proposé**
Ajouter dans `Auth.tsx` :
- Validation email regex
- Indicateur de force du mdp en temps réel
- Message "Le mot de passe doit faire au moins 8 caractères"
- Désactiver le bouton submit tant que la validation ne passe pas

**Dépendances** : aucune
**Fichier concerné** : `src/pages/Auth.tsx`
**À traiter en** : session UX dédiée (peut être combiné avec B-19, B-20)

---

## B-19 — Message post-signup trompeur

**Statut** : 🔴 OUVERT
**Criticité** : Moyen
**Couche** : UX

**Description**
Après un signup réussi, le formulaire affiche un message du genre "Account created successfully! You can now sign in", **mais** l'utilisateur ne peut PAS se connecter tant que l'email n'est pas confirmé. Source de la confusion Kyungu/Sandra.

**Fix proposé**
Remplacer par : "Compte créé. **Vérifiez votre boîte mail et cliquez sur le lien de confirmation avant de vous connecter.** Si le mail ne vient pas, vérifiez vos spams."

**Dépendances** : aucune
**Fichier concerné** : `src/pages/Auth.tsx`
**À traiter en** : session UX dédiée

---

## B-20 — Pas de détection de collision last_name au signup

**Statut** : 🔴 OUVERT
**Criticité** : Moyen
**Couche** : UX

**Description**
Si Léonie saisit "Doua" dans le form et qu'une ligne sd "Monne Leonie Doua" existe déjà, le système ne demande pas confirmation. Le trigger 2 décide au hasard (B-01).

**Fix proposé**
Au moment du blur sur le champ "Nom", faire une requête à une nouvelle fonction RPC `find_similar_staff(first_name, last_name)` qui retourne les candidats sd matchant par pg_trgm. Si > 0 candidats avec similarité > 70%, afficher un encart "Êtes-vous une de ces personnes ?" avec choix "Oui je suis [...]" / "Non, je suis nouveau".

**Dépendances** : pg_trgm activé (déjà disponible dans Supabase par défaut)
**Fichier concerné** : `src/pages/Auth.tsx` + nouvelle fonction PostgreSQL
**À traiter en** : session "UI rattachement assisté" (en parallèle de B-17)

---

# 🟢 PARTIE 2 — CAS DONNÉES SPÉCIFIQUES

## D-01 — ✅ Mois Dumitrita réalignée Housekeeping/Manager

**Statut** : 🟢 RÉSOLU (2026-05-27)
**Actions effectuées** :
1. Via UI admin (`/admin/onboarding > Rôles & Hiérarchie`) : modification de service → Housekeeping + hierarchy → Manager → propagation via trigger 2 vers staff_directory
2. UPDATE SQL manuel pour normaliser `staff_directory.service` de `Housekeeping` (capitale) à `housekeeping` (minuscule) — workaround au bug B-07

**État final** :
- `profiles.service` = `housekeeping` ✅
- `profiles.hierarchy` = `Manager` ✅
- `staff_directory.service` = `housekeeping` ✅
- `staff_directory.hierarchy` = `Manager` ✅

---

## D-02 — Kyungu Ebongo : email_confirmed_at = NULL

**Statut** : 🔴 OUVERT
**ID auth** : à retrouver via `SELECT id FROM auth.users WHERE email = 'ebongokyungu@gmail.com'`
**État** : Compte créé le 06/05/2026 à 11:52, email jamais confirmé

**Options de résolution** :
- **Option courte** (5 min) : UPDATE SQL manuel
  ```sql
  UPDATE auth.users 
  SET email_confirmed_at = NOW(), confirmed_at = NOW()
  WHERE email = 'ebongokyungu@gmail.com' 
    AND email_confirmed_at IS NULL;
  ```
- **Option longue** : attendre que B-14 soit implémenté (bouton dans UI admin), puis Juliette valide depuis SOCLE

**Après résolution** : prévenir Kyungu qu'elle peut se connecter avec son mdp d'origine, ou utiliser "Mot de passe oublié" si oublié

---

## D-03 — Sandra Kina Mangudi : email_confirmed_at = NULL

**Statut** : 🔴 OUVERT
**ID auth** : à retrouver via `SELECT id FROM auth.users WHERE email = 'sandralina2477@gmail.com'`
**État** : Compte créé le 06/05/2026 à 11:51, email jamais confirmé

**Options de résolution** : identique à D-02

---

## D-04 — Léonie Doua : profile sans staff_directory

**Statut** : 🔴 OUVERT
**ID auth** : `70bcf914-fb76-4d49-b884-9831d7056ac8`
**ID profile** : idem (70bcf914...)
**État** : 
- `auth.users` existe ✅, email confirmé ✅
- `profiles` existe ✅
- `staff_directory` lié à `70bcf914` : **INEXISTANT** ❌ (trigger 2 a planté silencieusement)
- Ligne sd fantôme `d2d5ca7c-13a5-44b2-8033-67177f147bdb` "Monne Leonie Doua" du seed initial existe sans auth_user_id

**Action de résolution** :
1. UPDATE la ligne sd fantôme : `UPDATE staff_directory SET auth_user_id = '70bcf914...' WHERE id = 'd2d5ca7c...'`
2. OU créer une nouvelle ligne sd liée à 70bcf914 + supprimer la fantôme
3. Vérifier que `profiles.staff_directory_id` pointe au bon endroit

**Pré-requis recommandé** : B-04 résolu (sinon le moindre UPDATE peut re-déclencher la cascade catastrophique)
**À traiter en** : session "Cleanup données restants"

---

## D-05 — Mélanie Tavares : doublon sd + 11 tasks orphelines

**Statut** : 🔴 OUVERT
**Lignes sd impliquées** :
- Fantôme : `70418d66-980c-4b51-acfa-023b7f90b87d` (sans auth_user_id, du seed 11/09/2025)
- Vraie : `9d20cf22-078e-4757-9aa7-f0b810c90da7` (liée à auth.users id `mélanie...`)
**Tasks impactées** : 11 tasks ont `70418d66...` dans leur `assigned_to[]`

**Action de résolution** :
1. Migration des 11 tasks :
   ```sql
   UPDATE task SET assigned_to = array_replace(assigned_to, '70418d66-...', '9d20cf22-...')
   WHERE '70418d66-...' = ANY(assigned_to);
   ```
2. Vérifier qu'aucune autre table ne référence `70418d66...`
3. DELETE de la ligne fantôme : `DELETE FROM staff_directory WHERE id = '70418d66-...'`

**À traiter en** : session "Cleanup données restants"

---

## D-06 — Remy Gervais : staff parti, à supprimer

**Statut** : 🔴 OUVERT
**ID sd** : à retrouver (un des 7 du seed du 11/09/2025, sans auth_user_id)
**État** : Parti de l'hôtel selon Thibault, "on n'arrive pas à supprimer son profil"

**Action de résolution** :
1. Vérifier les FK : Remy a-t-il des tasks, shifts, etc. ?
2. Si oui : décider quoi faire des FK (SET NULL, transférer, conserver)
3. `DELETE FROM staff_directory WHERE id = '<remy_sd_id>'`

**Pré-requis recommandé** : B-13 résolu (bouton supprimer fonctionnel) sinon il faut le faire en SQL direct
**À traiter en** : session "Cleanup données restants" OU à reporter après B-13

---

## D-07 — Shami Martin : compte test à supprimer

**Statut** : 🔴 OUVERT
**ID auth** : à retrouver via `SELECT id FROM auth.users WHERE email = 'shami123@mailinator.com'`
**État** : Compte test (mailinator), pas de ligne sd, à supprimer complètement

**Action de résolution** :
1. `DELETE FROM profiles WHERE id = '<shami_id>'`
2. `supabase.auth.admin.deleteUser('<shami_id>')` (depuis Edge Function ou Dashboard)
3. Aucune ligne sd à supprimer

**Pré-requis recommandé** : B-13 résolu, sinon il faut le faire via Dashboard Supabase manuellement
**À traiter en** : session "Cleanup données restants"

---

## D-08 — Pierre Test : compte test sans sd, statut à clarifier

**Statut** : 🔴 OUVERT
**ID auth** : `ea216ab4-9e0a-441e-8719-f611f2dde680`
**Email** : `pierre.moulin.vardez@gmail.com`
**État** : profile en `reception/Manager`, pas de ligne sd

**Action de clarification** :
- Demander à Wilfried : qui est Pierre Test ? Compte de test ? Vrai utilisateur ?
- Si test → suppression (idem D-07)
- Si vrai → recréer une ligne sd (idem D-04)

---

## D-09 — sd.service polluées sur ~7 lignes

**Statut** : 🔴 OUVERT
**Lignes connues** :
- Alioune Coulibaly : `staff_directory.service = 'Réception'` (capitale + accent)
- Islem Salhi : `staff_directory.service = 'Petit Dejeuner'` (valeur fictive)
- Et d'autres potentiellement

**Action de résolution**
1. Audit complet : `SELECT id, full_name, service FROM staff_directory WHERE service NOT IN ('reception', 'housekeeping', 'maintenance', 'direction', 'restaurant', 'ai_team', 'artificial_intelligence', NULL) ORDER BY service;`
2. Mapping manuel décidé par Juliette/Thibault :
   - `'Réception'` → `'reception'`
   - `'Petit Dejeuner'` → `'restaurant'`
   - `'Housekeeping'` capitale → `'housekeeping'`
3. UPDATE SQL en lot

**Dépendances** : B-15 et B-16 (TabAttribution et TabSuivi) doivent être adaptés en parallèle pour ne pas casser les filtres
**À traiter en** : session "Cleanup données polluées"

---

## D-10 — sd.role hardcodé `receptionist` sur ~18 lignes

**Statut** : 🔴 OUVERT
**Cas connus** :
- Euridece, Kyungu, Rebecca, Sandra : signup avec `job_role = 'Room Attendant'`, mais sd.role = `'receptionist'`
- Amelie Trengan : signup avec `'Restaurant staff'`, sd.role = `'receptionist'`
- Et probablement d'autres

**Action de résolution**
1. Backfill SQL :
   ```sql
   UPDATE staff_directory sd
   SET role = au.raw_user_meta_data->>'job_role'
   FROM auth.users au
   WHERE sd.auth_user_id = au.id 
     AND sd.role = 'receptionist'
     AND au.raw_user_meta_data->>'job_role' IS NOT NULL
     AND au.raw_user_meta_data->>'job_role' != 'Receptionist';
   ```
2. Vérifier visuellement le résultat

**Dépendances** : B-06 (fix branche INSERT du trigger 2) résolu de préférence
**À traiter en** : session "Cleanup données restants"

---

## D-11 à D-14 — Staff en arrêt maladie longue durée

**Statut** : ⚪ DIFFÉRÉ (par décision client)
**Concernés** :
- Tsira Batsikadze (Femme de chambre)
- Patrick Castagne (Veilleur de nuit)
- Natia Shvirtaridze (Femme de chambre, arrêt longue durée)
- Rachida Zarrouki (Femme de chambre)

**État** : 4 lignes sd seed 11/09/2025 sans auth_user_id, sans email, sans phone
**Décision client** : on ne contacte pas, on conserve les lignes en l'état
**Action** : aucune pour le moment. Ces lignes seront cleanées si/quand le staff revient ou quitte définitivement.

---

## D-15 — Risque collision last_name "de Renty" (latent)

**Statut** : 🟡 LATENT
**Cas** : 3 lignes sd ont `last_name = 'de Renty'` (Wilfried, Will, W). Toute modification du profile d'un de ces 3 comptes déclenche le trigger 2 qui match LIMIT 1 non déterministe (B-01).

**Action** : sera résolu structurellement quand B-01 sera fixé. Aucune action manuelle nécessaire.

---

# 🗺️ ROADMAP DES SESSIONS RESTANTES

## Session A — Refonte trigger 2 (~2h, criticité haute)
**Résout** : B-01, B-02, B-03, B-04, B-05, B-06, B-07, B-08, B-09, B-10
**Approche** :
1. Snapshot tables (déjà fait pour 27/05, à refaire au début de la session)
2. Réécrire `public.sync_profiles_to_staff_directory()` :
   - Garde-fou anti-récursion `pg_trigger_depth() = 1`
   - Matching prioritaire par `auth_user_id` (si existant)
   - Pas de modification de PK
   - COALESCE remplacé par écrasement direct
   - Branche INSERT : map du `job_role` correctement
   - Exception loggée dans system_events
3. Ajouter trigger `BEFORE UPDATE` sur `profiles` pour `updated_at`
4. Ajouter `trim()` dans `handle_new_user` + couvrir tous les job_role
5. Tests sur cas Léonie, Mélanie, Mois

## Session B — Cleanup données restants (~1h30, criticité moyenne)
**Pré-requis** : Session A faite
**Résout** : D-02, D-03, D-04, D-05, D-06, D-07, D-08, D-10
**Approche** :
1. UPDATE auth.users pour confirmer Kyungu + Sandra
2. Migration tasks Mélanie fantôme → vraie + suppression fantôme
3. Restauration Léonie (lien sd ↔ profile)
4. Suppression Shami (auth + profile + sd) via SQL/Dashboard
5. Suppression Remy (sd seul)
6. Backfill sd.role depuis raw_user_meta_data
7. Clarification Pierre Test

## Session C — Bouton supprimer fonctionnel (~4-6h, feature)
**Pré-requis** : Session A faite (pour FK propagation)
**Résout** : B-13
**Approche** :
1. Audit complet des FK pointant vers profiles.id et staff_directory.id
2. Décision policy pour chaque FK : CASCADE / SET NULL / RESTRICT
3. Edge Function `delete-staff` avec auth check + pre-check FK + cascade
4. Modal de confirmation enrichie dans `TabRoleHierarchy`
5. Câblage du bouton corbeille existant

## Session D — Bouton "Valider l'email" dans admin (~1h30)
**Pré-requis** : aucune (peut être fait avant ou après tout le reste)
**Résout** : B-14, D-02, D-03 (alternative au SQL)
**Approche** :
1. Edge Function `confirm-staff-email` avec auth check
2. UI : bouton visible uniquement si `access_status === 'pending_email'`
3. Toast de confirmation
4. Refresh de la liste après confirmation

## Session E — Cleanup données polluées (~1h, après A & B)
**Résout** : D-09, B-15, B-16
**Approche** :
1. Audit complet des `sd.service` polluées
2. Refactor TabAttribution avec `SERVICE_OPTIONS`
3. Refactor TabSuivi `<select>` hardcodé
4. UPDATE en lot des valeurs polluées
5. UPDATE en lot des `video_assignments.service` polluées
6. Test des filtres

## Session F — UX du formulaire signup (~2h, low priority)
**Résout** : B-18, B-19
**Approche** : refonte Auth.tsx avec validation temps réel, messages clairs, force du mdp

## Session G — UI de rattachement assisté (~3-4h, feature long terme)
**Pré-requis** : Sessions A et B faites
**Résout** : B-17, B-20
**Approche** :
1. Colonne `profiles.link_status` ajoutée
2. Modifier trigger 2 pour utiliser `link_status` au lieu de matching auto
3. Fonction RPC `find_similar_staff` avec pg_trgm
4. Composant `PendingLinkBanner` dans `/admin/onboarding`
5. Modal de rattachement avec candidats par similarité
6. Encart de détection au moment du blur dans Auth.tsx

---

# 📝 NOTES TRANSVERSES

## Vue `v_staff_auth_status` (créée le 2026-05-27)
```sql
CREATE OR REPLACE VIEW public.v_staff_auth_status AS
SELECT sd.id AS staff_id, sd.auth_user_id, au.email_confirmed_at,
  CASE
    WHEN sd.auth_user_id IS NULL THEN 'not_registered'
    WHEN au.email_confirmed_at IS NULL THEN 'pending_email'
    ELSE 'active'
  END AS access_status
FROM public.staff_directory sd
LEFT JOIN auth.users au ON au.id = sd.auth_user_id;
GRANT SELECT ON public.v_staff_auth_status TO authenticated;
```

## Tables d'audit (créées le 2026-05-27)
- `audit_2026_05_27_profiles` (25 lignes)
- `audit_2026_05_27_staff_directory` (29 lignes)
- `audit_2026_05_27_auth_users` (25 lignes)

RLS activée, lecture interdite côté front. Lecture admin via SQL Editor uniquement.
**À conserver** au moins jusqu'à la fin de toutes les sessions cleanup, puis archivable.

## Enum `service_type` (état au 2026-05-27)
Valeurs acceptées : `reception, housekeeping, maintenance, direction, ai_team, restaurant, artificial_intelligence`

## Enum `user_role` (état au 2026-05-27)
Valeurs acceptées : `receptionist, Housekeeping Supervisor, Room Attendant, restaurant staff, tech maintenance team, Director, Restaurant staff, Tech maintenance team, Receptionist`
**Note** : casse incohérente (doublons receptionist/Receptionist). À nettoyer en session ultérieure (pas dans le scope actuel).

---

# 🔗 HISTORIQUE DES MODIFICATIONS DE CE DOCUMENT

- **2026-05-27** — Création initiale après séance 8 (audit + fix dropdown + badge 3 états). 20 bugs (B-01 à B-20), 15 cas données (D-01 à D-15). 2 bugs résolus dans le commit 45e5697.
