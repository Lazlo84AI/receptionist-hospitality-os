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
