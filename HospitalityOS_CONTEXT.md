# Receptionist Hospitality OS - PROJECT_CONTEXT

## Vision Produit

**HospitalityOS** est une plateforme de gestion hôtelière moderne centralisant toutes les opérations de réception pour améliorer l'efficacité opérationnelle et l'expérience client. L'objectif principal est de transformer la gestion quotidienne des tâches de réception en un système intégré, collaboratif et intelligent.

### Objectifs Stratégiques
- **Efficacité Opérationnelle** : Réduire le temps de traitement des demandes clients de 60%
- **Collaboration Équipe** : Centraliser la communication et le suivi des tâches entre services
- **Qualité Service** : Améliorer la traçabilité et le suivi des incidents pour une résolution plus rapide
- **Digitalisation** : Moderniser les processus de gestion des shifts et handovers

### Proposition de Valeur
Contrairement aux PMS traditionnels qui se concentrent sur la gestion des réservations, HospitalityOS se focalise sur l'orchestration des tâches opérationnelles quotidiennes, en offrant une vision temps réel de toutes les activités de l'hôtel avec des workflows intelligents et des systèmes d'escalade automatisés.

## Personas Principaux

### Réceptionniste (Primary User)
- **Profil** : Personnel de réception, 20-35 ans, utilisation intensive (8h/jour)
- **Besoins** : Interface intuitive, accès rapide aux informations, workflows guidés
- **Pain Points** : Perte d'information entre équipes, difficultés de priorisation, manque de visibilité sur l'avancement
- **Usage** : Dashboard principal, gestion des incidents, communication interne

### Manager d'Hôtel (Secondary User)
- **Profil** : Responsable opérationnel, besoin de supervision et reporting
- **Besoins** : Tableaux de bord analytics, KPIs en temps réel, gestion d'équipe
- **Pain Points** : Manque de visibilité sur la charge de travail, difficultés de suivi des performances
- **Usage** : Analytics, gestion des shifts, supervision générale

### Personnel de Maintenance/Housekeeping (Tertiary User)
- **Profil** : Équipes techniques, accès mobile souhaitable
- **Besoins** : Notifications en temps réel, mise à jour statuts, communication simple
- **Usage** : Réception de tâches, mise à jour de statuts, escalades

## Stack Technique Complète

### Frontend Architecture
```json
{
  "framework": "React 18.3.1",
  "language": "TypeScript 5.5.3",
  "build_tool": "Vite 5.4.1",
  "styling": "Tailwind CSS 3.4.11",
  "ui_library": "shadcn/ui (Radix UI components)",
  "routing": "React Router DOM 6.26.2",
  "state_management": "TanStack Query 5.56.2",
  "forms": "React Hook Form 7.53.0 + Zod 3.23.8",
  "drag_and_drop": "@dnd-kit 6.3.1",
  "animations": "Tailwind CSS Animate",
  "theming": "next-themes 0.3.0"
}
```

### Backend & Database
```json
{
  "database": "Supabase (PostgreSQL)",
  "authentication": "Supabase Auth",
  "api": "Supabase API (Auto-generated REST/GraphQL)",
  "realtime": "Supabase Realtime",
  "storage": "Supabase Storage",
  "project_id": "ypxmzacmwqqvlciwahzw"
}
```

### Development Tools
```json
{
  "package_manager": "npm + Bun",
  "linting": "ESLint 9.9.0",
  "type_checking": "TypeScript ESLint",
  "development_platform": "Lovable.dev",
  "deployment": "Vite Build + Lovable Deploy"
}
```

### Libraries & Dependencies Clés
- **UI Components** : Radix UI primitives complets (20+ composants)
- **Charts & Visualizations** : Recharts 2.12.7
- **Date Management** : date-fns 3.6.0, React Day Picker 8.10.1
- **Notifications** : Sonner 1.5.0 + Custom Toast System
- **Icons** : Lucide React 0.462.0 (500+ icônes)
- **Responsive Design** : React Resizable Panels 2.1.3
- **Form Validation** : Zod schemas + React Hook Form resolvers

## Architecture Projet

