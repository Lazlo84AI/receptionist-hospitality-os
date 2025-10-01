# 📊 SUPABASE DATABASE REFERENCE - HospitalityOS

> **Date** : 01 octobre 2025  
> **Project ID** : ypxmzacmwqqvlciwahzw  
> **Source** : Structure actuelle en production

---

## 🎯 TABLES PRINCIPALES

### 1️⃣ `staff_directory` - ANNUAIRE DES EMPLOYÉS

**Rôle** : Table principale des employés avec toutes les informations RH

| Colonne | Type | Nullable | Default | Description |
|---------|------|----------|---------|-------------|
| `id` | uuid | NO | - | PRIMARY KEY - Identifiant unique |
| `auth_user_id` | uuid | YES | - | FK vers auth.users |
| `full_name` | text | YES | - | **Nom complet de l'employé** |
| `first_name` | text | YES | - | Prénom |
| `last_name` | text | YES | - | Nom de famille |
| `email` | text | YES | - | Email professionnel |
| `phone` | text | YES | - | Téléphone |
| `avatar_url` | text | YES | - | URL photo de profil |
| `role` | user_role | NO | - | ENUM - Rôle de l'employé |
| `department` | text | YES | - | **Département** (reception, housekeeping, etc.) |
| `service` | text | YES | - | **Service spécifique** |
| `job_title` | text | YES | - | Titre du poste |
| `hierarchy` | text | YES | - | Normal / Manager / Director |
| `is_active` | boolean | NO | true | Employé actif |
| `created_at` | timestamptz | NO | now() | Date de création |
| `updated_at` | timestamptz | NO | now() | Dernière modification |

**⚠️ IMPORTANT** : C'est la table de référence pour les employés, utilisée par `shifts.user_id`

---

### 2️⃣ `profiles` - PROFILS AUTH (LÉGERS)

**Rôle** : Table légère synchronisée avec auth.users

| Colonne | Type | Nullable | Default | Description |
|---------|------|----------|---------|-------------|
| `id` | uuid | NO | - | PRIMARY KEY = auth.users.id |
| `email` | text | YES | - | Email |
| `first_name` | text | YES | - | Prénom |
| `last_name` | text | YES | - | Nom |
| `role` | text | YES | - | Rôle basique |
| `hierarchy` | text | YES | 'Normal' | Niveau hiérarchique |
| `staff_directory_id` | uuid | YES | - | FK vers staff_directory |
| `service` | service_type | YES | - | ENUM - Service |
| `permissions` | jsonb | YES | {} | Permissions JSON |
| `created_at` | timestamptz | YES | now() | Date création |
| `updated_at` | timestamptz | YES | now() | Dernière modif |

**Note** : Préférer `staff_directory` pour les requêtes principales

---

### 3️⃣ `shifts` - SERVICES / SHIFTS

**Rôle** : Enregistrement des services (début, fin, notes de passation)

| Colonne | Type | Nullable | Default | Description |
|---------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| `user_id` | uuid | NO | - | **FK → staff_directory.id** |
| `start_time` | timestamptz | NO | now() | Début du service |
| `end_time` | timestamptz | YES | - | Fin du service |
| `status` | shift_status | NO | 'active' | ENUM: active / completed / cancelled |
| `service` | text | YES | - | **Service du shift** |
| `voice_note_url` | text | YES | - | URL audio de passation |
| `voice_note_transcription` | text | YES | - | Transcription de l'audio |
| `handover_notes` | text | YES | - | Notes texte de passation |
| `created_at` | timestamptz | NO | now() | Date création |
| `updated_at` | timestamptz | NO | now() | Dernière modif |

**Relations clés** :
- `user_id` → `staff_directory.id`
- Référencé par `shift_handovers.from_shift_id`

---

### 4️⃣ `shift_handovers` - SNAPSHOT DES TÂCHES

**Rôle** : Sauvegarde de l'état de toutes les tâches à la fin d'un shift

| Colonne | Type | Nullable | Default | Description |
|---------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| `from_shift_id` | uuid | NO | - | **FK → shifts.id** |
| `handover_data` | jsonb | NO | {} | **Snapshot complet des tâches** |
| `additional_notes` | text | YES | - | Notes supplémentaires |
| `created_at` | timestamptz | NO | now() | Date création |
| `updated_at` | timestamptz | NO | now() | Dernière modif |

**Structure de `handover_data` (JSONB)** :
```json
{
  "all_tasks": [
    {
      "id": "uuid",
      "title": "string",
      "category": "incident | client_request | follow_up | internal_task",
      "status": "pending | in_progress | completed | cancelled",
      "priority": "normal | urgent",
      "location": "string",
      "service": "reception | housekeeping | maintenance"
    }
  ],
  "tasks_by_type": {
    "incident": [...],
    "client_request": [...],
    "maintenance": [...]
  },
  "tasks_by_status": {
    "pending": [...],
    "in_progress": [...],
    "completed": [...]
  }
}
```

