# Guide d'intégration TaskFullEditView

## 🎯 Objectif
Remplacer l'utilisation d'EditTaskModal par TaskFullEditView dans les 2 accès identifiés.

## 📍 Accès n°1 : ShiftCloseModal

### Fichier à modifier : `/src/components/modals/ShiftCloseModal.tsx`

### Étapes :

1. **Import du nouveau module :**
```typescript
// Remplacer :
import { EditTaskModal } from './EditTaskModal';

// Par :
import { TaskFullEditView } from '@/components/modules/TaskFullEditView';
```

2. **Utilisation dans le JSX :**
```typescript
// Chercher cette section (vers la fin du fichier) :
<EditTaskModal
  isOpen={isEditModalOpen}
  onClose={() => {
    setIsEditModalOpen(false);
    setEditingTask(null);
  }}
  task={editingTask}
  onSave={handleSaveTask}
/>

// Remplacer par :
<TaskFullEditView
  isOpen={isEditModalOpen}
  onClose={() => {
    setIsEditModalOpen(false);
    setEditingTask(null);
  }}
  task={editingTask}
  onSave={handleSaveTask}
/>
```

3. **C'est tout !** L'interface reste identique pour l'utilisateur.

## 📍 Accès n°2 : Bouton à créer

### À déterminer ensemble :
- Quel composant/page
- Où placer le bouton
- Quelle tâche éditer

### Code type :
```typescript
import { TaskFullEditView } from '@/components/modules/TaskFullEditView';

const [isFullEditOpen, setIsFullEditOpen] = useState(false);
const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

// Bouton pour ouvrir
<Button onClick={() => {
  setSelectedTask(task);
  setIsFullEditOpen(true);
}}>
  Edit Full Card
</Button>

// Modal
<TaskFullEditView
  isOpen={isFullEditOpen}
  onClose={() => setIsFullEditOpen(false)}
  task={selectedTask}
  onSave={handleTaskSave}
/>
```

## ⚠️ Points d'attention

### 1. **Ne pas casser l'existant :**
- EditTaskModal reste utilisé ailleurs
- Seuls les 2 accès spécifiques utilisent TaskFullEditView

### 2. **Vérifications avant intégration :**
- [ ] TaskFullEditView fonctionne en démo
- [ ] Tous les champs sont éditables
- [ ] Task Enhancement buttons fonctionnent
- [ ] Sauvegarde OK

### 3. **Test après intégration :**
- [ ] End Shift → Edit Card fonctionne
- [ ] Interface identique à avant
- [ ] Pas de régression sur autres fonctionnalités

## 🔧 Configuration personnalisable

Si vous voulez modifier quelque chose, tout se fait dans `/src/config/taskEditConfig.ts` :

- **Ajouter une priorité :** ajouter dans `PRIORITY_OPTIONS`
- **Nouveau statut :** ajouter dans `STATUS_OPTIONS`  
- **Changer les couleurs :** modifier `TASK_EDIT_THEME`
- **Messages :** modifier `MESSAGES`

Aucune modification du code du composant nécessaire !