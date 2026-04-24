# HospitalityOS - Architecture Fonctionnelle

> ℹ️ **Document daté : 29 Janvier 2026 — mises à jour partielles 17 Février 2026 et 24 Avril 2026.**
>
> Ce document décrit l'architecture fonctionnelle haut-niveau à son état de janvier/février 2026. **Plusieurs détails SQL (enums, colonnes, triggers) ont depuis évolué.** Pour les **faits actuels** sur la base, utiliser par priorité :
>
> 1. **[docs/ARCHITECTURE_USERS_AND_STAFF.md](docs/ARCHITECTURE_USERS_AND_STAFF.md)** — référence complète `profiles` + `staff_directory` + triggers + RLS (mise à jour 2026-04-24)
> 2. **`CHANGELOG.md`** — chronologie des modifications de schéma et de feature
> 3. Audit SQL direct via `information_schema` et `pg_catalog` si un doute subsiste
>
> **Points spécifiquement obsolètes dans ce document** (liste non exhaustive) :
> - Le compte de « 15 tables » est sous-estimé (la base en contient 30+ au 24 avril 2026, incluant `notifications`, `assistant_conversations`, `assistant_documents`, `task_comments`, `platform_tutorial_videos`, `user_view_configurations`, `training_assignments`, `training_results`, `training_workflow_rules`, `competency_scores`, `service_competency_profiles`, `video_assignments`, `video_chains`, etc.)
> - Enum `priority_level` en prod : **`normal, urgent`** (2 valeurs), pas `low/medium/high/urgent`
> - Enum `service_type` en prod : **5 valeurs** (`reception, housekeeping, maintenance, direction, ai_team`), pas de `restaurant`
> - Enum `user_role` en prod : 9 valeurs avec doublons de casse (enum pollué), pas une liste propre
> - Triggers de notifications PostgreSQL natifs (`fn_notify_task_assigned`, `fn_notify_task_comment`, `fn_notify_training_assigned`) non documentés ici — sujet à dedier dans un doc `docs/ARCHITECTURE_NOTIFICATIONS.md` futur
> - Trigger `trigger_auto_refill_qcm` sur `knowledge_queries` non documenté ici — potentiellement lié au blocage A2 « < 20 questions »

---

**Version** : 1.0  
**Date** : 29 Janvier 2026  
**Auteur** : Wilfried de Renty  
**Projet** : receptionist-hospitality-os

---

## 📋 Table des Matières

