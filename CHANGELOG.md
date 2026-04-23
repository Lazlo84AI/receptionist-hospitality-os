## [2026-04-23]

### fix: Team Dispatch multi-device sync via Supabase (nouvelle table `user_view_configurations`)

**Contexte**
Bug remonté par le client : les staff members ajoutés dans Team Dispatch sur desktop n'apparaissaient pas sur mobile. Cause identifiée : `selectedColumns` persisté dans `localStorage`, cloisonné par navigateur/device, pas de synchronisation cross-device.

**Supabase — nouvelle table `user_view_configurations`**
```sql
CREATE TABLE public.user_view_configurations (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_dispatch_columns JSONB NOT NULL DEFAULT '[null]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
- Trigger `trg_user_view_configurations_updated_at` : mise à jour auto de `updated_at` à chaque UPDATE
- RLS activé : 3 policies (SELECT, INSERT, UPDATE) basées sur `auth.uid() = user_id`
- PK sur `user_id` → 1 ligne par user, écrasement garanti via upsert (pas d'historique, pas de duplicat)

**`src/pages/TeamDispatch.tsx` — 3 modifications chirurgicales**
- Ajout imports `useAuth` et `supabase` (lignes 12-13)
- Remplacement du `useState` localStorage par state vide `[null]` + flag `isConfigLoaded` + récupération du `user` via `useAuth()`
- Remplacement du `useEffect` localStorage par 2 `useEffect` Supabase :
  - **Load** au montage : lecture `user_view_configurations` via `.eq('user_id', user.id).maybeSingle()`. Si vide, fallback migration douce depuis `localStorage` (hydrate Supabase automatiquement)
  - **Save** automatique via `upsert` avec `onConflict: 'user_id'` à chaque changement de `selectedColumns`, gardé après `isConfigLoaded` pour éviter l'écrasement pendant l'hydratation

**Décisions d'architecture**
- Table dédiée préférée à colonne JSONB sur `profiles` : évite invalidations de cache `useProfiles` sur toutes les pages qui l'utilisent (TeamDispatch, ServiceControl, Connaissances, TeamAnalytics, Annuaire), évite déclenchement inutile du trigger `sync_profiles_to_staff_directory`, extensible aux futures préférences UI
- Nom `user_view_configurations` (pluriel cohérent avec convention projet) : accueillera à terme d'autres préférences UI (filtres ServiceControl mémorisés, carotte QCM T15, vue TeamAnalytics par défaut, etc.)
- Migration douce localStorage → Supabase au premier montage : aucun reconfiguration manuelle nécessaire pour les users existants, Thibault retrouve ses 4 colonnes existantes automatiquement
- `localStorage` pas supprimé après migration : reste comme fallback pour simplifier un éventuel revert

**Test bout-en-bout validé**
- Desktop Chrome : config localStorage existante migrée automatiquement vers Supabase au 1er montage (ligne créée avec `created_at` correct)
- Modification ultérieure de la config : 1 seule ligne en base, `updated_at` correctement mis à jour par le trigger, `created_at` inchangé (confirmation que le `upsert` fait bien UPDATE et pas INSERT)

---

### feat: T16 — Double radar Manager dans Connaissances.tsx

**`src/pages/Connaissances.tsx`**
- Ajout 3 states : `managerRadarData`, `isManagerRadar`, `isManagerRadarEmpty`
- Query parallèle sur `v_user_task_stats` pour récupérer `hierarchy` (via `auth_user_id`, même pattern que `useStaffService.ts`). Query `staff_directory` existante inchangée.
- Ajout `.eq('hierarchy', 'Collaborator')` sur la query `service_competency_profiles` métier (durcissement vu la nouvelle contrainte UNIQUE à 3 colonnes)
- Si `hierarchy === 'Manager'` : query additionnelle `service_competency_profiles` avec `.is('service', null).eq('hierarchy', 'Manager')` → 2e radar "Compétences management" (7 axes transversaux)
- Rendu desktop ET mobile : Radar Direction → Barres Direction → Radar Manager → Barres Manager (empilé verticalement, scroll dans le panneau gauche)
- Label "COMPÉTENCES MANAGEMENT" gold au-dessus de chaque bloc Manager

**Gap découvert (à régler dans une session dédiée)**
- Le trigger `sync_profiles_to_staff_directory` ne synchronise pas la colonne `hierarchy`
- Workaround : update simultané sur `profiles` + `staff_directory` lors de tout changement de hierarchy

**Test bout-en-bout validé**
- Compte sokle.decoeur passé temporairement en Manager sur les 2 tables → 2 radars empilés s'affichent (scores à 0, normal : aucune formation Manager encore mappée dans `formation_criteria_mapping`)
- Compte revert en Collaborator après validation

**À faire (prochaine session)**
- Tâche 2 : refonte `FormationCards` dans `src/pages/admin/TeamAnalytics.tsx` (1/3 radar gauche + 2/3 liste cliquable)
- Investiguer le gap trigger `sync_profiles_to_staff_directory`
- Cosmétique : doublon label "COMPÉTENCES MANAGEMENT" (radar + barres) — retirer celui des barres ou différencier

---

## [2026-04-22] (suite)

### fix: T16 — Correction du décalage critiques/brief (3 critères manquants)

**Contexte**
En relisant le PDF de proposition initial envoyé à Thibault + sa réponse WhatsApp corrective du 20 avril, il a été constaté que le brief Wilfried donné à Claude en début de session ne reflétait pas fidèlement la liste finale validée par Thibault. Trois critères manquaient en base.

**Gap identifié**
- `pilotage_equipe` : présent dans le PDF pour Direction, non remis en cause par Thibault, absent du brief initial → manquait en base pour Direction
- `connaissance_hotel` (socle Manager) : présent dans le PDF comme "socle commun" du profil Manager, non remis en cause par Thibault, absent du brief initial → manquait en base pour Manager
- `prise_responsabilite` : présent dans le PDF pour Manager, non remis en cause par Thibault, absent du brief initial → manquait en base pour Manager

**Supabase — 3 INSERT additifs (zero suppression)**
```sql
INSERT INTO service_competency_profiles (service, competency_key, label, hierarchy) VALUES
  ('direction', 'pilotage_equipe',      'Pilotage Equipe',         'Collaborator'),
  (NULL,        'connaissance_hotel',   'Connaissance Hotel',      'Manager'),
  (NULL,        'prise_responsabilite', 'Prise Responsabilite',    'Manager');
```

**État final — 37 lignes (vs 34 précédemment)**
- 24 lignes métier Collaborator inchangées
- **6 lignes Direction Collaborator** (+1 : pilotage_equipe)
- **7 lignes Manager** (+2 : connaissance_hotel, prise_responsabilite)

---

### feat: T16 — Ajout colonne `hierarchy` à `formation_criteria_mapping`

**Contexte**
Le pipeline N8N A1 insère les mappings document→critères dans `formation_criteria_mapping`. Pour distinguer les mappings destinés aux collaborateurs vs aux managers (critique avec l'activation du profil Manager), il faut une colonne `hierarchy` sur cette table.

**SQL exécuté**
```sql
ALTER TABLE formation_criteria_mapping
  ADD COLUMN hierarchy text NOT NULL DEFAULT 'Collaborator';
```

**Effet**
- Les 108+ lignes existantes sont automatiquement taguées `hierarchy = 'Collaborator'` via DEFAULT
- Les futurs inserts peuvent passer `hierarchy = 'Manager'` pour les mappings destinés au bloc transversal
- Aucune suppression ni modification de l'existant

---

### feat: T16 — Pipeline N8N A1 mis à jour (Criteria Mapper + Flatten + Insert)

**Contexte**
Option B retenue après discussion : un document peut concerner à la fois Collaborator ET Manager (cas mixte). Le JSON de sortie du Criteria Mapper doit donc produire un tableau `mappings[]` au lieu d'un mapping plat, pour séparer les deux blocs hiérarchiques.

**Trois nœuds modifiés (aucun nœud ajouté)**

**1. Nœud `AI Agent1 - competences mapping` — nouveau System Message**
- Ajout bloc DIRECTION (5 critères + connaissance_hotel transversal)
- Ajout bloc MANAGER transversal (6 critères + connaissance_hotel transversal)
- Nouvelle règle : un document peut contenir plusieurs hiérarchies (Collaborator + Manager mixtes)
- Structure JSON de sortie : passage de `{services, criteria_mapping}` à `{mappings: [{hierarchy, services, criteria_mapping}, ...]}`
- Règle Manager : `connaissance_hotel` à 5% obligatoire (aligné avec les autres blocs)
- Exemples de sortie fournis pour cas simple et cas mixte (2 blocs)

**2. Nœud `Code in JavaScript1` — double boucle + fallback legacy**
```javascript
// Fallback : si l'IA retourne l'ancien format (sans mappings[]), on l'enveloppe
if (!mapping.mappings && mapping.criteria_mapping) {
  mapping.mappings = [{
    hierarchy: 'Collaborator',
    services: mapping.services || [],
    criteria_mapping: mapping.criteria_mapping
  }];
}

