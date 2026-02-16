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