---

### 5️⃣ `task` - TABLE UNIFIÉE DES TÂCHES

**Rôle** : Table centrale pour TOUTES les tâches

| Colonne | Type | Nullable | Default | Description |
|---------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| `title` | text | NO | - | Titre de la tâche |
| `description` | text | YES | - | Description détaillée |
| `category` | task_category | YES | - | ENUM: incident / client_request / follow_up / internal_task |
| `status` | text | NO | 'pending' | pending / in_progress / completed / cancelled |
| `priority` | priority_level | YES | - | ENUM: normal / urgent |
| `service` | task_service | YES | - | ENUM: reception / housekeeping / maintenance / direction |
| `origin_type` | text | YES | - | Origine: client / team / maintenance |
| `location` | text | YES | - | Localisation (legacy text) |
| `location_id` | uuid | YES | - | FK → locations.id |
| `guest_name` | varchar | YES | - | Nom du client (pour client_request) |
| `assigned_to` | uuid[] | YES | {} | IDs des membres assignés |
| `created_by` | uuid | YES | - | Créateur |
| `updated_by` | uuid | YES | - | Dernier modificateur |
| `current_receptionist_id` | uuid | YES | - | Réceptionniste en charge |
| `checklist_items` | jsonb | YES | [] | Items de checklist |
| `collaborators` | jsonb | YES | - | Collaborateurs (JSON) |
| `attachment_url` | text | YES | - | URL pièces jointes |
| `voice_note_url` | text | YES | - | URL note vocale |
| `voice_transcript` | text | YES | - | Transcription vocale |
| `reminder_id` | uuid | YES | - | FK → reminders.id |
| `reminder_date` | timestamptz | YES | - | Date rappel |
| `reminder_sent_at` | timestamptz | YES | - | Date envoi rappel |
| `escalation_date` | timestamptz | YES | - | Date escalade |
| `escalated_at` | timestamptz | YES | - | Date effective escalade |
| `escalation_channel` | text | YES | - | Canal d'escalade |
| `requires_validation` | boolean | YES | true | Validation requise |
| `validation_status` | text | YES | - | Statut validation |
| `validation_deadline` | timestamptz | YES | - | Deadline validation |
| `completed_at` | timestamptz | YES | - | Date complétion |
| `created_at` | timestamptz | NO | now() | Date création |
| `updated_at` | timestamptz | NO | now() | Dernière modif |

---

### 6️⃣ `locations` - LIEUX

**Rôle** : Référentiel des lieux (chambres, zones communes)

| Colonne | Type | Nullable | Default | Description |
|---------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| `name` | text | NO | - | Nom du lieu |
| `display_name` | text | YES | - | Nom d'affichage |
| `type` | text | NO | - | Type: room, common_area, facility |
| `location_type` | text | YES | - | Type détaillé |
| `location_code` | text | YES | - | Code |
| `floor` | int4 | YES | - | Étage |
| `building` | text | YES | - | Bâtiment |
| `capacity` | int4 | YES | - | Capacité |
| `amenities` | jsonb | YES | [] | Équipements |
| `metadata` | jsonb | YES | {} | Métadonnées |
| `is_active` | boolean | NO | true | Actif |
| `created_at` | timestamptz | NO | now() | Date création |
| `updated_at` | timestamptz | NO | now() | Dernière modif |

---

## 📝 TABLES LEGACY (ANCIENNES STRUCTURES)

### `incidents` - ANCIENNE TABLE INCIDENTS

**⚠️ LEGACY** - Migrer vers `task` avec `category = 'incident'`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid | PRIMARY KEY |
| `title` | text | Titre |
| `description` | text | Description |
| `incident_type` | text | Type d'incident |
| `priority` | priority_level | ENUM: normal / urgent |
| `status` | task_status | ENUM: pending / in_progress / completed / cancelled |
| `location` | text | Localisation (text) |
| `location_id` | uuid | FK → locations.id |
| `assigned_to` | text | Assigné à (text legacy) |
| `assigned_member_ids` | uuid[] | IDs assignés |
| `origin_type` | text | Origine |
| `created_by` | uuid | Créateur |
| `checklists` | jsonb | Checklists |
| `attachments` | uuid[] | IDs attachements |
| `reminders` | uuid[] | IDs reminders |
| `created_at` | timestamptz | Date création |
| `updated_at` | timestamptz | Dernière modif |

---

### `client_requests` - ANCIENNE TABLE DEMANDES CLIENTS

