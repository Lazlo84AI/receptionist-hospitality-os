# Architecture `profiles` ↔ `staff_directory` — référence permanente

> **Statut** : doc de référence à jour  
> **Dernière mise à jour** : 2026-04-24  
> **Portée** : tout ce qui concerne les utilisateurs et le personnel dans la base Supabase du projet HospitalityOS / Sokle.  
> **Autres docs sur le sujet** (partiellement obsolètes, à ne pas suivre aveuglément) : `SUPABASE_TABLES.md`, `ARCHITECTURE_FONCTIONNELLE.md` (sections 1.4 et 1.5), `SIGNUP_DEBUG_GUIDE.md` (marqué obsolète en tête).

---

## TL;DR — la règle d'or

Il existe **deux tables** qui décrivent des personnes dans le système : `public.profiles` et `public.staff_directory`. Elles ne sont **pas interchangeables**.

| Cas | Source de vérité | Raison |
|---|---|---|
| Personne avec compte Sokle (`staff_directory.auth_user_id IS NOT NULL`) | **`profiles`** pour email / service / hierarchy | Valeurs propres, enum strictes, conformes au signup actuel |
| Personne sans compte Sokle (`staff_directory.auth_user_id IS NULL`) | **`staff_directory`** pour tous les champs | Pas d'alternative, la personne n'a pas de ligne `profiles` |
| Tous cas | **`staff_directory`** pour `first_name`, `last_name`, `full_name`, `phone`, `avatar_url`, `is_active`, `job_title` | Ces champs n'existent pas dans `profiles` ou ne s'y propagent pas |

**Conséquence pratique pour tout code front qui affiche du staff** :

```typescript
const display_email     = profile?.email     ?? staff.email;
const display_service   = profile?.service   ?? staff.service;
const display_hierarchy = profile?.hierarchy ?? staff.hierarchy;
// first_name, last_name, phone : toujours depuis staff_directory, pas de fallback
```

**Conséquence pratique pour tout code qui modifie du staff** :

- Champs identitaires (`first_name`, `last_name`, `full_name`, `email`, `phone`) → **toujours** UPDATE sur `staff_directory`, jamais sur `profiles`.
- Champs `service` et `hierarchy` → UPDATE sur `profiles` si `auth_user_id IS NOT NULL`, sinon UPDATE sur `staff_directory`. Le trigger `trigger_sync_profiles_to_staff` propage automatiquement `profiles → staff_directory`.

---

## 1. Vue d'ensemble

### `public.profiles` — comptes authentifiés

Contient **uniquement les utilisateurs qui ont créé leur compte Sokle** via `supabase.auth.signUp()` sur `/auth`. 1 ligne par user authentifié, PK `id = auth.users.id`.

**En prod au 24 avril 2026** : 17 lignes, 17 comptes Sokle actifs.

### `public.staff_directory` — annuaire complet du staff

Contient **tous les membres du staff de l'hôtel**, qu'ils aient ou non créé leur compte Sokle. Une personne peut être dans `staff_directory` sans jamais avoir fait de signup. C'est l'annuaire opérationnel utilisé par le reste du produit (shifts, tasks, analytics).

**En prod au 24 avril 2026** : 22 lignes — 15 avec `auth_user_id IS NOT NULL` (compte Sokle) + 7 sans (staff enregistré mais pas encore inscrit).

### Le lien entre les deux

```
auth.users.id ═══ profiles.id ═══ staff_directory.auth_user_id
                    ↑
                    │ lien inverse redondant :
                    │ profiles.staff_directory_id = staff_directory.id
                    ↓
          staff_directory.id
```

- Relation **1 ↔ 0..1** : une ligne `staff_directory` peut avoir 0 ou 1 ligne `profiles` associée via `auth_user_id`.
- Une ligne `profiles` a **toujours** une ligne `staff_directory` associée (créée par trigger au signup — voir section 4).
- Le lien inverse `profiles.staff_directory_id` existe mais est redondant et peu utilisé côté code. Le lien canonique est `staff_directory.auth_user_id = profiles.id`.

