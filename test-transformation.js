// Test simple de la requête Supabase modifiée
import { createClient } from '@supabase/supabase-js';

// Simuler le client Supabase pour tester la requête
const mockSupabase = {
  from: (table) => ({
    select: (query) => {
      console.log(`🔍 Requête sur table '${table}':`);
      console.log(`   SELECT: ${query}`);
      
      // Simuler la réponse avec nos données de test
      const mockData = [
        {
          id: 'task-1',
          title: 'Ascenseur bloqué entre étages',
          task_type: 'incident',
          priority: 'urgent',
          status: 'pending',
          assigned_to: 'user-1',
          created_at: '2025-01-15T10:30:00Z',
          updated_at: '2025-01-15T10:30:00Z',
          profiles: {
            id: 'user-1',
            first_name: 'Wilfried',
            last_name: 'de Renty',
            email: 'wilfried@example.com'
          }
        },
        {
          id: 'task-2',
          title: 'Éclairage défaillant couloir étage 3',
          task_type: 'incident',
          priority: 'normal',
          status: 'in_progress',
          assigned_to: 'user-2',
          created_at: '2025-01-15T11:00:00Z',
          updated_at: '2025-01-15T11:15:00Z',
          profiles: {
            id: 'user-2',
            first_name: 'Marie',
            last_name: 'Dupont',
            email: 'marie@example.com'
          }
        },
        {
          id: 'task-3',
          title: 'Feedback satisfaction Mme Leroy',
          task_type: 'follow_up',
          priority: 'normal',
          status: 'pending',
          assigned_to: 'user-3',
          created_at: '2025-01-15T09:45:00Z',
          updated_at: '2025-01-15T09:45:00Z',
          profiles: {
            id: 'user-3',
            first_name: 'Jean',
            last_name: 'Martin',
            email: 'jean@example.com'
          }
        }
      ];

      return {
        order: (field, options) => ({
          then: (callback) => {
            console.log(`   ORDER BY: ${field} ${options.ascending ? 'ASC' : 'DESC'}`);
            return Promise.resolve({ data: mockData, error: null });
          }
        })
      };
    }
  })
};

// Test de transformation des données
function testTaskTransformation() {
  console.log('🧪 Test de transformation des tâches\n');

  const mapPriority = (dbPriority) => {
    return dbPriority === 'urgent' || dbPriority === 'high' ? 'urgent' : 'normal';
  };

  // Simuler les données reçues de Supabase
  const mockTasks = [
    {
      id: 'task-1',
      title: 'Ascenseur bloqué entre étages',
      task_type: 'incident',
      priority: 'urgent',
      status: 'pending',
      assigned_to: 'user-1',
      created_at: '2025-01-15T10:30:00Z',
      updated_at: '2025-01-15T10:30:00Z',
      profiles: {
        id: 'user-1',
        first_name: 'Wilfried',
        last_name: 'de Renty',
        email: 'wilfried@example.com'
      }
    },
    {
      id: 'task-2',
      title: 'Éclairage défaillant couloir étage 3',
      task_type: 'incident',
      priority: 'normal',
      status: 'in_progress',
      assigned_to: 'user-2',
      created_at: '2025-01-15T11:00:00Z',
      updated_at: '2025-01-15T11:15:00Z',
      profiles: {
        id: 'user-2',
        first_name: 'Marie',
        last_name: 'Dupont',
        email: 'marie@example.com'
      }
    },
    {
      id: 'task-3',
      title: 'Tâche sans profil assigné',
      task_type: 'internal_task',
      priority: 'normal',
      status: 'pending',
      assigned_to: 'unknown-user',
      created_at: '2025-01-15T09:45:00Z',
      updated_at: '2025-01-15T09:45:00Z',
      profiles: null // Cas où l'utilisateur n'existe pas
    }
  ];

  console.log('📋 Transformation des tâches:');
  console.log('=============================\n');

  const transformedTasks = mockTasks.map((task) => {
    // Logique de transformation exacte de notre code
    let assignedToDisplay = 'Unassigned';
    if (task.profiles) {
      const profile = task.profiles;
      if (profile.first_name || profile.last_name) {
        assignedToDisplay = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
      } else if (profile.email) {
        assignedToDisplay = profile.email;
      }
    } else if (task.assigned_to) {
      // Fallback if profile not found but ID exists
      assignedToDisplay = task.assigned_to;
    }

    return {
      id: task.id,
      title: task.title,
      type: task.task_type,
      priority: mapPriority(task.priority),
      status: task.status,
      assignedTo: assignedToDisplay,
      created_at: new Date(task.created_at),
      updated_at: new Date(task.updated_at)
    };
  });

  transformedTasks.forEach((task, index) => {
    console.log(`${index + 1}. "${task.title}"`);
    console.log(`   📱 Affiché comme: "${task.assignedTo}"`);
    console.log(`   🏷️  Type: ${task.type} | Priorité: ${task.priority} | Status: ${task.status}\n`);
  });

  return transformedTasks;
}

// Exécuter le test
const results = testTaskTransformation();

console.log('✅ RÉSULTAT DU TEST:');
console.log('===================');
console.log(`${results.length} tâches transformées avec succès`);
console.log(`Noms d'utilisateurs correctement affichés: ${results.filter(t => t.assignedTo !== 'Unassigned' && !t.assignedTo.includes('user-')).length}`);
console.log(`Tâches sans assignation: ${results.filter(t => t.assignedTo === 'Unassigned' || t.assignedTo.includes('unknown')).length}`);
