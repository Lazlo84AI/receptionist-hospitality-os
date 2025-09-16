// Analyse complète des cartes existantes
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeExistingCards() {
  console.log('🔍 ANALYSE COMPLÈTE DES CARTES EXISTANTES');
  console.log('==========================================\n');

  try {
    // ÉTAPE 1 : Compter les cartes
    console.log('📊 ÉTAPE 1 : COMPTAGE DES CARTES');
    console.log('=================================');
    
    const { count: totalCards, error: countError } = await supabase
      .from('task')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    console.log(`Total de cartes existantes : ${totalCards || 0}`);

    // Compter par catégorie
    const { data: categoryCount, error: catError } = await supabase
      .from('task')
      .select('category')
      .then(({ data, error }) => {
        if (error) throw error;
        const counts = {};
        data?.forEach(item => {
          counts[item.category] = (counts[item.category] || 0) + 1;
        });
        return { data: counts, error: null };
      });

    if (!catError) {
      console.log('Répartition par catégorie :');
      Object.entries(categoryCount.data).forEach(([category, count]) => {
        console.log(`  - ${category}: ${count} cartes`);
      });
    }

    // ÉTAPE 2 : Analyser la structure
    console.log('\n📊 ÉTAPE 2 : STRUCTURE DES CARTES');
    console.log('==================================');
    
    const { data: sampleCards, error: structError } = await supabase
      .from('task')
      .select('*')
      .limit(5);

    if (structError) throw structError;

    if (sampleCards && sampleCards.length > 0) {
      console.log(`Analysant ${sampleCards.length} cartes exemples...\n`);
      
      // Analyser la première carte en détail
      const firstCard = sampleCards[0];
      console.log('STRUCTURE DÉTAILLÉE (première carte) :');
      console.log('======================================');
      
      Object.entries(firstCard).forEach(([key, value]) => {
        const type = Array.isArray(value) ? 'array' : typeof value;
        const displayValue = Array.isArray(value) ? `[${value.length} éléments]` : 
                           typeof value === 'string' && value.length > 50 ? `"${value.substring(0, 50)}..."` :
                           JSON.stringify(value);
        console.log(`${key.padEnd(15)} : ${type.padEnd(8)} = ${displayValue}`);
      });

      // Analyser assigned_to spécifiquement
      console.log('\n🎯 FOCUS SUR assigned_to :');
      console.log('===========================');
      sampleCards.forEach((card, index) => {
        const assignedTo = card.assigned_to;
        const type = Array.isArray(assignedTo) ? 'array' : typeof assignedTo;
        console.log(`Carte ${index + 1}: ${type} = ${JSON.stringify(assignedTo)}`);
      });
    }

    // ÉTAPE 3 : Valeurs ENUM utilisées
    console.log('\n📊 ÉTAPE 3 : VALEURS ENUM UTILISÉES');
    console.log('===================================');
    
    const { data: allCards, error: enumError } = await supabase
      .from('task')
      .select('category, priority, service, origin_type, status');

    if (enumError) throw enumError;

    if (allCards) {
      const enumAnalysis = {
        category: [...new Set(allCards.map(c => c.category).filter(Boolean))],
        priority: [...new Set(allCards.map(c => c.priority).filter(Boolean))],
        service: [...new Set(allCards.map(c => c.service).filter(Boolean))],
        origin_type: [...new Set(allCards.map(c => c.origin_type).filter(Boolean))],
        status: [...new Set(allCards.map(c => c.status).filter(Boolean))]
      };

      Object.entries(enumAnalysis).forEach(([field, values]) => {
        console.log(`${field.padEnd(12)} : [${values.join(', ')}]`);
      });
    }

    // ÉTAPE 4 : Modèle recommandé
    console.log('\n🎯 MODÈLE RECOMMANDÉ POUR CRÉATION');
    console.log('==================================');
    
    if (sampleCards && sampleCards.length > 0) {
      const model = sampleCards[0];
      console.log('Basé sur la structure existante :');
      console.log('\nconst insertData = {');
      console.log(`  title: "Votre titre",`);
      console.log(`  description: "Votre description",`);
      console.log(`  category: "${model.category}",          // ENUM`);
      console.log(`  priority: "${model.priority}",          // ENUM`);
      console.log(`  service: "${model.service}",            // ENUM`);
      console.log(`  origin_type: "${model.origin_type}",    // ENUM`);
      
      const assignedType = Array.isArray(model.assigned_to) ? 'ARRAY' : 'STRING';
      console.log(`  assigned_to: ${JSON.stringify(model.assigned_to)}, // ${assignedType}`);
      
      console.log(`  location: "${model.location || '101'}",`);
      console.log(`  status: "${model.status}",`);
      console.log(`  created_by: user.id,`);
      
      if (model.hasOwnProperty('updated_by')) {
        console.log(`  updated_by: user.id,                  // ${model.updated_by ? 'OBLIGATOIRE' : 'OPTIONNEL'}`);
      }
      console.log('};');
    }

  } catch (error) {
    console.error('❌ ERREUR ANALYSE :', error.message);
    console.error('Détails :', error);
  }
}

analyzeExistingCards();
