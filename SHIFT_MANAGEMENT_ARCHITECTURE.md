# 🏨 HospitalityOS - Architecture de Gestion des Shifts

**Date de création** : 10 octobre 2025  
**Version** : 2.0  
**Auteur** : Documentation Technique Système  

---

## 📋 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Architecture des Tables](#architecture-des-tables)
3. [Begin Shift - Shift Management](#begin-shift---shift-management)
4. [Begin Shift - Service Control 2](#begin-shift---service-control-2)
5. [End Shift - Les Deux Pages](#end-shift---les-deux-pages)
6. [Synchronisation Temps Réel](#synchronisation-temps-réel)
7. [Gestion des UUIDs et Filtrage par Service](#gestion-des-uuids-et-filtrage-par-service)
8. [Shift ID : Création et Utilisation](#shift-id--création-et-utilisation)
9. [Règles de Continuité Intelligente](#règles-de-continuité-intelligente)

---

## 🎯 Vue d'Ensemble

HospitalityOS dispose de **deux pages distinctes** pour la gestion des shifts :

### **Shift Management** (`/shift-management`)
- **Usage** : Gestion standard des tâches pendant un shift
- **Workflow Begin Shift** : Simplifié (1 modal)
- **Public** : Tous les services (réception, housekeeping, maintenance, direction)

### **Service Control 2** (`/service-control2`)
- **Usage** : Gestion avancée pour le service housekeeping/réception
- **Workflow Begin Shift** : Complet (4 modales en séquence)
- **Public** : Services opérationnels (réception, housekeeping)
- **Particularité** : Création automatique de cartes quotidiennes

---

## 🗄️ Architecture des Tables

### Table `shifts`
**Responsabilité** : Enregistrement des sessions de travail

```sql
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  service TEXT NOT NULL,  -- ✅ 'reception' | 'housekeeping' | 'maintenance' | 'direction'
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL,  -- 'active' | 'completed'
  
  -- Données de passation (END SHIFT)
  handover_notes TEXT,
  voice_note_url TEXT,
  voice_note_transcription TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**Points clés** :
- Un utilisateur ne peut avoir qu'**un seul shift actif** à la fois
- Le champ `service` est renseigné depuis `staff_directory.service` ou `profiles.service`
- Les données de passation sont enregistrées lors du **End Shift**

---

### Table `shift_handovers`
**Responsabilité** : Snapshot complet de l'état des tâches à la fin d'un shift

```sql
CREATE TABLE shift_handovers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_shift_id UUID REFERENCES shifts(id) NOT NULL,
  handover_data JSONB NOT NULL,
  additional_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**Structure du JSONB `handover_data`** :
```json
{
  "timestamp": "2025-10-10T14:32:00Z",
  "voice_note_url": "https://...",
  "voice_note_transcription": "Correction de bug encore",
  "total_tasks_count": 25,
  
  "tasks_by_status": {
    "pending": [...],
    "in_progress": [...],
    "completed": [...],
    "resolved": [...]
  },
  
  "tasks_by_type": {
    "incident": [...],
    "client_request": [...],
    "follow_up": [...],
    "internal_task": [...]
  },
  
  "all_tasks": [
    {
      "id": "uuid",
      "type": "incident",
      "status": "in_progress",
      "title": "Verif coffre",
      "assigned_to": ["uuid1", "uuid2"],  // ✅ UUIDs array
      "created_by": "uuid3",              // ✅ UUID
      "priority": "urgent",
      "data": { /* TaskItem complet */ }
    }
  ]
}
```

**Points clés** :
- **TOUTES** les tâches actives (pending + in_progress) sont archivées
- Les tâches `completed` et `verified` ne sont PAS transférées
- Chaque tâche inclut `created_by` (UUID) et `assigned_to` (array de UUIDs)

---

### Table `task` (Unifiée)
**Responsabilité** : Stockage de toutes les tâches

```sql
CREATE TABLE task (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identification
  title TEXT NOT NULL,
  description TEXT,
  
  -- Catégorisation
  category TEXT NOT NULL,  -- ✅ 'incident' | 'client_request' | 'follow_up' | 'internal_task'
  type TEXT NOT NULL,      -- Alias de category (deprecated)
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'pending',
  
  -- Localisation
  location TEXT,
  room_number TEXT,
  
  -- Assignment
  created_by UUID REFERENCES profiles(id),
  assigned_to UUID[],  -- ✅ Array de UUIDs
  
  -- Service et Shift
  service TEXT NOT NULL,   -- ✅ 'reception' | 'housekeeping' | 'maintenance' | 'direction'
  shift_id UUID REFERENCES shifts(id),  -- ✅ Lié au shift en cours
  
  -- Métadonnées
  origin_type TEXT DEFAULT 'team',
  guest_name TEXT,
  recipient TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**Points clés** :
- Architecture **unifiée** : toutes les tâches dans une seule table
- `shift_id` : lié lors du **Begin Shift** (nouvelles cartes) ou lors du **linkTasksToShift** (anciennes cartes)
- `service` : filtre les tâches par service
- `assigned_to` : array de UUIDs pour permettre plusieurs assignations

---

## 🚀 Begin Shift - Shift Management

### Flux Simplifié (1 Modal)

```
┌─────────────────────────────────────┐
│   ShiftManagement.tsx               │
│   Button: "Start Shift"             │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│   ShiftStartModal                   │
│   ┌───────────────────────────────┐ │
│   │  ÉCRAN 0:                     │ │
│   │  Audio Player + Handover Notes│ │
│   │  (Données du dernier shift)   │ │
│   └───────────┬───────────────────┘ │
│               ▼                      │
│   ┌───────────────────────────────┐ │
│   │  ÉCRANS 1+:                   │ │
│   │  Cartes une par une           │ │
│   │  (Vue lecture seule)          │ │
│   └───────────┬───────────────────┘ │
└───────────────┼───────────────────┘
                │ Bouton "Start Shift"
                ▼
┌─────────────────────────────────────┐
│   handleShiftStarted()              │
│   (ShiftManagement.tsx)             │
└─────────────────┬───────────────────┘
                  │
                  ▼
        ┌─────────┴──────────┐
        │                    │
        ▼                    ▼
┌──────────────────┐  ┌──────────────────┐
│ 1. Créer Shift   │  │ 2. Get Handover  │
│ startShift()     │  │ getShiftHandover │
│ → shift_id       │  │ → tasks[]        │
└────────┬─────────┘  └────────┬─────────┘
         │                     │
         │                     ▼
         │            ┌──────────────────┐
         │            │ 3. Lier au Shift │
         │            │ linkTasksToShift │
         │            │ (shift_id)       │
         │            └────────┬─────────┘
         │                     │
         └─────────┬───────────┘
                   ▼
         ┌──────────────────┐
         │ 4. Webhook       │
         │ 5. Refetch UI    │
         │ 6. Toast Success │
         └──────────────────┘
```

### Détails des Fonctions

#### `handleShiftStarted()` - ShiftManagement.tsx

```typescript
const handleShiftStarted = async () => {
  try {
    // 1. Récupérer l'utilisateur connecté
    const { data: { user } } = await supabase.auth.getUser();
    
    // 2. Récupérer le service de l'utilisateur
    const { data: profile } = await supabase
      .from('profiles')
      .select('service')
      .eq('id', user.id)
      .single();
    
    const userService = profile.service; // 'reception' | 'housekeeping' etc.
    
    // 3. Créer le shift en base de données
    const shiftResult = await startShift();
    const newShiftId = shiftResult.shift_id; // UUID
    
    // 4. Récupérer les tâches du handover filtrées par service
    const { tasks: transferredTasks, stats } = await getShiftHandover(userService);
    
    // 5. Lier les tâches au nouveau shift
    if (transferredTasks.length > 0) {
      const taskIds = transferredTasks.map(t => t.id);
      await linkTasksToShift(taskIds, newShiftId);
    }
    
    // 6. Webhook + UI update
    await sendShiftStartedEvent({ shift_id: newShiftId, ... });
    setShiftStatus('active');
    await refetch();
    
    toast({ 
      title: "Shift Started", 
      description: `${transferredTasks.length} tasks transferred` 
    });
  } catch (error) {
    // Gestion d'erreur
  }
};
```

#### `startShift()` - useShiftData.ts

```typescript
export const useStartShift = () => {
  const startShift = async (): Promise<{ success: boolean; shift_id?: string }> => {
    // 1. Récupérer l'utilisateur
    const { data: { user } } = await supabase.auth.getUser();
    
    // 2. Récupérer le service depuis staff_directory
    const { data: staffData } = await supabase
      .from('staff_directory')
      .select('service')
      .eq('id', user.id)
      .single();
    
    const userService = staffData?.service || 'reception';
    
    // 3. Terminer tout shift actif existant
    await supabase
      .from('shifts')
      .update({ 
        status: 'completed',
        end_time: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('status', 'active');
    
    // 4. Créer un nouveau shift
    const { data: newShift } = await supabase
      .from('shifts')
      .insert({
        user_id: user.id,
        start_time: new Date().toISOString(),
        status: 'active',
        service: userService  // ✅ Service renseigné
      })
      .select()
      .single();
    
    return { success: true, shift_id: newShift.id };
  };
  
  return { startShift };
};
```

#### `getShiftHandover()` - shiftContinuityManager-v2.ts

```typescript
export const getShiftHandover = async (userService: string) => {
  // 1. Récupérer le dernier handover
  const { data: latestHandover } = await supabase
    .from('shift_handovers')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  const allTasks = latestHandover.handover_data.all_tasks || [];
  
  // 2. Collecter tous les UUIDs (créateurs + assignés)
  const allUserIds = new Set<string>();
  allTasks.forEach((taskSnapshot: any) => {
    if (taskSnapshot.created_by) allUserIds.add(taskSnapshot.created_by);
    if (taskSnapshot.assigned_to) {
      taskSnapshot.assigned_to.forEach((id: string) => allUserIds.add(id));
    }
  });
  
  // 3. Récupérer les services depuis staff_directory
  const { data: staffMembers } = await supabase
    .from('staff_directory')
    .select('id, department')
    .in('id', Array.from(allUserIds));
  
  // 4. Créer le mapping UUID → service
  const userServiceMap: Record<string, string> = {};
  staffMembers?.forEach(member => {
    if (member.department) {
      userServiceMap[member.id] = member.department.toLowerCase();
    }
  });
  
  // 5. Filtrer les tâches selon les 2 critères
  const tasksToTransfer = allTasks.filter((taskSnapshot: any) => {
    const task = taskSnapshot.data;
    
    // Filtre status : uniquement in_progress et pending
    if (task.status !== 'in_progress' && task.status !== 'pending') {
      return false;
    }
    
    // Critère 1 : Créée par mon service
    const creatorService = userServiceMap[taskSnapshot.created_by];
    if (creatorService === userService) return true;
    
    // Critère 2 : Assignée à quelqu'un de mon service
    const assignedIds = taskSnapshot.assigned_to || [];
    const hasMyService = assignedIds.some((id: string) => 
      userServiceMap[id] === userService
    );
    if (hasMyService) return true;
    
    return false;
  });
  
  return {
    handoverId: latestHandover.id,
    tasks: tasksToTransfer.map((t: any) => t.data),
    voiceNote: {
      url: handoverData.voice_note_url,
      transcription: handoverData.voice_transcription
    },
    stats: {
      totalArchived: allTasks.length,
      transferred: tasksToTransfer.length,
      archived: allTasks.length - tasksToTransfer.length
    }
  };
};
```

#### `linkTasksToShift()` - shiftContinuityManager-v2.ts

```typescript
export const linkTasksToShift = async (taskIds: string[], newShiftId: string): Promise<void> => {
  const { error } = await supabase
    .from('task')
    .update({ 
      shift_id: newShiftId,
      updated_at: new Date().toISOString()
    })
    .in('id', taskIds);
    
  if (error) throw error;
};
```

---

## 🏢 Begin Shift - Service Control 2

### Flux Complet (4 Modales en Séquence)

```
┌─────────────────────────────────────┐
│   ServiceControl2.tsx               │
│   Button: "Begin Shift"             │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│   BeginShiftWorkflow                │
│   (Orchestrateur de modales)        │
└─────────────────┬───────────────────┘
                  │
    ┌─────────────┼─────────────┬─────────────┬─────────────┐
    │             │             │             │             │
    ▼             ▼             ▼             ▼             ▼
┌────────┐  ┌─────────┐  ┌───────────┐  ┌─────────┐  ┌───────┐
│MODAL 1 │  │MODAL 2  │  │MODAL 3    │  │MODAL 4  │  │RESULT │
│Daily   │→ │Cards    │→ │Task       │→ │Voice    │→ │Start  │
│Tasks   │  │Creation │  │Allocation │  │Note     │  │Shift  │
└────────┘  └─────────┘  └───────────┘  └─────────┘  └───────┘
    │             │             │             │             │
    │             │             │             │             │
    ▼             ▼             ▼             ▼             ▼
  Choix     Sélection     Assignation    Écoute       handleShiftStarted()
  Oui/Non   Locations     + Filtres     Handover      (avec createdCards[])
```

### Modal 1 : BeginShiftDailyTasksModal

**Responsabilité** : Choix de créer ou non des cartes quotidiennes

**Flux** :
```typescript
// Options proposées
- WITH CREATION → onWithCreation()
- WITHOUT CREATION → onWithoutCreation()

// Actions
const handleWithCreation = () => {
  setWorkflowData(prev => ({ ...prev, withCreation: true }));
  setCurrentStep('cards_creation'); // Passe à Modal 2
};

const handleWithoutCreation = () => {
  setWorkflowData(prev => ({ ...prev, withCreation: false }));
  setCurrentStep('task_allocation'); // Saute Modal 2, passe à Modal 3
};
```

---

### Modal 2 : BeginShiftCardsCreationModal

**Responsabilité** : Sélection des locations pour créer des cartes

**Flux** :
```typescript
// 1. Récupérer toutes les locations depuis useLocations()
const { locations } = useLocations();

// 2. Grouper par floor et type
const roomsByFloor = groupLocationsByFloor(
  locations.filter(location => location.type === 'room')
);
const commonAreasByFloor = groupLocationsByFloor(
  locations.filter(location => location.type === 'common_area')
);

// 3. Sélection utilisateur
const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

// 4. Création des cartes
const handleCreateCards = (selectedLocationsWithTypes: Array<{ name: string; type: string }>) => {
  const newCards: TaskItem[] = selectedLocationsWithTypes.map((location, index) => ({
    id: `temp-card-${Date.now()}-${index}`, // ID temporaire
    title: generateCardTitle(location.name, location.type),
    location: location.name,
    roomNumber: location.name,
    type: 'internal_task' as const,
    status: 'pending' as const,
    priority: 'normal' as const,
    category: 'internal_task', // ✅ IMPORTANT
    assignedTo: null,
    description: `Daily task for ${location.name}`
  }));
  
  setWorkflowData(prev => ({ 
    ...prev, 
    selectedLocations: selectedLocationsWithTypes.map(loc => loc.name),
    createdCards: newCards 
  }));
  
  setCurrentStep('task_allocation'); // Passe à Modal 3
};

// Fonction de génération du titre
const generateCardTitle = (locationName: string, locationType: string) => {
  if (locationType === 'room') return 'Room';
  
  if (lowerLocationName.includes('breakfast') || 
      lowerLocationName.includes('restaurant')) {
    return 'Restauration';
  }
  
  if (locationType === 'common_area' || 
      locationType === 'public_areas' || 
      locationType === 'staff_area') {
    return 'Cleaning';
  }
  
  return 'Cleaning'; // Défaut
};
```

---

### Modal 3 : BeginShiftTaskAllocationModal

**Responsabilité** : Allocation des tâches et application d'actions spécifiques

**Caractéristiques** :
- **Nouvelles cartes** (créées en Modal 2) : **Éditables** (icône Edit)
- **Cartes existantes** (handover) : **Lecture seule** (icône Eye)
- Filtres : Floor, Category, Person, Theme
- Actions : Assign To, Apply Checklist

**Flux** :
```typescript
// 1. Fusion des tâches : nouvelles + existantes
const allTasks = [...workflowData.createdCards, ...tasks];

// 2. Séparation
const newCards = allTasks.filter(task => task.id.startsWith('temp-card-'));
const existingCards = allTasks.filter(task => !task.id.startsWith('temp-card-'));

// 3. Sélection multiple
const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

// 4. Application d'actions
const handleAssignTasks = () => {
  if (selectedTasks.length > 0) {
    const updates: typeof taskModifications = {};
    
    selectedTasks.forEach(taskId => {
      updates[taskId] = {
        ...(assignToPerson !== 'unassigned' && { assignedTo: assignToPerson }),
        ...(selectedChecklist !== 'none' && { action: selectedChecklist })
      };
    });
    
    setTaskModifications(prev => ({ ...prev, ...updates }));
  }
};

// 5. Passage à Modal 4
const handleTaskAllocationContinue = () => {
  setCurrentStep('voice_note');
};
```

**Actions disponibles** :
- `arrivee` : Arrival Checklist
- `recouche` : Turndown Checklist
- `deep_cleaning` : Deep Cleaning
- `ongoing_incident` : Ongoing Incident
- `to_repair` : To Repair

---

### Modal 4 : BeginShiftVoiceNoteModal

**Responsabilité** : Écoute de la note vocale/texte du shift précédent + revue des cartes

**Structure** :
```
ÉCRAN 0 : Audio Player + Handover Notes
  - Lecture de la note vocale (audio)
  - Affichage de la transcription/notes textuelles
  - Bouton "Start Reviewing the Task Cards"

ÉCRANS 1+ : Cartes une par une
  - ShiftFacingCard (lecture seule)
  - Bouton "View Details" : modal avec commentaires/reminders/activités
  - Bouton "Next" : passe à la carte suivante
  - Dernier écran : "Begin Shift" → Trigger onContinue()
```

**Flux** :
```typescript
// 1. Récupération du handover
const { shiftData } = useLatestShiftHandover();

// 2. Récupération des tâches filtrées par service
useEffect(() => {
  const fetchHandoverTasks = async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('service')
      .eq('id', user.id)
      .single();
    
    const { tasks: transferredTasks } = await getShiftHandover(profile.service);
    setHandoverTasks(transferredTasks);
  };
  
  fetchHandoverTasks();
}, [isOpen]);

// 3. Navigation entre les cartes
const handleValidate = () => {
  if (currentTaskIndex < handoverTasks.length) {
    setCurrentTaskIndex(currentTaskIndex + 1);
  } else {
    // Toutes les cartes vues → Begin Shift
    onContinue();
  }
};

// 4. Déclenchement du shift
const handleVoiceNoteContinue = () => {
  handleStartShift();
};
```

---

### Fonction Finale : `handleShiftStarted()` - ServiceControl2.tsx

```typescript
const handleShiftStarted = async (createdCards: TaskItem[] = []) => {
  try {
    console.log('🚀 [ServiceControl2] Starting shift...');
    console.log('📝 [ServiceControl2] Received', createdCards.length, 'cards from workflow');
    
    // 1. Récupérer l'utilisateur et son service
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('profiles')
      .select('service')
      .eq('id', user.id)
      .single();
    
    const userService = profile.service;
    
    // 2. Créer le shift en base
    const shiftResult = await startShift();
    const newShiftId = shiftResult.shift_id;
    console.log(`✅ [ServiceControl2] Shift created: ${newShiftId}`);
    
    // 3. CRÉER LES NOUVELLES CARTES dans Supabase
    let insertedCardsCount = 0;
    if (createdCards.length > 0) {
      const cardsToInsert = createdCards.map(card => ({
        title: card.title,
        description: card.description || null,
        location: card.location || card.roomNumber || null,
        category: card.category || 'internal_task', // ✅ Obligatoire
        priority: card.priority || 'normal',
        status: card.status || 'pending',
        service: userService,           // ✅ Service de l'utilisateur
        shift_id: newShiftId,            // ✅ Liées au nouveau shift
        created_by: user.id,
        assigned_to: card.assignedTo ? [card.assignedTo] : null,
        origin_type: 'team'              // ✅ Origin type
      }));
      
      const { data: insertedCards, error: insertError } = await supabase
        .from('task')
        .insert(cardsToInsert)
        .select();
      
      if (insertError) {
        console.error('❌ [ServiceControl2] Error creating cards:', insertError);
        // ✅ Ne pas throw - continuer avec les anciennes cartes
      } else {
        insertedCardsCount = insertedCards?.length || 0;
        console.log(`✅ [ServiceControl2] Created ${insertedCardsCount} cards in Supabase`);
      }
    }
    
    // 4. Récupérer les tâches du handover
    const { tasks: transferredTasks, stats } = await getShiftHandover(userService);
    console.log(`📦 [ServiceControl2] ${transferredTasks.length} tasks to transfer`);
    
    // 5. Lier les anciennes tâches au nouveau shift
    if (transferredTasks.length > 0) {
      const taskIds = transferredTasks.map(t => t.id);
      await linkTasksToShift(taskIds, newShiftId);
      console.log(`🔗 [ServiceControl2] Linked ${transferredTasks.length} old tasks to shift ${newShiftId}`);
    }
    
    // 6. Webhook
    const { sendShiftStartedEvent } = await import('@/lib/webhookService');
    await sendShiftStartedEvent({
      shift_id: newShiftId,
      timestamp: new Date().toISOString(),
      status: 'active',
      tasks_count: transferredTasks.length + insertedCardsCount,
    });
    
    // 7. Update UI
    setShiftStatus('active');
    setIsShiftStartOpen(false);
    await refetch();
    
    // 8. Success message
    const totalCards = transferredTasks.length + insertedCardsCount;
    toast({
      title: "Service Shift Started",
      description: `${insertedCardsCount} new cards created, ${transferredTasks.length} tasks transferred (Total: ${totalCards} cards)`,
    });
    
    console.log('✅ [ServiceControl2] Shift start complete!');
  } catch (error) {
    console.error('❌ [ServiceControl2] Error starting shift:', error);
    toast({
      title: "Error Starting Shift",
      description: error instanceof Error ? error.message : "Failed to start shift",
      variant: "destructive",
    });
  }
};
```

---

## 🛑 End Shift - Les Deux Pages

Les deux pages utilisent **la même logique End Shift** mais avec des modales différentes.

### Flux Commun

```
┌─────────────────────────────────────┐
│   ShiftManagement / ServiceControl2 │
│   Button: "End Shift"               │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│   ShiftCloseModal /                 │
│   ServiceShiftCloseModal            │
│   ┌───────────────────────────────┐ │
│   │  ÉCRANS 1-N:                  │ │
│   │  Une carte par carte          │ │
│   │  "Has situation evolved?"     │ │
│   │  - Next / Modify              │ │
│   └───────────┬───────────────────┘ │
│               ▼                      │
│   ┌───────────────────────────────┐ │
│   │  ÉCRAN FINAL:                 │ │
│   │  Voice Note / Text Note       │ │
│   │  → Submit                     │ │
│   └───────────┬───────────────────┘ │
└───────────────┼───────────────────┘
                │ submitShiftEnd()
                ▼
┌─────────────────────────────────────┐
│   Traitement End Shift              │
└─────────────────┬───────────────────┘
                  │
        ┌─────────┴──────────┬─────────────┬──────────────┐
        │                    │             │              │
        ▼                    ▼             ▼              ▼
┌──────────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────┐
│1. Upload     │  │2. End Shift  │  │3. Tag    │  │4. Save   │
│   Audio      │  │   (DB)       │  │   Logs   │  │   Handover│
│   (Storage)  │  │ endShift()   │  │          │  │saveShift │
└──────┬───────┘  └──────┬───────┘  └────┬─────┘  └────┬─────┘
       │                 │                │             │
       └─────────────────┴────────────────┴─────────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │ 5. Success Toast │
                 │ 6. Call Callback │
                 │    onShiftEnded()│
                 └──────────────────┘
```

### Fonction `submitShiftEnd()` - ShiftCloseModal.tsx / ServiceShiftCloseModal.tsx

```typescript
const submitShiftEnd = async () => {
  setIsSubmitting(true);
  
  try {
    // 1. Upload audio si présent
    let voiceNoteUrl = null;
    if (recordedAudio) {
      const fileName = `shift_${Date.now()}.wav`;
      
      const { data, error } = await supabase.storage
        .from('shift-recordings')
        .upload(fileName, recordedAudio, {
          contentType: 'audio/wav'
        });
      
      if (error) throw new Error(`Audio upload failed: ${error.message}`);
      
      const { data: { publicUrl } } = supabase.storage
        .from('shift-recordings')
        .getPublicUrl(fileName);
      
      voiceNoteUrl = publicUrl;
    }
    
    // 2. Vérifier qu'un shift actif existe
    if (!currentShift) {
      throw new Error('No active shift found');
    }
    
    // 3. Terminer le shift avec les notes
    const endShiftResult = await endShift(
      noteMode === 'text' ? textNote : (recordedAudio ? 'Voice note recorded' : 'No handover notes'),
      voiceNoteUrl || undefined,
      noteMode === 'text' ? textNote : undefined
    );
    
    if (!endShiftResult.success) {
      throw new Error('Failed to end shift');
    }
    
    // 4. Taguer tous les activity_logs créés pendant ce shift
    await supabase
      .from('activity_logs')
      .update({ shift_id: currentShift.id })
      .gte('created_at', currentShift.start_time)
      .lte('created_at', new Date().toISOString())
      .is('shift_id', null);
    
    // 5. Récupérer TOUTES les tâches actives pour le handover
    const { data: allActiveTasks } = await supabase
      .from('task')
      .select('*')
      .in('status', ['pending', 'in_progress']);
    
    const tasksToArchive = allActiveTasks || [];
    
    // 6. Sauvegarder le handover snapshot
    await saveShiftHandover(
      currentShift.id,
      tasksToArchive,    // ✅ Toutes les tâches actives
      voiceNoteUrl,
      noteMode === 'text' ? textNote : null,
      'Shift handover with continuity rules applied'
    );
    
    // 7. Statistiques pour le message de succès
    const stats = {
      pending: tasksToArchive.filter(t => t.status === 'pending').length,
      inProgress: tasksToArchive.filter(t => t.status === 'in_progress').length,
      completed: 0,
      total: tasksToArchive.length
    };
    
    // 8. Message de succès
    const message = `Thank you for your professionalism!
• ${stats.total} cards archived
• ${stats.completed} resolved cards (archived only)
• ${stats.pending + stats.inProgress} active cards (will transfer to next shift)
${voiceNoteUrl ? 'Audio note' : 'Text notes'} recorded for next team
Your shift handover has been successfully registered.`;
    
    alert(message);
    
    // 9. Clean up
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
    }
    
    // 10. Callback
    if (onShiftEnded) {
      onShiftEnded();
    } else {
      onClose();
    }
    
  } catch (error: any) {
    alert(`Error: ${error.message}`);
  } finally {
    setIsSubmitting(false);
  }
};
```

### Fonction `endShift()` - useShiftData.ts

```typescript
export const useEndShift = () => {
  const endShift = async (
    handoverNotes?: string, 
    voiceNoteUrl?: string, 
    voiceNoteTranscription?: string
  ): Promise<{ success: boolean }> => {
    try {
      // 1. Récupérer l'utilisateur
      const { data: { user } } = await supabase.auth.getUser();
      
      // 2. Terminer le shift actif
      const { error: updateError } = await supabase
        .from('shifts')
        .update({ 
          status: 'completed',
          end_time: new Date().toISOString(),
          handover_notes: handoverNotes || null,
          voice_note_url: voiceNoteUrl || null,
          voice_note_transcription: voiceNoteTranscription || null
        })
        .eq('user_id', user.id)
        .eq('status', 'active');
      
      if (updateError) throw updateError;
      
      return { success: true };
    } catch (err) {
      return { success: false };
    }
  };
  
  return { endShift };
};
```

### Fonction `saveShiftHandover()` - shiftContinuityManager-v2.ts

```typescript
export const saveShiftHandover = async (
  fromShiftId: string,
  tasks: TaskItem[],
  voiceNoteUrl?: string,
  transcription?: string,
  additionalNotes?: string
) => {
  console.log('💾 Sauvegarde handover - TOUTES les cartes archivées');
  
  const handoverData = {
    timestamp: new Date().toISOString(),
    voice_note_url: voiceNoteUrl || null,
    voice_transcription: transcription || null,
    total_tasks_count: tasks.length,
    
    tasks_by_status: {
      pending: tasks.filter(t => t.status === 'pending'),
      in_progress: tasks.filter(t => t.status === 'in_progress'), 
      completed: tasks.filter(t => t.status === 'completed'),
      resolved: tasks.filter(t => t.status === 'resolved')
    },
    
    tasks_by_type: {
      incident: tasks.filter(t => t.type === 'incident'),
      client_request: tasks.filter(t => t.type === 'client_request'),
      follow_up: tasks.filter(t => t.type === 'follow_up'),
      internal_task: tasks.filter(t => t.type === 'internal_task')
    },
    
    all_tasks: tasks.map(task => ({
      id: task.id,
      type: task.type,
      status: task.status,
      title: task.title,
      assigned_to: task.assigned_to || [],  // ✅ UUIDs array
      created_by: task.created_by,           // ✅ UUID
      priority: task.priority,
      data: task
    }))
  };
  
  const { data, error } = await supabase
    .from('shift_handovers')
    .insert({
      from_shift_id: fromShiftId,
      handover_data: handoverData,
      additional_notes: additionalNotes || null
    })
    .select()
    .single();
    
  if (error) throw error;
  console.log('✅ Handover sauvegardé:', data.id);
  return data;
};
```

---

## 🔄 Synchronisation Temps Réel

Les deux pages **écoutent les changements de la table `shifts`** pour se synchroniser automatiquement.

### Implémentation - ShiftManagement.tsx / ServiceControl2.tsx

```typescript
// 1. État du shift
const [shiftStatus, setShiftStatus] = useState<'not_started' | 'active' | 'closed'>('not_started');

// 2. Vérification au montage
useEffect(() => {
  const checkActiveShift = async () => {
    const { data: activeShift } = await supabase
      .from('shifts')
      .select('id')
      .eq('status', 'active')
      .single();
    
    if (activeShift) {
      setShiftStatus('active');
      console.log('✅ Active shift detected:', activeShift.id);
    } else {
      setShiftStatus('not_started');
    }
  };
  
  checkActiveShift();
}, []);

// 3. Écoute temps réel
useEffect(() => {
  const channel = supabase
    .channel('shifts-realtime-sync')
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'shifts' 
      },
      (payload) => {
        console.log('🔔 Shift change detected:', payload);
        
        // Re-vérifier l'état du shift
        supabase
          .from('shifts')
          .select('id')
          .eq('status', 'active')
          .single()
          .then(({ data }) => {
            if (data) {
              setShiftStatus('active');
              console.log('✅ Shift activated from another page');
            } else {
              setShiftStatus('not_started');
              console.log('✅ Shift ended from another page');
            }
          });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

// 4. Boutons conditionnels
<Button 
  onClick={() => handleShiftAction('start')} 
  disabled={shiftStatus === 'active'} 
  className={shiftStatus === 'active' ? 'bg-gray-300' : 'bg-green-600'}
>
  {shiftStatus === 'active' ? 'Active Shift' : 'Begin Shift'}
</Button>

<Button 
  onClick={() => handleShiftAction('close')} 
  disabled={shiftStatus !== 'active'}
  className={shiftStatus !== 'active' ? 'bg-gray-300' : 'bg-red-600'}
>
  End Shift
</Button>
```

### Avantages de la Synchronisation

1. **Cohérence** : Un utilisateur ne peut pas démarrer 2 shifts simultanément
2. **Visibilité** : Les boutons s'adaptent automatiquement sur toutes les pages ouvertes
3. **Prévention d'erreurs** : Impossible de terminer un shift qui n'existe pas
4. **Multi-onglets** : Fonctionne même si l'utilisateur a plusieurs onglets ouverts

---

## 🔐 Gestion des UUIDs et Filtrage par Service

### 1. Mapping UUID → Service

**Objectif** : Déterminer à quel service appartient chaque utilisateur

**Table source** : `staff_directory`

```sql
SELECT id, department FROM staff_directory WHERE id IN (array_of_uuids);
```

**Exemple** :
```javascript
// Collecter tous les UUIDs
const allUserIds = new Set<string>();
allTasks.forEach((taskSnapshot: any) => {
  if (taskSnapshot.created_by) allUserIds.add(taskSnapshot.created_by);
  if (taskSnapshot.assigned_to) {
    taskSnapshot.assigned_to.forEach((id: string) => allUserIds.add(id));
  }
});

// Récupérer les services
const { data: staffMembers } = await supabase
  .from('staff_directory')
  .select('id, department')
  .in('id', Array.from(allUserIds));

// Créer le mapping
const userServiceMap: Record<string, string> = {};
staffMembers?.forEach(member => {
  if (member.department) {
    userServiceMap[member.id] = member.department.toLowerCase();
  }
});
```

### 2. Critères de Filtrage

**Lors du Begin Shift**, les tâches sont filtrées selon **2 critères** :

#### Critère 1 : Créée par mon service
```javascript
const creatorService = userServiceMap[taskSnapshot.created_by];
if (creatorService === userService) return true;
```

#### Critère 2 : Assignée à quelqu'un de mon service
```javascript
const assignedIds = taskSnapshot.assigned_to || [];
const hasMyService = assignedIds.some((id: string) => 
  userServiceMap[id] === userService
);
if (hasMyService) return true;
```

### 3. Exemples Concrets

**Scénario 1 : Tâche créée par Réception, assignée à Housekeeping**
- `created_by` : UUID de Will (service: reception)
- `assigned_to` : [UUID de Océane (service: housekeeping)]
- **Résultat** :
  - Shift Reception : ✅ Récupérée (Critère 1)
  - Shift Housekeeping : ✅ Récupérée (Critère 2)

**Scénario 2 : Tâche créée par Maintenance, assignée à Maintenance**
- `created_by` : UUID de Technicien (service: maintenance)
- `assigned_to` : [UUID de Technicien (service: maintenance)]
- **Résultat** :
  - Shift Maintenance : ✅ Récupérée (Critère 1 et 2)
  - Shift Reception : ❌ Non récupérée
  - Shift Housekeeping : ❌ Non récupérée

**Scénario 3 : Tâche créée par Réception, non assignée**
- `created_by` : UUID de Will (service: reception)
- `assigned_to` : []
- **Résultat** :
  - Shift Reception : ✅ Récupérée (Critère 1)
  - Autres services : ❌ Non récupérée

---

## 🆔 Shift ID : Création et Utilisation

### 1. Création du Shift ID

**Quand** : Lors de l'appel à `startShift()`

**Où** : `useShiftData.ts`

```typescript
const { data: newShift } = await supabase
  .from('shifts')
  .insert({
    user_id: user.id,
    start_time: new Date().toISOString(),
    status: 'active',
    service: userService  // ✅ Service de l'utilisateur
  })
  .select()
  .single();

const shift_id = newShift.id; // UUID généré automatiquement
```

### 2. Utilisation du Shift ID

#### A. Nouvelles Cartes (Service Control 2)

**Lors de la création des cartes dans `handleShiftStarted()`** :

```typescript
const cardsToInsert = createdCards.map(card => ({
  title: card.title,
  description: card.description || null,
  location: card.location || card.roomNumber || null,
  category: 'internal_task',
  priority: 'normal',
  status: 'pending',
  service: userService,
  shift_id: newShiftId,  // ✅ Lié au shift dès la création
  created_by: user.id,
  assigned_to: null,
  origin_type: 'team'
}));

await supabase.from('task').insert(cardsToInsert);
```

#### B. Anciennes Cartes (Handover)

**Lors de la liaison avec `linkTasksToShift()`** :

```typescript
export const linkTasksToShift = async (taskIds: string[], newShiftId: string): Promise<void> => {
  await supabase
    .from('task')
    .update({ 
      shift_id: newShiftId,         // ✅ Mise à jour du shift_id
      updated_at: new Date().toISOString()
    })
    .in('id', taskIds);
};
```

#### C. Tagging des Activity Logs

**Lors du End Shift** :

```typescript
await supabase
  .from('activity_logs')
  .update({ shift_id: currentShift.id })  // ✅ Tag avec shift_id
  .gte('created_at', currentShift.start_time)
  .lte('created_at', new Date().toISOString())
  .is('shift_id', null);
```

### 3. Traçabilité et Analytics

Le `shift_id` permet :
- **Historique** : Retrouver toutes les tâches créées pendant un shift
- **Performance** : Calculer le nombre de tâches résolues par shift
- **Audit** : Tracer les actions effectuées pendant un shift
- **Reporting** : Générer des rapports par shift

**Requête exemple** :
```sql
-- Toutes les tâches d'un shift spécifique
SELECT * FROM task WHERE shift_id = 'uuid-du-shift';

-- Statistiques d'un shift
SELECT 
  status,
  COUNT(*) as count
FROM task 
WHERE shift_id = 'uuid-du-shift'
GROUP BY status;

-- Activity logs d'un shift
SELECT * FROM activity_logs WHERE shift_id = 'uuid-du-shift';
```

---

## 🧠 Règles de Continuité Intelligente

### Philosophie

**Objectif** : Transférer uniquement les tâches actives (pending + in_progress) au prochain shift, en archivant TOUTES les tâches pour traçabilité.

### Règles Appliquées

#### 1. Archivage Complet
```javascript
// TOUTES les tâches actives sont archivées dans shift_handovers
const { data: allActiveTasks } = await supabase
  .from('task')
  .select('*')
  .in('status', ['pending', 'in_progress']);

await saveShiftHandover(currentShift.id, allActiveTasks, ...);
```

#### 2. Filtrage Intelligent lors du Begin Shift
```javascript
// Filtrer selon status ET service
const tasksToTransfer = allTasks.filter((taskSnapshot: any) => {
  const task = taskSnapshot.data;
  
  // ✅ Filtre status : uniquement in_progress et pending
  if (task.status !== 'in_progress' && task.status !== 'pending') {
    console.log(`📦 Carte "${task.title}" archivée (${task.status})`);
    return false;
  }
  
  // ✅ Filtre service : créée par OU assignée à mon service
  const creatorService = userServiceMap[taskSnapshot.created_by];
  if (creatorService === userService) return true;
  
  const assignedIds = taskSnapshot.assigned_to || [];
  const hasMyService = assignedIds.some((id: string) => 
    userServiceMap[id] === userService
  );
  if (hasMyService) return true;
  
  return false;
});
```

### Matrice de Décision

| Status        | Créée par mon service | Assignée à mon service | Transférée ? |
|---------------|-----------------------|------------------------|--------------|
| `pending`     | ✅                    | -                      | ✅           |
| `pending`     | ❌                    | ✅                     | ✅           |
| `pending`     | ❌                    | ❌                     | ❌           |
| `in_progress` | ✅                    | -                      | ✅           |
| `in_progress` | ❌                    | ✅                     | ✅           |
| `in_progress` | ❌                    | ❌                     | ❌           |
| `completed`   | ✅                    | ✅                     | ❌           |
| `verified`    | ✅                    | ✅                     | ❌           |

### Statistiques Affichées

```javascript
const stats = {
  totalArchived: allTasks.length,           // Toutes les tâches archivées
  transferred: tasksToTransfer.length,       // Tâches transférées au prochain shift
  archived: allTasks.length - tasksToTransfer.length  // Tâches archivées uniquement
};

console.log(`📊 ${stats.transferred}/${stats.totalArchived} cartes transférées`);
```

---

## 📝 Cas d'Usage Complets

### Cas 1 : Shift Reception avec 10 nouvelles cartes

```
JOUR 1 - 08:00 - Will (Réception)
┌─────────────────────────────────────────────┐
│ BEGIN SHIFT - Service Control 2             │
│ ✅ Modal 1: Avec création                   │
│ ✅ Modal 2: Sélection 10 chambres (Étage 1) │
│ ✅ Modal 3: Assignation à Océane            │
│ ✅ Modal 4: Écoute handover vide            │
└─────────────────┬───────────────────────────┘
                  ▼
┌─────────────────────────────────────────────┐
│ handleShiftStarted(createdCards: 10)        │
│ → Créer shift_id: abc-123                   │
│ → Créer 10 cartes en DB (shift_id: abc-123) │
│ → Aucune tâche à transférer                 │
└─────────────────────────────────────────────┘

JOUR 1 - 16:00 - Will (Réception)
┌─────────────────────────────────────────────┐
│ END SHIFT                                   │
│ ✅ Revue des 10 cartes (8 resolved, 2 pending)│
│ ✅ Note vocale enregistrée                  │
└─────────────────┬───────────────────────────┘
                  ▼
┌─────────────────────────────────────────────┐
│ submitShiftEnd()                            │
│ → Terminer shift abc-123                    │
│ → Archiver 10 cartes dans shift_handovers   │
│ → 2 cartes (pending) seront transférées     │
└─────────────────────────────────────────────┘

JOUR 2 - 08:00 - Océane (Réception)
┌─────────────────────────────────────────────┐
│ BEGIN SHIFT - Service Control 2             │
│ ✅ Modal 1: Sans création                   │
│ ✅ Modal 3: 2 cartes récupérées du handover │
│ ✅ Modal 4: Écoute note vocale de Will      │
└─────────────────┬───────────────────────────┘
                  ▼
┌─────────────────────────────────────────────┐
│ handleShiftStarted(createdCards: [])        │
│ → Créer shift_id: def-456                   │
│ → Récupérer 2 tâches du handover            │
│ → Lier 2 tâches à shift def-456             │
└─────────────────────────────────────────────┘
```

---

### Cas 2 : Shift Housekeeping sans création

```
JOUR 1 - 08:00 - Maria (Housekeeping)
┌─────────────────────────────────────────────┐
│ BEGIN SHIFT - Shift Management              │
│ ✅ Écoute handover: 5 tâches de la veille   │
│ ✅ Revue des 5 cartes                       │
└─────────────────┬───────────────────────────┘
                  ▼
┌─────────────────────────────────────────────┐
│ handleShiftStarted()                        │
│ → Créer shift_id: xyz-789                   │
│ → Récupérer 5 tâches du handover            │
│ → Lier 5 tâches à shift xyz-789             │
└─────────────────────────────────────────────┘

JOUR 1 - 16:00 - Maria (Housekeeping)
┌─────────────────────────────────────────────┐
│ END SHIFT                                   │
│ ✅ Revue des 5 cartes (3 resolved, 2 pending)│
│ ✅ Note texte enregistrée                   │
└─────────────────┬───────────────────────────┘
                  ▼
┌─────────────────────────────────────────────┐
│ submitShiftEnd()                            │
│ → Terminer shift xyz-789                    │
│ → Archiver 5 cartes dans shift_handovers    │
│ → 2 cartes (pending) seront transférées     │
└─────────────────────────────────────────────┘
```

---

## 🎓 Points Clés à Retenir

### Architecture

1. **Deux pages distinctes** : Shift Management (simple) et Service Control 2 (avancé)
2. **Table `shifts`** : Enregistre les sessions de travail avec `service` et `user_id`
3. **Table `shift_handovers`** : Snapshot JSONB complet de l'état des tâches
4. **Table `task`** : Architecture unifiée avec `shift_id`, `service`, `assigned_to[]`

### Flux Begin Shift

1. **Shift Management** : 1 modal (ShiftStartModal) → Écoute handover → Start
2. **Service Control 2** : 4 modales en séquence → Création cartes → Allocation → Handover → Start
3. **Création du shift** : `startShift()` génère un `shift_id` UUID
4. **Récupération handover** : `getShiftHandover(userService)` filtre par service (2 critères)
5. **Liaison** : `linkTasksToShift()` met à jour `shift_id` sur les anciennes tâches
6. **Nouvelles cartes** : Insérées directement avec `shift_id` lors de la création

### Flux End Shift

1. **Revue des cartes** : Une par une avec possibilité de modifier
2. **Note finale** : Voice note OU text note pour l'équipe suivante
3. **Upload audio** : Supabase Storage (`shift-recordings`)
4. **Terminer shift** : `endShift()` met à jour `status`, `end_time`, notes
5. **Archivage** : `saveShiftHandover()` archive TOUTES les tâches actives
6. **Tag logs** : Tous les `activity_logs` reçoivent le `shift_id`

### Synchronisation

1. **Temps réel** : Supabase Realtime écoute les changements de `shifts`
2. **Multi-pages** : Les deux pages se synchronisent automatiquement
3. **Multi-onglets** : Fonctionne même avec plusieurs onglets ouverts
4. **Boutons adaptés** : Begin Shift actif uniquement si aucun shift actif

### Filtrage et UUIDs

1. **Mapping** : `staff_directory.id` → `staff_directory.department` (service)
2. **Critère 1** : Tâche créée par mon service (`created_by`)
3. **Critère 2** : Tâche assignée à quelqu'un de mon service (`assigned_to[]`)
4. **Règle status** : Uniquement `pending` + `in_progress` transférées
5. **Archivage** : TOUTES les tâches archivées pour traçabilité

### Shift ID

1. **Création** : Lors de `startShift()`, UUID généré automatiquement
2. **Nouvelles cartes** : `shift_id` renseigné lors de l'insertion
3. **Anciennes cartes** : `shift_id` mis à jour via `linkTasksToShift()`
4. **Activity logs** : `shift_id` ajouté lors du End Shift
5. **Traçabilité** : Toutes les actions d'un shift sont liées au même `shift_id`

---

## ✅ Checklist de Vérification

- [ ] Les deux pages (Shift Management et Service Control 2) sont-elles bien distinctes ?
- [ ] Le `shift_id` est-il créé lors du Begin Shift ?
- [ ] Les nouvelles cartes (Service Control 2) sont-elles créées avec `shift_id` ?
- [ ] Les anciennes cartes sont-elles liées au nouveau shift via `linkTasksToShift()` ?
- [ ] Le filtrage par service fonctionne-t-il avec les 2 critères ?
- [ ] L'archivage du End Shift inclut-il TOUTES les tâches actives ?
- [ ] Les tâches `completed` et `verified` sont-elles exclues du transfert ?
- [ ] La synchronisation temps réel fonctionne-t-elle entre les pages ?
- [ ] Les `activity_logs` sont-ils bien tagués avec `shift_id` ?
- [ ] Les notes vocales/texte sont-elles correctement enregistrées ?

---

## 🔚 Conclusion

Ce document de référence constitue la **source de vérité** pour l'architecture de gestion des shifts dans HospitalityOS. Il documente en détail :

- Les **deux flux distincts** (Shift Management vs Service Control 2)
- L'**architecture des tables** et leurs relations
- Les **fonctions clés** avec leur implémentation complète
- Le **filtrage intelligent** par service et status
- La **synchronisation temps réel** entre les pages
- Les **règles de continuité** des tâches

**Tout développeur ou IA** doit se référer à ce document pour comprendre le fonctionnement du système de shifts et éviter les erreurs d'implémentation.

---

**Document créé le 10 octobre 2025**  
**Dernière mise à jour : 10 octobre 2025**  
**Version : 2.0**
