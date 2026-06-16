## [2026-06-16] (séance 23 - fin de migration vision A.1 : sortie de pixtral-large-latest)

### chore(n8n): bascule des 2 derniers nœuds A.1 de pixtral-large-latest (EOL 27/02/2026) vers mistral-medium-3.5

Suite de la séance 20 qui n'avait migré que la branche vision des images dans les PDF : le nœud `Pixtral Vision` (branche fichier image direct) et le `Mistral Cloud Chat Model` de l'agent de chat passent désormais à `mistral-medium-3.5`, éliminant le dernier recours au modèle pixtral en fin de vie. A.1 utilise maintenant un seul modèle vision partout ; A.2 n'était pas concerné.

---

## [2026-06-16] (séance 22 - record d'architecture : paramétrage actuel du pipeline n8n Mistral RAG/QCM)

### chore(n8n): journalisation rétroactive de la migration du pipeline formateur vers Mistral Cloud + Qdrant (état figé)

Entrée récapitulative consignant le paramétrage actuel des workflows n8n du module formation, dont la migration vers Mistral n'avait jamais été tracée comme décision d'architecture (seulement en filigrane des bugfixes séances 20-21).

**Socle commun** : vector store Qdrant Cloud `RAGMistral2` (1024 dims, Cosine), embeddings `mistral-embed`, Supabase `ypxmzacmwqqvlciwahzw`.

**A.1 THE TRAINER'S BRAIN — CORE RAG** (n8n id `5kapoWXtMBNfuxwa`) : ingestion déclenchée par Webhook `POST /new-training-to-record`. Dédup Qdrant (scroll + delete sur `metadata.document_name`). OCR PDF via `mistral-ocr-latest` ; vision des images de pages PDF via `mistral-medium-3.5` (batch 1, retry 5 / 4000 ms, onError continue) ; image directe via `pixtral-large-latest`. Mapping compétences par AI Agent `mistral-large-latest` (4000 tok / temp 0.2) → table `formation_criteria_mapping`. Chunking 1200 / overlap 150. Après insertion : Wait 3 min → vérification Qdrant → PATCH `knowledge_queries.ingestion_status` (`vectorisé`/`échec`) → appel `/generate-qcm`. Agent de chat (sous-graphe) : `pixtral-large-latest` + retrieve-as-tool topK 50 + mémoire fenêtrée.

**A.2 THE EVALUATOR — QCM Generator** (n8n id `UCnvxBbADJ9s6HKK`) : Webhook `POST /generate-qcm` → vérification points Qdrant → PATCH statut. AI Agent QCM `mistral-large-latest` (8000 tok / temp 0.3) + retrieve-as-tool topK 35 (filtre `metadata.document_name`). Génère 20 QCM FR (5×factual_recall / procedure / application / error_id), parser JS tolérant (strip markdown + récupération question-par-question + skip des invalides) → insert `training_questions` (`Prefer: merge-duplicates`).

**Note sécurité** : les exports n8n embarquent la clé `service_role` Supabase en dur dans les nœuds HTTP — à externaliser en credential n8n (non traité ici).

---

## [2026-06-16] (séance 21 - fix assistant : parsing JSON tolérant côté n8n)

### fix(n8n): déblocage des réponses de l'assistant (B.2) cassées par la migration Mistral

B.2 THE ASSISTANT - CHAT : le nœud `Code in JavaScript` plantait sur `JSON.parse` (« Bad control character in string literal ») depuis le passage à Mistral, qui renvoie des retours-ligne bruts dans les chaînes JSON — toutes les réponses tombaient sur le fallback « Désolé, je n'ai pas pu récupérer » (confidence bad, sources vides). Ajout d'un parser tolérant `safeJsonParse` qui échappe les caractères de contrôle uniquement à l'intérieur des chaînes, + assouplissement de la validation (seul `answer` requis, `sources` défaut `[]`). Vérifié : « est-ce que la chambre 54 est twinable » renvoie une vraie réponse en High confidence avec sources.

---

## [2026-06-08] (séance 20 - debug pipeline n8n RAG/QCM : ingestion A.1, vérification Qdrant, génération QCM A.2)

### fix(n8n): déblocage de bout en bout de l'ingestion (A.1) et de la génération de QCM (A.2), + rattrapage de la séance n8n précédente non journalisée

A.1 THE TRAINER'S BRAIN (CORE RAG) : `Search For Existing Point1` passé de `.item` à `.first()` sur `$('Webhook')...document_name` (erreur paired-item qui plantait juste après le Wait et empêchait le PATCH de statut), et `Delete Existing Point` dont le corps JSON est désormais enveloppé dans `JSON.stringify(...)` (le tableau d'UUID était rendu en JSON invalide, bloquant la purge des anciens points lors d'une réingestion). A.2 THE EVALUATOR (QCM Generator) : `HTTP Request2 set vectorized` et `HTTP Request3 set Failed` réécrits pour cibler `ingestion_status` (`vectorisé` / `échec`) au lieu de `status` (varchar(20) trop court et colonne réservée au cycle de vie utilisateur), avec ajout des accolades manquantes au body Failed ; topK du retrieval QCM confirmé à 35. Rattrapage séance n8n précédente (A.1) : branche image/vision fiabilisée (onError=continue + retry 3-5 / wait ~3000 ms + batching 1 item / 2000-3000 ms sur Pixtral Vision et Send Image pour absorber les 429 sur ~39 images), modèle Pixtral à migrer de pixtral-large-latest (EOL 27/02/2026) vers mistral-medium-3.5, Prepare Embedding passé de `.item` à `.first()`, Webhook en Respond Immediately (fix timeout navigateur 4 min), Recursive Character Text Splitter en chunk 1000 / overlap 150, Limit maxItems 3 vers 1 (1 QCM par ingestion), et ajout de la branche de vérification Qdrant post-Wait (Search For Existing Point1, IF Points Présents ?, PATCH ingestion_status vectorisé/échec).