// Double boucle : chaque bloc hiérarchique × chaque critère → 1 ligne à insérer
const rows = [];
for (const block of mapping.mappings) {
  for (const criterion of block.criteria_mapping) {
    rows.push({
      document_name, formation_name: mapping.formation_name,
      hierarchy: block.hierarchy,     // NOUVEAU
      services: block.services,        // désormais pris depuis block (pas mapping)
      competency_key: criterion.competency_key,
      weight: criterion.weight,
      confidence: mapping.confidence,
      justification: mapping.justification,
      validated: false
    });
  }
}
```

**3. Nœud `HTTP Request1` — ajout 1 ligne au body JSON**
```json
"hierarchy": "{{ $json.hierarchy }}"
```
Sans cet ajout, le DEFAULT `'Collaborator'` de la table serait utilisé pour toutes les insertions, rendant les mappings Manager invisibles.

---

### 🚧 Statut actuel T16 — modifs faites, test bout-en-bout en attente

**Ce qui est FAIT et validé techniquement** ✅
1. ~~SQL Supabase — INSERT 10 critères Direction + Manager~~
2. ~~SQL Supabase — Correction 3 critères manquants (pilotage_equipe Direction, connaissance_hotel Manager, prise_responsabilite Manager)~~
3. ~~SQL Supabase — ALTER formation_criteria_mapping ADD COLUMN hierarchy~~
4. ~~N8N A1 Criteria Mapper — nouveau System Message avec 5 profils Collaborator + 1 profil Manager~~
5. ~~N8N A1 Code in JavaScript1 — double boucle + fallback legacy~~
6. ~~N8N A1 HTTP Request1 — transmission du champ hierarchy~~

**Ce qui RESTE à faire** ⏳
1. ⏳ **Test bout-en-bout du pipeline A1** avec un vrai document (demande faite à Thibault/Juliette d'un document managerial ou mixte pour éviter de polluer le RAG avec du fake data)
2. ⏳ Re-upload progressif des documents existants depuis Vercel (si nécessaire pour re-mapper vers les nouveaux critères)
3. ⏳ Front `src/pages/Connaissances.tsx` — radar double pour les managers (service + Manager transversal)
4. ⏳ Front `src/pages/admin/TeamAnalytics.tsx` — affichage radars complémentaires Manager dans les onglets training

**Décision produit documentée — pourquoi ne pas tester avec un fake PDF**
Pour éviter de polluer Qdrant (collection `RAGMistral2`) avec des points vectoriels bidon, d'insérer du fake data dans `formation_criteria_mapping` et de déclencher la génération de QCMs fantaisistes via le trigger `sync_training_questions_to_knowledge_queries`, Wilfried a fait le choix de demander à Thibault un vrai document de formation à la place. Le premier test servira donc aussi de première mise en service utile de la fonctionnalité.

---

## [2026-04-22]

### feat: T16 — Profils de compétences Direction & Manager (base SQL)

**Contexte**
Première étape de l'implémentation du ticket T16 (Profil Direction & Manager). Objectif : permettre l'évaluation des managers sur un double radar (leur service métier + un bloc transversal de critères managériaux) et évaluer les membres du service `direction` (Thibault, Juliette) sur un profil dédié. Critères validés explicitement par Thibault via WhatsApp.

---

**Supabase — `service_competency_profiles`**

Avant migration : 24 lignes (reception, housekeeping, maintenance, restauration), aucune pour direction. Contrainte UNIQUE sur `(service, competency_key)`. Colonne `service` NOT NULL.

Script exécuté en transaction (BEGIN...COMMIT) :

1. **Ajout colonne `hierarchy text`** — nullable le temps du backfill
2. **Backfill** : `UPDATE ... SET hierarchy = 'Collaborator' WHERE hierarchy IS NULL` sur les 24 lignes existantes. Valeur `Collaborator` alignée avec les données réelles de `profiles.hierarchy` (aucun `Normal` en production).
3. **`ALTER COLUMN hierarchy SET NOT NULL`** — rend la colonne obligatoire une fois remplie
4. **`ALTER COLUMN service DROP NOT NULL`** — autorise `service = NULL` pour les critères Manager transversaux
5. **Contrainte UNIQUE élargie** : `DROP CONSTRAINT service_competency_profiles_service_competency_key_key`, puis `ADD CONSTRAINT service_competency_profiles_service_competency_hierarchy_key UNIQUE (service, competency_key, hierarchy)`. Permet qu'une même `competency_key` (ex. `experience_client_globale`, `application_procedures`) coexiste dans plusieurs profils (Direction Collaborator + Manager transversal).

**INSERT — 5 critères Direction** (`service = 'direction'`, `hierarchy = 'Collaborator'`) :
- `connaissance_hotel` → Connaissance Hotel
- `experience_client_globale` → Experience Client Globale
- `gestion_economique_hotel` → Gestion Economique Hotel (encaissements, facturation, VAD, virement, dépôt garantie, espèces, débiteurs, clôtures de caisse)
- `gestion_rh` → Gestion RH (connaissance métiers, recrutement, contrats, cohésion équipe, carrières, paie)
- `application_procedures` → Application Procedures (intègre Sokle)

**INSERT — 5 critères Manager** (`service = NULL`, `hierarchy = 'Manager'`) :
- `experience_client_globale` → Experience Client Globale (inclut bonne tenue et présentation de l'hôtel)
- `gestion_litiges_collecte_avis` → Gestion Litiges Collecte Avis (litiges client + avis internet)
- `pilotage_cohesion_equipe` → Pilotage Cohesion Equipe (management + entraide entre collaborateurs)
- `gestion_achats_commandes` → Gestion Achats Commandes (stocks, anticipation, coûts, durabilité)
- `application_procedures` → Application Procedures (respect des process dont utilisation de Sokle)

**Correction en cours de route**
Les 5 lignes Direction ont été initialement insérées avec `hierarchy = 'Director'`. Correction appliquée via `UPDATE service_competency_profiles SET hierarchy = 'Collaborator' WHERE service = 'direction' AND hierarchy = 'Director'`. Raison : dans `profiles`, Thibault et Juliette sont tous deux `hierarchy = 'Collaborator'`. Aucun utilisateur n'a `hierarchy = 'Director'` en production — la valeur `Director` aurait rendu les critères invisibles sur le front.

---

**État final — 34 lignes**
- 24 lignes `Collaborator` par service métier (reception 7, housekeeping 6, maintenance 5, restauration 6)
- 5 lignes Direction `Collaborator` (`service = 'direction'`)
- 5 lignes Manager `Manager` (`service = NULL`, transversal)

---

**Logique fonctionnelle de requêtage (pour le front — à implémenter étapes 4 et 5)**

Pour un utilisateur donné (`staff_directory.service`, `staff_directory.hierarchy`) :
- **Collaborator Réception** → `WHERE service = 'reception' AND hierarchy = 'Collaborator'` → radar simple 7 axes
- **Collaborator Direction** (Thibault, Juliette) → `WHERE service = 'direction' AND hierarchy = 'Collaborator'` → radar Direction 5 axes
- **Manager** (Drichelle Réception, Lopez Maintenance, Boncoeur Housekeeping, etc.) → 2 requêtes : `service = <son_service> AND hierarchy = 'Collaborator'` (radar métier) + `hierarchy = 'Manager'` (radar managérial transversal 5 axes)

Les critères partagés entre Direction et Manager (`experience_client_globale`, `application_procedures`) coexistent en base grâce à la contrainte UNIQUE élargie à `(service, competency_key, hierarchy)`.

---

**Décisions d'architecture documentées**
- **`service` nullable** retenu (Option B3 du brief) plutôt que de stocker `service = 'manager'` comme valeur conventionnelle (Option B1), ou de dupliquer les critères Manager par service (Option B2, qui aurait donné 20 lignes au lieu de 5 avec update multiple sur changement de libellé).
- **`hierarchy` ajoutée** à `service_competency_profiles` pour matcher la granularité déjà présente dans `profiles.hierarchy` et `staff_directory.hierarchy`.
- **Aucune suppression de données existantes**. Uniquement des INSERTS additifs + ALTER non destructifs. La table `formation_criteria_mapping` (108+ lignes) n'a pas été touchée.

---

**Étapes T16 restantes (non faites)**
1. ⏳ N8N A1 "Criteria Mapper" — mettre à jour le prompt pour inclure les 10 nouveaux critères (5 Direction + 5 Manager), sinon aucun document uploadé ne sera mappé vers ces critères et les radars resteront à 0
2. ⏳ Re-upload des documents depuis Vercel (après fix N8N) — re-génération `formation_criteria_mapping`
3. ⏳ Front `src/pages/Connaissances.tsx` — radar double pour les managers
4. ⏳ Front `src/pages/admin/TeamAnalytics.tsx` — radars compétences managers

---

## [2026-04-16] — Front T16 préalable (modifs réalisées en avril, committées le 22 avril)

### Conversation du 16 avril 2026 — "Analyse bugs formation et architecture système agentique"

**Objectif** : permettre aux Managers (Drichelle, Lopez, Boncoeur) d'accéder à l'admin, pas seulement à la Direction.

Fichiers impactés :
- `src/hooks/useStaffService.ts`
- `src/components/AdminProtectedRoute.tsx`

---

### Conversation du 16 avril 2026 — "Récupération du système de score preview disparu"

**Objectif** : permettre de cliquer sur une formation dans la liste pour afficher son radar d'impact sur les compétences.

Fichiers impactés :
- `src/pages/admin/TeamAnalytics.tsx`

---

### Conversation des 2-3 avril 2026 — "Radar overlay sur modal de formation"

**Objectif** : afficher le radar overlay quand on ouvre un document de formation. Le debug a été ajouté pour chercher un bug qui n'existait pas (en fait il manquait juste les critères Direction en base).

Fichier impacté :
- `src/components/modals/DocumentViewerModal.tsx` — **non inclus dans le commit du 22 avril**, nettoyage du debug prévu dans un commit ultérieur dédié.

---

## 2026-04-09

### feat: Team Management — traductions FR, durées semaines, fallback vidéos, chaîne par défaut

**`src/pages/admin/TeamOnboarding.tsx`**
- Labels OKR supprimés : "/ Objective Key Results" retiré du label champ nom chaîne, toast "Sélectionnez une chaîne OKR" → "chaîne de vidéos", état vide "Aucune chaîne OKR créée" → "de vidéos", sous-titre header "Chaînes OKR" → "Chaînes de vidéos"
- `DURATION_OPTIONS` : `[2,3,4,5,6]` jours → `[7,14,21,30]` jours avec labels lisibles (1 semaine / 2 semaines / 3 semaines / 1 mois)
- Valeur par défaut `duration` : `3` → `14` (2 semaines)
- Onglets traduits : 'Role & Hierarchy' → 'Rôles & Hiérarchie', 'Video Briefs' → 'Vidéothèque', 'Team Focus' → 'Chaînes de vidéos'
- Titre page : 'Team Management' → 'Gestion de l\'équipe'
- Colonne Suivi : 'Deadline' → 'Échéance'
- Fallback label chaîne introuvable : 'Chaîne OKR' → 'Chaîne de vidéos'
- Ajout colonne `is_default` dans l'interface `VideoChain` + fetch
- Nouvelle fonction `setDefaultChain()` : reset toutes les chaînes à `false` puis set la sélectionnée à `true`
- Bouton étoile ⭐ sur chaque chaîne existante : dorée = défaut actif, creuse au hover = définir comme défaut ; tooltip "Chaîne par défaut lorsqu'aucune autre sélectionnée"

**`src/components/help/OnboardingCarousel.tsx`**
- Fallback en 2 temps : Query 1 = vidéos `is_onboarding = true` ; Query 2 (si vide) = vidéos de la chaîne `is_default = true` → écran noir impossible

**Supabase**
- `ALTER TABLE video_chains ADD COLUMN is_default boolean DEFAULT false;`

---

## 2026-04-02

### fix: Système de pièces jointes — upload Storage, affichage et suppression

**Contexte**
Les pièces jointes ajoutées aux cartes n'étaient jamais uploadées dans Supabase Storage. Le contenu binaire des fichiers restait en mémoire RAM du navigateur (blob URL temporaire) et disparaissait à la fermeture de l'onglet. La table `attachments` recevait les métadonnées (nom, taille, MIME type) mais `file_url` était systématiquement `NULL`.

**Supabase Storage — bucket `task-attachments`**
- Création du bucket public `task-attachments`
- Ajout de 3 policies sur `storage.objects` :
  - `INSERT` pour les utilisateurs authentifiés
  - `SELECT` public (lecture sans authentification pour affichage direct)
  - `UPDATE` pour les utilisateurs authentifiés

**`src/components/modals/AttachmentModal.tsx`**
- Ajout de `fileObject?: File` dans l'interface `UploadedFile` — conserve l'objet `File` natif au lieu de le jeter après création du blob URL
- Remplacement de `handleSubmit` par `handleSave` avec deux chemins :
  - Si `onSave` fourni (création de tâche) : délègue au parent (`TaskCreationModal` gère l'upload)
  - Si `task.id` fourni (carte existante) : upload vers Storage → récupération URL publique → `INSERT` dans `attachments`
- `DialogContent` : ajout `max-h-[85vh] flex flex-col overflow-hidden` + contenu interne scrollable
- Fix layout noms de fichiers longs : `overflow-hidden` + `min-w-0 flex-1` sur les conteneurs
- Bouton Add : état `uploading` avec label dynamique "Uploading..."
- Suppression des imports inutiles (`sendTaskUpdatedEvent`, `useProfiles`, `useLocations`)

**`src/components/modals/TaskCreationModal.tsx`**
- Step 7 de `handleCreateCard` : remplacement du `.map()` par une boucle `for...of` async
- Pour chaque fichier : upload vers `task-attachments` Storage → `getPublicUrl` → `file_url` renseigné
- Les liens (type `link`) continuent de passer directement en `file_url`

**`src/components/modals/EnhancedTaskDetailModal.tsx`**
- Footer bouton Validate : `justify-end` → `justify-center` (évite le chevauchement avec le bouton flottant de création de carte sur petit écran)

**`src/components/modules/TaskFullEditView.tsx`**
- Import `useTaskAttachments` depuis `useTaskDetails`, `Paperclip` et `Trash2` depuis lucide
- Hook `useTaskAttachments(task?.id)` appelé au niveau du composant
- Nouvelle section "Pièces jointes (N)" affichée si `attachments.length > 0` :
  - Nom de fichier tronqué + lien "Voir le fichier" (bleu) ou badge orange "⚠ Fichier non uploadé"
  - Taille en KB si disponible
  - Bouton poubelle rouge : DELETE en base + `refetchAttachments()` immédiat
- `AttachmentModal.onUpdate` connecté à `refetchAttachments()` (était vide)
- Footer Cancel/Save : `justify-between` → `justify-center gap-4`

**Résultat**
- Upload fichiers fonctionnel sur les cartes existantes et nouvelles
- Prévisualisation des images/GIFs/PDFs directement dans la carte
- Suppression propre des anciennes entrées NULL depuis la Full Editable Card

---

## 2026-03-31

### feat: Radar compétences dynamique + Bloc My Training (statistiques formation)

**Contexte**
Le radar de la page Connaissances affichait des données statiques codées en dur. Le bloc formation de MyStatistics n'existait pas. Création du système complet de visualisation des scores de compétences par service et des statistiques de formation personnelles.

**Nouvelle table Supabase — `service_competency_profiles`**
- Définit les axes du radar pour chaque service (source de vérité)
- Colonnes : `service`, `competency_key`, `label`
- Données insérées : Réception (7 critères), Housekeeping (6), Restauration (6), Maintenance (5)
- RLS activée : `SELECT` pour tous les utilisateurs authentifiés
- `direction` : délibérément non défini — reporté à une session dédiée
- `restauration` : inséré mais absent de `staff_directory` pour l'instant (pas d'employés restauration)

**`src/pages/Connaissances.tsx`**
- Suppression des données statiques `STANDOUT_STATS`
- Ajout states `radarData` et `isCompetencyEmpty`
- Double query dans `fetchUserData` :
  1. `service_competency_profiles` → tous les axes du service de l'employé (liste complète)
  2. `competency_scores` → scores réels de l'employé, mergés par `competency_key`
- Axes sans score → affichés à 0 (comportement correct)
- Fallback si service inconnu ou `direction` → `EMPTY_RADAR_DATA` (7 catégories à 0)
- Message `⚡ Dépêchez-vous de vous former !` affiché si tous les scores sont à 0
- Applicable desktop ET mobile (2 blocs radar synchronisés)

**`src/hooks/useTrainingStatistics.ts`** (nouveau)
- Fetch `training_results` (tous les employés) + `staff_directory` (noms + services)
- Calcul côté JS : scores perso, moyenne, meilleur score
- Classement hôtel : tous les employés triés par `avg_score` DESC
- Classement service : filtré sur le service de l'utilisateur connecté

**`src/pages/MyStatistics.tsx`**
- Import `useTrainingStatistics`, `LineChart`, `Line`, `BookOpen`
- Nouveau Bloc 4 "My Training" après Team Ranking :
  - 3 KPIs : QCMs passés / Score moyen (couleur dynamique vert/jaune/rouge) / Meilleur score
  - Courbe de progression Recharts (LineChart, chronologique)
  - Tableau historique scrollable : formation · score · date
  - Classement service (sans colonne Service)
  - Classement hôtel (avec colonne Service)
  - Emoji médailles 🥇🥈🥉 + ligne de l'utilisateur surlignée en doré
  - État vide si aucun QCM complété

**À faire (prochaine session)**
- Vérifier le rendu visuel dans le navigateur (radar + bloc My Training)
- Définir les critères de compétences du service `direction`
- Vérifier cohérence `competency_key` entre `service_competency_profiles` et `formation_criteria_mapping`
- Valider que `training_results` est bien alimenté par le système de scoring QCM existant

---

## 2026-03-26

### style: Alignement charte graphique Sokle — KnowledgeAssistance + AdminTraining (itérations couleurs)

**Contexte**
Toutes les tuiles des modules Knowledge et Training utilisaient des couleurs hors charte (violet, rouge, vert, ardoise). Harmonisation complète sur la palette officielle Sokle : Navy `#1E1A37` · Gold `#BBA57A` · Yellow `#DEAE35` · Sand `#E0D3B4` · White `#FFFFFF` + Teal prestige `#0d3d3d` (6e couleur, cohérente charte, inspirée du luxe hôtelier).

