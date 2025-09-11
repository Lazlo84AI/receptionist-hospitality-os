import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://ypxmzacmwqqvlciwahzw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlweG16YWNtd3FxdmxjaXdhaHp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMjM0OTE5NCwiZXhwIjoyMDM3OTI1MTk0fQ.3H6NPGK9JCVZo9Y92nk8zGzBqRtS2iuEQF5Y2zz0mY8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupHardcodedLocations() {
  try {
    console.log('🚀 Démarrage du nettoyage des locations hardcodées...');
    
    // ÉTAPE 1: Nettoyer les incidents
    console.log('📝 Nettoyage des incidents...');
    
    // Remplacer Presidential Suite / Espace Spa par chambre 50
    await supabase
      .from('incidents')
      .update({ location: '50' })
      .in('location', ['Espace Spa', 'Pool Area', 'Presidential Suite']);
    
    // Remplacer Spa Reception / Main Lobby par Accueil
    await supabase
      .from('incidents')
      .update({ location: 'Accueil' })
      .in('location', ['Spa Reception', 'Main Lobby', 'Reception']);
    
    // Remplacer Elevator par Ascenseur
    await supabase
      .from('incidents')
      .update({ location: 'Ascenseur' })
      .in('location', ['Elevator Maintenance Required', 'Main Elevator']);
    
    // Corriger les numéros de chambres
    await supabase
      .from('incidents')
      .update({ location: '35' })
      .in('location', ['Room 207', '207']);
    
    await supabase
      .from('incidents')
      .update({ location: '27' })
      .in('location', ['Room 305', '305']);
    
    console.log('✅ Incidents nettoyés');
    
    // ÉTAPE 2: Nettoyer les client_requests
    console.log('📝 Nettoyage des demandes clients...');
    
    await supabase
      .from('client_requests')
      .update({ room_number: '35' })
      .in('room_number', ['50', 'Presidential Suite', 'Room 305']);
    
    await supabase
      .from('client_requests')
      .update({ room_number: '27' })
      .in('room_number', ['Room 207', '207']);
    
    await supabase
      .from('client_requests')
      .update({ room_number: '30' })
      .in('room_number', ['Multiple Rooms', 'Various']);
    
    console.log('✅ Demandes clients nettoyées');
    
    // ÉTAPE 3: Nettoyer les internal_tasks
    console.log('📝 Nettoyage des tâches internes...');
    
    await supabase
      .from('internal_tasks')
      .update({ location: 'Cuisine' })
      .in('location', ['Restaurant Kitchen', 'Kitchen', 'HVAC Service Company']);
    
    await supabase
      .from('internal_tasks')
      .update({ location: 'Accueil' })
      .in('location', ['Main Lobby', 'Reception Area']);
    
    await supabase
      .from('internal_tasks')
      .update({ location: '50' })
      .in('location', ['Presidential Suite', 'Room 50']);
    
    console.log('✅ Tâches internes nettoyées');
    
    // ÉTAPE 4: Supprimer les anciennes tâches de démo et en créer de nouvelles
    console.log('📝 Remplacement des tâches de démo...');
    
    // Supprimer les anciennes
    await supabase
      .from('incidents')
      .delete()
      .or('title.like.%Pool Chemistry%,title.like.%Water Leak%');
    
    await supabase
      .from('client_requests')
      .delete()
      .or('guest_name.like.%Mrs. Catherine%,guest_name.like.%Mr. Robert%');
    
    // Créer de nouvelles tâches avec vraies locations
    const newIncidents = [
      {
        title: 'Problème climatisation chambre',
        description: 'Climatisation ne fonctionne pas correctement',
        incident_type: 'technical',
        priority: 'urgent',
        status: 'pending',
        location: '35',
        assigned_to: 'Pierre Leroy',
        created_at: new Date(Date.now() - 36 * 60 * 60 * 1000 - 17 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 36 * 60 * 60 * 1000 - 17 * 60 * 1000).toISOString()
      },
      {
        title: 'Fuite d\'eau salle de bain',
        description: 'Petite fuite détectée sous le lavabo',
        incident_type: 'maintenance',
        priority: 'normal',
        status: 'in_progress',
        location: '27',
        assigned_to: 'Jean Dupont',
        created_at: new Date(Date.now() - 36 * 60 * 60 * 1000 - 17 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 36 * 60 * 60 * 1000 - 17 * 60 * 1000).toISOString()
      },
      {
        title: 'Maintenance ascenseur requise',
        description: 'Contrôle technique périodique',
        incident_type: 'maintenance',
        priority: 'urgent',
        status: 'completed',
        location: 'Ascenseur',
        assigned_to: 'Thomas Anderson',
        created_at: new Date(Date.now() - 36 * 60 * 60 * 1000 - 17 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 36 * 60 * 60 * 1000 - 17 * 60 * 1000).toISOString()
      }
    ];
    
    await supabase.from('incidents').insert(newIncidents);
    
    const newClientRequests = [
      {
        guest_name: 'Mrs. Catherine Dubois',
        room_number: '35',
        request_type: 'special_occasion',
        request_details: 'Anniversaire de mariage - décoration chambre',
        preparation_status: 'in_progress',
        arrival_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'normal',
        assigned_to: 'Marie Dubois',
        created_at: new Date(Date.now() - 36 * 60 * 60 * 1000 - 17 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 36 * 60 * 60 * 1000 - 17 * 60 * 1000).toISOString()
      },
      {
        guest_name: 'Mr. Robert Anderson',
        room_number: '50',
        request_type: 'special_preparation',
        request_details: 'Suite présidentielle - arrivée VIP',
        preparation_status: 'completed',
        arrival_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        priority: 'urgent',
        assigned_to: 'Emma Wilson',
        created_at: new Date(Date.now() - 36 * 60 * 60 * 1000 - 17 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 36 * 60 * 60 * 1000 - 17 * 60 * 1000).toISOString()
      }
    ];
    
    await supabase.from('client_requests').insert(newClientRequests);
    
    console.log('✅ Nouvelles tâches créées avec vraies locations');
    
    // ÉTAPE 5: Vérification
    console.log('🔍 Vérification des données...');
    
    const { data: locations } = await supabase
      .from('locations')
      .select('name, type')
      .eq('is_active', true)
      .order('type, name');
    
    console.log(`✅ ${locations.length} locations valides disponibles`);
    
    const { data: incidents } = await supabase
      .from('incidents')
      .select('title, location')
      .limit(3);
    
    console.log('✅ Exemples d\'incidents avec vraies locations :');
    incidents.forEach(incident => {
      console.log(`   • ${incident.title} → ${incident.location}`);
    });
    
    const { data: requests } = await supabase
      .from('client_requests')
      .select('guest_name, room_number')
      .limit(3);
    
    console.log('✅ Exemples de demandes clients avec vraies chambres :');
    requests.forEach(request => {
      console.log(`   • ${request.guest_name} → Chambre ${request.room_number}`);
    });
    
    console.log('🎉 Nettoyage terminé ! Les cartes du dashboard utilisent maintenant les vraies locations de votre hôtel.');
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  }
}

// Exécuter le nettoyage
cleanupHardcodedLocations();