```
/src
├── /components
│   ├── /cards              # Composants de cartes (CardFaceModal, etc.)
│   ├── /modals             # Modals du système
│   │   ├── EnhancedTaskDetailModal.tsx
│   │   ├── ShiftStartModal.tsx
│   │   ├── ShiftCloseModal.tsx
│   │   ├── ServiceShiftStartModal.tsx      # NOUVEAU
│   │   └── ServiceShiftCloseModal.tsx      # NOUVEAU
│   ├── /shared             # Composants partagés
│   │   └── CardFaceModal.tsx
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   └── VoiceCommandButton.tsx
│
├── /pages
│   ├── Index.tsx           # Dashboard principal
│   ├── ShiftManagement.tsx # Gestion des shifts réception
│   ├── TeamDispatch.tsx    # Vue dispatch équipe
│   ├── ServiceControl.tsx  # NOUVEAU - Gestion service/housekeeping
│   ├── Connaissances.tsx
│   └── Assistant.tsx
│
├── /hooks
│   ├── useSupabaseData.ts  # Hook principal pour récupération données
│   ├── useShiftData.ts
│   └── use-toast.ts
│
├── /integrations
│   └── /supabase
│       ├── client.ts
│       └── types.ts        # Types générés depuis Supabase
│
├── /lib
│   ├── /migrations
│   │   └── teamDispatchMigration.ts
│   ├── utils.ts
│   └── webhookService.ts
│
├── /types
│   └── database.ts         # Types custom de l'application
│
└── /utils
    └── timeUtils.ts
```

## Nouvelles Fonctionnalités (Mars 2026)

### 1. Team Dispatch View (`/team-dispatch`)
**Objectif** : Vue de dispatch pour la gouvernante/manager afin de visualiser et gérer les tâches de toute l'équipe

**Caractéristiques** :
- **3 boutons d'action** :
  - Begin Shift (devient Active Shift quand actif)
  - Work Improvement (redirige vers /connaissances)
  - End Shift
- **3 colonnes Kanban** : To Process, In Progress, Resolved
- **Vue par membre d'équipe** : Une colonne par personne avec leurs tâches
- **Statistiques par membre** : X tâches • Y% completed • Z% To Process
- **Drag & Drop** : Réorganisation des tâches entre colonnes et membres
- **Modal de détail** : EnhancedTaskDetailModal avec commentaires, pièces jointes, escalade
- **Indicateur de statut visuel** : 
  - 🔴 "Status: Inactive" (rouge) quand shift non démarré
  - 🟢 "Status: Active" (vert avec pulse) quand shift actif

**Filtres et données** :
- Affiche uniquement les tâches des membres de l'équipe housekeeping/service
- Utilise les profils Supabase pour récupérer les noms complets (first_name + last_name)
- Calculs temps réel des statistiques de complétion

### 2. Service Control View (`/service-control`)
**Objectif** : Vue spécialisée pour le service housekeeping avec gestion avancée des chambres et checklists

**Caractéristiques** :
- **4 colonnes Kanban** (au lieu de 3) :
  - To Process
  - In Progress
  - Resolved
  - Verified (nouvelle colonne spécifique au service)
- **Navigation horizontale** : Affiche 3 colonnes à la fois, scroll pour voir la 4ème
- **Boutons adaptés** :
  - Begin Shift (au lieu de Start Shift)
  - Work Improvement
  - End Shift
- **Indicateur de statut visuel** : Identique à Team Dispatch
  - 🔴 "Status: Inactive" (rouge)
  - 🟢 "Status: Active" (vert avec pulse)

**Modal "Begin Shift" sophistiqué** :

**Filtres** :
- **Par étage** : RDC, Basement, Étages 1-5 (basé sur locations Supabase)
- **Par catégorie** : 4 catégories du projet
  - Ongoing Incident (incidents)
  - Clients (client_requests)
  - Tasks (internal_tasks)
  - Follow Ups (follow_ups)
- **Par personne** : Noms individuels des membres d'équipe (first_name + last_name)
- **Par priorité** : Low, Medium, High, Urgent (priority_level du projet)

**Filtres thématiques** :
- **Tri par retard** : Affiche les plus en retard en premier
- **Par shift** :
  - Issues du shift précédent
  - Issues du nouveau shift

**Actions** :
- **Sélectionner** : Cases à cocher une par une ou tout sélectionner
- **Attribuer** : Menu déroulant des membres d'équipe + bouton "Attribuer (X)"
- **Appliquer checklist** : Menu avec 2 options
  - Checklist "en arrivée"
  - Checklist "en recouche"

**Cartes de chambres** :
- **Création automatique** : Une carte vierge par chambre (basé sur locations Supabase de type 'room')
- **Style visuel** : Légèrement jaune (bg-yellow-50) pour distinguer des tâches normales
- **Format** : Grid 2 colonnes (même largeur que Shift Management)
- **Logique d'attribution** :
  - Tâches non assignées en haut avec cases à cocher
  - Tâches assignées en bas (opacity réduite, pas de cases)
  - Les cartes assignées vont automatiquement à la fin de la liste (scroll down)

### 3. Système d'Archivage des Tâches

**Problème résolu** : Les tâches 'completed' réapparaissaient au shift suivant

**Solution implémentée** :

**Migration Supabase** (`add-archived-status.sql`) :
```sql
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'archived';
```

