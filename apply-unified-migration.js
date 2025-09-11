// Script pour créer la vue unified_tasks et l'ENUM task_category
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ypxmzacmwqqvlciwahzw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlweG16YWNtd3FxdmxjaXdhaHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2ODgyODEsImV4cCI6MjA2OTI2NDI4MX0.8h2Pb7_pYjx_SNxdp4qLjt234u9wcKjBFxdqmQeB6wI";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function applyUnifiedTasksMigration() {
  console.log('🚀 Application de la migration unified_tasks...');
  
  try {
    // Étape 1: Créer l'ENUM task_category (si il n'existe pas déjà)
    console.log('📋 Étape 1: Vérification/Création de l\'ENUM task_category...');
    
    const createEnumSql = `
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_category') THEN
          CREATE TYPE public.task_category AS ENUM (
            'incident', 
            'client_request', 
            'follow_up', 
            'internal_task'
          );
          RAISE NOTICE 'ENUM task_category créé avec succès';
        ELSE
          RAISE NOTICE 'ENUM task_category existe déjà';
        END IF;
      END
      $$;
    `;

    const { error: enumError } = await supabase.rpc('exec_sql', { sql: createEnumSql });
    
    if (enumError) {
      console.warn('⚠️ Impossible de créer l\'ENUM via RPC, continuons...');
    } else {
      console.log('✅ ENUM task_category vérifié/créé');
    }

    // Étape 2: Créer la vue unified_tasks
    console.log('📋 Étape 2: Création de la vue unified_tasks...');
    
    const createViewSql = `
      CREATE OR REPLACE VIEW public.unified_tasks AS
      SELECT 
          id,
          title,
          'incident' as task_category,
          priority::text as priority,
          status::text as status,
          description,
          assigned_to,
          location,
          null as guest_name,
          null as room_number,
          null as recipient,
          null as due_date,
          null as arrival_date,
          created_at,
          updated_at
      FROM public.incidents

      UNION ALL

      SELECT 
          id,
          CONCAT(request_type, ' - ', guest_name) as title,
          'client_request' as task_category,
          priority::text as priority,
          preparation_status::text as status,
          request_details as description,
          assigned_to,
          null as location,
          guest_name,
          room_number,
          null as recipient,
          null as due_date,
          arrival_date,
          created_at,
          updated_at
      FROM public.client_requests

      UNION ALL

      SELECT 
          id,
          title,
          'follow_up' as task_category,
          priority::text as priority,
          status::text as status,
          notes as description,
          assigned_to,
          null as location,
          null as guest_name,
          null as room_number,
          recipient,
          due_date,
          null as arrival_date,
          created_at,
          updated_at
      FROM public.follow_ups

      UNION ALL

      SELECT 
          id,
          title,
          'internal_task' as task_category,
          priority::text as priority,
          status::text as status,
          description,
          assigned_to,
          location,
          null as guest_name,
          null as room_number,
          null as recipient,
          due_date,
          null as arrival_date,
          created_at,
          updated_at
      FROM public.internal_tasks;
    `;

    const { error: viewError } = await supabase.rpc('exec_sql', { sql: createViewSql });
    
    if (viewError) {
      console.error('❌ Erreur création vue:', viewError);
      
      // Fallback: essayer de créer la vue différemment
      console.log('🔄 Tentative alternative...');
      
      // On ne peut pas créer de vue avec l'API REST classique
      // Mais on peut au moins tester si les données sont cohérentes
      const testQuery = await supabase
        .from('incidents')
        .select('id, title, priority, status, description, assigned_to, location, created_at, updated_at')
        .limit(1);
        
      if (testQuery.error) {
        console.error('❌ Problème avec la table incidents:', testQuery.error);
      } else {
        console.log('✅ Structure des données vérifiée');
        console.log('⚠️ La vue unified_tasks doit être créée manuellement via SQL Editor');
        console.log('📋 Utilisez le code SQL ci-dessus dans le Dashboard Supabase');
      }
    } else {
      console.log('✅ Vue unified_tasks créée avec succès !');
    }

    // Étape 3: Test de la vue
    console.log('📋 Étape 3: Test de la vue unified_tasks...');
    
    const { data, error } = await supabase
      .from('unified_tasks')
      .select('*')
      .limit(5);
      
    if (error) {
      console.error('❌ Test vue échoué:', error.message);
      console.log('💡 Vous devez créer la vue manuellement dans Supabase SQL Editor');
    } else {
      console.log('🎉 Vue unified_tasks fonctionne !');
      console.log(`📊 ${data.length} tâches trouvées`);
      
      if (data.length > 0) {
        console.log('📋 Exemple de données:');
        console.log(JSON.stringify(data[0], null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Fonction helper que Supabase pourrait ne pas avoir
async function checkRpcFunction() {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });
    return !error;
  } catch {
    return false;
  }
}

async function main() {
  const hasRpc = await checkRpcFunction();
  
  if (!hasRpc) {
    console.log('⚠️ RPC exec_sql non disponible');
    console.log('📋 INSTRUCTIONS MANUELLES:');
    console.log('1. Ouvrez Supabase Dashboard > SQL Editor');
    console.log('2. Copiez-collez le contenu du fichier:');
    console.log('   supabase/migrations/20250826000001_fix_task_categories.sql');
    console.log('3. Exécutez le SQL');
    console.log('4. Relancez ce script pour vérifier');
    return;
  }
  
  await applyUnifiedTasksMigration();
}

main();