---

## [2026-06-08] (séance 19 - autocomplétion anti-doublon sur le champ Training Title)

### feat(admin-training): suggestions de documents existants pendant la saisie du titre de formation

UploadTraining.tsx : en mode création, le champ Training Title affiche désormais en temps réel la liste des formations existantes dont le nom correspond à la saisie (la liste `knowledge_queries` est maintenant chargée dès l'ouverture, plus seulement en mode update). Cliquer sur une suggestion bascule directement vers l'onglet de mise à jour avec le document présélectionné, ce qui évite de recréer un doublon au lieu de mettre à jour l'ancien.

---

## [2026-06-08] (séance 18 - statut admin à la place du statut user + panneau Filtres repliable dans la Bibliothèque)

### feat(admin-training): statut d'ingestion affiché à la place du statut kanban + filtres et tri repliables

AdminTraining.tsx : en vue grille et liste, la zone Statut affiche désormais le statut d'ingestion admin (et plus jamais le statut kanban user) ; `en attente` (« Mettre à jour le document dans la base ») passe en rouge, les contenus sans ingestion (QCM/training/practice) affichent `—`, et les variables mortes statusColor/statusLabel sont retirées. Les pills de type sont remplacées par un panneau « Filtres » repliable à 4 menus (Type de contenus, Statut, Ordre alphabétique A-Z / Z-A, Date récent / ancien), avec tri unique actif et filtrage statut restreint aux formations.

---

## [2026-05-29] (séance 17 - refonte panel notifications : sections non lues / récemment lues + fix Tout lire)

### fix(notifications): panel scindé en 2 sections, « Tout lire » optimiste, historique 30 dernières lues repliable

« Tout lire » ne marchait pas visuellement : `markAllAsRead` mettait à jour l'état local seulement si la requête DB réussissait (gating sur erreur), pattern asymétrique vs `markAsRead`. Et les notifs cliquées restaient dans la liste avec fond neutre, accumulant le bruit visuel. Fix : (1) `useNotifications.ts` refactoré — 2 requêtes parallèles (non lues sans limite + 30 dernières lues sur `read_at` desc), 2 états séparés `unreadNotifications` / `readNotifications`, `markAsRead` et `markAllAsRead` optimistes (état local d'abord, DB en best-effort, log si échec). (2) `NotificationBell.tsx` — section haute non lues toujours visible (empty state « Aucune nouvelle notification »), section basse « Récemment lues » repliable (chevron + compte), clic sur non lue la déplace en tête de la section basse, « Tout lire » bascule en bloc. Footer total supprimé (badge cloche suffit).

---

## [2026-05-29] (séance 16 - auto-archivage cartes completed/verified à la rotation de shift)

### fix(shifts): cartes completed/verified rattachées à un shift clos désormais archivées automatiquement

26 cartes orphelines (17 completed + 9 verified) s'accumulaient dans le Kanban (`useTasks` filtre `status != 'archived'`). Cause : la fonction SQL `rotate_permanent_shifts()` (cron quotidien 01:00 UTC) ne touchait pas la table `task`, et l'archivage front (`ShiftManagement.tsx`) ne couvrait que `completed`, pas `verified`. Fix : (1) SQL — `rotate_permanent_shifts()` étendue avec un UPDATE catch-all qui archive toute carte completed/verified dont le shift est `status='completed'` (idempotent, couvre auto + manuel). (2) Front — `ShiftManagement.tsx` l. 839 : filtre étendu à `completed || verified`. (3) Backfill SQL one-shot exécuté : 26 cartes archivées.

---

## [2026-05-28] (séance 15 - reproduction graphe + Répartition côté Individual Shift)

### feat(analytics): graphe Évolution temporelle et bloc Répartition ajoutés à l'onglet Individual Shift

Miroir de l'onglet Individual Task. `shiftChartTimeseries` (useMemo) dérive de `periodShiftDetails` : séries Démarrés/Clôturés par bucket sur `start_time`, granularité auto identique (day=heure, week/month=jour, custom auto). `shiftCategories` ventile par service (reception/housekeeping/maintenance/direction) avec `SERVICE_COLORS`. JSX inséré entre KPIs et tableau classement. Couleurs Démarrés=vert / Clôturés=gold cohérentes avec KPIs.

---

## [2026-05-28] (séance 14 - fix Répartition non scopée à la période + réintégration tâches orphelines)

### fix(analytics): bloc Répartition dérivé de rangeTasks, cohérent avec classement et graphe

**Problème** — Onglet Individual Task : le bloc Répartition (Incidents / Demandes client / Follow-ups / Tâches internes) restait figé sur le cumul all-time quelle que soit la période sélectionnée. Invisible par défaut car la 1re tâche (2026-01-28) tombe dans la fenêtre affichée → all-time = période ; visible dès qu'on bascule sur day/week. Même classe de bug que le classement (séance 12) et le graphe (séance 13).