**Logique d'archivage** :
1. **Pendant le shift** : Les tâches 'completed' restent visibles dans la colonne "Resolved"
2. **À la fermeture du shift** (`onShiftEnded`) :
   - Toutes les tâches avec statut 'completed' passent à 'archived'
   - Pour Service Control : 'completed' ET 'verified' passent à 'archived'
   - Mise à jour dans Supabase pour tous les types de tâches :
     - incidents → status: 'archived'
     - client_requests → preparation_status: 'archived'
     - follow_ups → status: 'archived'
     - internal_tasks → status: 'archived'
3. **Au shift suivant** : Les tâches archivées ne réapparaissent plus

**Hook modifié** (`useSupabaseData.ts`) :
```typescript
.not('status', 'eq', 'archived')  // Exclure les tâches archivées
```

**Notification** : Toast affichant "X task(s) archived" à la fermeture du shift

### 4. Indicateurs de Statut Visuels

**Implémentation** : Sur Shift Management et Service Control

**Design** :
- Position : Sur la même ligne que le titre de la page
- Cercle coloré : 
  - 🔴 `w-3 h-3 rounded-full bg-red-500` pour Inactive
  - 🟢 `w-3 h-3 rounded-full bg-green-500 animate-pulse` pour Active
- Texte : `text-xl font-playfair font-bold`
  - Rouge `text-red-600` : "Status: Inactive"
  - Vert `text-green-600` : "Status: Active"

**États** :
- `not_started` → Status: Inactive (rouge)
- `active` → Status: Active (vert avec animation pulse)
- `closed` → Status: Inactive (rouge)

## Enums Supabase

```typescript
export const Constants = {
  public: {
    Enums: {
      attachment_type: ["image", "document", "audio", "video", "other"],
      comment_type: ["comment", "system", "escalation"],
      escalation_method: ["email", "sms", "phone", "internal"],
      priority_level: ["low", "medium", "high", "urgent"],
      reminder_frequency: ["once", "daily", "weekly", "monthly"],
      shift_status: ["active", "completed", "cancelled"],
      task_status: ["pending", "in_progress", "completed", "cancelled", "archived"],  // ✅ archived ajouté
      user_role: ["admin", "manager", "staff", "maintenance", "housekeeping"],
    },
  },
}
```

## Routes de l'Application

```typescript
/                     → Dashboard (Index.tsx)
/shift                → Shift Management
/team-dispatch        → Team Dispatch (NOUVEAU)
/service-control      → Service Control (NOUVEAU)
/connaissances        → Base de connaissances
/assistant            → Assistant AI
```

## Menu Sidebar

```typescript
const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: RefreshCw, label: 'Shift Management', href: '/shift' },
  { icon: Users, label: 'Team Dispatch', href: '/team-dispatch' },
  { icon: Settings, label: 'Service Control', href: '/service-control' },  // NOUVEAU
  { icon: BookOpen, label: 'Knowledge Base', href: '/connaissances' },
  { icon: Search, label: 'Assistant', href: '/assistant' },
  { icon: LogOut, label: 'Sign Out', href: '/logout', danger: true },
];
```

## Structure des Données

### TaskItem Type
```typescript
interface TaskItem {
  id: string;
  title: string;
  type: 'incident' | 'client_request' | 'follow_up' | 'internal_task' | 'personal_task';
  priority: 'normal' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'verified' | 'archived';
  description?: string;
  assignedTo?: string;
  location?: string;
  guestName?: string;
  roomNumber?: string;
  recipient?: string;
  dueDate?: string;
  created_at: Date;
  updated_at: Date;
}
```

### Locations (Supabase)
```typescript
interface Location {
  id: string;
  name: string;          // Ex: "Chambre 101", "Suite 301"
  type: 'room' | 'common_area' | 'staff_area';
  floor: number;         // -1 (Basement), 0 (RDC), 1-5
  building: string;
  capacity?: number;
  is_active: boolean;
}
```

### Profiles (Supabase)
```typescript
interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  department: 'housekeeping' | 'restaurant' | 'management' | string;
  role: 'admin' | 'manager' | 'staff' | 'maintenance' | 'housekeeping';
  is_active: boolean;
}
```

## Workflow d'un Shift Complet

### 1. Début de Shift
1. **Shift Management/Service Control** : Clic sur "Begin Shift" / "Start Shift"
2. **Modal d'attribution** (Service Control uniquement) :
   - Filtrage des tâches (étage, catégorie, personne, priorité, shift)
   - Sélection multiple des tâches
   - Attribution aux membres d'équipe
   - Application de checklists
3. **Activation** : 
   - Statut passe à `active`
   - Indicateur visuel devient 🟢 "Status: Active"
   - Webhook `sendShiftStartedEvent`