**`src/pages/admin/KnowledgeAssistance.tsx`**
- `THEMATIC_CONFIG` : 6 thématiques remappées sur la charte
  - Housekeeping → Sand foncé `#4a3c28 → #241d12`
  - Réception → Gold foncé `#6b4c28 → #3a2810`
  - Maintenance → Navy pur `#2d2850 → #1E1A37`
  - Sécurité → Navy très sombre `#1a1030 → #100820` + accent Yellow
  - F&B → Yellow foncé `#7a5e10 → #3d2f08`
  - Expérience client → Teal prestige `#0d3d3d → #061f1f`

**`src/pages/admin/AdminTraining.tsx`**
- `STEP_CONFIG` : step `practice` migré de violet `#a5b4fc` vers Navy `#8b83b8` (4e couleur charte, différenciante)
- `THEMATIC_TRAINING_CONFIG` : 13 thématiques remappées, en cohérence exacte avec KnowledgeAssistance pour les thématiques communes
  - Housekeeping → Sand foncé (idem KA)
  - Réception/Reception → Gold foncé (idem KA)
  - Maintenance → Navy pur (idem KA)
  - Sécurité → Navy très sombre (idem KA)
  - F&B/Restauration → Yellow foncé (idem KA)
  - Petit Déjeuner → Gold warm `#5c3d18 → #2e1c08`
  - Espace Bien Être/Spa → Teal prestige (idem Expérience client KA)
  - Bar → Navy nuit `#100a1f → #070412`
  - Conciergerie → Gold profond `#4a2e10 → #21130a`
  - Terrain → Sand terreux `#3a2f1a → #1a1509`