1. [Architecture Base de Données - 15 Tables](#1-architecture-base-de-données---15-tables)
2. [Architecture Frontend Complète](#2-architecture-frontend-complète)
3. [Modules Fonctionnels](#3-modules-fonctionnels)
4. [Système de Shifts avec Workflows](#4-système-de-shifts-avec-workflows)

---

## 1. Architecture Base de Données - 15 Tables

### 1.1 Table `task` - Tâches Unifiées ⭐ CENTRALE

**Rôle** : Table centrale contenant TOUTES les tâches du système (migration septembre 2025 vers architecture unifiée)

**Champs principaux** :
- `id` : UUID, clé primaire
- `title`, `description` : Titre et description de la tâche
- `category` : Type de tâche ('incident', 'client_request', 'follow_up', 'internal')
- `priority` : Niveau de priorité (low, medium, high, urgent)
- `status` : État actuel (pending, in_progress, completed, cancelled)
- `service` : Service concerné (reception, housekeeping, maintenance, direction)
- `origin_type` : Origine de la demande (guest, staff, system)

**Relations clés** :
- `created_by` → profiles(id) : Créateur de la tâche
- `assigned_to` → ARRAY UUID : Multi-assignation possible
- `location_id` → locations(id) : Localisation dans l'hôtel
- `shift_id` → shifts(id) : Lien avec le shift actif (CRUCIAL pour continuité)

**Données spécifiques** :
- `guest_name`, `room_number` : Pour les demandes clients
- `due_date` : Date d'échéance
- `checklist_items` : JSONB contenant les sous-tâches

**Index critiques** :
- Sur `status` : Pour filtrage rapide par état
- Sur `shift_id` : Pour récupération des tâches d'un shift
- Sur `assigned_to` (GIN) : Pour recherche dans le array
- Sur `created_by` : Pour historique par utilisateur

**Fonction business** : Centralise TOUTES les opérations quotidiennes de l'hôtel en une seule table pour simplifier les requêtes et la gestion

---

### 1.2 Table `shifts` - Périodes de Travail

**Rôle** : Enregistre les périodes de travail des employés avec système de handover

**Champs principaux** :
- `id` : UUID du shift
- `user_id` → profiles(id) : Employé concerné
- `service` : Service (reception, housekeeping, maintenance)
- `start_time`, `end_time` : Début et fin du shift
- `status` : État (active, completed, cancelled)

**Données de handover** :
- `handover_notes` : Notes textuelles de transmission
- `voice_note_url` : URL vers Supabase Storage pour note vocale
- `voice_note_transcription` : Transcription automatique de la note vocale

**Règle business** : 
- 1 seul shift `active` par utilisateur à la fois
- Le `shift_id` est automatiquement lié à toutes les tâches créées pendant cette période
- Fermeture = archivage + handover vers shift suivant

**Fonction business** : Assure la continuité opérationnelle entre équipes avec traçabilité complète

---

### 1.3 Table `shift_handovers` - Continuité des Shifts

**Rôle** : Stocke les données de transition entre deux shifts consécutifs

**Champs principaux** :
- `id` : UUID du handover
- `from_shift_id` → shifts(id) : Shift qui se termine
- `to_shift_id` → shifts(id) : Shift qui commence (peut être NULL si pas encore démarré)

**Données archivées (JSONB)** :
- `archived_tasks` : Snapshot COMPLET de toutes les tâches actives du shift
- `transferred_tasks` : Sous-ensemble des tâches à transférer (pending + in_progress uniquement)
- `handover_notes` : Notes de transmission
- `voice_note_url` : Note vocale d'accompagnement

**Règles de transfert** :
```
pending → ✅ Transféré au shift suivant
in_progress → ✅ Transféré au shift suivant
completed → ❌ Archivé uniquement (pas de transfert)
cancelled → ❌ Archivé uniquement
```

**Fonction business** : Permet une continuité intelligente entre shifts avec règles métier claires et historique complet

---

### 1.4 Table `profiles` - Utilisateurs du Système

**Rôle** : Profils utilisateurs synchronisés automatiquement avec auth.users de Supabase

**Champs principaux** :
- `id` : UUID référençant auth.users(id)
- `email` : Email unique
- `first_name`, `last_name` : Identité
- `avatar_url` : Photo de profil

**Rôles & permissions** :
- `role` : Rôle système (admin, manager, staff, maintenance, housekeeping)
- `department` : Département
- `job_role` : Fonction précise dans l'hôtel
- `hierarchy` : Niveau hiérarchique
- `is_active` : Statut actif/inactif

**Trigger auto-sync** :
- Fonction `handle_new_user()` crée automatiquement un profil lors de l'inscription
- Garantit la cohérence entre authentification et profils

**Fonction business** : Centralise les données utilisateurs avec synchronisation automatique auth/profil

> 📌 **Documentation exhaustive et à jour** — pour les détails complets sur les triggers (`handle_new_user`, `sync_profiles_to_staff_directory`), les RLS policies, la règle métier « profiles fait foi si `auth_user_id IS NOT NULL` », les valeurs historiquement polluées et la dette technique identifiée, voir **[docs/ARCHITECTURE_USERS_AND_STAFF.md](docs/ARCHITECTURE_USERS_AND_STAFF.md)** (mise à jour : 2026-04-24).

---

### 1.5 Table `staff_directory` - Annuaire Personnel Étendu

**Rôle** : Données étendues du personnel, séparé de `profiles` pour plus de flexibilité

**Champs principaux** :
- `id` : UUID (peut correspondre à profiles.id mais pas obligatoire)
- `email` : Email unique
- `first_name`, `last_name`, `full_name` : Identité complète
- `service` : Service d'affectation (reception, housekeeping, maintenance, direction)
- `position` : Poste précis
- `phone` : Contact direct

**Fonction business** : 
- Mapping UUID → Nom pour affichage dans les tâches
- Filtrage des tâches par service (via staff_directory.service)
- Peut contenir du personnel non-utilisateur du système (ex: externes)

> 📌 **Documentation exhaustive et à jour** — pour le schéma réel des colonnes (dont `auth_user_id`, `role`, `hierarchy`, compteurs analytics), le lien canonique avec `profiles`, les valeurs polluées en prod (`Réception`, `Petit Dejeuner`, etc.) et les règles d'écriture à respecter, voir **[docs/ARCHITECTURE_USERS_AND_STAFF.md](docs/ARCHITECTURE_USERS_AND_STAFF.md)** (mise à jour : 2026-04-24).

---

### 1.6 Table `locations` - Référentiel des Espaces

**Rôle** : Répertorie tous les emplacements de l'hôtel avec leurs caractéristiques

**Champs principaux** :
- `id` : UUID de la localisation
- `name` : Nom de l'emplacement ("Chambre 101", "Hall d'entrée", "Cuisine")
- `type` : Type d'espace (room, common_area, staff_area, corridor, office)
- `floor` : Étage
- `building` : Bâtiment (si hôtel multi-bâtiments)
- `capacity` : Capacité d'accueil
- `amenities` : JSONB avec liste des équipements ["WiFi", "TV", "Minibar"]
- `is_active` : Actif ou désactivé

**Fonction business** : 
- Permet de lier précisément chaque tâche à un lieu physique
- Facilite le filtrage par zone pour le personnel (ex: étage 2 uniquement)
- Base pour futures optimisations logistiques (proximité des tâches)

---

### 1.7 Table `comments` - Commentaires sur Tâches

**Rôle** : Historique des échanges et notes sur chaque tâche

**Champs principaux** :
- `id` : UUID du commentaire
- `task_id` → task(id) : Tâche concernée (CASCADE DELETE)
- `user_id` → profiles(id) : Auteur du commentaire
- `content` : Contenu du commentaire
- `comment_type` : Type (comment, system, escalation)
- `created_at`, `updated_at` : Horodatage

**Fonction business** : 
- Communication asynchrone entre équipes sur une tâche
- Traçabilité des décisions et actions
- Commentaires système automatiques (ex: "Tâche escaladée à...")

---

### 1.8 Table `attachments` - Pièces Jointes

**Rôle** : Gestion des fichiers attachés aux tâches

**Champs principaux** :
- `id` : UUID de l'attachement
- `task_id` → task(id) : Tâche concernée (CASCADE DELETE)
- `uploaded_by` → profiles(id) : Uploader
- `filename` : Nom du fichier
- `file_url` : URL vers Supabase Storage
- `file_size` : Taille en octets
- `mime_type` : Type MIME
- `attachment_type` : Catégorie (image, document, audio, video, other)

**Fonction business** : 
- Preuves visuelles pour incidents (photos de dégâts)
- Documents officiels (devis, factures)
- Notes audio pour contexte

---

### 1.9 Table `escalations` - Escalades

**Rôle** : Gestion des remontées hiérarchiques sur tâches bloquantes/urgentes

**Champs principaux** :
- `id` : UUID de l'escalade
- `task_id` → task(id) : Tâche escaladée (CASCADE DELETE)
- `escalated_by` → profiles(id) : Qui escalade
- `escalated_to` → profiles(id) : Destinataire (manager)
- `method` : Méthode (email, sms, phone, internal)
- `message` : Message d'escalade
- `recipient_email`, `recipient_phone` : Contacts externes si besoin
- `is_resolved` : Résolu ou non

**Fonction business** : 
- Alerte automatique des managers sur problèmes critiques
- Historique des escalades pour analyse
- Multi-canal (interne, email, SMS)

---

### 1.10 Table `reminders` - Rappels Temporels

**Rôle** : Système de rappels pour ne pas oublier les tâches importantes

**Champs principaux** :
- `id` : UUID du rappel
- `task_id` → task(id) : Tâche concernée (CASCADE DELETE)
- `created_by` → profiles(id) : Créateur du rappel
- `title` : Titre du rappel
- `message` : Message optionnel
- `reminder_time` : Date/heure du rappel
- `frequency` : Fréquence (once, daily, weekly, monthly)
- `is_active` : Actif ou désactivé

**Fonction business** : 
- Rappels ponctuels ("Check-in VIP dans 30 min")
- Rappels récurrents ("Vérifier stocks tous les lundis")
- Notifications push (futur)

---

### 1.11 Table `checklists` - Listes de Vérification

**Rôle** : Checklists détaillées pour tâches complexes nécessitant plusieurs étapes

**Champs principaux** :
- `id` : UUID de la checklist
- `task_id` → task(id) : Tâche parent (CASCADE DELETE)
- `created_by` → profiles(id) : Créateur
- `title` : Titre de la checklist
- `items` : JSONB contenant [{text: string, checked: boolean}]
- `created_at`, `updated_at` : Horodatage

**Fonction business** : 
- Décomposition de tâches complexes en sous-étapes
- Progression visible (3/5 items complétés)
- Standardisation des processus (ex: checklist d'arrivée VIP)

---

### 1.12 Table `activity_log` - Journal d'Activité

**Rôle** : Historique complet de toutes les actions sur les tâches

**Champs principaux** :
- `id` : UUID du log
- `task_id` → task(id) : Tâche concernée (CASCADE DELETE)
- `user_id` → profiles(id) : Qui a effectué l'action
- `action` : Type d'action ("status_changed", "assigned", "commented", "escalated")
- `description` : Description textuelle de l'action
- `metadata` : JSONB avec données contextuelles supplémentaires
- `created_at` : Horodatage

**Fonction business** : 
- Traçabilité complète de qui a fait quoi et quand
- Audit trail pour conformité
- Analyse de performance (temps de résolution)

---

### 1.13 Table `task_members` - Historique des Assignations

**Rôle** : Historique des personnes ayant été assignées à une tâche

**Champs principaux** :
- `id` : UUID de l'entrée
- `task_id` → task(id) : Tâche concernée (CASCADE DELETE)
- `user_id` → profiles(id) : Membre assigné
- `added_by` → profiles(id) : Qui a fait l'assignation
- `role` : Rôle dans la tâche ("assignee", "viewer", "collaborator")
- `created_at` : Date d'assignation

**Fonction business** : 
- Historique complet des assignations (même après réassignation)
- Permet de savoir qui a travaillé sur quoi
- Base pour statistiques de charge de travail

---

### 1.14 Table `knowledge_formations` - Documents de Formation

**Rôle** : Catalogue des documents PDF/vidéos de formation disponibles

**Champs principaux** :
- `id` : UUID de la formation
- `title` : Titre du document
- `file_url` : URL vers Supabase Storage
- `file_type` : Type de fichier (pdf, docx, video)
- `category` : Catégorie (reception, housekeeping, security, management)
- `description` : Description du contenu
- `tags` : Array de tags pour recherche
- `upload_date` : Date d'upload
- `uploaded_by` → profiles(id) : Qui a uploadé

**Fonction business** : 
- Base de connaissances centralisée
- Formation continue du personnel
- Onboarding des nouveaux employés

---

### 1.15 Table `knowledge_queries` - Base RAG avec Embeddings

**Rôle** : Entrées pour recherche sémantique (RAG - Retrieval Augmented Generation)

**Champs principaux** :
- `id` : UUID de l'entrée
- `formation_id` → knowledge_formations(id) : Document source
- `question` : Question extraite du document
- `answer` : Réponse correspondante
- `context` : Contexte extrait du document
- `theme` : Thème du contenu (pour filtrage)
- `embedding` : VECTOR(1536) - Embedding OpenAI pour recherche sémantique
- `created_at` : Date de création

**Index vectoriel** :
- Index IVFFlat sur `embedding` pour recherche cosine similarity rapide

**Fonction business** : 
- Recherche sémantique intelligente dans les documents
- Réponses automatiques aux questions du personnel
- Base pour assistant IA contextuel

**Workflow** :
1. Upload PDF → N8N
2. Extraction texte → Chunking
3. Génération embeddings OpenAI
4. Stockage Qdrant + Supabase
5. Recherche vectorielle lors des requêtes

---

### 1.16 Table `training_questions` - Questions QCM

**Rôle** : Questions à choix multiples générées automatiquement pour évaluation

**Champs principaux** :
- `id` : UUID de la question
- `formation_id` → knowledge_formations(id) : Formation source
- `question` : Question posée
- `options` : JSONB contenant [{text: string, isCorrect: boolean}]
- `explanation` : Explication de la bonne réponse
- `difficulty` : Niveau (easy, medium, hard)
- `theme` : Thème de la question
- `created_at` : Date de création

**Trigger auto-sync** :
- Fonction `sync_training_questions_to_knowledge_queries()` copie automatiquement vers knowledge_queries
- Garantit cohérence entre QCM et base RAG

**Fonction business** : 
- Évaluation du personnel sur formations
- Génération automatique via IA (GPT-4)
- Suivi de la progression individuelle

---

## 2. Architecture Frontend Complète

### 2.1 Structure des Dossiers

```
/src
├── /components              # Composants réutilisables
│   ├── /ui                 # 50+ composants shadcn/ui
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ... (accordion, alert, badge, calendar, etc.)
│   │
│   ├── /modals             # 20+ modales métier
│   │   ├── TaskCreationModal.tsx
│   │   ├── TaskDetailModal.tsx
│   │   ├── EnhancedTaskDetailModal.tsx
│   │   ├── EditTaskModal.tsx
│   │   ├── MembersModal.tsx
│   │   ├── ChecklistModal.tsx
│   │   ├── ReminderModal.tsx
│   │   ├── EscalationModal.tsx
│   │   ├── AttachmentModal.tsx
│   │   ├── ShiftStartModal.tsx
│   │   ├── ShiftCloseModal.tsx
│   │   ├── BeginShiftWorkflow.tsx
│   │   ├── BeginShiftDailyTasksModal.tsx
│   │   ├── BeginShiftCardsCreationModal.tsx
│   │   ├── BeginShiftTaskAllocationModal.tsx
│   │   ├── BeginShiftVoiceNoteModal.tsx
│   │   ├── ServiceShiftStartModal.tsx
│   │   ├── ServiceShiftCloseModal.tsx
│   │   ├── DocumentViewerModal.tsx
│   │   ├── FormationViewerModal.tsx
│   │   ├── PdfViewerModal.tsx
│   │   ├── QuizzModal.tsx
│   │   └── QCMCreationModal.tsx
│   │
│   ├── /cards              # Cartes dashboard
│   │   ├── IncidentsCard.tsx
│   │   ├── ClientRequestsCard.tsx
│   │   ├── FollowUpsCard.tsx
│   │   └── ShiftFacingCard.tsx
│   │
│   ├── /shift              # Composants gestion shifts
│   │   └── ShiftActionSelector.tsx
│   │
│   ├── /training           # Composants formation
│   │   └── TrainingActionSelector.tsx
│   │
│   ├── /shared             # Composants partagés
│   │   ├── CardFaceModal.tsx
│   │   └── CommentsActivitySection.tsx
│   │
│   ├── Header.tsx          # En-tête global
│   ├── Sidebar.tsx         # Menu latéral
│   ├── VoiceCommandButton.tsx  # Bouton commande vocale
│   ├── UploadTraining.tsx  # Upload de formations
│   └── ProtectedRoute.tsx  # HOC protection routes
│
├── /pages                  # Pages principales
│   ├── Index.tsx           # Dashboard principal
│   ├── Auth.tsx            # Authentification
│   ├── ResetPassword.tsx   # Reset mot de passe
│   ├── ShiftManagement.tsx # Gestion shifts (Kanban)
│   ├── ServiceControl2.tsx # Contrôle service (workflow 4 modales)
│   ├── TeamDispatch.tsx    # Dispatch équipe
│   ├── Connaissances.tsx   # Base de connaissances
│   ├── TrainingManagement.tsx  # Gestion formations
│   ├── Assistant.tsx       # Chat assistant IA
│   ├── MyShifts.tsx        # Historique shifts personnels
│   └── NotFound.tsx        # Page 404
│
├── /hooks                  # Custom React Hooks
│   ├── useSupabaseData.ts  # Hook principal données + filtrage par service
│   ├── useAuth.tsx         # Hook authentification
│   ├── useShiftData.ts     # Données shift actif
│   ├── useShiftHandover.ts # Logique handover
│   ├── usePreviousShiftTasks.ts  # Tâches shift précédent
│   ├── useTeamShifts.ts    # Shifts de l'équipe
│   ├── useTaskDetails.ts   # Détails d'une tâche
│   ├── useTaskComments.ts  # Commentaires tâche
│   ├── useTaskActivity.ts  # Activité tâche
│   ├── useCreateTask.ts    # Création de tâche
│   ├── useDataActions.ts   # Actions sur données
│   ├── useKnowledgeFormations.ts  # Formations disponibles
│   ├── useKnowledgeQueries.ts     # Recherche connaissances
│   ├── useQuizQuestions.ts        # Questions QCM
│   ├── useTrainingTasks.ts        # Tâches de formation
│   ├── useReminderNotifications.ts  # Notifications rappels
│   └── use-mobile.tsx      # Détection mobile
│
├── /integrations           # Intégrations externes
│   └── /supabase
│       ├── client.ts       # Client Supabase configuré
│       └── types.ts        # Types TypeScript auto-générés
│
├── /lib                    # Librairies utilitaires
│   ├── /actions            # Actions de données
│   │   ├── activityLogHelper.ts
│   │   ├── addTaskComment.ts
│   │   ├── getActivityLogs.ts
│   │   ├── getTaskComments.ts
│   │   ├── getReminders.ts
│   │   ├── getUserProfiles.ts
│   │   └── updateReminder.ts
│   │
│   ├── /migrations         # Scripts de migration
│   │   └── teamDispatchMigration.ts
│   │
│   ├── shiftContinuityManager-v2.ts  # Gestion continuité shifts
│   ├── webhookService.ts   # Service webhooks
│   └── utils.ts            # Fonctions utilitaires
│
├── /types                  # Définitions TypeScript
│   ├── database.ts         # Types de la DB
│   ├── payloads.ts         # Types de payloads API
│   └── comprehensive-payloads.ts  # Payloads détaillés
│
├── /config                 # Configuration
│   ├── hoverStyles.ts      # Styles hover unifiés
│   └── taskEditConfig.ts   # Config édition tâches
│
├── /styles                 # Styles globaux
│   └── decoeur-typography.css  # Typographies marque DECOEUR
│
├── /data                   # Données statiques
│   └── trainingQuestions.ts  # Questions d'exemple
│
├── /assets                 # Assets statiques
│   ├── hotel-crest.jpg
│   └── hotel-crest-dark.svg
│
├── App.tsx                 # Composant racine + routing
├── main.tsx                # Point d'entrée
└── index.css               # Styles Tailwind globaux
```

### 2.2 Routing & Navigation

**Routes publiques** :
- `/auth` → Auth.tsx : Connexion / Inscription
- `/reset-password` → ResetPassword.tsx : Réinitialisation mot de passe

**Routes protégées** (ProtectedRoute HOC) :
- `/` → Index.tsx : Dashboard principal
- `/shift` → ShiftManagement.tsx : Gestion shifts (Kanban 3 colonnes)
- `/connaissances` → Connaissances.tsx : Base de connaissances
- `/training` → TrainingManagement.tsx : Gestion formations
- `/assistant` → Assistant.tsx : Chat assistant IA
- `/team-shifts` → MyShifts.tsx : Historique des shifts personnels
- `/team-dispatch` → TeamDispatch.tsx : Dispatch équipe
- `/service-control` → ServiceControl2.tsx : Contrôle service
- `/service-control2` → ServiceControl2.tsx : Alias

**Protection** :
- Vérification session Supabase
- Redirection vers `/auth` si non authentifié
- Loading state pendant vérification

### 2.3 Hooks Principaux et Leurs Fonctions

#### `useSupabaseData.ts` - Hook Central de Données

**Fonction** : Récupération et filtrage intelligent des tâches selon le service de l'utilisateur

**Logique de filtrage** :
1. Récupère l'utilisateur authentifié
2. Trouve son shift actif (status='active', user_id=current_user)
3. Extrait le service du shift (reception/housekeeping/maintenance)
4. Récupère tous les membres du même service via staff_directory
5. Filtre les tâches avec 2 critères :
   - **Critère 1** : Tâche créée par quelqu'un de mon service
   - **Critère 2** : Tâche assignée à quelqu'un de mon service
6. Mappe les UUIDs vers les noms (staff_directory + profiles en fallback)
7. Transforme en format TaskItem pour l'UI
8. Souscription Realtime pour synchronisation

**Retour** : `{ tasks, loading, error, refetch }`

#### `useAuth.tsx` - Gestion Authentification

**Fonction** : Gestion complète du cycle de vie auth

**Capacités** :
- Récupération session Supabase
- Écoute des changements d'état auth (connexion, déconnexion, refresh token)
- Gestion du profil utilisateur
- Stockage session en localStorage
- Redirection automatique

**Retour** : `{ session, loading, user, signIn, signOut, signUp }`

#### `useShiftData.ts` - Données Shift Actif

**Fonction** : Récupération du shift actif de l'utilisateur courant

**Logique** :
1. Requête shift avec `user_id = current_user` ET `status = 'active'`
2. Souscription Realtime pour synchronisation multi-pages
3. Rafraîchissement automatique lors de changements

**Retour** : `{ activeShift, loading, error, refetch }`

**Utilisation** : Détermine si l'utilisateur peut créer des tâches (nécessite shift actif)

#### `useShiftHandover.ts` - Logique Handover

**Fonction** : Gestion du handover entre shifts

**Capacités** :
- Récupération du handover précédent (from_shift_id du dernier shift completed)
- Extraction des tâches transférées (transferred_tasks JSONB)
- Récupération des notes audio/texte
- Liaison des tâches au nouveau shift

**Retour** : `{ handover, loading, getHandover, linkTasks }`

#### `useKnowledgeQueries.ts` - Recherche Connaissances

**Fonction** : Recherche sémantique dans la base de connaissances

**Workflow** :
1. Génération embedding OpenAI de la requête utilisateur
2. Recherche vectorielle dans Qdrant (cosine similarity)
3. Récupération des résultats avec score de pertinence
4. Affichage avec liens vers documents sources

**Retour** : `{ results, loading, search }`

#### `useQuizQuestions.ts` - Questions QCM

**Fonction** : Récupération des questions QCM pour une formation donnée

**Logique** :
1. Récupération depuis training_questions par formation_id
2. Mélange aléatoire des options
3. Suivi des réponses utilisateur
4. Calcul du score final

**Retour** : `{ questions, loading, submitQuiz, score }`

### 2.4 State Management Strategy

**TanStack Query (React Query)** :
- Cache intelligent avec staleTime de 5 minutes
- Refetch automatique au focus window
- Retry automatique (3 tentatives)
- Invalidation de cache après mutations

**Realtime Subscriptions** :
- Souscriptions Supabase sur tables critiques (task, shifts)
- Propagation instantanée des changements (< 500ms)
- Multi-onglets synchronisés

**Local State** :
- useState pour états UI simples (modales ouvertes/fermées)
- Pas de Redux/Zustand (simplicité)

### 2.5 Composants UI Critiques

#### Dashboard Kanban (ShiftManagement.tsx)

**Structure** : 3 colonnes (Pending, In Progress, Completed)

**Fonctionnalités** :
- Drag & Drop avec @dnd-kit
- Filtres multi-critères (category, priority, service, status)
- Affichage responsive (horizontal scroll sur mobile)
- Mise à jour optimiste lors du drag
- Synchronisation Realtime

#### Modales de Création (TaskCreationModal.tsx)

**Champs** :
- Titre, description
- Catégorie (dropdown)
- Priorité (dropdown)
- Service (auto-détecté depuis shift actif)
- Localisation (autocomplete depuis locations)
- Date d'échéance (date picker)
- Assignation (multi-select depuis staff_directory)
- Checklist (ajout dynamique d'items)

**Validation** : Zod schema avec React Hook Form

#### Workflow 4 Modales (BeginShiftWorkflow.tsx)

**Séquence** :
1. Modal 1 : Sélection tâches quotidiennes récurrentes
2. Modal 2 : Création rapide de nouvelles cartes
3. Modal 3 : Assignation des cartes créées
4. Modal 4 : Enregistrement note vocale de contexte

**Finalisation** : Création shift + tâches + liens en une transaction

---

## 3. Modules Fonctionnels

### 3.1 Module Authentification

**Fichiers** :
- `Auth.tsx` : Page de connexion/inscription
- `useAuth.tsx` : Hook de gestion auth
- `ProtectedRoute.tsx` : HOC protection routes

**Fonctions** :

#### `signIn(email, password)`
- Appel `supabase.auth.signInWithPassword()`
- Récupération profil utilisateur depuis profiles
- Stockage session en localStorage
- Redirection vers dashboard

#### `signUp(email, password, userData)`
- Création compte via `supabase.auth.signUp()`
- Trigger auto-création profil (handle_new_user)
- Envoi email de confirmation
- Redirection vers page de vérification

#### `signOut()`
- Appel `supabase.auth.signOut()`
- Nettoyage localStorage
- Redirection vers /auth

#### `resetPassword(email)`
- Envoi email de réinitialisation
- Lien avec token temporaire
- Page dédiée pour nouveau mot de passe

**Protection des routes** :
- Vérification session au montage
- Redirection automatique si non authentifié
- Loading state pendant vérification

---

### 3.2 Module Dashboard

**Fichier** : `Index.tsx`

**Structure visuelle** :
```
+----------------------------------+
|           Header                 |
+----------------------------------+
|  [50%]          |  [50%]         |
|  Incidents      |  Demandes      |
|  Card          |  Clients Card  |
|                 |                 |
+----------------------------------+
|          [100%]                  |
|      Follow-ups Card             |
+----------------------------------+
```

**Fonctions** :

#### IncidentsCard
- Affiche tâches avec category='incident'
- Tri par priorité (urgent > high > medium > low)
- Affichage : titre, priorité (badge), assigné, localisation
- Clic → Ouverture TaskDetailModal
- Compteur : "Incidents (X)"

#### ClientRequestsCard
- Affiche tâches avec category='client_request'
- Tri par date d'arrivée (arrival_date)
- Affichage : guest_name, room_number, request_type, priority
- Highlight si arrivée aujourd'hui
- Clic → Ouverture TaskDetailModal

#### FollowUpsCard
- Affiche tâches avec category='follow_up'
- Tri par due_date (les plus proches en premier)
- Affichage : titre, destinataire (recipient), due_date, status
- Alerte visuelle si échéance < 24h
- Clic → Ouverture TaskDetailModal

**Filtrage** :
- Toutes les cartes utilisent le hook `useTasks()`
- Filtrage automatique par service de l'utilisateur
- Synchronisation Realtime

**VoiceCommandButton** :
- Bouton flottant en bas à droite
- Clic → Ouverture interface vocale (futur)

---

### 3.3 Module Gestion des Tâches

**Fichiers** :
- `TaskCreationModal.tsx`
- `TaskDetailModal.tsx`
- `EnhancedTaskDetailModal.tsx`
- `EditTaskModal.tsx`
- `MembersModal.tsx`
- `ChecklistModal.tsx`
- `ReminderModal.tsx`
- `EscalationModal.tsx`
- `AttachmentModal.tsx`

**Fonctions principales** :

#### Création de tâche
**Fonction** : `handleCreateTask(data)`
1. Validation des données (Zod schema)
2. Insertion dans table task :
   - created_by = user.id
   - shift_id = activeShift.id
   - status = 'pending'
   - service = activeShift.service
3. Log dans activity_log :
   - action = 'task_created'
   - description = "Tâche créée: {title}"
4. Toast de confirmation
5. Rafraîchissement liste des tâches

#### Affichage détails
**Fonction** : `TaskDetailModal` affiche :
- Informations principales (titre, description, dates)
- Assignés avec avatars
- Localisation avec icône
- Checklist si présente (avec progression)
- Commentaires (onglet)
- Activité (onglet)
- Pièces jointes (onglet)
- Actions : Modifier, Assigner, Escalader, Archiver

#### Modification de tâche
**Fonction** : `handleUpdateTask(taskId, updates)`
1. Mise à jour dans table task
2. Log dans activity_log si changement de status/priority/assignation
3. Notifications aux assignés si réassignation
4. Toast de confirmation

#### Assignation multi-utilisateurs
**Fonction** : `handleAssignMembers(taskId, userIds)`
1. Mise à jour task.assigned_to (array UUID)
2. Insertion dans task_members pour historique
3. Log dans activity_log
4. Notification aux nouveaux assignés

#### Gestion checklist
**Fonction** : `handleChecklistUpdate(taskId, items)`
1. Mise à jour task.checklist_items (JSONB)
2. Calcul progression (X/Y items complétés)
3. Si 100% → Suggestion de passer status='completed'

#### Ajout commentaire
**Fonction** : `handleAddComment(taskId, content, type)`
1. Insertion dans table comments
2. Log dans activity_log (action='commented')
3. Notification aux membres de la tâche
4. Affichage temps réel dans l'onglet commentaires

#### Escalade
**Fonction** : `handleEscalate(taskId, managerId, message, method)`
1. Insertion dans table escalations
2. Mise à jour task.priority = 'urgent' si pas déjà
3. Log dans activity_log (action='escalated')
4. Envoi notification selon method :
   - internal : Notification in-app
   - email : Email via Supabase
   - sms : SMS via service externe (futur)
   - phone : Alerte téléphonique (futur)

#### Upload pièce jointe
**Fonction** : `handleUploadAttachment(taskId, file)`
1. Upload vers Supabase Storage (bucket: task-attachments)
2. Récupération URL publique
3. Insertion dans table attachments
4. Log dans activity_log
5. Affichage miniature dans l'onglet attachments

#### Suppression (soft delete)
**Fonction** : `handleDeleteTask(taskId)`
1. Mise à jour task.status = 'cancelled'
2. Log dans activity_log (action='task_cancelled')
3. Conservation des données (pas de DELETE physique)

---

### 3.4 Module Base de Connaissances

**Fichiers** :
- `Connaissances.tsx`
- `UploadTraining.tsx`
- `DocumentViewerModal.tsx`
- `FormationViewerModal.tsx`
- `PdfViewerModal.tsx`
- `QuizzModal.tsx`
- `QCMCreationModal.tsx`

**Fonctions principales** :

#### Upload de formation
**Fonction** : `handleUploadTraining(file, metadata)`
1. Validation fichier (PDF/DOCX/Video, < 50MB)
2. Upload vers Supabase Storage (bucket: trainings)
3. Insertion dans knowledge_formations :
   - title, file_url, file_type, category
   - uploaded_by = user.id
4. Déclenchement webhook N8N pour traitement RAG :
   - POST https://n8n.domain.com/webhook/process-training
   - Body : { formation_id, file_url }
5. Toast "Traitement en cours..."

**Workflow N8N (asynchrone)** :
1. Téléchargement fichier depuis URL
2. Extraction texte (pdf-parse)
3. Chunking (500 mots par segment)
4. Génération embeddings OpenAI (text-embedding-ada-002)
5. Insertion dans Qdrant Vector DB
6. Insertion dans knowledge_queries avec embeddings
7. Webhook de confirmation → Toast "Formation prête"

#### Recherche sémantique
**Fonction** : `handleSearch(query)`
1. Génération embedding de la requête (OpenAI)
2. Recherche vectorielle dans Qdrant :
   - Collection: hotel_knowledge
   - Méthode: cosine similarity
   - Limit: 5 résultats
   - Score threshold: 0.7
3. Affichage résultats avec :
   - Score de pertinence
   - Extrait de texte
   - Lien vers formation source
   - Bouton "Voir le document"

#### Génération QCM automatique
**Fonction** : `handleGenerateQCM(formationId, numQuestions)`
1. Appel webhook N8N :
   - POST https://n8n.domain.com/webhook/generate-qcm
   - Body : { formation_id, num_questions: 10 }
2. Workflow N8N :
   - Récupération chunks pertinents depuis Qdrant
   - Prompt GPT-4 : "Créer {num} questions QCM basées sur : {context}"
   - Formatage JSON : [{question, options:[{text, isCorrect}], explanation, difficulty}]
3. Réception réponse
4. Insertion dans training_questions (trigger auto-sync vers knowledge_queries)
5. Toast "{num} questions générées"

#### Passage de quiz
**Fonction** : `handleQuizSubmit(formationId, answers)`
1. Récupération questions depuis training_questions
2. Comparaison réponses utilisateur vs options.isCorrect
3. Calcul score : (correctCount / totalQuestions) * 100
4. Sauvegarde résultat (table user_quiz_results - à créer)
5. Affichage :
   - Score global
   - Détail par question (correct/incorrect)
   - Explications pour les erreurs
   - Badge si ≥ 70%

#### Visualisation PDF
**Fonction** : `handleViewDocument(formationId)`
1. Récupération file_url depuis knowledge_formations
2. Ouverture PdfViewerModal avec react-pdf
3. Navigation pages (prev/next)
4. Zoom in/out
5. Téléchargement PDF

---

### 3.5 Module Assistant IA

**Fichier** : `Assistant.tsx`

**Fonctions** :

#### Chat avec RAG
**Fonction** : `handleSendMessage(message)`
1. Ajout message utilisateur à l'historique
2. Appel webhook N8N :
   - POST https://n8n.domain.com/webhook/chat
   - Body : { message, history: previousMessages, user_id }
3. Workflow N8N :
   - Génération embedding de la question
   - Recherche contexte pertinent dans Qdrant (top 3)
   - Prompt GPT-4 avec RAG :
     ```
     Contexte: {retrieved_context}
     Historique: {chat_history}
     Question: {user_message}
     Réponds en tant qu'assistant hôtelier expert.
     ```
4. Réception réponse
5. Ajout réponse assistant à l'historique
6. Affichage avec formatage Markdown

#### Sources citées
- Chaque réponse inclut les sources utilisées
- Liens cliquables vers formations
- Score de pertinence affiché

---

## 4. Système de Shifts avec Workflows

### 4.1 Vue d'Ensemble du Système

**Objectif** : Assurer la continuité opérationnelle 24/7 avec transmission intelligente des tâches entre équipes successives.

**Principes clés** :
- 1 shift actif par utilisateur à la fois
- Toutes les tâches créées pendant un shift sont liées à ce shift (via shift_id)
- À la fermeture, archivage complet + transfert sélectif vers le shift suivant
- Synchronisation temps réel multi-pages et multi-utilisateurs

---

### 4.2 Workflow : Début de Shift - Version Simplifiée (ShiftManagement.tsx)

**Déclencheur** : Bouton "Démarrer Shift" dans ShiftManagement.tsx

**Modal** : `ShiftStartModal.tsx`

**Fonction** : `handleShiftStarted()`

**Étapes** :

#### 1. Création du shift
```javascript
const shift = await startShift(user.id, service)
```
- INSERT INTO shifts :
  - user_id = current_user
  - service = user.service (depuis profil)
  - status = 'active'
  - start_time = NOW()
- Retourne shift.id

#### 2. Récupération du handover précédent
```javascript
const handover = await getShiftHandover(service)
```
- Requête :
  1. Trouver le dernier shift completed du même service
  2. Récupérer le shift_handover associé (from_shift_id = lastShift.id)
- Retourne :
  - transferred_tasks (JSONB array)
  - handover_notes (texte)
  - voice_note_url (si présent)

#### 3. Affichage du handover
- Modal affiche :
  - Nombre de tâches transférées
  - Liste des tâches avec titres, priorités
  - Notes du shift précédent
  - Lecteur audio si note vocale

#### 4. Liaison des tâches au nouveau shift
```javascript
await linkTasksToShift(shift.id, transferredTaskIds)
```
- UPDATE task SET shift_id = new_shift_id WHERE id IN (transferredTaskIds)
- Les tâches deviennent visibles dans le Kanban

#### 5. Finalisation
- Toast "Shift démarré avec succès"
- Fermeture modal
- Refresh automatique du dashboard
- Button "Démarrer Shift" → "Terminer Shift"

---

### 4.3 Workflow : Début de Shift - Version Complète (ServiceControl2.tsx)

**Déclencheur** : Bouton "Begin Shift" dans ServiceControl2.tsx

**Composant** : `BeginShiftWorkflow.tsx` (orchestrateur de 4 modales séquentielles)

**Fonction** : `handleShiftStarted(createdCards)`

#### Modal 1 : BeginShiftDailyTasksModal

**Fonction** : Sélection des tâches quotidiennes récurrentes

**Interface** :
- Checkbox list de tâches prédéfinies :
  - ✓ Vérifier les arrivées du jour
  - ✓ Contrôle qualité chambres
  - ✓ Réapprovisionnement minibar
  - ✓ Inspection espaces communs
  - ✓ Briefing équipe
- Possibilité d'ajouter des tâches custom

**Sortie** : Array de tâches sélectionnées
```javascript
dailyTasks = [
  { title: "Vérifier arrivées", priority: "high", category: "internal" },
  { title: "Contrôle chambres", priority: "medium", category: "housekeeping" }
]
```

**Transition** : Clic "Suivant" → Modal 2

#### Modal 2 : BeginShiftCardsCreationModal

**Fonction** : Création rapide de nouvelles cartes de tâches

**Interface** :
- Formulaire rapide :
  - Titre (input)
  - Catégorie (select: incident/client_request/follow_up/internal)
  - Priorité (select: low/medium/high/urgent)
  - Description optionnelle (textarea)
- Bouton "Ajouter une autre carte"
- Liste des cartes créées (éditable)

**Sortie** : Array de nouvelles cartes
```javascript
newCards = [
  { title: "Incident chambre 302", category: "incident", priority: "urgent" },
  { title: "Demande VIP suite 501", category: "client_request", priority: "high" }
]
```

**Transition** : Clic "Suivant" → Modal 3

#### Modal 3 : BeginShiftTaskAllocationModal

**Fonction** : Assignation des cartes créées aux membres de l'équipe

**Interface** :
- Colonnes :
  - Gauche : Liste des cartes créées (non assignées)
  - Droite : Liste des membres de l'équipe (avec leur photo)
- Drag & Drop :
  - Glisser une carte sur un membre pour l'assigner
  - Possibilité multi-assignation (glisser sur plusieurs membres)
- Affichage visuel :
  - Cartes assignées : Badge avec initiales du membre
  - Cartes non assignées : Badge "Non assigné"

**Sortie** : Mapping carte → membres
```javascript
allocations = {
  "card-1-uuid": ["user-a-uuid", "user-b-uuid"],
  "card-2-uuid": ["user-c-uuid"]
}
```

**Transition** : Clic "Suivant" → Modal 4

#### Modal 4 : BeginShiftVoiceNoteModal

**Fonction** : Enregistrement d'une note vocale de contexte

**Interface** :
- Bouton micro : Démarrer/Arrêter enregistrement
- Waveform visualisation pendant l'enregistrement
- Lecture de la note avant validation
- Bouton "Recommencer" si insatisfait
- Optionnel : Peut être sauté

**Sortie** : Blob audio (WebM)
```javascript
voiceNoteBlob = Blob (audio/webm)
```

**Transition** : Clic "Terminer" → Finalisation

#### Finalisation du Shift

**Fonction** : `finalizeShiftStart(allData)`

**Étapes** :

1. **Création du shift**
```javascript
const shift = await supabase.from('shifts').insert({
  user_id,
  service,
  status: 'active',
  start_time: new Date()
}).select().single()
```

2. **Upload de la note vocale** (si présente)
```javascript
const { data: uploadData } = await supabase.storage
  .from('voice-notes')
  .upload(`shift_${shift.id}.webm`, voiceNoteBlob)

const voiceNoteUrl = supabase.storage
  .from('voice-notes')
  .getPublicUrl(uploadData.path).data.publicUrl

await supabase.from('shifts').update({
  voice_note_url: voiceNoteUrl
}).eq('id', shift.id)
```

3. **Création des tâches quotidiennes**
```javascript
for (const task of dailyTasks) {
  await supabase.from('task').insert({
    ...task,
    shift_id: shift.id,
    created_by: user.id,
    status: 'pending',
    service: service
  })
}
```

4. **Création des nouvelles cartes avec assignations**
```javascript
for (const card of newCards) {
  const { data: createdTask } = await supabase.from('task').insert({
    title: card.title,
    category: card.category,
    priority: card.priority,
    description: card.description,
    shift_id: shift.id,
    created_by: user.id,
    assigned_to: allocations[card.id], // Array d'UUIDs
    status: 'pending',
    service: service
  }).select().single()
  
  // Log d'activité
  await supabase.from('activity_log').insert({
    task_id: createdTask.id,
    user_id: user.id,
    action: 'task_created',
    description: `Tâche créée au début du shift: ${card.title}`
  })
}
```

5. **Récupération du handover précédent** (comme version simplifiée)
```javascript
const handover = await getShiftHandover(service)
if (handover?.transferred_tasks) {
  await linkTasksToShift(shift.id, handover.transferred_tasks.map(t => t.id))
}
```

6. **Confirmation**
- Toast success avec résumé :
  - "Shift démarré"
  - "{dailyTasks.length} tâches quotidiennes"
  - "{newCards.length} nouvelles cartes"
  - "{handover.transferred_tasks.length} tâches transférées"
- Fermeture des modales
- Refresh dashboard

---

### 4.4 Workflow : Fin de Shift (Commun aux 2 Pages)

**Déclencheur** : Bouton "Terminer Shift" dans ShiftManagement.tsx ou ServiceControl2.tsx

**Modal** : `ShiftCloseModal.tsx`

**Fonction** : `submitShiftEnd(data)`

**Interface de la modal** :

1. **Résumé du shift**
   - Durée : X heures Y minutes
   - Tâches créées : X
   - Tâches complétées : Y
   - Tâches en cours : Z
   - Tâches pending : W

2. **Notes de handover** (textarea)
   - "Décrivez ce qui doit être transmis au shift suivant..."
   - Prérempli avec suggestions basées sur tâches en cours

3. **Note vocale optionnelle**
   - Bouton micro pour enregistrement
   - Lecture/réécoute possible

4. **Aperçu des tâches à transférer**
   - Liste automatique : Toutes les tâches pending + in_progress
   - Highlight sur les urgentes
   - Possibilité de marquer comme "completed" avant fermeture

**Étapes de la fonction** :

#### 1. Upload de la note vocale (si présente)
```javascript
let voiceNoteUrl = null
if (data.voiceNoteBlob) {
  const { data: uploadData } = await supabase.storage
    .from('voice-notes')
    .upload(`shift_end_${activeShift.id}.webm`, data.voiceNoteBlob)
  
  voiceNoteUrl = supabase.storage
    .from('voice-notes')
    .getPublicUrl(uploadData.path).data.publicUrl
}
```

#### 2. Récupération de TOUTES les tâches du shift
```javascript
const { data: allShiftTasks } = await supabase
  .from('task')
  .select('*')
  .eq('shift_id', activeShift.id)
  .in('status', ['pending', 'in_progress', 'completed', 'cancelled'])
```

#### 3. Séparation des tâches selon règles de continuité
```javascript
// TOUTES les tâches sont archivées
const archivedTasks = allShiftTasks

// Seulement pending + in_progress sont transférées
const transferredTasks = allShiftTasks.filter(
  t => t.status === 'pending' || t.status === 'in_progress'
)
```

**Règles de continuité** :
| Statut | Archivage | Transfert | Raison |
|--------|-----------|-----------|--------|
| pending | ✅ | ✅ | Tâche pas encore démarrée, doit continuer |
| in_progress | ✅ | ✅ | Tâche en cours, nécessite suivi |
| completed | ✅ | ❌ | Tâche terminée, aucune action requise |
| cancelled | ✅ | ❌ | Tâche annulée, pas de transfert |

#### 4. Création du handover
```javascript
const { data: handover } = await supabase
  .from('shift_handovers')
  .insert({
    from_shift_id: activeShift.id,
    to_shift_id: null, // Sera lié au prochain shift au démarrage
    archived_tasks: archivedTasks, // JSONB
    transferred_tasks: transferredTasks, // JSONB
    handover_notes: data.handoverNotes,
    voice_note_url: voiceNoteUrl
  })
  .select()
  .single()
```

#### 5. Logging dans activity_log
```javascript
// Pour chaque tâche archivée, on log
for (const task of archivedTasks) {
  await supabase.from('activity_log').insert({
    task_id: task.id,
    user_id: user.id,
    action: 'shift_closed',
    description: `Shift terminé - Tâche archivée`,
    metadata: {
      shift_id: activeShift.id,
      was_transferred: transferredTasks.some(t => t.id === task.id)
    }
  })
}
```

#### 6. Fermeture du shift
```javascript
await supabase
  .from('shifts')
  .update({
    status: 'completed',
    end_time: new Date().toISOString(),
    handover_notes: data.handoverNotes,
    voice_note_url: voiceNoteUrl
  })
  .eq('id', activeShift.id)
```

#### 7. Confirmation
- Toast success :
  - "Shift terminé avec succès"
  - "{archivedTasks.length} tâches archivées"
  - "{transferredTasks.length} tâches transférées"
- Fermeture modal
- Refresh dashboard
- Button "Terminer Shift" → "Démarrer Shift"

---

### 4.5 Synchronisation Temps Réel

**Hook** : `useShiftData.ts`

**Fonction** : Écoute des changements de shifts en temps réel pour synchronisation multi-pages

**Logique** :

```javascript
useEffect(() => {
  // Récupération initiale
  const fetchActiveShift = async () => {
    const { data: shift } = await supabase
      .from('shifts')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()
    
    setActiveShift(shift)
  }
  
  fetchActiveShift()
  
  // Souscription Realtime
  const subscription = supabase
    .channel('shifts-realtime')
    .on('postgres_changes', {
      event: '*', // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'shifts'
    }, (payload) => {
      console.log('Shift change detected:', payload)
      fetchActiveShift() // Refresh
    })
    .subscribe()
  
  return () => {
    supabase.removeChannel(subscription)
  }
}, [user.id])
```

**Cas d'usage** :
- Utilisateur ouvre 2 onglets (ShiftManagement + ServiceControl2)
- Démarre shift dans onglet 1
- Onglet 2 se met à jour instantanément (< 500ms)
- Bouton "Démarrer" → "Terminer" dans les deux onglets

---

### 4.6 Filtrage par Service

**Fonction** : `useTasks()` dans `useSupabaseData.ts`

**Logique de filtrage** :

```javascript
// 1. Récupérer le shift actif de l'utilisateur
const { data: activeShift } = await supabase
  .from('shifts')
  .select('id, service')
  .eq('user_id', user.id)
  .eq('status', 'active')
  .maybeSingle()

// Si pas de shift actif, retourner [] (pas de tâches visibles)
if (!activeShift) {
  setTasks([])
  return
}

// 2. Récupérer tous les membres du même service
const { data: myServiceStaff } = await supabase
  .from('staff_directory')
  .select('id')
  .eq('service', activeShift.service)

const myServiceUserIds = myServiceStaff.map(s => s.id)

// 3. Récupérer TOUTES les tâches actives
const { data: rawTasks } = await supabase
  .from('task')
  .select('*')
  .in('status', ['pending', 'in_progress', 'completed'])

// 4. Filtrer avec 2 critères business
const filteredTasks = rawTasks.filter((task) => {
  // Critère 1 : Créée par quelqu'un de mon service
  if (task.created_by && myServiceUserIds.includes(task.created_by)) {
    return true
  }
  
  // Critère 2 : Assignée à quelqu'un de mon service
  if (task.assigned_to && Array.isArray(task.assigned_to)) {
    const hasMyServiceMember = task.assigned_to.some(
      assignedId => myServiceUserIds.includes(assignedId)
    )
    if (hasMyServiceMember) return true
  }
  
  return false
})

setTasks(filteredTasks)
```

**Cas concrets** :

**Scénario 1 : Tâche visible par 2 services (cross-service)**
- Tâche créée par Reception (created_by = UUID_receptionist)
- Assignée à Housekeeping (assigned_to = [UUID_housekeeper])
- ✅ Visible par Reception (critère 1)
- ✅ Visible par Housekeeping (critère 2)

**Scénario 2 : Tâche interne à un service**
- Tâche créée par Maintenance (created_by = UUID_maintenance)
- Assignée à Maintenance (assigned_to = [UUID_maintenance2])
- ✅ Visible par Maintenance uniquement
- ❌ Invisible par Reception/Housekeeping

**Scénario 3 : Tâche non assignée**
- Tâche créée par Reception (created_by = UUID_receptionist)
- Non assignée (assigned_to = [])
- ✅ Visible par Reception (critère 1)
- ❌ Invisible par autres services

---

### 4.7 Cas d'Usage Complets

#### Cas 1 : Réception avec 10 nouvelles cartes

**Timeline** :
```
08:00 - Océane démarre son shift (service: reception)
        → Création shift (id: shift_1, status: active)
        → Récupération handover précédent : 4 tâches transférées
        → Liaison des 4 tâches à shift_1

08:15 - Création de 10 nouvelles cartes (incidents clients)
        → 10 INSERT task avec shift_id = shift_1

08:30 - Traitement des tâches
        → 3 tâches passent à in_progress
        → 2 tâches passent à completed

...

16:00 - Fermeture du shift
        → Récupération de toutes les tâches de shift_1
        → Total : 14 tâches (4 transférées + 10 créées)
        → Statuts : 
          - 6 completed
          - 3 in_progress
          - 5 pending
        → Archivage : 14 tâches (TOUTES)
        → Transfert : 8 tâches (3 in_progress + 5 pending)
        → Création shift_handover
        → UPDATE shifts SET status='completed', end_time=NOW()

16:00 - Drishelle démarre son shift (service: reception)
        → Création shift (id: shift_2, status: active)
        → Récupération handover précédent (from_shift_id = shift_1)
        → Les 8 tâches transférées passent à shift_id = shift_2
```

#### Cas 2 : Housekeeping sans nouvelles cartes

**Timeline** :
```
07:00 - Emma démarre son shift (service: housekeeping)
        → Création shift (id: shift_3, status: active)
        → Récupération handover : 12 tâches transférées
        → Liaison des 12 tâches à shift_3

07:00-15:00 - Traitement des tâches existantes uniquement
        → Aucune création de nouvelle tâche
        → 8 tâches passent à completed
        → 4 tâches restent in_progress

15:00 - Fermeture du shift
        → Total : 12 tâches (toutes transférées)
        → Statuts :
          - 8 completed
          - 4 in_progress
        → Archivage : 12 tâches
        → Transfert : 4 tâches (in_progress uniquement)
        → Création shift_handover

15:00 - Sophie démarre son shift (service: housekeeping)
        → Création shift (id: shift_4, status: active)
        → Les 4 tâches in_progress passent à shift_id = shift_4
```

#### Cas 3 : Shift avec escalade

**Timeline** :
```
08:00 - Shift démarré

09:30 - Incident urgent chambre 302 (fuite d'eau)
        → Création tâche (priority: urgent)
        → Assignation à maintenance

10:00 - Maintenance constate nécessité d'intervention externe
        → Escalade vers manager
        → INSERT escalations (method: email)
        → Email automatique envoyé
        → task.priority reste urgent

10:30 - Manager valide appel plombier externe
        → Ajout commentaire sur la tâche
        → LOG activity_log

14:00 - Plombier termine intervention
        → Maintenance met à jour : status = completed
        → Ajout photo avant/après en attachments

16:00 - Fermeture shift
        → Tâche completed → Archivée mais PAS transférée
```

---

### 4.8 Gestion des UUID et Mapping

**Problème** : Les UUIDs sont peu lisibles pour les utilisateurs

**Solution** : Double mapping staff_directory + profiles

**Fonction** : Dans `useSupabaseData.ts`

```javascript
// 1. Récupérer staff_directory ET profiles
const [staffResponse, profilesResponse] = await Promise.all([
  supabase.from('staff_directory').select('*'),
  supabase.from('profiles').select('id, first_name, last_name, email')
])

// 2. Créer des maps pour lookup rapide
const staffMap = new Map()
staffResponse.data.forEach(staff => {
  staffMap.set(staff.id, staff)
})

const profilesMap = new Map()
profilesResponse.data.forEach(profile => {
  profilesMap.set(profile.id, profile)
})

// 3. Mapping des tâches
tasks.map(task => {
  // Créateur
  let creatorDisplay = 'Inconnu'
  const creatorStaff = staffMap.get(task.created_by)
  if (creatorStaff) {
    creatorDisplay = creatorStaff.full_name || `${creatorStaff.first_name} ${creatorStaff.last_name}`
  } else {
    const creatorProfile = profilesMap.get(task.created_by)
    if (creatorProfile) {
      creatorDisplay = `${creatorProfile.first_name} ${creatorProfile.last_name}`
    }
  }
  
  // Assignés (multi)
  const assignedNames = []
  for (const assignedId of task.assigned_to) {
    const staff = staffMap.get(assignedId)
    if (staff) {
      assignedNames.push(staff.full_name)
    } else {
      const profile = profilesMap.get(assignedId)
      if (profile) {
        assignedNames.push(`${profile.first_name} ${profile.last_name}`)
      } else {
        assignedNames.push(assignedId) // Fallback UUID
      }
    }
  }
  
  const assignedDisplay = assignedNames.join(', ') || 'Non assigné'
  
  // Affichage combiné
  return {
    ...task,
    assignedTo: `${creatorDisplay} → ${assignedDisplay}`
  }
})
```

**Résultat affiché** :
```
"Océane Dubois → Marie Leroy, Jean Dupont"
```
Au lieu de :
```
"a3f2e1d4-... → [b5c7d8e9-..., c9a1f3e4-...]"
```

---

### 4.9 Historique et Analytics

**Page** : `MyShifts.tsx`

**Fonction** : Afficher l'historique des shifts de l'utilisateur

**Données affichées** :
```javascript
{
  shift_id: "uuid",
  start_time: "2026-01-28 08:00:00",
  end_time: "2026-01-28 16:00:00",
  duration: "8h 00min",
  service: "reception",
  tasks_created: 10,
  tasks_completed: 6,
  tasks_transferred: 8,
  handover_notes: "Attention VIP arrivée 18h...",
  voice_note_url: "https://..."
}
```

**Filtres disponibles** :
- Par service
- Par période (jour/semaine/mois)
- Par statut (completed uniquement pour historique)

**Statistiques** :
- Durée moyenne des shifts
- Nombre moyen de tâches par shift
- Taux de complétion (completed / total)
- Temps de résolution moyen par catégorie

---

## Conclusion

Ce document décrit l'architecture fonctionnelle complète du système HospitalityOS, en se concentrant sur :

✅ **15 tables de base de données** avec leurs rôles et relations  
✅ **Architecture frontend** complète avec structure des dossiers et composants  
✅ **Modules fonctionnels** détaillés avec leurs fonctions principales  
✅ **Système de shifts** avec workflows complets (version simple et complexe)

**Points clés** :
- Architecture unifiée des tâches (table task centrale)
- Système de continuité intelligente entre shifts
- Filtrage par service avec 2 critères business
- Synchronisation temps réel multi-utilisateurs
- Base de connaissances avec RAG et QCM automatisés

---

## 5. Système de Tutoriels Vidéo & Help Center

**Ajouté le** : 17 Février 2026

### 5.1 Architecture générale

Le Help Center est accessible depuis toutes les pages via l'icône `HelpCircle` (Gold #BBA57A) dans le header, à gauche de l'avatar utilisateur. Un clic ouvre un Popover déroulant listant les vidéos disponibles. Un clic sur un titre ouvre un Dialog modal avec player embed (Loom ou YouTube).

```
Header
  └── HelpButton.tsx
        ├── Popover (liste plate, dédupliquée par titre)
        └── VideoTutorialModal.tsx (iframe 16:9, Loom + YouTube)
```

### 5.2 Table Supabase : `platform_tutorial_videos`

| Colonne | Type | Rôle |
|---|---|---|
| `id` | uuid PK | Identifiant unique |
| `title` | text | Titre affiché dans le popover |
| `category` | text | Page concernée : `Dashboard`, `Shift Management`, `Team Dispatch`, `Service Control` |
| `objectif_fonctionnel` | text | Problème utilisateur résolu, formulé explicitement (utilisé pour le RAG) |
| `url` | text | URL complète Loom ou YouTube |
| `keywords` | text[] | Mots-clés pour recherche simple et RAG |
| `transcript` | text | Contenu verbal de la vidéo — base de la vectorisation |
| `embedding` | vector(1536) | Vecteur sémantique généré depuis transcript + objectif_fonctionnel |
| `sort_order` | integer | Ordre d'affichage dans le popover |
| `is_active` | boolean | Activer/désactiver sans supprimer |

**RLS** : lecture authentifiée uniquement (`TO authenticated USING (true)`)  
**Index** : `ivfflat` sur `embedding vector_cosine_ops` (listes = 100) pour recherche sémantique rapide

### 5.3 Règles de gestion

**Affichage front**
- Le popover affiche une **liste plate sans catégories**, dédupliquée par `title` (première occurrence selon `sort_order`)
- Une même vidéo peut avoir **plusieurs lignes en base** (une par catégorie) — c'est intentionnel pour le RAG contextuel
- Le player détecte automatiquement Loom vs YouTube par pattern matching sur l'URL
- `objectif_fonctionnel` s'affiche en sous-titre gris sous le titre dans le popover

**Gestion du contenu**
- Les vidéos sont gérées directement en base Supabase (pas d'interface admin pour l'instant)
- Pour désactiver une vidéo : mettre `is_active = false` (ne pas supprimer)
- Pour réordonner : modifier `sort_order`
- Pour ajouter une vidéo présente sur 4 pages : insérer 4 lignes avec la même URL et des `category` différentes

### 5.4 Pipeline de vectorisation (prêt à brancher)

**Statut actuel** : la colonne `embedding` est créée et indexée, mais non remplie.

**Pipeline prévu (N8N)** :
1. Trigger : INSERT ou UPDATE sur `platform_tutorial_videos`
2. Concaténation : `transcript` + `objectif_fonctionnel` + `keywords` joinés
3. Appel API Mistral ou OpenAI embeddings (dim 1536)
4. Stockage du vecteur dans la colonne `embedding`

**Recherche sémantique** (future fonction Supabase) :
```sql
SELECT title, url, objectif_fonctionnel
FROM platform_tutorial_videos
ORDER BY embedding <=> '[vecteur_requete]'::vector
LIMIT 3;
```

**Contenu à vectoriser par vidéo** = `transcript` (contenu brut) + `objectif_fonctionnel` (problème utilisateur) + `keywords` (termes clés). C'est ce triptyque qui garantit une bonne remontrée sémantique.

---

## 6. Système de Tracking des Performances Utilisateur

**Ajouté le** : 17 Février 2026

### 6.1 Objectif

Suivre automatiquement les métriques de performance des employés pour :
- Mesurer l'engagement et la productivité
- Alimenter de futurs dashboards RH et analytics
- Préparer le système de score card de compétences

### 6.2 Colonnes ajoutées à `staff_directory`

| Colonne | Type | Mode de mise à jour | Source |
|---|---|---|---|
| `onboarding_views_count` | integer (default 0) | Fonction RPC `increment_onboarding_views()` | Hook `useOnboarding` (frontend) |
| `tasks_created_total` | integer (default 0) | Trigger automatique | `task` (INSERT) |
| `tasks_closed_total` | integer (default 0) | Trigger automatique | `task` (UPDATE status → 'completed') |
| `assistant_queries_total` | integer (default 0) | Trigger automatique | `assistant_conversations` (INSERT) |

**Note** : Toutes les colonnes sont cumulées (compteurs totaux depuis la création du compte).

### 6.3 Triggers automatiques

**Trigger 1 : Incrémentation tâches créées**
```sql
CREATE TRIGGER trigger_increment_tasks_created
AFTER INSERT ON task
FOR EACH ROW
EXECUTE FUNCTION increment_tasks_created();
```
- Se déclenche à chaque nouvelle tâche
- Incrémente `tasks_created_total` pour l'employé (`task.created_by` → `staff_directory.auth_user_id`)

**Trigger 2 : Incrémentation tâches fermées**
```sql
CREATE TRIGGER trigger_increment_tasks_closed
AFTER UPDATE ON task
FOR EACH ROW
EXECUTE FUNCTION increment_tasks_closed();
```
- Se déclenche quand `task.status` passe à 'completed'
- Incrémente `tasks_closed_total` uniquement si le statut change (OLD.status ≠ 'completed')

**Trigger 3 : Incrémentation requêtes assistant**
```sql
CREATE TRIGGER trigger_increment_assistant_queries
AFTER INSERT ON assistant_conversations
FOR EACH ROW
EXECUTE FUNCTION increment_assistant_queries();
```
- Se déclenche à chaque question posée à l'assistant
- Incrémente `assistant_queries_total` pour l'employé (`assistant_conversations.user_id` → `staff_directory.auth_user_id`)

### 6.4 Métriques dynamiques (calculées en temps réel)

Ces métriques ne sont **pas stockées** en colonnes mais calculées via queries :

**Shifts ouverts cette semaine** :
```sql
SELECT COUNT(*) FROM shifts 
WHERE auth_user_id = :user_id 
  AND status = 'active' 
  AND start_time >= date_trunc('week', now());
```

**Shifts clos cette semaine** :
```sql
SELECT COUNT(*) FROM shifts 
WHERE auth_user_id = :user_id 
  AND status = 'completed' 
  AND end_time >= date_trunc('week', now());
```

**Tâches créées cette semaine** :
```sql
SELECT COUNT(*) FROM task 
WHERE created_by = :user_id 
  AND created_at >= date_trunc('week', now());
```

**Tâches fermées cette semaine** :
```sql
SELECT COUNT(*) FROM task 
WHERE created_by = :user_id 
  AND status = 'completed'
  AND updated_at >= date_trunc('week', now());
```

### 6.5 Onboarding Carousel

**Composant** : `OnboardingCarousel.tsx`  
**Hook** : `useOnboarding.ts`

**Logique** :
- Au chargement du Dashboard, vérification de `staff_directory.onboarding_views_count`
- Si `<= 10` → affichage du carousel de 4 tutoriels vidéo
- Après fermeture du carousel : appel RPC `increment_onboarding_views(user_uuid)`
- Après 10 vues, le carousel ne s'affiche plus

**Slides du carousel** :
1. "Pourquoi pas de cartes au début ? Comment lancer et clôturer son shift"
2. "Comment créer une carte : à la voix ou via l'interface"
3. "Vous avez une question ? Soumettez-la à l'assistant"
4. "Progressez dans votre travail : apprenez avec le formateur"

Bouton final : "Commencez" → redirection vers `/shift-management`

### 6.6 À venir : Système QCM + Score Card de compétences

**Statut** : Planifié pour session dédiée

**Objectifs** :
- Créer table `training_user_answers` pour stocker les réponses aux QCM
- Pondération des questions par compétence
- Calcul automatique du score par skill
- Mise à jour du profil de compétences dans `staff_directory` ou table dédiée
- Dashboard de progression individuelle

---

**Document Version** : 1.2  
**Dernière mise à jour** : 17 Février 2026 (sections 5 et 6) — bandeau d'actualisation ajouté le 24 Avril 2026 en tête du document  
**Auteur** : Wilfried de Renty  
**Statut** : ✅ Production-Ready (architecture fonctionnelle globale) — ⚠️ Détails SQL partiellement obsolètes, voir bandeau en tête

© 2026 Catapulz - HospitalityOS