---

## 2. Schéma détaillé — `public.profiles`

| Colonne | Type | Nullable | Usage réel en prod | Remarques |
|---|---|---|---|---|
| `id` | `uuid` | NO (PK) | `= auth.users.id`, posé par le trigger au signup | Clé primaire et FK logique vers `auth.users` |
| `email` | `text` | YES | Rempli au signup, en principe toujours présent | Copié depuis `auth.users.email` par le trigger |
| `first_name` | `text` | YES | Rempli au signup depuis `raw_user_meta_data.first_name` | Pas modifié ensuite automatiquement |
| `last_name` | `text` | YES | Idem | |
| `role` | `text` | YES | **Colonne morte** — toujours NULL en prod | À ne pas utiliser, ne pas confondre avec `staff_directory.role` qui est différent |
| `hierarchy` | `text` | YES | Valeurs métier valides : `'Collaborator'`, `'Manager'` | Default `'Normal'` dans le schéma mais posé à `'Collaborator'` par le trigger. **Une ligne parasite `'Normal'` subsiste en prod** (Shami Martin, à nettoyer) |
| `service` | `service_type` (enum) | YES | Enum strict. Valeurs en prod : `reception`, `housekeeping`, `maintenance`, `direction`, `restaurant`, `ai_team` | ⚠️ `restaurant` peut ne pas être dans l'enum selon l'état du repo — vérifier avec `SELECT unnest(enum_range(NULL::service_type))`. Le trigger mappe `job_role` → `service_type` via un CASE |
| `staff_directory_id` | `uuid` | YES | FK vers `staff_directory.id`, posé par le trigger au signup | Redondant avec `staff_directory.auth_user_id`. Lien inverse peu utilisé |
| `permissions` | `jsonb` | YES | `{}` par défaut, non utilisé aujourd'hui | Prévu pour évolution futures |
| `created_at` | `timestamptz` | YES | `now()` | |
| `updated_at` | `timestamptz` | YES | `now()` | Mis à jour manuellement ou par trigger |

### Enum `service_type`

Valeurs théoriques : `reception | housekeeping | maintenance | direction | restaurant | ai_team`.

⚠️ **Bug latent identifié** : le trigger `handle_new_user` (section 4) mappe `'Restaurant staff'` → `'restaurant'`, mais `'restaurant'` peut ne pas exister dans l'enum `service_type` selon l'état de la base. Si un user signup avec ce job_role, l'INSERT dans `profiles` plantera silencieusement.

**À faire** (non fait au 24 avril) : `ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'restaurant';`

---

## 3. Schéma détaillé — `public.staff_directory`