**⚠️ LEGACY** - Migrer vers `task` avec `category = 'client_request'`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid | PRIMARY KEY |
| `guest_name` | text | Nom du client |
| `room_number` | text | Numéro de chambre |
| `request_type` | text | Type de demande |
| `request_details` | text | Détails |
| `preparation_status` | task_status | Statut |
| `arrival_date` | date | Date d'arrivée |
| `priority` | priority_level | Priorité |
| `assigned_to` | text | Assigné à (text) |
| `location_id` | uuid | FK → locations |
| `assigned_member_ids` | uuid[] | IDs assignés |
| `origin_type` | text | Origine |
| `created_by` | uuid | Créateur |
| `checklists` | jsonb | Checklists |
| `attachments` | uuid[] | Attachements |
| `reminders` | uuid[] | Reminders |
| `created_at` | timestamptz | Date création |
| `updated_at` | timestamptz | Dernière modif |

---

### `follow_ups` - ANCIENNE TABLE SUIVIS

**⚠️ LEGACY** - Migrer vers `task` avec `category = 'follow_up'`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid | PRIMARY KEY |
| `title` | text | Titre |
| `recipient` | text | Destinataire |
| `follow_up_type` | text | Type de suivi |
| `notes` | text | Notes |
| `status` | task_status | Statut |
| `due_date` | date | Date d'échéance |
| `assigned_to` | text | Assigné à |
| `location_id` | uuid | FK → locations |
| `assigned_member_ids` | uuid[] | IDs assignés |
| `origin_type` | text | Origine |
| `created_by` | uuid | Créateur |
| `checklists` | jsonb | Checklists |
| `attachments` | uuid[] | Attachements |
| `reminders` | uuid[] | Reminders |
| `created_at` | timestamptz | Date création |
| `updated_at` | timestamptz | Dernière modif |

---

### `internal_tasks` - ANCIENNE TABLE TÂCHES INTERNES

**⚠️ LEGACY** - Migrer vers `task` avec `category = 'internal_task'`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid | PRIMARY KEY |
| `title` | text | Titre |
| `description` | text | Description |
| `task_type` | text | Type de tâche |
| `priority` | priority_level | Priorité |
| `status` | task_status | Statut |
| `location` | text | Localisation (text) |
| `location_id` | uuid | FK → locations |
| `department` | text | Département |
| `due_date` | date | Date d'échéance |
| `assigned_to` | text | Assigné à |
| `assigned_member_ids` | uuid[] | IDs assignés |
| `origin_type` | text | Origine |
| `created_by` | uuid | Créateur (NOT NULL) |
| `checklists` | jsonb | Checklists |
| `attachments` | jsonb[] | Attachements |
| `reminders` | jsonb[] | Reminders |
| `created_at` | timestamptz | Date création |
| `updated_at` | timestamptz | Dernière modif |

---

## 🔗 TABLES RELATIONNELLES

### `comments` - Commentaires

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid | PRIMARY KEY |
| `user_id` | uuid | FK → staff_directory |
| `task_id` | uuid | FK → task |
| `content` | text | Contenu |
| `comment_type` | comment_type | ENUM: comment / system / escalation |
| `created_at` | timestamptz | Date création |
| `updated_at` | timestamptz | Dernière modif |

---

### `attachments` - Pièces jointes

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid | PRIMARY KEY |
| `task_id` | uuid | FK → task |
| `filename` | text | Nom du fichier |
| `file_url` | text | URL |
| `file_size` | int4 | Taille en octets |
| `mime_type` | text | Type MIME |
| `attachment_type` | attachment_type | ENUM: image / document / audio / video / other |
| `uploaded_by` | uuid | FK → staff_directory |
| `created_at` | timestamptz | Date upload |

---

### `checklists` - Listes de vérification

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid | PRIMARY KEY |
| `task_id` | uuid | FK → task |
| `title` | text | Titre |
| `items` | jsonb | Items (array JSON) |
| `reminder_id` | uuid | FK → reminders |
| `created_by` | uuid | FK → staff_directory |
| `created_at` | timestamptz | Date création |
| `updated_at` | timestamptz | Dernière modif |

**Structure de `items`** :
```json
[
  {
    "id": "string",
    "text": "string",
    "completed": boolean,
    "assigned_to": "uuid",
    "due_date": "timestamp"
  }
]
```

---

### `reminders` - Rappels

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid | PRIMARY KEY |
| `task_id` | uuid | FK → task |
| `title` | text | Titre |
| `message` | text | Message |
| `reminder_time` | timestamptz | Date/heure |
| `frequency` | reminder_frequency | ENUM: once / daily / weekly / monthly / custom |
| `is_active` | boolean | Actif |
| `created_by` | uuid | FK → staff_directory |
| `created_at` | timestamptz | Date création |
| `updated_at` | timestamptz | Dernière modif |

---

