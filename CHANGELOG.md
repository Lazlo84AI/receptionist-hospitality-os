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