**Origine** — `categories` sommait `teamStats.reduce(... m.incidents_count ...)`, issu de la vue `v_user_task_stats` (cumul, non filtré par période, jointe sur `auth_user_id`).

**Diagnostic (read-only Supabase, avant correction)**
- Classement (table `task`, période 01/01 → 28/05) : vérifié exact sur 11/11 membres (créées/closes/assignées/résolues + % dérivés cohérents). Aucun hardcode dans toute la chaîne ; `useMyStatistics` ne lit que 3 vues, sans mock ni fallback.
- Répartition affichée = somme de la vue = 54 / 7 / 63 / 139.
- Table `task` réelle = 55 / 7 / 63 / 141. Écart -1 incident / -2 internes = 3 tâches `archived` (févr. 2026) dont `created_by` est orphelin (UUID absent de `staff_directory`), écartées par la jointure auth de la vue.

**Correction (src/pages/admin/TeamAnalytics.tsx, bloc `categories`)** — 4 expressions remplacées : `teamStats.reduce((s,m) => s + m.<cat>_count, 0)` → `rangeTasks.filter(t => t.category === '<cat>').length`. Édits chirurgicaux ASCII-only (libellés accentués et couleurs intacts). Mapping : incidents_count→incident, client_requests_count→client_request, follow_ups_count→follow_up, internal_tasks_count→internal_task. Pas de `useMemo` ajouté (recalcul trivial, aligné sur l'existant).

**Effets** — (1) Répartition désormais 100% scopée à la période, cohérente avec classement + graphe (3 blocs sur la source unique `rangeTasks`). (2) Réintègre les 3 tâches orphelines → 55 / 7 / 63 / 141 sur période full-history. Hausse attendue, pas une régression.

**Vérification** — Validé visuellement par Wilfried (bascule day/week/month recalcule bien le bloc). `teamStats` toujours utilisé ailleurs (classement, shifts) → aucun dead code introduit.

---

## [2026-05-28] (séance 13 - fix graphe Évolution temporelle plafonné 30j)

### fix(analytics): graphe Évolution temporelle débridé, dépend désormais 100% de la période

**Problème** — Onglet Individual Task : courbe Créées/Closes plafonnée à ~30j même en Custom (ex. 01/01 → 28/05 affichait 30 points). Bug acté en séance 12, non corrigé.

**Origine** — `chartTimeseries` lisait la vue SQL `v_tasks_timeseries` (cappée `now() - 30 days` côté DB). Même racine que le bug du classement résolu en séance 12.

**Correction (src/pages/admin/TeamAnalytics.tsx, l. 690-784)** — Réécriture du `useMemo chartTimeseries` pour dériver de `rangeTasks` (source unique avec KPIs + classement). Granularité auto depuis `periodFilter` :

| Filtre | Granularité | Buckets |
|---|---|---|
| day | heure | 24 (00h-23h) |
| week | jour | ≤ 7 |
| month | jour | ≤ 31 |
| custom | auto | ≤31j=jour, 32-90j=semaine, >90j=mois |

Pré-génération de la grille complète (pas de trous), lundi ISO pour les buckets semaine, labels FR (`JJ/MM`, `MMM YY`). `Closes` = `status ∈ CLOSED_STATUSES` (même définition que classement/KPIs → cohérence 3 blocs).

**Hors scope (cleanup 2e passe)** — `allTimeseries` / `rawDayRows` deviennent dead code. Le fetch `v_tasks_timeseries` reste branché car il alimente `rawLoading` → `kpiLoading` (spinners KPIs). Suppression complète reportée après validation visuelle pour faciliter rollback.

**Vérification** — TypeScript OK (`tsc --noEmit`). À valider visuellement : Custom 01/01→28/05 doit afficher des buckets mensuels.

---

## [2026-05-28] (séance 12 - consolidation compte fantôme Mélanie Tavares + refonte classement Team Analytics)

### fix(data): rattachement du compte fantôme Mélanie Tavares au compte actif

**Problème**
Mélanie Tavares possédait deux entrées dans `staff_directory` : un compte fantôme historique `70418d66-980c-4b51-acfa-023b7f90b87d` (créé 2025-09-11, `auth_user_id IS NULL`, jamais authentifié) et le compte actif `9d20cf22-078e-4757-9aa7-f0b810c90da7` (= `auth_user_id` = `profiles.id`). Une partie des tâches restait rattachée au fantôme, donc invisible dans le suivi analytique (les vues `v_user_task_stats` et `v_tasks_timeseries` joignent/filtrent sur `auth_user_id`, NULL pour le fantôme).

**Diagnostic (read-only Supabase)**
- `task.created_by` = fantôme : 4 tâches archivées non migrées.
- `task.assigned_to` (uuid[]) = fantôme : 15 tâches (dont 2 contenant déjà l'actif).
- `shifts`, `training_*`, `competency_scores`, tables secondaires : déjà migrés (0 résidu).

**Correction (SQL exécuté dans Supabase SQL Editor)**
1. `UPDATE staff_directory SET is_active=false WHERE id='70418d66...' AND auth_user_id IS NULL` (retrait des pickers/listes front).
2. `UPDATE task SET created_by='9d20cf22...' WHERE created_by='70418d66...'` (4 lignes).
3. `UPDATE task SET assigned_to = array_agg(DISTINCT e) FROM unnest(array_replace(assigned_to, fantôme, actif)) e WHERE fantôme = ANY(assigned_to)` (15 lignes, remplacement + dédoublonnage).

**Vérification**
- Fantôme : 0 référence `created_by` / `assigned_to`, `is_active=false`.
- `v_user_task_stats` compte actif : `tasks_created_total` 24 -> 28, `tasks_assigned_total` 4 -> 17.

**Fait**
- Suppression définitive de la ligne fantôme (`DELETE` exécuté le 2026-05-28). Pré-checks OK (0 FK bloquante référençant le fantôme, sauvegarde `audit_2026_05_27_staff_directory` présente). Vérif post-suppression : 0 fantôme restant, compte actif `9d20cf22` intact, 1 seule Mélanie Tavares dans `staff_directory`.

### feat(analytics): refonte du Classement équipe (onglet Individual Task) - périmètre cohérent + colonnes assignées/résolues

**Problèmes constatés**
1. Bug de périmètre majeur : le classement et le KPI Taches {periode} étaient reconstruits en sommant les lignes journalières de `v_tasks_timeseries`, qui ne couvrent que les 30 derniers jours (`created_at >= now() - 30 days`). Toute période > 30 j était silencieusement tronquée (ex. Mélanie : 28 créées réelles sur Jan-Mai, affichées 6).
2. Incohérence intra-ligne : créées/closes sur la période mais colonne shifts en cumul total (`shifts_completed`), et tooltip entièrement hors période (incidents/demandes en cumul, today/semaine figés).
3. Angle mort fonctionnel : aucune visibilité sur les tâches assignées ni résolues par le membre.

**Refonte (src/pages/admin/TeamAnalytics.tsx)**
1. Nouvelle source `rangeTasks` : `useEffect` requêtant directement `task` (created_by, assigned_to, status, updated_by, category, created_at) filtré par `activeRange` (même principe que la requête shifts). Corrige le plafond 30 j.
2. `periodRanking` reconstruit : map sur `teamStats` (filtré `auth_user_id`), agrégation par membre depuis `rangeTasks`. Plus de dépendance à `v_tasks_timeseries` / `rawDayRows` pour le classement.
3. `periodKPIs` recalculé depuis `rangeTasks` (cohérent avec le classement).
4. Définitions métier verrouillées :
   - Constante `CLOSED_STATUSES = {completed, archived, verified}` (terminé = résolu OU enregistré OU validé manager ; cancelled/pending/in_progress exclus).
   - Groupe 1 Créées & closées (individuel) : créées (`created_by`=membre, période), closes (+ statut terminé), résolution = closes/créées.
   - Groupe 2 Assignées & résolues : assignées (`membre = ANY(assigned_to)`, période), résolues (+ statut terminé ET `updated_by`=membre, donc closées par elle), taux = résolues/assignées.
5. `MemberRow` réécrit : 2 groupes de 3 colonnes + séparateur, colonne Shifts SUPPRIMÉE (doublon avec l'onglet Shift dédié), tooltip recalculé 100% période (En cours, Incidents, Demandes client, Follow-ups, Tâches internes) avec libellé de période.
6. En-têtes des 2 groupes ajoutés au-dessus de la liste.

**Choix & limites documentés**
- "par elle" s'appuie sur `updated_by` (seul champ peuplé à 97% ; `task_updates`, `completed_at`, `current_receptionist_id` existent mais sont vides). `shift_id` écarté (corrèle au résolveur seulement 39%). Conséquence : sur les tâches assignées, `updated_by` sous-estime la résolution (Mélanie 5/17 par elle vs 17/17 terminées) car l'archivage final est souvent fait par un tiers.
- Rétroactivité impossible : un vrai `resolved_by`/`completed_by` nécessiterait d'instrumenter le code de clôture (chantier backend séparé, futur uniquement).
- Le graphe Evolution temporelle garde le plafond 30 j (bloc non modifié, à traiter ultérieurement).
- Alignement px des 2 en-têtes (176/192) potentiellement à ajuster selon rendu.

**Vérification**
- Build OK (`noUnusedLocals: false` -> `rawDayRows` devenu inutilisé sans impact).
- Mélanie (période 01/01 -> 28/05) : Créées 28 / Closes 27 / Résolution 96% | Assignées 17 / Résolues 5 / Taux 29%.

---

## [2026-05-28] (séance 11 - B-14 LocationSection mobile responsive et fermeture auto accordéon)

### fix: grille responsive et wrap multi-ligne + fermeture auto Floor après sélection

**Problème (B-14) remonté par Thibault sur mobile**
1. Affichage : dans la modal de création de carte (TaskCreationModal > LocationSection), les noms longs des common areas (ex. « Couloir étage 1 chambres 1er - 2e (palier 1er included) ») se superposaient visuellement et devenaient illisibles sur un viewport mobile (~380px).
2. UX : après sélection d'un item de location, l'accordéon du Floor restait ouvert, obligeant l'utilisateur à le refermer manuellement.

**Cause technique**
1. Grille forcée à `grid-cols-4` sans breakpoint responsive → ~85px par cellule sur mobile, combiné à `h-8` (hauteur fixe 32px) et au `whitespace-nowrap` par défaut du `<Button>` shadcn → débordement et chevauchement entre boutons voisins.
2. La fonction `handleLocationSelect` ne mettait à jour que `formData`, sans toucher à `openSections`. Aucun feedback visuel de fermeture après sélection.

**Correction (src/components/LocationSection.tsx)**
1. Grille responsive : `grid-cols-2 sm:grid-cols-3 md:grid-cols-4` (2 colonnes mobile, 3 tablette, 4 desktop). Zéro régression desktop puisque le breakpoint md preserve `grid-cols-4`.
2. Button passe de `h-8 text-xs px-2` à `h-auto min-h-[2.5rem] py-1 text-xs px-2 whitespace-normal text-center leading-tight` → hauteur adaptative, wrap multi-ligne autorisé, texte centré.
3. Signature `handleLocationSelect(location: string)` étendue à `handleLocationSelect(location: string, sectionKey?: string, floor?: string)` (params optionnels → rétrocompatible si appelé ailleurs).
4. Ajout d'un bloc `setOpenSections` qui ferme uniquement `${sectionKey}-${floor}` après sélection. La section parente (Rooms / Common Areas / Public Areas / Staff Areas) reste ouverte pour préserver le contexte de navigation.
5. `onClick` du Button location passe désormais `(location.name, sectionKey, floor)` au handler.

**Vérification utilisateur**
- Test mobile DevTools ≈ 380px : noms longs s'affichent proprement sur 2-3 lignes, plus de superposition.
- Clic sur un item de Common Area : l'accordéon Floor X se referme, Common Areas reste déplié.
- Test desktop : 4 colonnes inchangées, aucune régression visuelle.

---

## [2026-05-27] (séance 10 - B-13 suppression membre staff cascade complète)

### feat: Edge Function delete-staff + double confirmation UI

**Problème (B-13)**
Le bouton corbeille dans `/admin/onboarding > Rôles & Hiérarchie` ne supprimait que la ligne `staff_directory`, laissant `auth.users` + `profiles` orphelins. Le compte restait utilisable côté login — faille fonctionnelle pour les comptes parasites ou les départs.

**Solution**
1. Nouvelle Edge Function `supabase/functions/delete-staff/index.ts` orchestrant la cascade complète :
   - Vérification JWT + re-check serveur du rôle (Manager OU service='direction')
   - 3 branches gérées (auth+sd / auth seul / sd seul)
   - Ordre forcé : `auth.users` d'abord (cascade auto vers `profiles` via FK ON DELETE CASCADE) puis `staff_directory`
   - Gestion FK violation 23503 → retour 409 avec code 'FK_VIOLATION' (11 FK NO ACTION pointent vers `staff_directory.id`)
   - Audit dans `system_events` (event_type='staff_deleted' ou 'staff_deleted_partial')

2. Front `TabRoleHierarchy` (`TeamOnboarding.tsx`) — double pop-in de confirmation :
   - Pop-in 1 ton doré : « Supprimer un membre de l'équipe ? » → boutons Non / Oui
   - Pop-in 2 ton rouge : « Confirmation finale » + saisie du prénom (normalisation case+accents) + bouton désactivé tant que pas de match
   - Fallback en cascade pour `expectedConfirmText` : `first_name` → premier mot `full_name` → premier mot `displayName`
   - Câblage `supabase.functions.invoke('delete-staff', { body: { auth_user_id, staff_directory_id } })`
   - Gestion erreur FK_VIOLATION → toast clair « Désactivez plutôt via is_active=false »

**Vérifications préalables Supabase (read-only)**
- `system_events` : colonnes event_type / payload / created_by / created_at confirmées
- FK `profiles.id → auth.users.id` = CASCADE ✅
- FK `profiles.staff_directory_id → staff_directory.id` = NO ACTION → impose l'ordre auth puis sd
- 11 FK pointant vers `staff_directory.id` en NO ACTION (incidents, shifts, comments, checklists, reminders, attachments, escalations×2, task_members×2, profiles)

**Test sur Remy Gervais (sd_id `d61319a6-6e5a-4aff-81f0-f14688806077`, branche C)**
- Suppression UI complète OK : pop-in 1 → pop-in 2 → saisie « Remy » → bouton activé → suppression
- `staff_directory` : ligne disparue (count = 0)
- `system_events` : événement 'staff_deleted' loggé @ 2026-05-27 23:43:32 UTC
- Toast vert affiché côté UI

**Non testé cette session**
- Branche B (auth_user_id seul, profile orphelin sans sd, cas Shami Martin) : test non réalisable via l'UI actuelle car `TabRoleHierarchy` n'affiche que les lignes `staff_directory`. À tester via curl / Supabase Dashboard quand besoin (sujet « orphelins profiles » à traiter séparément).
- Branche A (auth + sd combinés) : à valider lors de la prochaine vraie suppression d'un user authentifié.

---

## [2026-05-27] (séance 9 - fix triggers sync profiles staff_directory)

### fix: B-07 propagation service et hierarchy

**Problème**
Modification du service ou de la hiérarchie d'un membre depuis `/admin/onboarding > Rôles & Hiérarchie` : `profiles` était mis à jour mais `staff_directory` gardait l'ancienne valeur. Cas concret : Mois Dumitrita restait à "Housekeeping" majuscule dans staff_directory après modification.

**Cause**
Fonction `sync_profiles_to_staff_directory()` utilisait `COALESCE(NEW.service, staff_directory.service)` et `COALESCE(NEW.hierarchy, staff_directory.hierarchy)` dans la branche UPDATE — bloquait la propagation.

**Correction**
Remplacement de `COALESCE(...)` par `NEW.service` et `NEW.hierarchy` directs. `profiles` est source de vérité, sa valeur s'impose toujours.

---

### fix: B-09 trigger updated_at sur profiles

**Problème**
`profiles.updated_at` restait figé même après modification. Cas Mois : updated_at bloqué au 18/02/2026.

**Cause**
Aucun trigger `BEFORE UPDATE` sur `profiles` (alors que `staff_directory` en avait un).

**Correction**
Création du trigger `trigger_update_profiles_updated_at` `BEFORE UPDATE ON public.profiles` appelant la fonction existante `update_updated_at_column()` (déjà utilisée sur staff_directory).

---

### fix: B-10 timeout sur modification membre (fast path)

**Problème**
Modification d'un membre déjà rattaché (99% des cas après onboarding) déclenchait un timeout PostgreSQL `canceling statement due to statement timeout`. Reproduit sur Miguel Lopez (Manager Collaborator).

**Cause**
La fonction `sync_profiles_to_staff_directory()` réexécutait à chaque UPDATE la logique de migration initiale (matching par `last_name` + `UPDATE staff_directory SET id = NEW.id` même quand `id == NEW.id`). Le `SET id = NEW.id` déclenchait toutes les `ON UPDATE CASCADE` des FK vers `staff_directory.id` (tasks, training_progress, qcm_responses, etc.) > 8s sur un membre actif.

**Correction**
Ajout d'un FAST PATH en début de fonction : si `NEW.id` existe déjà dans `staff_directory`, UPDATE simple ciblé sur email/first_name/service/hierarchy/updated_at puis RETURN. La logique de matching/migration historique (SLOW PATH) reste intacte pour le cas onboarding initial.

**Vérification**
Miguel Lopez : Manager Collaborator passé en moins d'1s. profiles et staff_directory alignés au timestamp microseconde près (2026-05-27 18:41:59.69436).

---

## [2026-05-27] (séance 8 - audit users/staff + fix dropdown service + badge statut email)

### audit: Architecture profiles / staff_directory / auth.users (read-only)

**Contexte client**
3 cas remontés par Wilfried/cliente : (1) Mois Dumitrita inscrite mais affichée en "reception/Collaborator" alors qu'elle est Housekeeping Manager, (2) Kyungu Ebongo et Sandra Mangudi affirment ne pas pouvoir accéder à la plateforme malgré leur signup, (3) impossible de supprimer le profil de Remy Gervais (parti de l'hôtel).

**Audit complet effectué en 3 phases**
- Phase A : formulaire (`Auth.tsx`) → `auth.users` → `profiles` via trigger `handle_new_user`
- Phase B : `profiles` → `staff_directory` via trigger `sync_profiles_to_staff_directory`
- Phase C : UI admin (`/admin/onboarding > Rôles & Hiérarchie`)

**Bugs identifiés (14 au total, dont 8 critiques)**
- A2 : Si `job_role` absent de `raw_user_meta_data`, fallback ELSE 'reception' → explique le cas Mois (signup antérieur à l'enrichissement du CASE)
- B1 : Trigger 2 matche par `last_name` SEUL avec `LIMIT 1` non déterministe (3 lignes sd 'de Renty' = match aléatoire)
- B2 : Récursion potentielle du trigger 2 via `UPDATE profiles SET staff_directory_id` qui re-déclenche le trigger
- B3 : `EXCEPTION WHEN OTHERS THEN RAISE WARNING` masque toute erreur de sync (silent killer)
- B4 : Trigger 2 fait `UPDATE staff_directory SET id = NEW.id` qui peut violer PK si NEW.id existe déjà
- B5 : Seules `task.created_by` et `task.assigned_to` sont mises à jour par le trigger ; les autres FK (`shifts.user_id`, `training_results.user_id`, etc.) restent orphelines
- B7 : Branche INSERT du trigger 2 hardcode `role='receptionist'` quoi que soit le job_role réel
- C1 : Dropdown SERVICES `['Réception', 'Housekeeping', 'Petit Dejeuner', 'Maintenance', 'Direction']` incompatible avec enum `service_type` (minuscules) → toute modif via UI plante avec "invalid input value for enum"
- C7 : Bouton "Ajouter un membre" via `inviteUserByEmail` mais aucun indicateur dans l'UI montrant les comptes invités mais non confirmés par email → cas Kyungu/Sandra

**Découvertes annexes**
- 7 "fantomes" `staff_directory` du seed initial 11/09/2025 ont en réalité des first_name/last_name remplis (Tsira Batsikadze, Patrick Castagne, Monne Leonie Doua, Remy Gervais, Natia Shvirtaridze, Mélanie Tavares, Rachida Zarrouki). Validation client : 5 en arrêt maladie (à conserver), Remy parti (à supprimer), la "fantôme" Mélanie est en réalité un doublon de l'auth Mélanie avec 11 tasks orphelines.
- 3 profiles sans ligne staff_directory : Leonie (trigger 2 a planté silencieusement), Pierre Test (compte test), Shami Martin (compte test mailinator).
- Kyungu et Sandra ont `email_confirmed_at = NULL` dans `auth.users` : compte créé le 06/05 mais lien de confirmation jamais cliqué.

---

### chore: Snapshot d'audit des 3 tables critiques

**Action**
Création de 3 tables d'archive avant toute modification données :
- `audit_2026_05_27_profiles` (25 lignes)
- `audit_2026_05_27_staff_directory` (29 lignes)
- `audit_2026_05_27_auth_users` (25 lignes, colonnes sécurisées uniquement)

RLS activé sur les 3 tables, lecture interdite côté front (`anon` + `authenticated`). Lecture admin via SQL Editor (service_role) uniquement.

**Pourquoi**
Filet de sécurité avant les fixes data : permettre reconstitution de l'état initial en cas de regression.

---

### fix: Dropdown service de TabRoleHierarchy aligné sur l'enum `service_type`

**Symptome**
Dans `/admin/onboarding > Rôles & Hiérarchie`, toute tentative de modifier le service d'un user avec compte Sokle déclenchait "invalid input value for enum service_type: 'Réception'". Pour les users sans compte, la valeur polluée (avec capitale et accent) était écrite en text libre dans `staff_directory.service`.

**Cause root**
Le constant `SERVICES = ['Réception', 'Housekeeping', 'Petit Dejeuner', 'Maintenance', 'Direction']` (ligne 67 de `TeamOnboarding.tsx`) ne correspondait pas aux valeurs acceptées par l'enum (`reception, housekeeping, restaurant, maintenance, direction, ai_team, artificial_intelligence`).

**Fix appliqué**
Ajout d'un nouveau constant `SERVICE_OPTIONS` aligné sur l'enum (value = valeur stockée, label = affichage UI). Seul le `<select>` Service de `TabRoleHierarchy` est basculé dessus. `TabAttribution` et `TabSuivi` continuent d'utiliser `SERVICES` legacy (évite régression sur l'historique des assignations).

```typescript
const SERVICE_OPTIONS = [
  { value: 'reception',    label: 'Réception' },
  { value: 'housekeeping', label: 'Housekeeping' },
  { value: 'maintenance',  label: 'Maintenance' },
  { value: 'direction',    label: 'Direction' },
];
```

**Choix métier**
Périmètre limité à 4 services (vs 7 dans l'enum) : on n'expose pas `restaurant`, `ai_team`, `artificial_intelligence` qui sont des héritages techniques non pertinents pour le client hôtelier.

---

### fix: Mois Dumitrita - profile et staff_directory réalignés sur Housekeeping/Manager

**Avant**
- `profiles.service` = `'reception'` (snapshot périmé du 18/02/2026)
- `profiles.hierarchy` = `'Collaborator'`
- `staff_directory.service` = `'Housekeeping'` (capitale polluée)
- `staff_directory.hierarchy` = `'Manager'` (corrigé côté sd le 12/05 par l'admin)

**Après**
- `profiles.service` = `'housekeeping'` (via UI admin, grâce au fix dropdown)
- `profiles.hierarchy` = `'Manager'`
- `staff_directory.service` = `'housekeeping'` (UPDATE SQL manuel pour normaliser la casse)
- `staff_directory.hierarchy` = `'Manager'`

**Validation client**
Juliette avait déjà confirmé le 12/05 que Mois est Housekeeping Manager. Re-confirmé par Wilfried.

---

### feat: Vue `v_staff_auth_status` + badge statut email à 3 états

**Contexte**
Le badge actuel "✓ Accès Sokle" mentait : il s'affichait pour Kyungu et Sandra alors qu'elles n'avaient pas confirmé leur email et ne pouvaient donc pas se connecter. Aucun feedback côté admin permettant d'identifier ce cas.

**Architecture**
- Création d'une vue Supabase `public.v_staff_auth_status` qui joint `staff_directory` à `auth.users.email_confirmed_at`
- Calcul d'un champ dérivé `access_status` : `'not_registered' | 'pending_email' | 'active'`
- `GRANT SELECT ... TO authenticated` : la vue est lisible par tout user connecté (info non sensible : juste un statut de confirmation)

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

**Front**
- Type `StaffRow` étendu avec `auth_email_confirmed_at` et `access_status`
- Query `staff_directory_all` enrichie avec une 3ème requête sur la vue + merge dans le useMemo de mapping
- Constant `ACCESS_BADGE` ajouté avec 3 états visuels distincts :
  - 🟢 vert `#4ade80` : "✓ Inscrit sur Sokle" (active)
  - 🟠 orange `#fb923c` : "⚠ A créé son compte mais pas validé son mail" (pending_email)
  - 🔴 rouge `#f87171` : "✘ Pas encore inscrit, doit créer son compte" (not_registered)

**Résultat**
Kyungu et Sandra apparaissent maintenant en orange dans l'admin, ce qui rend visible le besoin de confirmation email. Mélanie fantome (seed sans auth), Monne Leonie, Natia, Patrick, Tsira, Rachida, Remy apparaissent en rouge (à inscrire / supprimer selon cas).

**Limitation V1**
Pas de bouton "Valider manuellement" dans l'UI. Pour confirmer Kyungu/Sandra il faudra encore passer un UPDATE SQL manuel via SQL Editor (`UPDATE auth.users SET email_confirmed_at = NOW() WHERE email IN (...)`). Bouton UI à ajouter dans une session dédiée.

---

### TODO (bugs identifiés à traiter en session suivante)

**Refonte trigger 2** (B1, B2, B3, B4, B5, B7) — le trigger `sync_profiles_to_staff_directory` actuel a 7 bugs structurels qui causent les fantômes, doublons et profiles orphelins. Le matching par last_name doit être remplacé par un matching déterministe (auth_user_id ou email canonical), la récursion doit être supprimée via `pg_trigger_depth() = 1`, et les exceptions doivent être logées dans `system_events` au lieu d'être silencées.

**Trigger `profiles.updated_at`** (B-NEW-1) — la colonne `profiles.updated_at` ne se met pas à jour automatiquement quand profile est modifié (pas de trigger BEFORE UPDATE). Conséquence : impossible de se fier à cette colonne pour audit. Ajouter un trigger similaire à celui de `staff_directory`.

**COALESCE garde l'ancien** (B-NEW-2) — le trigger 2 utilise `service = COALESCE(NEW.service, sd.service)` qui préserve l'ancienne valeur polluée au lieu de l'écraser. Logique inverse nécessaire.

**Trim manquant au signup** (B-NEW-3) — espaces parasites dans `profiles.first_name`/`last_name` lors de la création (cas Mois). Ajouter `trim()` dans `handle_new_user`.

**Cleanup données restants** (à traiter après refonte trigger 2)
- Migration des 11 tasks de la Mélanie fantôme (`70418d66`) vers la vraie Mélanie (`9d20cf22`), puis suppression du fantôme
- Suppression de Shami Martin (auth + profile + sd, compte test mailinator)
- Suppression de Remy Gervais (sd seul, sans auth, parti de l'hôtel)
- Restauration de Leonie Doua : recréer sa ligne sd liée à auth_user_id `70bcf914`, copier les data du fantôme `d2d5ca7c`, supprimer le fantôme
- Normalisation des `sd.service` polluées (`Réception`, `Petit Dejeuner`, `Housekeeping` capitale) avec adaptation des filtres dans `TabSuivi` et `TabAttribution`

**Bouton "Valider l'email" dans l'UI admin** (complément au badge 3 états) — Edge Function `confirm-staff-email` qui prend un `auth_user_id`, vérifie que l'appelant est Direction/Manager, set `email_confirmed_at = NOW()` sur `auth.users`, logge dans `system_events`. Permettre à Juliette d'auto-résoudre les cas Kyungu/Sandra-like depuis SOCLE sans passer par Wilfried.

**Feature "Bouton supprimer fonctionnel"** — actuellement le bouton corbeille ne supprime que `staff_directory`. Pour supprimer un staff parti (cas Remy), il faut une cascade auth + profiles + sd avec gestion des FK orphelines (SET NULL sur shifts/tasks/training_results historiques, RESTRICT si shifts ouverts).

**UI de rattachement assisté pour les futurs signups** — quand un nouveau user signup avec un last_name matchant une entrée sd existante (cas Léonie/Monne Leonie), présenter à l'admin (Direction/Manager) un panel "à valider" avec choix "rattacher à X" ou "créer nouvelle entrée". Matching robuste via `pg_trgm` (extension déjà disponible).

---

## [2026-05-12] (séance 7 - backfill created_by formations legacy)

### fix: Affichage "Inconnu a assigné" sur les tâches de formation — root cause data

**Symptôme**
Juliette remontait sans cesse voir "Inconnu" comme auteur d'assignation sur la plupart des cartes de tâches de formation. Le nom de la personne qui avait assigné le programme n'apparaissait jamais côté affichage.

**Cause root**
Sur 29 `training_assignments` en base, 26 (toutes antérieures au 2026-05-11) avaient `created_by` à NULL. Idem pour les 26 `task` liées (corrélation 1:1 via `training_assignments.task_id`). La colonne `created_by` avait été ajoutée tardivement au code d'insertion (`handleSend` dans `TabAttribution` de `AdminTraining.tsx`) et l'historique n'avait jamais été backfillé. Le frontend résolvait donc `created_by NULL` en "Inconnu" partout.

**Fix appliqué**
- Audit préalable : 100% des `training_assignments` ont un `task_id`, corrélation 1:1 confirmée
- Backfill SQL en 2 étapes ordonnées :
  1. `UPDATE task SET created_by = Juliette WHERE id IN (SELECT task_id FROM training_assignments WHERE created_by IS NULL)`
  2. `UPDATE training_assignments SET created_by = Juliette WHERE created_by IS NULL`
- Choix d'imputation : Juliette Gimonet par défaut (décision client). `updated_by` non utilisé comme proxy car non fiable (= dernière personne ayant touché la task, souvent l'assigné lui-même)
- Garantie future : déjà en place, le code applicatif envoie `created_by = auth.uid()` depuis le 11/05

**Résultat**
- `training_assignments` : 29/29 avec creator (26 = Juliette, 3 = Sokle Decoeur)
- `task` (internal_task) : 97/97 avec creator, dont 26 backfillées pour cette correction
- "Inconnu" disparaît sur toutes les vues qui résolvent l'auteur depuis la base

**Non couvert par ce fix (à traiter en Phase 2 si nécessaire)**
- Ajout d'une colonne explicite "Assigné par" dans `AdminTraining > Suivi & Retards` (la colonne n'existe pas à date)
- Correction du bloc "Created by → Assigned to" dans `EnhancedTaskDetailModal.tsx` (le label promet de montrer le créateur mais le code n'affiche que `assignedTo`)

---

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