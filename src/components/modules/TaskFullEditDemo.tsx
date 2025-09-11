// TaskFullEditDemo.tsx - Page de démonstration pour tester le nouveau module
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TaskFullEditView } from '@/components/modules/TaskFullEditView';
import { TaskItem } from '@/types/database';

// Données de test pour simuler une tâche
const DEMO_TASK: TaskItem = {
  id: 'demo-task-001',
  title: 'Pool Chemistry Imbalance',
  type: 'incident',
  priority: 'urgent',
  status: 'in_progress',
  description: 'Chlorine levels detected as too high during morning testing. Pool temporarily closed for safety. Need to rebalance chemicals.',
  assignedTo: 'Pierre Leroy',
  location: 'Espace Spa',
  roomNumber: undefined,
  guestName: undefined,
  recipient: undefined,
  dueDate: new Date().toISOString(),
  created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
  updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30min ago
};

export const TaskFullEditDemo = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [demoTask, setDemoTask] = useState<TaskItem>(DEMO_TASK);

  const handleSaveTask = (updatedTask: TaskItem) => {
    console.log('📝 Task saved:', updatedTask);
    setDemoTask(updatedTask);
    
    // Ici, en vrai, on ferait l'appel API vers Supabase
    // await updateTask(updatedTask.id, updatedTask);
    
    setIsOpen(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Info de démonstration */}
      <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
        <h1 className="text-2xl font-playfair font-bold text-blue-900 mb-2">
          🚀 Démonstration TaskFullEditView
        </h1>
        <p className="text-blue-700 mb-4">
          Nouveau module modulaire qui remplace le hardcoding de l'EditTaskModal pour les accès "Full Editable Card".
        </p>
        <div className="space-y-2 text-sm text-blue-600">
          <p><strong>✅ Fini le hardcoding :</strong> Tout est configuré dans taskEditConfig.ts</p>
          <p><strong>🎨 Modulaire :</strong> Chaque composant est réutilisable et paramétrable</p>
          <p><strong>🔧 Extensible :</strong> Facile d'ajouter de nouveaux champs, priorités, statuts</p>
          <p><strong>🎯 Intégration :</strong> Prêt à remplacer EditTaskModal dans ShiftCloseModal</p>
        </div>
      </div>

      {/* Aperçu de la tâche actuelle */}
      <div className="mb-6 p-4 bg-white rounded-lg border shadow-sm">
        <h3 className="font-medium mb-2">Tâche de démonstration actuelle :</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><strong>Titre:</strong> {demoTask.title}</div>
          <div><strong>Priorité:</strong> 
            <span className={demoTask.priority === 'urgent' ? 'text-red-600' : 'text-gray-600'}>
              {demoTask.priority === 'urgent' ? ' 🔥 Urgence' : ` ${demoTask.priority}`}
            </span>
          </div>
          <div><strong>Statut:</strong> {demoTask.status}</div>
          <div><strong>Assigné à:</strong> {demoTask.assignedTo}</div>
          <div><strong>Localisation:</strong> {demoTask.location}</div>
          <div><strong>Type:</strong> {demoTask.type}</div>
        </div>
        {demoTask.description && (
          <div className="mt-2">
            <strong>Description:</strong>
            <p className="text-gray-600 text-sm mt-1">{demoTask.description}</p>
          </div>
        )}
      </div>

      {/* Bouton pour ouvrir le TaskFullEditView */}
      <div className="text-center">
        <Button 
          onClick={() => setIsOpen(true)}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
        >
          🎨 Ouvrir TaskFullEditView
        </Button>
        <p className="text-sm text-gray-500 mt-2">
          Cliquez pour tester la nouvelle interface modulaire
        </p>
      </div>

      {/* Informations techniques */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border">
        <h4 className="font-medium mb-2">🔧 Informations techniques :</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Configuration dans <code>/src/config/taskEditConfig.ts</code></li>
          <li>• Module principal <code>/src/components/modules/TaskFullEditView.tsx</code></li>
          <li>• Utilise les mêmes modals existants (ReminderModal, MembersModal, etc.)</li>
          <li>• Compatible avec les types TaskItem existants</li>
          <li>• Prêt pour intégration dans ShiftCloseModal</li>
        </ul>
      </div>

      {/* Modifications futures possibles */}
      <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
        <h4 className="font-medium mb-2 text-green-800">🔄 Facilité de modifications :</h4>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• Ajouter une priorité : modifier PRIORITY_OPTIONS dans taskEditConfig.ts</li>
          <li>• Nouveau statut : ajouter dans STATUS_OPTIONS</li>
          <li>• Champ supplémentaire : ajouter dans EDITABLE_FIELDS</li>
          <li>• Changer les couleurs : modifier TASK_EDIT_THEME</li>
          <li>• Nouveaux messages : modifier MESSAGES</li>
        </ul>
      </div>

      {/* Le TaskFullEditView */}
      <TaskFullEditView
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        task={demoTask}
        onSave={handleSaveTask}
      />
    </div>
  );
};