| Colonne | Type | Nullable | Usage réel en prod | Remarques |
|---|---|---|---|---|
| `id` | `uuid` | NO (PK) | Généré à la création | Pour les lignes créées par le trigger post-signup, l'id est **écrasé** pour matcher `auth.users.id` — voir section 4 |
| `auth_user_id` | `uuid` | YES | FK logique vers `auth.users.id` | NULL si la personne n'a pas encore fait signup. C'est **le** lien canonique vers `profiles` |
| `first_name` | `text` | YES | | |
| `last_name` | `text` | YES | | |
| `full_name` | `text` | YES | Concaténation manuelle, pas de génération auto | Si tu fais un UPDATE partiel, pense à le recalculer |
| `email` | `text` | YES | Peut être différent de `profiles.email` ! | Exemple en prod : Thibault a `staff_directory.email = Thibault.desaintmartin@decoeur.com` et `profiles.email = tsm@decoeur.com`. Ne **jamais** considérer `staff_directory.email` comme la vérité pour un user avec compte Sokle |
| `phone` | `text` | YES | Champ opérationnel important | N'existe que dans `staff_directory` — pas dans `profiles` |
| `avatar_url` | `text` | YES | | |
| `role` | `user_role` (enum) | NO | **Ne pas confondre avec hierarchy**. C'est le `job_role` brut saisi au signup | Enum pollué avec doublons de casse (`receptionist` minuscule existe pour 4 lignes historiques). Valeurs théoriques : `Receptionist`, `Director`, `Housekeeping Supervisor`, `Room Attendant`, `Restaurant staff`, `Tech maintenance team`, `AI Engineer` |
| `department` | `text` | YES | Hardcodé à `'Reception'` par le trigger à la création, jamais mis à jour | **Colonne fonctionnellement inutilisée** — à ne pas se fier |
| `service` | `text` (libre, pas d'enum) | YES | ⚠️ Valeurs polluées en prod | Voir section 8. Mélange de casses et de libellés FR : `reception`, `Réception`, `housekeeping`, `Housekeeping`, `Petit Dejeuner`, `maintenance`, `direction`, NULL |
| `hierarchy` | `text` | YES | CHECK : `IN ('Collaborator', 'Manager', 'Director')` | 1 ligne `Director` en prod (à nettoyer vers `Manager`). Valeurs métier : uniquement `Collaborator` et `Manager` |
| `job_title` | `text` | YES | Rempli à `'Receptionist'` par défaut par le trigger | |
| `is_active` | `boolean` | NO | default `true` | Permet de désactiver un staff sans le supprimer |
| `onboarding_views_count` | `integer` | NO | default `0`, incrémenté via RPC | Voir doc onboarding |
| `tasks_created_total` | `integer` | NO | default `0`, incrémenté par trigger sur `task` | Compteur analytics cumulé |
| `tasks_closed_total` | `integer` | NO | default `0`, incrémenté par trigger sur `task` | Compteur analytics cumulé |
| `assistant_queries_total` | `integer` | NO | default `0`, incrémenté par trigger sur `assistant_conversations` | Compteur analytics cumulé |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | Mis à jour par trigger 3 (voir section 4) |

### Enum `user_role`

Déclaré : `Receptionist`, `Director`, `Housekeeping Supervisor`, `Room Attendant`, `Restaurant staff`, `Tech maintenance team`, `AI Engineer`.

⚠️ **Pollué historiquement** : 4 lignes avec `receptionist` minuscule existent, non-conformes à la casse de l'enum. Ces valeurs sont acceptées parce que l'enum les a reçues avant un `ALTER TYPE` de normalisation. À nettoyer lors d'un chantier dédié.

---

## 4. Flow signup et triggers PostgreSQL

Trois triggers sont impliqués dans le cycle de vie d'un user. **Ne jamais les modifier sans comprendre la chaîne complète.**

### Trigger 1 — `on_auth_user_created` sur `auth.users` (AFTER INSERT)

**Fonction exécutée** : `public.handle_new_user()`

**Déclenché** : automatiquement quand Supabase Auth insère une nouvelle ligne dans `auth.users` suite à un `supabase.auth.signUp()`.

**Effets** :
1. **INSERT dans `public.profiles`** avec les valeurs issues de `NEW.raw_user_meta_data` (métadonnées envoyées par le front au signup) :
   - `id = NEW.id` (= `auth.users.id`)
   - `email = NEW.email`
   - `first_name = NEW.raw_user_meta_data->>'first_name'`
   - `last_name = NEW.raw_user_meta_data->>'last_name'`
   - `hierarchy = COALESCE(NEW.raw_user_meta_data->>'hierarchy', 'Collaborator')`
   - `service` : résultat d'un `CASE` sur `NEW.raw_user_meta_data->>'job_role'` mappant vers `service_type` :
     - `'Receptionist'` → `reception`
     - `'Director'` → `direction`
     - `'Housekeeping Supervisor'` → `housekeeping`
     - `'Room Attendant'` → `housekeeping`
     - `'Tech maintenance team'` → `maintenance`
     - `'Restaurant staff'` → `restaurant` ⚠️ (voir bug latent section 2)
     - `'AI Engineer'` → `ai_team` (ou `artificial_intelligence` selon version du trigger — à vérifier)
     - default → `reception`
2. **Ne touche JAMAIS `staff_directory`** (c'est le trigger 2 qui s'en charge, en cascade).
3. **Ne remplit JAMAIS `profiles.role`** (reste NULL — colonne morte).
4. `SECURITY DEFINER` → bypass toutes les RLS pour l'INSERT.

### Trigger 2 — `trigger_sync_profiles_to_staff` sur `public.profiles` (AFTER INSERT OR UPDATE)

**Fonction exécutée** : `public.sync_profiles_to_staff_directory()`

**Déclenché** : après l'INSERT du trigger 1 (en cascade), **et** après tout UPDATE manuel sur `profiles` (ex: l'admin qui modifie `service` ou `hierarchy` depuis le front).

