// Vérifier les ENUM de la base
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkEnums() {
  console.log('🔍 Vérification des ENUM...\n');

  try {
    // Requête pour voir les types ENUM
    const { data, error } = await supabase.rpc('get_enum_values', { 
      enum_name: 'task_service' 
    }).catch(() => {
      // Si la fonction n'existe pas, on fait autrement
      return supabase
        .from('task')
        .select('service')
        .limit(10);
    });

    if (error) {
      console.log('Méthode alternative...');
      // Récupérer des exemples de valeurs
      const { data: samples } = await supabase
        .from('task')
        .select('service, category, priority, origin_type')
        .limit(10);
      
      console.log('📊 VALEURS ACTUELLES DANS LA TABLE:');
      console.log('===================================');
      
      if (samples) {
        const services = [...new Set(samples.map(s => s.service))];
        const categories = [...new Set(samples.map(s => s.category))];
        const priorities = [...new Set(samples.map(s => s.priority))];
        const origins = [...new Set(samples.map(s => s.origin_type))];
        
        console.log('Services utilisés:', services);
        console.log('Categories utilisées:', categories);
        console.log('Priorités utilisées:', priorities);
        console.log('Origins utilisés:', origins);
      }
    } else {
      console.log('ENUM values:', data);
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkEnums();
