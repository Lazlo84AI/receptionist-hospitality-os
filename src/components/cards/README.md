# ShiftFacingCard Component

## Description

Le composant `ShiftFacingCard` est un module réutilisable conçu pour afficher les tâches dans les modals de début et fin de shift. Il respecte le design spécifique demandé avec :

- **Picto en haut à gauche** : Icône du type de tâche
- **Priorité en haut à droite** : Badge "Urgent" si applicable
- **Titre** : Titre de la tâche
- **Description** : Résumé tronqué à 2 lignes avec ellipsis
- **Statut en bas à gauche** : Badge de statut coloré
- **Location et assigné en bas** : Informations de localisation et assignation

## Données Supabase

**Toutes les données proviennent de Supabase** via les props `TaskItem` :

```typescript
interface TaskItem {
  id: string;
  title: string;
  type: 'incident' | 'client_request' | 'follow_up' | 'internal_task' | 'personal_task';
  priority: 'normal' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed';
  description?: string;
  assignedTo?: string;
  location?: string;
  guestName?: string;
  roomNumber?: string;
  created_at: Date;
  updated_at: Date;
}
```

## Utilisation

```tsx
import { ShiftFacingCard } from '@/components/cards';

// Dans un composant
<ShiftFacingCard 
  task={taskFromSupabase}
  onClick={() => handleCardClick(task)}
  className="hover:border-yellow-400"
/>
```

## Intégration actuelle

Le composant est maintenant utilisé dans :

- ✅ `ShiftCloseModal` - Pour la revue des tâches en fin de shift
- ✅ `ShiftStartModal` - Pour la revue des tâches en début de shift

## Avantages

1. **DRY (Don't Repeat Yourself)** : Un seul composant pour tous les shifts
2. **Consistance** : Design uniforme dans toute l'application
3. **Maintenance** : Modifications centralisées
4. **Données dynamiques** : 100% connecté à Supabase, zéro hardcodage
5. **Réutilisable** : Peut être utilisé dans d'autres contextes

## Design Pattern

Le composant suit le pattern de composition :
- Accepte des props `TaskItem` de Supabase
- Gère l'affichage conditionnel (priorité, guest name, etc.)
- Respecte le design system avec les couleurs et badges cohérents
- Optimise l'espace (ellipsis pour la description longue)