**Logique (⚠️ complexe et défectueuse à plusieurs endroits, à comprendre avant tout refactor)** :

1. Cherche une ligne existante dans `staff_directory` **par `last_name` (lowercase + trim)**. ⚠️ **Pas par email, pas par `auth_user_id`**. Logique fragile si deux staff ont le même nom ou si le nom contient des espaces/accents.
2. **Si trouvé** :
   - Change l'id de la ligne `staff_directory` pour qu'il **matche `NEW.id`** (= l'UUID auth du user). Ça veut dire que `staff_directory.id` devient égal à `auth.users.id`.
   - Met à jour `auth_user_id = NEW.id`, `email = COALESCE(NEW.email, existing.email)`, `first_name`, `service`, `hierarchy` avec la même logique `COALESCE(NEW.x, existing.x)` (garde l'existant si NEW est NULL).
   - Met à jour les FK dans la table `task` (`created_by`, `assigned_to`) pour pointer vers le nouvel UUID (puisque l'id a changé).
3. **Si non trouvé** : crée une nouvelle ligne `staff_directory` avec :
   - `role = 'receptionist'` (minuscule hardcodé — **origine des 4 lignes polluées dans l'enum**)
   - `department = 'Reception'` (hardcodé — **origine de la colonne inutilisable**)
   - `job_title = 'Receptionist'` (hardcodé)
   - `service = COALESCE(NEW.service, 'reception')`
   - `hierarchy = COALESCE(NEW.hierarchy, 'Collaborator')`
4. Met à jour `profiles.staff_directory_id = NEW.id` (lien inverse).
5. Gère les erreurs avec `RAISE WARNING` sans bloquer — les erreurs sont donc **silencieuses** dans les logs. Si un signup échoue à créer une ligne `staff_directory`, il n'y aura aucun signal côté front.

**Raison pour laquelle `staff_directory.service` contient des valeurs polluées** (ex: `'Réception'`, `'Petit Dejeuner'`) : ces lignes ont été **créées avant l'existence du trigger** ou via des scripts d'import historiques. Le trigger n'override pas les valeurs existantes si un `COALESCE` les conserve.

### Trigger 3 — `update_profiles_updated_at` sur `public.staff_directory` (BEFORE UPDATE)

Inoffensif. Met à jour `updated_at = NOW()` à chaque UPDATE de `staff_directory`. Nom trompeur (dit `profiles` mais agit sur `staff_directory`), probablement legacy.

### Diagramme de flow — signup complet

```
User clique "S'inscrire" sur /auth
          ↓
supabase.auth.signUp({ email, password, options: { data: { first_name, last_name, job_role, hierarchy } } })
          ↓
INSERT INTO auth.users (...)
          ↓
🔥 TRIGGER 1 : on_auth_user_created
          ↓
          └─→ handle_new_user()
                  ↓
                  INSERT INTO profiles (id = auth.users.id, email, first_name, last_name, service (mappé), hierarchy)
                          ↓
                          🔥 TRIGGER 2 : trigger_sync_profiles_to_staff
                                  ↓
                                  └─→ sync_profiles_to_staff_directory()
                                          ↓
                                          ├─ si staff_directory contient déjà last_name : UPDATE + changement d'id
                                          └─ sinon : INSERT nouvelle ligne avec valeurs hardcodées
                                                  ↓
                                                  UPDATE profiles SET staff_directory_id = NEW.id
          ↓
Supabase envoie email de confirmation
          ↓
User confirme → session ouverte → redirection /shift ou /admin
```

---

## 5. RLS (Row Level Security)

### Sur `public.profiles`

**État initial** (avant 24 avril 2026) — 2 policies natives Supabase :

| Nom | Cmd | Condition | Effet |
|---|---|---|---|
| `Users can view own profile` | SELECT | `auth.uid() = id` | Un user ne peut lire que sa propre ligne |
| `Users can update own profile` | UPDATE | `auth.uid() = id` | Un user ne peut update que sa propre ligne |

Aucune policy INSERT : le trigger `handle_new_user` bypass grâce à `SECURITY DEFINER`.

**Problème identifié le 24 avril 2026** : ces policies empêchent l'onglet admin de fonctionner. Quand un admin (Direction / Manager) charge `/admin/onboarding > Rôles & Hiérarchie`, le front fait `SELECT ... FROM profiles WHERE id IN (<liste de 17 UUIDs>)`. PostgREST applique la policy → ne renvoie que la ligne de l'admin connecté, les 16 autres sont filtrées silencieusement. Le code front tombe en fallback sur `staff_directory` (valeurs polluées).

**Fix appliqué le 24 avril 2026** — 1 fonction + 2 policies additives :

```sql
-- Fonction helper SECURITY DEFINER (évite la récursion RLS lors du check admin)
CREATE OR REPLACE FUNCTION public.can_access_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND (service = 'direction' OR hierarchy = 'Manager')
  );
$$;

-- Policy SELECT additive
CREATE POLICY "admins_can_view_all_profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.can_access_admin());

-- Policy UPDATE additive
CREATE POLICY "admins_can_update_all_profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.can_access_admin())
  WITH CHECK (public.can_access_admin());
```

**Règle métier reproduite dans `can_access_admin()`** : `service = 'direction' OR hierarchy = 'Manager'`. Exactement la même condition que celle implémentée côté front dans `src/hooks/useStaffService.ts` (`canAccessAdmin`) et utilisée par `src/components/AdminProtectedRoute.tsx` pour le gating des routes `/admin/*`. **Toute évolution de cette règle doit être faite aux deux endroits en même temps** (SQL + TS).

PostgreSQL combine les policies SELECT en OU logique → un user classique continue de ne voir que sa ligne, un admin voit toutes les lignes. Zéro régression, zéro suppression.

### Sur `public.staff_directory`

| Nom | Cmd | Condition | Effet |
|---|---|---|---|
| `staff_directory_select` | SELECT | `true` (tous les authenticated) | Lecture libre pour tout user connecté |
| `staff_directory_write` | ALL (INSERT/UPDATE/DELETE) | `EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.hierarchy IN ('Manager', 'Direction'))` | Écriture réservée aux Manager / Direction |

⚠️ **Attention vocabulaire** : la policy `staff_directory_write` référence `profiles.hierarchy IN ('Manager', 'Direction')`. Le mot `'Direction'` ici correspond à un **ancien vocabulaire** où la Direction était considérée comme une hiérarchie. Désormais, la règle métier est : **uniquement `Collaborator` et `Manager` sont des valeurs de hierarchy**. La "direction" est un service (`profiles.service = 'direction'`), pas une hiérarchie. Cette policy est donc **incohérente** avec la règle métier actuelle : elle attend `profiles.hierarchy = 'Direction'` qui n'existe jamais en pratique. Les users de service `direction` n'ont donc **pas accès à l'écriture** sur `staff_directory` via cette policy.

**À réconcilier lors d'un chantier dédié** : remplacer par `EXISTS (... AND (profiles.hierarchy = 'Manager' OR profiles.service = 'direction'))`, aligné avec `can_access_admin()`. Non fait au 24 avril pour rester chirurgical.

---

## 6. Règle métier absolue — "profiles fait foi"

Quand `staff_directory.auth_user_id IS NOT NULL`, **`profiles` est la source de vérité** pour les champs qu'il contient (`email`, `service`, `hierarchy`). Les valeurs correspondantes dans `staff_directory` peuvent être polluées, obsolètes, ou simplement différentes — **les ignorer**.

Exemples en prod qui illustrent pourquoi :

| Nom | `staff_directory.email` | `profiles.email` | `auth.users.email` | Valeur à afficher |
|---|---|---|---|---|
| Thibault de Saint Martin | `Thibault.desaintmartin@decoeur.com` | `tsm@decoeur.com` | `tsm@decoeur.com` | **`tsm@decoeur.com`** |
| Drichelle Astom | `NULL` | `drichelle.nina@gmail.com` | `drichelle.nina@gmail.com` | **`drichelle.nina@gmail.com`** |
| Mélanie Tavares (sans Sokle) | `NULL` | — (pas de ligne) | — | **`NULL`** (affiché "—") |

| Nom | `staff_directory.service` | `profiles.service` | Valeur à afficher |
|---|---|---|---|
| Alioune Coulibaly | `Réception` | `reception` | **`reception`** |
| Islem Salhi | `Petit Dejeuner` | `reception` | **`reception`** |
| Cyrielle Gonetz | `reception` | `reception` | `reception` (identique par chance) |
| Mélanie Tavares (sans Sokle) | `NULL` | — | **`NULL`** |

Pour les champs qui **n'existent que dans `staff_directory`** (`phone`, `avatar_url`, `is_active`, `job_title`, compteurs analytics), pas d'ambiguïté : `staff_directory` fait toujours foi.

---

## 7. Règles d'écriture — comment modifier un staff depuis l'admin

Logique à respecter dans tout code qui édite un staff (cf. `TabRoleHierarchy` dans `src/pages/admin/TeamOnboarding.tsx`) :

### Champs identitaires (`first_name`, `last_name`, `full_name`, `email`, `phone`)

→ **TOUJOURS** `UPDATE staff_directory WHERE id = {staff_id}`.  
→ **Jamais** écrire dans `profiles` pour ces champs, même si un compte Sokle existe.  
→ **Jamais** toucher à `auth.users` — on ne peut pas changer l'email auth sans confirmation user, et ce n'est pas notre rôle.

### Champs `service` et `hierarchy`

→ **Si `auth_user_id IS NOT NULL`** : `UPDATE profiles SET service = ?, hierarchy = ? WHERE id = {auth_user_id}`. Le trigger 2 (`trigger_sync_profiles_to_staff`) propagera automatiquement la valeur vers `staff_directory`.  
→ **Si `auth_user_id IS NULL`** : `UPDATE staff_directory SET service = ?, hierarchy = ? WHERE id = {staff_id}`. Pas d'autre choix puisqu'il n'y a pas de ligne `profiles`.

### Valeurs acceptées

- `hierarchy` ∈ {`'Collaborator'`, `'Manager'`}. Strictement 2 valeurs.
- `service` ∈ valeurs de l'enum `service_type` : `reception`, `housekeeping`, `maintenance`, `direction`, `restaurant` (si enum à jour), `ai_team`. Valeurs minuscules, sans accent.

Si on veut pouvoir écrire `service = 'restaurant'` sur `profiles`, prérequis : `ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'restaurant';` (non fait au 24 avril).

### Suppression d'un staff

→ `DELETE FROM staff_directory WHERE id = {staff_id}`.  
→ Aucune cascade vers `profiles` ou `auth.users`. Le compte Sokle reste actif côté auth si la personne supprimée avait `auth_user_id IS NOT NULL` — à supprimer manuellement via Supabase Auth si besoin.  
→ À matérialiser côté UI avec un avertissement jaune dans ce cas.

### Invalidation des caches TanStack Query après mutation

Query keys à invalider systématiquement :

- `staff_directory_all` (liste complète utilisée par l'admin)
- `staff_directory_active` (liste filtrée par `is_active = true`)
- `staff_directory_count` (compteur KPI)
- Selon le contexte : `profiles` lié si le code en dépend

---

## 8. Valeurs historiquement polluées — recensement

À l'état au 24 avril 2026, **à nettoyer progressivement** lors de chantiers opportunistes. Ne pas faire de migration massive sans validation (risque de casser des références).

### `staff_directory.service` (text libre)

Valeurs actuellement présentes :
- `reception` ✅ (enum propre, conforme)
- `Réception` ❌ (1+ ligne, accent + capitale)
- `housekeeping` ✅
- `Housekeeping` ❌ (capitale)
- `Petit Dejeuner` ❌ (doit être `restaurant`)
- `maintenance` ✅
- `direction` ✅
- `NULL` (8 lignes, staff sans service défini)

### `staff_directory.hierarchy`

- `Collaborator` ✅
- `Manager` ✅
- `Director` ❌ (1 ligne, à passer en `Manager`)

### `profiles.hierarchy`

- `Collaborator` ✅
- `Manager` ✅
- `Normal` ❌ (1 ligne parasite : Shami Martin, à passer en `Collaborator`)

### Enum `user_role`

Valeurs polluées avec doublons de casse :
- `receptionist` (minuscule) coexiste avec `Receptionist` (capitale) — origine : trigger 2 qui INSERT avec hardcodé `'receptionist'`

### Colonnes mortes ou inutiles

- `profiles.role` — toujours NULL, à supprimer à terme (BREAKING — vérifier qu'aucun code ne la lit)
- `profiles.hierarchy` default `'Normal'` — valeur default jamais utilisée, à passer en `'Collaborator'`
- `staff_directory.department` — hardcodé à `'Reception'`, jamais mis à jour, à supprimer à terme

---

## 9. Dette technique identifiée

Capitalisée ici pour orienter les chantiers futurs. **Aucune action n'est urgente à la date du 24 avril.**

| # | Problème | Gravité | Coût fix isolé | Impact si non traité |
|---|---|---|---|---|
| 1 | `profiles.role` jamais rempli (colonne morte) | Faible | 5 min | Confusion documentaire, risque d'utilisation par erreur |
| 2 | `profiles.hierarchy` default `'Normal'` jamais utilisé | Faible | 5 min | 1 ligne parasite en prod (Shami Martin) |
| 3 | `staff_directory.department` hardcodé `'Reception'` par trigger | Moyen | 30 min | Colonne inutilisable, potentielle source de confusion |
| 4 | `staff_directory.service` text libre pollué | **Élevé** | 2-3 h | Affichage incohérent si la règle "profiles fait foi" est oubliée ; requêtes par service fragiles |
| 5 | Trigger 2 matche par `last_name` lowercase | **Critique fragile** | 2 h | Collision si homonymes, erreurs silencieuses |
| 6 | Enum `user_role` pollué avec doublons de casse | Moyen | 1 h | Affichage incohérent, filtres cassés |
| 7 | Enum `service_type` sans `'restaurant'` (non confirmé, à vérifier) | Faible | 5 min | Signup d'un `Restaurant staff` plante silencieusement |
| 8 | Policy `staff_directory_write` mentionne `'Direction'` (ancien vocab) | Moyen | 15 min | Users service=direction bloqués en écriture sur `staff_directory` |
| 9 | ~~Pas de policy SELECT admin sur profiles~~ | ~~Critique~~ | ~~Fait 24 avril~~ | ✅ Résolu |
| 10 | ~~Pas de policy UPDATE admin sur profiles~~ | ~~Critique~~ | ~~Fait 24 avril~~ | ✅ Résolu |

**Stratégie recommandée** : nettoyage chirurgical opportuniste (à chaque fois qu'on touche une zone, on nettoie en même temps). Pas de chantier dédié tant que le produit ne change pas de stack.

---

## 10. Pièges classiques à éviter

### Piège 1 — "Je lis `staff_directory.email`, c'est plus simple"

Non. Pour un user avec compte Sokle, `staff_directory.email` peut être désynchronisé de la vérité (cas Thibault). Toujours lire `profiles.email` en priorité si `auth_user_id IS NOT NULL`.

### Piège 2 — "Je modifie `profiles.hierarchy`, le trigger va tout synchroniser"

Oui, mais **uniquement le trigger 2**. Si la personne n'a pas de ligne `staff_directory` matchant par `last_name`, une nouvelle sera créée avec des valeurs hardcodées (`role = 'receptionist'`, `department = 'Reception'`, etc.). Cas rarissime, mais à savoir.

### Piège 3 — "Je filtre `WHERE service = 'Réception'`"

Ne jamais filtrer sur des libellés UI dans une requête SQL. Utiliser les valeurs enum minuscules (`reception`). Les valeurs capitalisées dans `staff_directory.service` sont des résidus historiques et ne doivent pas être la cible de requêtes nouvelles.

### Piège 4 — "RLS ne renvoie rien, c'est que la donnée n'existe pas"

Faux. RLS filtre **silencieusement** — si la policy ne match pas, PostgREST renvoie `[]` sans erreur. Toujours vérifier dans le SQL Editor (qui tourne en service_role et bypass les RLS) si la donnée est effectivement absente. Si oui, vérifier les policies avec `SELECT * FROM pg_policies WHERE tablename = 'profiles'`.

### Piège 5 — "Je fais un `UPDATE profiles SET email = ...` pour corriger un email"

Rarement pertinent. L'email canonique est dans `auth.users.email`, pas dans `profiles.email`. Si les deux divergent, c'est que le signup a été fait avec un email A et que `auth.users.email` a été mis à jour ensuite (par re-signup, par admin, par flow de récupération). `profiles.email` n'est **pas** synchronisé automatiquement depuis `auth.users.email` après la création initiale. Pour une correction propre, passer par Supabase Auth (changement d'email avec confirmation) plutôt que par UPDATE direct sur `profiles`.

---

## 11. Fichiers et composants front qui dépendent de ces tables

Non exhaustif — pour orienter un dev/IA cherchant à comprendre les impacts d'une modif.

| Fichier | Rôle |
|---|---|
| `src/pages/admin/TeamOnboarding.tsx` | Onglet admin `Rôles & Hiérarchie` — lecture et écriture sur les deux tables, applique la règle métier |
| `src/hooks/useStaffService.ts` | Hook central — détermine `canAccessAdmin` en se basant sur la ligne profiles de l'user connecté (via la vue `v_user_task_stats`) |
| `src/components/AdminProtectedRoute.tsx` | Gating des routes `/admin/*` — s'appuie sur `useStaffService.canAccessAdmin` |
| `src/hooks/useAuth.tsx` | Récupération de la session + appel à `supabase.auth.signUp` qui déclenche toute la chaîne de triggers |
| `src/pages/Auth.tsx` | Formulaire de signup — envoie les `raw_user_meta_data` (first_name, last_name, job_role, hierarchy) utilisés par le trigger 1 |
| `src/hooks/useSupabaseData.ts` | Hook des tâches — fait le mapping UUID → nom en combinant `staff_directory` + `profiles` en fallback |
| `v_user_task_stats` (vue Supabase) | Expose les données users de façon agrégée pour les analytics — utilisée par plusieurs pages admin |

---

## 12. Historique des modifications de cette doc

- **2026-04-24** : création initiale, suite au fix RLS `admins_can_view/update_all_profiles`. Rédaction basée sur l'inspection exhaustive de la base en prod (Supabase SQL Editor), du code `TabRoleHierarchy`, des hooks `useStaffService` et `useAuth`, et des triggers SQL en place.