### 2. Pendant le Shift
- **Drag & Drop** : Déplacement des tâches entre colonnes
- **Mise à jour statuts** : pending → in_progress → completed (→ verified pour Service Control)
- **Détail des tâches** : EnhancedTaskDetailModal avec édition complète
- **Synchronisation temps réel** : Supabase Realtime

### 3. Fin de Shift
1. **Clic sur "End Shift"**
2. **Modal de fermeture** : Récapitulatif des tâches
3. **Archivage automatique** :
   - Récupération de toutes les tâches 'completed' (+ 'verified' pour Service Control)
   - Mise à jour en batch : status → 'archived' dans Supabase
   - Pour chaque type de tâche (incidents, client_requests, follow_ups, internal_tasks)
4. **Finalisation** :
   - Statut shift passe à `closed`
   - Indicateur visuel devient 🔴 "Status: Inactive"
   - Refetch des données (les tâches archivées disparaissent)
   - Toast : "X task(s) archived"
   - Webhook `sendShiftEndedEvent`

### 4. Shift Suivant
- Les tâches archivées ne réapparaissent PAS (filtrées par `.not('status', 'eq', 'archived')`)
- Seules les nouvelles tâches ou celles en pending/in_progress sont visibles
- Kanban commence propre

## Composants Clés

### CardFaceModal
Composant de carte unifié utilisé dans toutes les vues Kanban
- Affichage : Titre, location, client, statut, priorité, assigné à, temps écoulé
- Largeur standardisée pour grid 2 ou 3 colonnes
- Clic → Ouvre EnhancedTaskDetailModal

### EnhancedTaskDetailModal
Modal de détail complet d'une tâche
- Édition de tous les champs
- Commentaires
- Pièces jointes
- Escalade
- Historique

### ServiceShiftStartModal
Modal sophistiqué d'attribution des tâches au début du shift Service Control
- 8+ filtres combinables
- Sélection multiple
- Attribution en masse
- Application de checklists
- Cartes de chambres vierges générées automatiquement

## Conventions de Code

### Nommage
- **Composants** : PascalCase (`TeamDispatch.tsx`, `ServiceControl.tsx`)
- **Hooks** : camelCase avec préfixe use (`useTasks`, `useProfiles`)
- **Types** : PascalCase (`TaskItem`, `Profile`)
- **Constantes** : SCREAMING_SNAKE_CASE ou camelCase selon contexte

### Structure des Pages
```typescript
const PageName = () => {
  // 1. États locaux
  const [state, setState] = useState();
  
  // 2. Hooks personnalisés
  const { data, loading } = useCustomHook();
  
  // 3. Handlers
  const handleAction = () => { };
  
  // 4. Render
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />
      <main className="p-8">
        {/* Content */}
      </main>
      {/* Modals */}
    </div>
  );
};
```

### Gestion des États de Shift
```typescript
type ShiftStatus = 'not_started' | 'active' | 'closed';

// État initial
const [shiftStatus, setShiftStatus] = useState<ShiftStatus>('not_started');

// Transitions
'not_started' → 'active'   // Begin/Start Shift
'active' → 'closed'         // End Shift
'closed' → 'not_started'    // Nouveau shift
```

## Migrations Supabase

### add-archived-status.sql
```sql
-- Ajouter le statut 'archived' à l'enum task_status
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'archived';

-- Vérification
SELECT unnest(enum_range(NULL::task_status)) AS task_status_values;
```

**À exécuter dans** : Supabase Dashboard → SQL Editor

## Points d'Attention

### Performance
- Utiliser `useMemo` pour les calculs de filtrage/tri lourds
- Limiter les re-renders avec `useCallback` pour les handlers
- Batch updates pour l'archivage (éviter N requêtes)

### Synchronisation
- Supabase Realtime activé sur toutes les tables de tâches
- Refetch après modifications critiques (archivage, attribution)
- Gestion des erreurs avec try/catch et toast notifications

### UX
- Indicateurs visuels clairs (statut shift, compteurs)
- Feedback immédiat (toasts, loading states)
- Drag & Drop fluide avec animations
- Responsive design (grid adaptatif)

### Sécurité
- Authentification Supabase requise
- RLS (Row Level Security) sur toutes les tables
- Validation des données côté client (Zod) et serveur (Supabase)

## Prochaines Étapes Potentielles

1. **Analytics Dashboard** : KPIs temps réel, graphiques de performance
2. **Mobile App** : Version React Native pour équipes terrain
3. **Notifications Push** : Alertes temps réel pour escalades
4. **IA Prédictive** : Suggestion d'attribution basée sur charge/compétences
5. **Export/Reporting** : PDF/Excel des shifts avec métriques détaillées
6. **Intégration PMS** : Synchronisation avec systèmes de réservation existants

---

**Dernière mise à jour** : Mars 2026
**Version** : 2.0
**Auteur** : CatapulZ AI (catapulzai.eu)