**Corrections visuelles post-rendu (itérations)**
- Housekeeping ↔ Maintenance permutés : Housekeeping → Navy bleuté, Maintenance → Sand terreux (bruns trop proches à l'œil)
- Réception + Conciergerie migrés vers **Lie de vin** `#5a1428 → #2e0a14` (ultra premium, service haut de gamme)
- Petit Déjeuner migré vers Yellow kaki `#7a5e10 → #3d2f08` (trop proche de Réception Gold avant correction)

**Palette finale 6 familles visuelles**
- 🍷 Lie de vin `#5a1428→2e0a14` : Réception, Conciergerie
- 🟣 Navy bleuté `#2d2850→1E1A37` : Housekeeping, Bar
- 🟤 Sand terreux `#4a3c28→241d12` : Maintenance, Terrain
- ⬛ Navy nuit `#1a1030→100820` : Sécurité
- 🟡 Yellow kaki `#7a5e10→3d2f08` : F&B, Restauration, Petit Déjeuner
- 🩵 Teal `#0d3d3d→061f1f` : Espace Bien Être, Spa, Expérience client

---

## 2026-03-19

### Fixed — Team Dispatch (bugfixes client V1)

**1. Colonne unique par défaut**
- Réduit l'état initial de 4 colonnes vides à 1 seule colonne "Add Staff Member"
- Fichier : `src/pages/TeamDispatch.tsx`

**2. Tâches non affichées dans les colonnes membres**
- Ajout du champ `assignedToUserIds: string[]` dans l'interface `TaskItem`
- Propagation des UUIDs bruts depuis `useTasks` (champ `assigned_to` de la table `task`)
- Remplacement du routing `assignedToUserId` (champ inexistant) par `assignedToUserIds` dans `taskAssignments`
- Support multi-assignation : une tâche assignée à plusieurs membres apparaît dans chaque colonne
- Fichiers : `src/types/database.ts`, `src/hooks/useSupabaseData.ts`, `src/pages/TeamDispatch.tsx`

**3. Persistance des colonnes**
- Sauvegarde automatique des colonnes sélectionnées dans `localStorage` (clé : `teamDispatch_columns`)
- Restauration au chargement de la page — survit à la navigation et au F5
- Fichier : `src/pages/TeamDispatch.tsx`

**4. Bouton edit harmonisé**
- Couleur unifiée navy `#1E1A37` sur les deux boutons edit (colonne vide et colonne assignée)
- Fichier : `src/pages/TeamDispatch.tsx`

**5. Message toast création de carte**
- Remplacement de "Test réussi!" par "Merci, ta carte a bien été enregistrée 🌟"
- Fichier : `src/components/modals/TaskCreationModal.tsx`

**6. Scroll interne des colonnes**
- Hauteur fixe responsive avec scroll interne visible : `h-[50vh] md:h-[calc(100vh-420px)]`
- Permet de naviguer à travers toutes les cartes d'une colonne à la molette
- Fichier : `src/pages/TeamDispatch.tsx`

### Fixed — Base de données Miguel Lopez (Maintenance)

**Contexte** : Miguel avait deux entrées dans `staff_directory` — une entrée historique (`185bd59c`) sans `auth_user_id` ni `service`, et un doublon créé à l'inscription (`bedfa044`) avec `service = reception` et prénom/nom inversés. Les tâches assignées à l'entrée historique n'étaient jamais reçues par Miguel.

**Corrections SQL appliquées** :
- Migration de toutes les tâches de l'ancien ID (`185bd59c`) vers le compte auth réel (`bedfa044`) via `array_replace`
- `staff_directory` `bedfa044` mis à jour : `first_name = Miguel`, `last_name = Lopez`, `full_name = Miguel Lopez`, `service = maintenance`, `department = Maintenance`, `hierarchy = Manager`, `is_active = true`
- `profiles` `bedfa044` mis à jour : `service = maintenance`, `hierarchy = Manager`
- Entrée orpheline `185bd59c` désactivée : `is_active = false`, `auth_user_id = NULL`

---

## 2026-03-06

### Added
- **Team Dispatch View** (`/team-dispatch`)
  - Vue de dispatch pour gouvernante/manager avec vision globale de l'équipe
  - 3 colonnes Kanban par membre d'équipe (To Process, In Progress, Resolved)
  - Statistiques temps réel par membre : X tâches • Y% completed • Z% To Process
  - Drag & Drop entre colonnes et membres
  - Modal EnhancedTaskDetailModal intégré (commentaires, pièces jointes, escalade)
  - Indicateur visuel de statut shift : 🔴 "Status: Inactive" / 🟢 "Status: Active" (avec pulse)

- **Service Control View** (`/service-control`)
  - Vue spécialisée housekeeping avec 4 colonnes : To Process, In Progress, Resolved, Verified
  - Navigation horizontale : affiche 3 colonnes, scroll pour voir la 4ème
  - Boutons adaptés : Begin Shift (au lieu de Start Shift), Work Improvement, End Shift
  - Indicateur visuel de statut shift identique à Team Dispatch
  - Modal "Begin Shift" sophistiqué avec :
    - **8 filtres combinables** :
      - Par étage (RDC, Basement, Étages 1-5)
      - Par catégorie (Ongoing Incident, Clients, Tasks, Follow Ups)
      - Par personne (noms individuels des membres d'équipe)
      - Par priorité (Low, Medium, High, Urgent)
      - Tri par retard (affiche les plus en retard en premier)
      - Par shift (issues du shift précédent / nouveau shift)
    - **Actions d'attribution** :
      - Sélection multiple (cases à cocher)
      - Attribution en masse à un membre d'équipe
      - Application de checklists ("en arrivée" / "en recouche")
    - **Cartes de chambres vierges** :
      - Génération automatique : une carte par chambre (basé sur locations Supabase)
      - Style visuel : bg-yellow-50 pour distinguer des tâches normales
      - Format : grid 2 colonnes (même largeur que Shift Management)
      - Tâches assignées vont automatiquement en bas de liste (scroll down)

- **Système d'archivage automatique des tâches**
  - **Migration SQL** : Ajout du statut 'archived' à l'enum task_status (fichier `add-archived-status.sql`)
  - **Workflow d'archivage** :
    1. Pendant le shift : tâches 'completed' restent visibles dans colonne "Resolved"
    2. À la fermeture du shift (`onShiftEnded`) : toutes les tâches 'completed' passent à 'archived'
    3. Pour Service Control : 'completed' ET 'verified' passent à 'archived'
    4. Au shift suivant : tâches archivées ne réapparaissent plus
  - Archivage pour tous types de tâches : incidents, client_requests, follow_ups, internal_tasks
  - Toast de confirmation : "X task(s) archived" affiché à la fermeture du shift

- **Indicateurs de statut visuel sur toutes les pages de shift**
  - Affichage : Shift Management et Service Control
  - Design :
    - Cercle coloré (w-3 h-3 rounded-full)
    - Texte en gras (text-xl font-playfair font-bold)
    - Position : sur la même ligne que le titre de la page
  - États :
    - 🔴 "Status: Inactive" (bg-red-500, text-red-600) → shift non démarré
    - 🟢 "Status: Active" (bg-green-500 animate-pulse, text-green-600) → shift actif

### Changed
- **Hook useSupabaseData.ts**
  - Ajout du filtre `.not('status', 'eq', 'archived')` pour exclure les tâches archivées
  - Les tâches archivées ne réapparaissent plus dans aucun Kanban

- **Workflow de fermeture de shift**
  - ShiftManagement : Callback `onShiftEnded` archive automatiquement toutes les tâches 'completed'
  - ServiceControl : Callback archive les tâches 'completed' ET 'verified'
  - Mise à jour du champ `updated_at` lors de l'archivage
  - Refetch automatique après archivage pour retirer les tâches du Kanban

- **Menu Sidebar**
  - Ajout de l'entrée "Service Control" avec icône Settings
  - Ordre du menu : Dashboard, Shift Management, Team Dispatch, Service Control, Knowledge Base, Assistant, Sign Out

### Fixed
- **Bug critique** : Les tâches marquées 'completed' réapparaissaient au shift suivant
  - **Cause** : Les tâches 'completed' n'étaient jamais retirées de la base de données
  - **Solution** : Système d'archivage automatique à la fermeture du shift
  - **Résultat** : Les tâches archivées sont définitivement exclues du Kanban
  - Les shifts commencent maintenant propres sans les anciennes tâches terminées

### Database
- **Migration SQL** : `add-archived-status.sql`
  ```sql
  ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'archived';
  ```
- **Enum task_status mis à jour** : `["pending", "in_progress", "completed", "cancelled", "archived"]`
- **Tables affectées** : incidents, client_requests, follow_ups, internal_tasks

### Files Created
- `src/pages/TeamDispatch.tsx`
- `src/pages/ServiceControl.tsx`
- `src/components/modals/ServiceShiftStartModal.tsx`
- `src/components/modals/ServiceShiftCloseModal.tsx`
- `add-archived-status.sql`
- `HospitalityOS_CONTEXT.md` (documentation complète architecture)

### Files Modified
- `src/App.tsx` (routes /team-dispatch et /service-control ajoutées)
- `src/components/Sidebar.tsx` (menu Team Dispatch et Service Control)
- `src/pages/ShiftManagement.tsx` (indicateur statut + archivage onShiftEnded)
- `src/hooks/useSupabaseData.ts` (filtre .not('status', 'eq', 'archived'))

---

## 2026-02-17

### 📊 Feature : Système de tracking des performances utilisateur
**Objectif** : Suivre automatiquement les métriques de performance des employés (tâches, shifts, assistant, QCM).

**Base de données**
- Ajout de 4 colonnes dans `staff_directory` :
  - `tasks_created_total` (integer, default 0) — compteur total des tâches créées par l'employé
  - `tasks_closed_total` (integer, default 0) — compteur total des tâches fermées
  - `assistant_queries_total` (integer, default 0) — compteur total des questions posées à l'assistant
  - `onboarding_views_count` (integer, default 0) — compteur des vues onboarding (limité à 10)

**Triggers automatiques**
- `trigger_increment_tasks_created` — incrémente `tasks_created_total` sur INSERT dans `task`
- `trigger_increment_tasks_closed` — incrémente `tasks_closed_total` quand `task.status` passe à 'completed'
- `trigger_increment_assistant_queries` — incrémente `assistant_queries_total` sur INSERT dans `assistant_conversations`
- `increment_onboarding_views()` — fonction RPC pour incrémenter le compteur onboarding

**Fichiers créés**
- add-onboarding-tracking.sql
- src/hooks/useOnboarding.ts

**Métriques dynamiques** (calculées en temps réel, pas stockées) :
- Shifts ouverts/clos cette semaine
- Tâches créées/closes cette semaine

**À venir** : Système QCM + Score Card de compétences (session dédiée)

---

### 🎬 Feature : Système de tutoriels vidéo (Help Center)
**Objectif** : Permettre aux utilisateurs d'accéder à des vidéos tutoriels contextuelles depuis n'importe quelle page de l'application.

**Base de données**
- Création table `platform_tutorial_videos` avec vectorisation sémantique préparée
  - Colonnes : id, title, category, objectif_fonctionnel, url, keywords (text[]), transcript, embedding (vector 1536), sort_order, is_active
  - RLS activé : lecture authentifiée uniquement
  - Index ivfflat sur embedding pour recherche cosine distance (pgvector)
  - 2 vidéos insérées en test (8 lignes — déduplication par titre côté front)

**Frontend**
- Nouveau dossier `src/components/help/`
  - `HelpButton.tsx` — icône HelpCircle Gold #BBA57A, Popover déroulant, fetch Supabase, déduplication par titre, liste plate sans catégories
  - `VideoTutorialModal.tsx` — Dialog Radix, iframe responsive 16:9, compatible Loom + YouTube (détection automatique par URL)
- Modification `Header.tsx` :
  - Suppression email + "Authenticated User" du header
  - Migration email + rôle en haut du dropdown avatar (section informative non cliquable)
  - Insertion `<HelpButton />` entre l'horloge et l'avatar

**Fichiers modifiés**
- src/components/Header.tsx
- src/components/help/HelpButton.tsx (nouveau)
- src/components/help/VideoTutorialModal.tsx (nouveau)

## 2026-02-12
- Suppression de la fonctionnalité Voice Input dans l'interface Assistant
- Retrait du bouton micro, du texte "Recording in progress", et du séparateur "or"
- Renommage du titre "Voice Input" en "Question Input"
- Nettoyage du code : suppression de l'état isRecording, de la fonction handleVoiceInput, et des imports inutilisés (Mic, CheckCircle, AlertCircle, XCircle)
- Interface simplifiée avec uniquement le champ texte et le bouton d'envoi
src/pages/Assistant.tsx

## 2025-12-15
- interface de chat question et reponse en lien avec N8N juste la partie interaction pas RAG
src/pages/Assistant.tsx
## 2025-12-11
- Ajout d'un bouton suppression de question sur les quizzs
SHIFT_FIX_SUMMARY.md
delete_training_question_function.sql
src/components/modals/QuizzModal.tsx
src/pages/ServiceControl2.tsx
## 2025-11-17
- feat: Add QCM creation modal with training selection - question mark button opens modal to select existing trainings and send to N8N webhook for QCM generation
src/components/UploadTraining.tsx
src/components/modals/QCMCreationModal.tsx
## 2025-11-17
- feat: Transform creation button into expandable vertical menu with QCM and new training options
src/components/UploadTraining.tsx
## 2025-11-17
- Individual shift management with service-based task filtering - Each user manages their own shift independently - Multiple shifts can be active simultaneously (reception + housekeeping + maintenance) - Tasks filtered by service using 2 criteria: 1. Created by someone from my service ΓåÆ I see it 2. Assigned to someone from my service ΓåÆ I see it - Cross-service tasks visible to both services - Button states reflect current user's shift (not other users) Modified: - ShiftManagement.tsx: Check shift by user_id - useSupabaseData.ts: Filter tasks by service
src/hooks/useSupabaseData.ts
src/pages/ShiftManagement.tsx
## 2025-11-16
- Updated the sync_training_questions_to_knowledge_queries function, added the trigger_auto_refill_qcm function, and modified the 'Standout Stats' block: added 7 domains and linked it to the logged session
src/pages/Connaissances.tsx
## 2025-11-14
- Resolved a function issue between the Training Questions table and Knowledge Queries ΓÇö wrong naming, mismapping, and problems affecting the production of the AIs in n8n.
src/components/UploadTraining.tsx
## 2025-11-10
- Updated changelog with the new knowledge management section and modified the quiz modal, replacing the 'SupplyBase topic' column with the 'theme' column, and updated the rewarding system accordingly.
src/components/modals/QuizzModal.tsx

Changelog

NOTES ABOUT DEVELOPING OPERATIONS MANAGER

# Changelog

[Unreleased] – 2025-11-07
🔍 IA-READY STRUCTURED CHANGELOG
[2025-11-05]
Author: Wilfried de Renty
Summary: Designed the QuizModal and DocumentViewerModal modules, including their database links and overall integration.
Files:
⦁	src/components/UploadTraining.tsx
⦁	src/components/modals/QuizzModal.tsx
⦁	src/hooks/useKnowledgeQueries.ts
⦁	src/hooks/useQuizQuestions.ts
⦁	src/pages/Connaissances.tsx
⦁	src/pages/TrainingManagement.tsx
Summary: Designed the QuizModal and DocumentViewerModal modules, including their database links and overall integration.
[2025-11-04]
Author: Wilfried de Renty
Summary: Created the QuizModal module for multiple-choice quizzes and linked it with the DocumentViewerModal module for training display.
Files:
⦁	src/pages/TrainingManagement.tsx
Summary: Created the QuizModal module for multiple-choice quizzes and linked it with the DocumentViewerModal module for training display.
[2025-11-04]
Author: Wilfried de Renty
Summary: Worked on synchronizing the base knowledge and training management systems, focusing on aligning the two related tables in Supabase.
Files:
⦁	src/components/shared/CardFaceModal.tsx
⦁	src/pages/Connaissances.tsx
⦁	src/pages/TrainingManagement.tsx
Summary: Worked on synchronizing the base knowledge and training management systems, focusing on aligning the two related tables in Supabase.
[2025-11-03]
Author: Wilfried de Renty
Summary: link training_questions to knowledge_queries tables
Files:
⦁	src/components/modals/DocumentViewerModal.tsx
⦁	src/pages/Connaissances.tsx
Summary: link training_questions to knowledge_queries tables
[2025-11-02]
Author: Wilfried de Renty
Summary: Correct bug in mobile version
Files:
⦁	src/pages/Connaissances.tsx
Summary: Correct bug in mobile version
[2025-11-02]
Author: Wilfried de Renty
Summary: Link the table knowledge queries
Files:
⦁	src/components/modals/FormationViewerModal.tsx
⦁	src/hooks/useKnowledgeFormations.ts
⦁	src/hooks/useKnowledgeQueries.ts
⦁	src/pages/Connaissances.tsx
Summary: Link the table knowledge queries
[2025-11-02]
Author: Wilfried de Renty
Summary: New training creation button
Files:
⦁	src/components/UploadTraining.tsx
⦁	src/pages/Connaissances.tsx
⦁	src/pages/TrainingManagement.tsx
Summary: New training creation button
[2025-10-31]
Author: Wilfried de Renty
Summary: Optimize responsivity on knowledge management
Files:
⦁	src/pages/Connaissances.tsx
Summary: Optimize responsivity on knowledge management
[2025-10-31]
Author: Wilfried de Renty
Summary: Trying debugging responsivity of connaissances.
Files:
⦁	src/pages/Connaissances.tsx
Summary: Trying debugging responsivity of connaissances.
[2025-10-31]
Author: Wilfried de Renty
Summary: Optimizing responsive design of team dispatch & training managemnent.
Files:
⦁	src/components/training/TrainingActionSelector.tsx
⦁	src/pages/Connaissances.tsx
⦁	src/pages/TeamDispatch.tsx
⦁	src/pages/TrainingManagement.tsx
Summary: Optimizing responsive design of team dispatch & training managemnent.
[2025-10-30]
Author: Wilfried de Renty
Summary: Shift Management and Service Control 2 have been adapted to a Mobile First format, featuring ultra-responsive design with horizontal kanban navigation and optimized filter buttons for mobile.
Files:
⦁	src/components/modals/QuizzModal.tsx
⦁	src/components/shift/ShiftActionSelector.tsx
⦁	src/pages/ServiceControl2.tsx
⦁	src/pages/ShiftManagement.tsx
Summary: Shift Management and Service Control 2 have been adapted to a Mobile First format, featuring ultra-responsive design with horizontal kanban navigation and optimized filter buttons for mobile.
[2025-10-30]
Author: Wilfried de Renty
Summary: Integrated dynamic quizzes based on covered topics: added a React function fetching questions from Supabase via N8n.
Files:
⦁	api-server.cjs
⦁	package-lock.json
⦁	package.json
⦁	src/components/modals/QuizzModal.tsx
⦁	src/data/trainingQuestions.ts
⦁	src/hooks/useQuizQuestions.ts
Summary: Integrated dynamic quizzes based on covered topics: added a React function fetching questions from Supabase via N8n.
[2025-10-10]
Author: Wilfried de Renty
Summary: ≡ƒôä Document created: SHIFT_MANAGEMENT_ARCHITECTURE.md ≡ƒôï Detailed content (50+ pages)
Files:
⦁	CHANGELOG.md
⦁	SHIFT_MANAGEMENT_ARCHITECTURE.md
Summary: ≡ƒôä Document created: SHIFT_MANAGEMENT_ARCHITECTURE.md ≡ƒôï Detailed content (50+ pages)
[2025-10-10]
Author: Wilfried de Renty
Summary: Correct bug in service control begin shift process
Files:
⦁	src/components/modals/BeginShiftWorkflow.tsx
⦁	src/pages/ServiceControl2.tsx
⦁	src/pages/TeamDispatch.tsx
Summary: Correct bug in service control begin shift process
[2025-10-10]
Author: Wilfried de Renty
Summary: Debug service team shifts in profile
Files:
⦁	diagnose-team-shifts.mjs
⦁	diagnose-team-shifts.sql
⦁	src/hooks/useShiftData.ts
Summary: Debug service team shifts in profile
[2025-10-09]
Author: Wilfried de Renty
Summary: Debug task allocation
Files:
⦁	src/components/modals/BeginShiftTaskAllocationModal.tsx
Summary: Debug task allocation
[2025-10-09]
Author: Wilfried de Renty
Summary: feat: sync shift states between ShiftManagement and ServiceControl2
Files:
⦁	src/components/modals/BeginShiftTaskAllocationModal.tsx
⦁	src/components/modals/BeginShiftVoiceNoteModal.tsx
⦁	src/components/modals/BeginShiftWorkflow.tsx
⦁	src/components/modals/ServiceShiftCloseModal.tsx
⦁	src/pages/ServiceControl2.tsx
Summary: feat: sync shift states between ShiftManagement and ServiceControl2
[2025-10-08]
Author: Wilfried de Renty
Summary: correction of bugs into card creation link with actual shift and debuging members assignated to a card
Files:
⦁	assign-tasks-to-shift.sql
⦁	src/components/modals/MembersModal.tsx
⦁	src/components/modals/ShiftCloseModal.tsx
⦁	src/components/modals/TaskCreationModal.tsx
⦁	src/components/modules/TaskFullEditView.tsx
⦁	src/hooks/useSupabaseData.ts
⦁	src/pages/ShiftManagement.tsx
Summary: correction of bugs into card creation link with actual shift and debuging members assignated to a card
[2025-10-08]
Author: Wilfried de Renty
Summary: fix(shift-handover): Fix task transfer system between shifts
Files:
⦁	auto-sync-auth-profiles.sql
⦁	src/components/modals/ShiftCloseModal.tsx
⦁	src/components/modals/ShiftStartModal.tsx
⦁	src/lib/shiftContinuityManager-v2.ts
Summary: fix(shift-handover): Fix task transfer system between shifts
[2025-10-08]
Author: Wilfried de Renty
Summary: Service control begin shift screen layers reordered
Files:
⦁	SHIFT_COORDINATION.md
⦁	diagnostic-shift-coordination.sql
⦁	handleShiftStarted-improved.js
⦁	src/components/modals/BeginShiftDailyTasksModal.tsx
⦁	src/components/modals/BeginShiftVoiceNoteModal.tsx
⦁	src/hooks/useShiftData.ts
Summary: Service control begin shift screen layers reordered
[2025-10-06]
Author: Wilfried de Renty
Summary: UI: Empty state consistency & shift messages
Files:
⦁	TEST_GUIDE.md
⦁	src/components/ClientRequestsCard.tsx
⦁	src/components/FollowUpsCard.tsx
⦁	src/components/IncidentsCard.tsx
⦁	src/components/modals/ShiftCloseModal.tsx
⦁	src/components/modals/ShiftStartModal.tsx
⦁	src/hooks/useSupabaseData.ts
⦁	src/pages/ServiceControl.tsx
⦁	src/pages/ServiceControl2.tsx
⦁	src/pages/ShiftManagement.tsx
⦁	src/pages/TeamDispatch.tsx
Summary: UI: Empty state consistency & shift messages
[2025-10-01]
Author: Wilfried de Renty
Summary: feat: coordinate start/end shift with shift_id linking
Files:
⦁	src/components/modals/ShiftCloseModal.tsx
⦁	src/lib/shiftContinuityManager-v2.ts
⦁	src/pages/ShiftManagement.tsx
Summary: feat: coordinate start/end shift with shift_id linking
[2025-10-01]
Author: Wilfried de Renty
Summary: create teamshift in profile to display the last shifts after recoring them
Files:
⦁	SUPABASE_TABLES.md
⦁	src/App.tsx
⦁	src/components/Header.tsx
⦁	src/hooks/useTeamShifts.ts
⦁	src/pages/MesShifts.tsx.old
⦁	src/pages/MyShifts.tsx
Summary: create teamshift in profile to display the last shifts after recoring them
[2025-09-30]
Author: Wilfried de Renty
Summary: working on optimizing shift modal
Files:
⦁	src/components/modals/ShiftCloseModal.tsx
⦁	src/hooks/useShiftData.ts
⦁	src/lib/shiftContinuityManager-v2.ts
⦁	src/pages/Auth.tsx
Summary: working on optimizing shift modal
[2025-09-29]
Author: Wilfried de Renty
Summary: Start and end shift activated Voicenote storage stop display completed task on dashboard avoir erase previous members when you add new ones
Files:
⦁	src/components/ClientRequestsCard.tsx
⦁	src/components/FollowUpsCard.tsx
⦁	src/components/IncidentsCard.tsx
⦁	src/components/modals/MembersModal.tsx
⦁	src/components/modals/ShiftCloseModal.tsx
⦁	src/components/modals/ShiftStartModal.tsx
⦁	src/hooks/useShiftData.ts
⦁	src/pages/ShiftManagement.tsx




\## \[2025-09-11]

\- feat: Solved drag and drop between columns called internal tasks

\- note: bizarre behavior with drag and drop from one kanban column to another (`handleDragEnd` on \[internal tasks]) → weird because it’s typed as a card



 ## \[2025-09-12]
- feat: manage data between shift : shiftContinuityManager-v2.ts and shift-handovers
- note: we build shiftContinuityManager-v2.ts to manage the rules and shift-handovers to structurize well in backup
→ kind of important part here


\## \[2025-09-13]

\- feat: "Refactoring: Migration architecture tâches - suppression task_type et unification table task"
- note: [Database Architecture] Task Management System Unification - 2025-09-13
Breaking Changes

Removed task_type column from 7 tables: activity_log, attachments, checklists, comments, escalations, reminders, task_members
Unified task storage into single task table architecture
Purged legacy data from activity_log (8 demo entries removed)

Database Schema Changes
sql-- Executed DDL operations:
ALTER TABLE activity_log DROP COLUMN task_type;
ALTER TABLE attachments DROP COLUMN task_type;
ALTER TABLE checklists DROP COLUMN task_type;
ALTER TABLE comments DROP COLUMN task_type;
ALTER TABLE escalations DROP COLUMN task_type;
ALTER TABLE reminders DROP COLUMN task_type;
ALTER TABLE task_members DROP COLUMN task_type;
DELETE FROM activity_log; -- Legacy demo data cleanup
Frontend Changes

Modified TaskCreationModal.tsx: Removed task_type references in handleTestCreateCard
Updated Due Date field: Made optional (removed required asterisk)
Validated Task creation flow with unified table structure

Known Issues

CRITICAL: handleTestCreateCard function incomplete after restoration attempt
Impact: Task creation UI shows success but fails to persist data
Root cause: Incomplete .select().single() chain in Supabase insertion

Next Phase Identified

Database: Migrate TEXT fields to proper ENUM types
Target fields: category, priority, status, service, origin_type
Proposed service values: ['reception', 'housekeeping', 'maintenance', 'direction']


\## \[2025-09-16]

\- feat: Data restructuration & creation modal  
- note: This update was aimed at restructuring the architecture by centralizing everything into a unified task table that is connected to five other tables: checklists, reminders, numbers, escalations, and attachments. 

Optimization update covering the task creation module, 
and updates to the checklist 
and reminder creation modules.

\## \[2025-09-23]


### Fixed
- **Drag & Drop**: Resolved functionality issues for all authenticated users
  - Fixed activity logging constraint to reference profiles instead of staff_directory
  - Added explicit user tracking for audit trail
  - Ensured Drishelle and Océane can use drag & drop operations

### Changed
- Database constraint: activity_logs.user_id now references profiles table


\## \[2025-10-10]


### 📄 Document created: SHIFT_MANAGEMENT_ARCHITECTURE.md
📋 Detailed content (50+ pages)

The document covers everything you requested:

### 1. Table Architecture

shifts table with all fields explained
shift_handovers table with full JSONB structure
task table including shift_id, service, and assigned_to[]


### 2. Begin Shift – Shift Management (Simplified Flow)

1 modal: ShiftStartModal
Full function handleShiftStarted()
Includes startShift(), getShiftHandover(), and linkTasksToShift()

### 3. Begin Shift – Service Control 2 (Complete Flow)

4 detailed modals in sequence:
Modal 1: BeginShiftDailyTasksModal
Modal 2: BeginShiftCardsCreationModal
Modal 3: BeginShiftTaskAllocationModal
Modal 4: BeginShiftVoiceNoteModal
handleShiftStarted(createdCards) function with card creation

### 4. End Shift – Two Pages

Common flow using submitShiftEnd()
Functions: endShift(), saveShiftHandover()
Audio upload, log tagging, full archiving process

### 5. Real-Time Synchronization

Supabase Realtime listener
Multi-page and multi-tab sync
Full implementation with useEffect

### 6. UUID Management and Service Filtering

UUID → Service mapping via staff_directory
Two filtering criteria (created by OR assigned to)
Concrete examples with decision matrices

### 7. Shift ID: Creation and Usage

When the shift_id is created (during startShift())
How it’s used (new cards, previous cards, logs)
Traceability and analytics

### 8. Smart Continuity Rules

Full archiving of all active tasks
Transfer of only pending + in_progress tasks
Complete decision matrix


### 9. Full Use Cases

Scenario 1: Reception with 10 new cards
Scenario 2: Housekeeping without new cards

### 10. Final Verification Checklist ✅


## [2026-03-06]

### feat: Permanent Shift — Mode direction (Thibault de Saint Martin)

**Contexte**
Le directeur Thibault ne fonctionne pas en shifts manuels. Besoin de créer des tâches et de les attribuer librement, sans contrainte d'ouverture/fermeture de shift.

**Concept implémenté : Permanent Shift**
Les membres du service `direction` ont un shift toujours actif, renouvelé automatiquement chaque nuit à 1h AM. Totalement transparent pour l'utilisateur.

**Supabase — Base de données**
- Création du shift permanent initial pour Thibault (`staff_directory.id = 4c509751-f4c1-477d-b63c-f44dbb02da18`, `service = 'direction'`, `status = 'active'`)
- Création de la fonction PostgreSQL `rotate_permanent_shifts()` : itère sur tous les membres actifs du service `direction`, clôture le shift actif du jour, ouvre un nouveau shift pour le lendemain
- Activation pg_cron + job `permanent-shift-rotation` schedulé à `0 1 * * *` (1h AM tous les jours)
- Déploiement Edge Function `rotate-permanent-shifts` (disponible pour invocation manuelle)
- Contrainte FK confirmée : `shifts.user_id → staff_directory.id` (et non profiles)

**TypeScript — Synchronisation types**
- `src/types/payloads.ts` : ajout de `'Director'` dans `UserRole`
- `src/integrations/supabase/types.ts` : ajout de `'Director'` dans `Enums.user_role` et `Constants.user_role`

**Frontend — `src/pages/ShiftManagement.tsx`**
- Ajout state `isPermanentShift` (boolean)
- `checkActiveShift()` : détection du service `direction` via `staff_directory` + remplacement de `.maybeSingle()` par `.limit(1)` pour robustesse multi-shifts
- Badge status conditionnel : service `direction` → point gold animé (`#BBA57A`) + texte gold "Always Active — Auto-archiving nightly" au lieu du rouge/vert standard
- Aucun impact sur les autres services

**Généralisation**
Le système est conçu pour tout le service `direction` (pas uniquement Thibault). Tout membre actif avec `service = 'direction'` dans `staff_directory` bénéficie automatiquement du permanent shift.

---

---

## [2026-03-20]

### fix: TaskFullEditView — Persistance du statut en base Supabase

**Contexte**
Le modal "Full Editable Card" (`TaskFullEditView.tsx`) permettait de changer le statut d'une tâche mais ne persistait rien en base. Le toast "Task Updated" s'affichait, le modal se fermait, mais la table `task` n'était jamais mise à jour.

**Root cause**
`confirmSave()` appelait uniquement le callback `onSave(editedTask)` (notification parent) sans aucun appel Supabase.

**Fix — `src/components/modules/TaskFullEditView.tsx`**
- Ajout d'un appel `supabase.from('task').update({status, priority, title, description, location}).eq('id', editedTask.id)` en tête de `confirmSave()`
- Si erreur Supabase → `throw error` → toast destructive, modal reste ouvert
- Si succès → `onSave` → toast succès → fermeture
- Le client Supabase était déjà importé, zéro nouvel import

**Fix UX — `src/components/modals/EnhancedTaskDetailModal.tsx`**
- Ajout de `onClose()` dans le callback `onSave` de `<TaskFullEditView>` : les deux modals (Full Edit + Detail) se ferment simultanément après save
- Suppression de l'état intermédiaire stale visible sur `EnhancedTaskDetailModal` après un save
- Le Realtime Supabase (`useTasks` subscription sur `task`) propage la mise à jour au kanban automatiquement

---

### feat: ServiceControl2 — Manager Interface redesign

**Contexte**
Refonte de la page `ServiceControl2` pour les managers : mise en avant des colonnes "Resolved" et "Verified", colonnes "To Process" et "In Progress" repliables, suppression du module shift inutile dans ce contexte.

**`src/pages/ServiceControl2.tsx`**
- Titre : "Service Control - Manager Interface"
- Sous-titre : "Monitor your team's work by moving cards from 'Resolved' to 'Verified'"
- Suppression du bloc `ShiftActionSelector` (Active Shift / Work Improvement / End Shift) — non pertinent pour cette vue manager
- `KanbanColumn` redesigné : mode replié = bande verticale `w-12` avec titre en `writing-mode: vertical-rl`, badge count et chevron. Clic sur la bande → expand. Mode ouvert = `flex-1` avec bouton `ChevronLeft` pour replier
- State `collapsedColumns` initialisé à `{ pending: true, in_progress: true }` → To Process et In Progress repliés par défaut à l'ouverture
- Container : `flex gap-3 overflow-x-auto` — wrappers des colonnes en `flex-none w-12` (replié) ou `flex-none w-[85vw] md:flex-1` (ouvert) pour compatibilité mobile scroll horizontal + desktop flex
- Resolved et Verified visibles immédiatement, occupent tout l'espace disponible

## [2026-04-09 / 2026-04-10]

### fix: Pipeline RAG + QCM — correction complète de bout en bout

**Contexte**
Après suppression et recréation manuelle de la collection Qdrant `RAGMistral2`, le pipeline A1 tournait en vert mais insérait 0 points dans Qdrant. A2 ne pouvait donc pas générer de QCMs. Plusieurs bugs en cascade ont été identifiés et corrigés.

---

**N8N A1 — The Trainer's Brain**

- `Prepare Embedding` : les 3 expressions lisaient depuis `HTTP Request1` (retour Supabase INSERT vide). Corrigé avec `$if($('Edit Fields').isExecuted, ...)` couvrant les 3 branches d'exécution possibles (PDF sans images → `Edit Fields`, PDF avec images → `Edit Fields1`, fichier image direct → `Edit Fields3`)
- `AI Agent1 - competences mapping` : le prompt lisait `$json.markdown` (undefined). Corrigé en `$json.finalMarkdown`
- `HTTP Request RAG` : `On Error` passé de `Stop Workflow` à `Continue` pour absorber les timeout 524 Cloudflare (A2 prend 2-3 min, Cloudflare coupe à 100s)

**N8N A2 — The Evaluator**

- `Qdrant Vector Store1` : toggle `Rerank Results` désactivé (slot Reranker vide → Bad Request)
- `Code in JavaScript` : bloc `catch` remplacé par `throw new Error(...)` — stoppe proprement le pipeline au lieu de passer un item corrompu à HTTP Request QCM
- `Webhook` : headers CORS ajoutés (`Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`) pour autoriser les appels depuis le front
- `HTTP Request QCM` : header `Prefer: resolution=merge-duplicates` ajouté pour gérer les upserts

**Supabase SQL**

- Trigger `sync_training_questions_to_knowledge_queries` : ajout de `ON CONFLICT (document_title) DO NOTHING` sur l'INSERT dans `knowledge_queries` — corrige le crash race condition quand plusieurs exécutions A2 parallèles tentent de créer le même `document_title`
- Index Qdrant créés via console REST : `metadata.document_name` (keyword) et `metadata.thematic` (keyword) sur la collection `RAGMistral2` pour optimiser les recherches avec 30+ documents
- Suppression des 15 questions orphelines sous `document = 'Votre role a l\'hotel dequesne'` (silo mort créé lors d'un test avec titre différent)

**Frontend — `src/components/modals/QCMCreationModal.tsx`**

- `handleCreateQCM` : transformé en fire-and-forget — le fetch N8N est lancé sans `await`, la modal se ferme immédiatement avec un toast de confirmation. Suppression du try/catch qui bloquait l'UI pendant 3 minutes avant de planter sur le timeout 524

**Frontend — `src/pages/admin/AdminTraining.tsx`**

- `STEP_CONFIG` : icônes mises à jour — `training` → `Brain`, `qcm` → `HelpCircle`, `practice` → `Hand`
- `ItemCard` : pictogramme principal conditionnel — `formation` affiche l'emoji thématique, les autres types (`qcm`, `training`, `practice`) affichent l'icône de leur `STEP_CONFIG`
- `ItemCard` : titre affiché depuis `document_title` au lieu de `document_name` — les QCMs affichent désormais `"Votre role au Duquesne Hotel - QCM v1"` / `"- QCM v2"` etc. au lieu du même nom pour tous

---

### feat: My Analytics — Page de statistiques personnelles

**Concept**
Nouvelle page `MyStatistics` donnant à chaque membre une vision complète de ses performances individuelles : tâches créées, complétées, assignées, répartition par catégorie, évolution temporelle et données de shifts.

**Nouveau hook — `src/hooks/useMyStatistics.ts`**
- Interface `UserTaskStats` : agrégats complets (tâches créées/complétées/en cours/en attente, par catégorie, assignées, par période jour/semaine/mois, shifts total/actif/complété)
- Interface `TimeseriesEntry` : données de séries temporelles par `period_type` (day / week / month)
- Requêtes Supabase vers les vues dédiées aux statistiques personnelles

**Nouvelle page — `src/pages/MyStatistics.tsx`**
- KPI cards : tâches créées, complétées, en cours, en attente — avec icônes et couleurs brand
- Onglets de période : Day / Week / Month (tabs gold `#BBA57A`)
- BarChart (Recharts) : évolution des tâches créées dans le temps
- PieChart (Recharts) : répartition par catégorie (incident, client_request, follow_up, internal_task)
- Section shifts : total, actifs, complétés, shifts du jour et de la semaine
- Design brand-compliant : Gold `#BBA57A`, Navy `#1E1A37`, Yellow `#DEAE35`
- Responsive, chargement avec spinner `Loader2`

---

## [2026-04-22]

### feat: T16 — Profils de compétences Direction & Manager (base SQL)

**Contexte**
Première étape de l'implémentation du ticket T16 (Profil Direction & Manager). Objectif : permettre l'évaluation des managers sur un double radar (leur service métier + un bloc transversal de critères managériaux) et évaluer les membres du service `direction` (Thibault, Juliette) sur un profil dédié. Critères validés explicitement par Thibault via WhatsApp.

---

**Supabase — `service_competency_profiles`**

Avant migration : 24 lignes (reception, housekeeping, maintenance, restauration), aucune pour direction. Contrainte UNIQUE sur `(service, competency_key)`. Colonne `service` NOT NULL.

Script exécuté en transaction (BEGIN...COMMIT) :

1. **Ajout colonne `hierarchy text`** — nullable le temps du backfill
2. **Backfill** : `UPDATE ... SET hierarchy = 'Collaborator' WHERE hierarchy IS NULL` sur les 24 lignes existantes. Valeur `Collaborator` alignée avec les données réelles de `profiles.hierarchy` (aucun `Normal` en production).
3. **`ALTER COLUMN hierarchy SET NOT NULL`** — rend la colonne obligatoire une fois remplie
4. **`ALTER COLUMN service DROP NOT NULL`** — autorise `service = NULL` pour les critères Manager transversaux
5. **Contrainte UNIQUE élargie** : `DROP CONSTRAINT service_competency_profiles_service_competency_key_key`, puis `ADD CONSTRAINT service_competency_profiles_service_competency_hierarchy_key UNIQUE (service, competency_key, hierarchy)`. Permet qu'une même `competency_key` (ex. `experience_client_globale`, `application_procedures`) coexiste dans plusieurs profils (Direction Collaborator + Manager transversal).

**INSERT — 5 critères Direction** (`service = 'direction'`, `hierarchy = 'Collaborator'`) :
- `connaissance_hotel` → Connaissance Hotel
- `experience_client_globale` → Experience Client Globale
- `gestion_economique_hotel` → Gestion Economique Hotel (encaissements, facturation, VAD, virement, dépôt garantie, espèces, débiteurs, clôtures de caisse)
- `gestion_rh` → Gestion RH (connaissance métiers, recrutement, contrats, cohésion équipe, carrières, paie)
- `application_procedures` → Application Procedures (intègre Sokle)

**INSERT — 5 critères Manager** (`service = NULL`, `hierarchy = 'Manager'`) :
- `experience_client_globale` → Experience Client Globale (inclut bonne tenue et présentation de l'hôtel)
- `gestion_litiges_collecte_avis` → Gestion Litiges Collecte Avis (litiges client + avis internet)
- `pilotage_cohesion_equipe` → Pilotage Cohesion Equipe (management + entraide entre collaborateurs)
- `gestion_achats_commandes` → Gestion Achats Commandes (stocks, anticipation, coûts, durabilité)
- `application_procedures` → Application Procedures (respect des process dont utilisation de Sokle)

**Correction en cours de route**
Les 5 lignes Direction ont été initialement insérées avec `hierarchy = 'Director'`. Correction appliquée via `UPDATE service_competency_profiles SET hierarchy = 'Collaborator' WHERE service = 'direction' AND hierarchy = 'Director'`. Raison : dans `profiles`, Thibault et Juliette sont tous deux `hierarchy = 'Collaborator'`. Aucun utilisateur n'a `hierarchy = 'Director'` en production — la valeur `Director` aurait rendu les critères invisibles sur le front.

---

**État final — 34 lignes**
- 24 lignes `Collaborator` par service métier (reception 7, housekeeping 6, maintenance 5, restauration 6)
- 5 lignes Direction `Collaborator` (`service = 'direction'`)
- 5 lignes Manager `Manager` (`service = NULL`, transversal)

---

**Logique fonctionnelle de requêtage (pour le front — à implémenter étapes 4 et 5)**

Pour un utilisateur donné (`staff_directory.service`, `staff_directory.hierarchy`) :
- **Collaborator Réception** → `WHERE service = 'reception' AND hierarchy = 'Collaborator'` → radar simple 7 axes
- **Collaborator Direction** (Thibault, Juliette) → `WHERE service = 'direction' AND hierarchy = 'Collaborator'` → radar Direction 5 axes
- **Manager** (Drichelle Réception, Lopez Maintenance, Boncoeur Housekeeping, etc.) → 2 requêtes : `service = <son_service> AND hierarchy = 'Collaborator'` (radar métier) + `hierarchy = 'Manager'` (radar managérial transversal 5 axes)

Les critères partagés entre Direction et Manager (`experience_client_globale`, `application_procedures`) coexistent en base grâce à la contrainte UNIQUE élargie à `(service, competency_key, hierarchy)`.

---

**Décisions d'architecture documentées**
- **`service` nullable** retenu (Option B3 du brief) plutôt que de stocker `service = 'manager'` comme valeur conventionnelle (Option B1), ou de dupliquer les critères Manager par service (Option B2, qui aurait donné 20 lignes au lieu de 5 avec update multiple sur changement de libellé).
- **`hierarchy` ajoutée** à `service_competency_profiles` pour matcher la granularité déjà présente dans `profiles.hierarchy` et `staff_directory.hierarchy`.
- **Aucune suppression de données existantes**. Uniquement des INSERTS additifs + ALTER non destructifs. La table `formation_criteria_mapping` (108+ lignes) n'a pas été touchée.

---

**Étapes T16 restantes (non faites)**
1. ⏳ N8N A1 "Criteria Mapper" — mettre à jour le prompt pour inclure les 10 nouveaux critères (5 Direction + 5 Manager), sinon aucun document uploadé ne sera mappé vers ces critères et les radars resteront à 0
2. ⏳ Re-upload des documents depuis Vercel (après fix N8N) — re-génération `formation_criteria_mapping`
3. ⏳ Front `src/pages/Connaissances.tsx` — radar double pour les managers
4. ⏳ Front `src/pages/admin/TeamAnalytics.tsx` — radars compétences managers

---

## [2026-04-22] (suite)

### fix: T16 — Correction du décalage critiques/brief (3 critères manquants)

**Contexte**
En relisant le PDF de proposition initial envoyé à Thibault + sa réponse WhatsApp corrective du 20 avril, il a été constaté que le brief Wilfried donné à Claude en début de session ne reflétait pas fidèlement la liste finale validée par Thibault. Trois critères manquaient en base.

**Gap identifié**
- `pilotage_equipe` : présent dans le PDF pour Direction, non remis en cause par Thibault, absent du brief initial → manquait en base pour Direction
- `connaissance_hotel` (socle Manager) : présent dans le PDF comme "socle commun" du profil Manager, non remis en cause par Thibault, absent du brief initial → manquait en base pour Manager
- `prise_responsabilite` : présent dans le PDF pour Manager, non remis en cause par Thibault, absent du brief initial → manquait en base pour Manager

**Supabase — 3 INSERT additifs (zero suppression)**
```sql
INSERT INTO service_competency_profiles (service, competency_key, label, hierarchy) VALUES
  ('direction', 'pilotage_equipe',      'Pilotage Equipe',         'Collaborator'),
  (NULL,        'connaissance_hotel',   'Connaissance Hotel',      'Manager'),
  (NULL,        'prise_responsabilite', 'Prise Responsabilite',    'Manager');
```

**État final — 37 lignes (vs 34 précédemment)**
- 24 lignes métier Collaborator inchangées
- **6 lignes Direction Collaborator** (+1 : pilotage_equipe)
- **7 lignes Manager** (+2 : connaissance_hotel, prise_responsabilite)

---

### feat: T16 — Ajout colonne `hierarchy` à `formation_criteria_mapping`

**Contexte**
Le pipeline N8N A1 insère les mappings document→critères dans `formation_criteria_mapping`. Pour distinguer les mappings destinés aux collaborateurs vs aux managers (critique avec l'activation du profil Manager), il faut une colonne `hierarchy` sur cette table.

**SQL exécuté**
```sql
ALTER TABLE formation_criteria_mapping
  ADD COLUMN hierarchy text NOT NULL DEFAULT 'Collaborator';
```

**Effet**
- Les 108+ lignes existantes sont automatiquement taguées `hierarchy = 'Collaborator'` via DEFAULT
- Les futurs inserts peuvent passer `hierarchy = 'Manager'` pour les mappings destinés au bloc transversal
- Aucune suppression ni modification de l'existant

---

### feat: T16 — Pipeline N8N A1 mis à jour (Criteria Mapper + Flatten + Insert)

**Contexte**
Option B retenue après discussion : un document peut concerner à la fois Collaborator ET Manager (cas mixte). Le JSON de sortie du Criteria Mapper doit donc produire un tableau `mappings[]` au lieu d'un mapping plat, pour séparer les deux blocs hiérarchiques.

**Trois nœuds modifiés (aucun nœud ajouté)**

**1. Nœud `AI Agent1 - competences mapping` — nouveau System Message**
- Ajout bloc DIRECTION (5 critères + connaissance_hotel transversal)
- Ajout bloc MANAGER transversal (6 critères + connaissance_hotel transversal)
- Nouvelle règle : un document peut contenir plusieurs hiérarchies (Collaborator + Manager mixtes)
- Structure JSON de sortie : passage de `{services, criteria_mapping}` à `{mappings: [{hierarchy, services, criteria_mapping}, ...]}`
- Règle Manager : `connaissance_hotel` à 5% obligatoire (aligné avec les autres blocs)
- Exemples de sortie fournis pour cas simple et cas mixte (2 blocs)

**2. Nœud `Code in JavaScript1` — double boucle + fallback legacy**
```javascript
// Fallback : si l'IA retourne l'ancien format (sans mappings[]), on l'enveloppe
if (!mapping.mappings && mapping.criteria_mapping) {
  mapping.mappings = [{
    hierarchy: 'Collaborator',
    services: mapping.services || [],
    criteria_mapping: mapping.criteria_mapping
  }];
}

// Double boucle : chaque bloc hiérarchique × chaque critère → 1 ligne à insérer
const rows = [];
for (const block of mapping.mappings) {
  for (const criterion of block.criteria_mapping) {
    rows.push({
      document_name, formation_name: mapping.formation_name,
      hierarchy: block.hierarchy,     // NOUVEAU
      services: block.services,        // désormais pris depuis block (pas mapping)
      competency_key: criterion.competency_key,
      weight: criterion.weight,
      confidence: mapping.confidence,
      justification: mapping.justification,
      validated: false
    });
  }
}
```

**3. Nœud `HTTP Request1` — ajout 1 ligne au body JSON**
```json
"hierarchy": "{{ $json.hierarchy }}"
```
Sans cet ajout, le DEFAULT `'Collaborator'` de la table serait utilisé pour toutes les insertions, rendant les mappings Manager invisibles.

---

### 🚧 Statut actuel T16 — modifs faites, test bout-en-bout en attente

**Ce qui est FAIT et validé techniquement** ✅
1. ~~SQL Supabase — INSERT 10 critères Direction + Manager~~
2. ~~SQL Supabase — Correction 3 critères manquants (pilotage_equipe Direction, connaissance_hotel Manager, prise_responsabilite Manager)~~
3. ~~SQL Supabase — ALTER formation_criteria_mapping ADD COLUMN hierarchy~~
4. ~~N8N A1 Criteria Mapper — nouveau System Message avec 5 profils Collaborator + 1 profil Manager~~
5. ~~N8N A1 Code in JavaScript1 — double boucle + fallback legacy~~
6. ~~N8N A1 HTTP Request1 — transmission du champ hierarchy~~

**Ce qui RESTE à faire** ⏳
1. ⏳ **Test bout-en-bout du pipeline A1** avec un vrai document (demande faite à Thibault/Juliette d'un document managerial ou mixte pour éviter de polluer le RAG avec du fake data)
2. ⏳ Re-upload progressif des documents existants depuis Vercel (si nécessaire pour re-mapper vers les nouveaux critères)
3. ⏳ Front `src/pages/Connaissances.tsx` — radar double pour les managers (service + Manager transversal)
4. ⏳ Front `src/pages/admin/TeamAnalytics.tsx` — affichage radars complémentaires Manager dans les onglets training

**Décision produit documentée — pourquoi ne pas tester avec un fake PDF**
Pour éviter de polluer Qdrant (collection `RAGMistral2`) avec des points vectoriels bidon, d'insérer du fake data dans `formation_criteria_mapping` et de déclencher la génération de QCMs fantaisistes via le trigger `sync_training_questions_to_knowledge_queries`, Wilfried a fait le choix de demander à Thibault un vrai document de formation à la place. Le premier test servira donc aussi de première mise en service utile de la fonctionnalité.

---

## [2026-04-16] — Front T16 préalable (modifs réalisées en avril, committées le 22 avril)

### Conversation du 16 avril 2026 — "Analyse bugs formation et architecture système agentique"

**Objectif** : permettre aux Managers (Drichelle, Lopez, Boncoeur) d'accéder à l'admin, pas seulement à la Direction.

Fichiers impactés :
- `src/hooks/useStaffService.ts`
- `src/components/AdminProtectedRoute.tsx`

---

### Conversation du 16 avril 2026 — "Récupération du système de score preview disparu"

**Objectif** : permettre de cliquer sur une formation dans la liste pour afficher son radar d'impact sur les compétences.

Fichiers impactés :
- `src/pages/admin/TeamAnalytics.tsx`

---

### Conversation des 2-3 avril 2026 — "Radar overlay sur modal de formation"

**Objectif** : afficher le radar overlay quand on ouvre un document de formation. Le debug a été ajouté pour chercher un bug qui n'existait pas (en fait il manquait juste les critères Direction en base).

Fichier impacté :
- `src/components/modals/DocumentViewerModal.tsx` — **non inclus dans le commit du 22 avril**, nettoyage du debug prévu dans un commit ultérieur dédié.

---