### `escalations` - Escalades

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid | PRIMARY KEY |
| `task_id` | uuid | FK → task |
| `escalated_by` | uuid | FK → staff_directory |
| `escalated_to` | uuid | FK → staff_directory |
| `method` | escalation_method | ENUM: email / sms / phone / internal |
| `recipient_email` | text | Email destinataire |
| `recipient_phone` | text | Téléphone |
| `message` | text | Message |
| `is_resolved` | boolean | Résolu |
| `created_at` | timestamptz | Date escalade |
| `updated_at` | timestamptz | Dernière modif |

---

### `task_members` - Membres assignés

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid | PRIMARY KEY |
| `task_id` | uuid | FK → task |
| `user_id` | uuid | FK → staff_directory |
| `role` | text | Rôle (assignee par défaut) |
| `added_by` | uuid | FK → staff_directory |
| `created_at` | timestamptz | Date ajout |

---

### `activity_logs` - Journal d'activité

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid | PRIMARY KEY |
| `user_id` | uuid | FK → staff_directory |
| `department` | text | Département |
| `entity_type` | text | Type entité |
| `entity_id` | uuid | ID entité |
| `action` | text | Action |
| `old_values` | jsonb | Anciennes valeurs |
| `new_values` | jsonb | Nouvelles valeurs |
| `metadata` | jsonb | Métadonnées |
| `shift_id` | uuid | FK → shifts (si lié à un shift) |
| `created_at` | timestamptz | Date action |

---

## 🔐 ENUMS DISPONIBLES

### `user_role`
```
'receptionist'
'Housekeeping Supervisor'
'Room Attendant'
'restaurant staff'
'tech maintenance team'
```

### `task_category`
```
'incident'
'client_request'
'follow_up'
'internal_task'
```

### `task_service`
```
'reception'
'housekeeping'
'maintenance'
'direction'
```

### `task_status`
```
'pending'
'in_progress'
'completed'
'cancelled'
```

### `priority_level`
```
'normal'
'urgent'
```

### `shift_status`
```
'active'
'completed'
'cancelled'
```

### `comment_type`
```
'comment'
'system'
'escalation'
```

### `attachment_type`
```
'image'
'document'
'audio'
'video'
'other'
```

### `escalation_method`
```
'email'
'sms'
'phone'
'internal'
```

### `reminder_frequency`
```
'once'
'daily'
'weekly'
'monthly'
'custom'
```

### `service_type` (pour profiles)
```sql
-- À vérifier dans Supabase, probablement similaire à task_service
```

---

## 🔗 SCHÉMA DE RELATIONS

```
auth.users (Supabase Auth)
    ↓
staff_directory (employés)
    ↓
    ├── shifts (services effectués)
    │     ↓
    │   shift_handovers (snapshots des tâches)
    │
    ├── task (tâches unifiées)
    │     ↓
    │   ├── comments
    │   ├── attachments
    │   ├── checklists
    │   ├── reminders
    │   ├── escalations
    │   └── task_members
    │
    └── activity_logs (journal)

locations (lieux)
    ↓
task.location_id
```

---

## 🎯 REQUÊTES UTILES

### Récupérer les 6 derniers shifts d'un service

```sql
SELECT 
  shifts.*,
  staff_directory.full_name,
  staff_directory.department,
  staff_directory.service,
  shift_handovers.handover_data,
  shift_handovers.additional_notes
FROM shifts
INNER JOIN staff_directory ON shifts.user_id = staff_directory.id
LEFT JOIN shift_handovers ON shift_handovers.from_shift_id = shifts.id
WHERE 
  shifts.status = 'completed'
  AND shifts.service = 'reception'  -- ou staff_directory.department
ORDER BY shifts.end_time DESC
LIMIT 6;
```

### Récupérer toutes les tâches d'un shift

```sql
SELECT 
  handover_data->'all_tasks' as tasks
FROM shift_handovers
WHERE from_shift_id = 'uuid-du-shift';
```

### Tâches actives par service

```sql
SELECT *
FROM task
WHERE status IN ('pending', 'in_progress')
  AND service = 'reception'
ORDER BY priority DESC, created_at ASC;
```

---

## 📌 NOTES IMPORTANTES

1. **`staff_directory`** est la table principale pour les employés (pas `profiles`)
2. **`shifts.user_id`** pointe vers `staff_directory.id`
3. **`shifts.service`** indique le service du shift (reception, housekeeping, etc.)
4. **`shift_handovers.handover_data`** contient le snapshot complet des tâches en JSONB
5. **Tables legacy** (`incidents`, `client_requests`, etc.) coexistent avec `task` unifié
6. **`task.guest_name`** est une colonne VARCHAR ajoutée récemment

---

**Dernière mise à jour** : 01 octobre 2025
