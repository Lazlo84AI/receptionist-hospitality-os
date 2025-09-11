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
├── /components          # Composants réutilisables
│