// Phase 3 : Adaptation Frontend - TaskCreationModal.tsx
// Modifications à apporter pour utiliser la table task unifiée

// 1. REMPLACER la fonction handleTestCreateCard (ligne ~200)
const handleTestCreateCard = async () => {
  console.log('🧪 DÉBUT TEST CRÉATION TÂCHE - TABLE TASK UNIFIÉE');
  
  try {
    // 1. RÉCUPÉRER USER ACTUEL
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw new Error(`Erreur user: ${userError.message}`);
    console.log('👤 User actuel:', user?.id);

    // 2. VÉRIFIER QUE LE USER EXISTE DANS PROFILES
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('id', user.id)
      .single();
      
    if (profileError || !userProfile) {
      throw new Error(`Profil utilisateur non trouvé. Veuillez vous reconnecter.`);
    }
    console.log('✅ Profil utilisateur trouvé:', userProfile);

    // 3. VÉRIFIER QUE NOUS AVONS DES MEMBRES
    if (!hotelMembers || hotelMembers.length === 0) {
      throw new Error('Aucun membre trouvé. Chargement en cours...');
    }

    // 4. DONNÉES DE TEST
    const firstMember = hotelMembers[0];
    
    const testData = {
      title: 'Test Task - ' + new Date().toISOString().slice(0,16).replace('T', ' '),
      category: 'incident',
      priority: 'normal',
      service: 'reception',
      assignedMember: firstMember.id, // Utiliser l'ID directement
      location: '101',
      description: 'Test automatique de création de tâche depuis le modal - TABLE TASK',
      originType: 'team'
    };
    console.log('📝 Données de test:', testData);
    console.log('👥 Premier membre:', firstMember);

    // 5. PRÉPARER DONNÉES D'INSERTION POUR TABLE TASK
    const insertData = {
      title: testData.title,
      description: testData.description,
      category: testData.category,           // ✅ Pas incident_type
      priority: testData.priority,
      origin_type: testData.originType,
      service: testData.service,             // ✅ Pas department
      assigned_to: [testData.assignedMember], // ✅ ARRAY au lieu de text
      created_by: user.id,
      location: testData.location,
      status: 'pending',
      checklist_items: checklists.length > 0 ? checklists : null,  // ✅ JSONB
      collaborators: testData.assignedMember ? 
        { members: [testData.assignedMember] } : null,             // ✅ JSONB
      validation_status: 'pending'
    };
    console.log('📊 Données finales pour insertion TABLE TASK:', insertData);

    // 6. INSERTION EN BASE TASK (pas incidents)
    const { data: result, error: insertError } = await supabase
      .from('task')                          // ✅ Table unifiée
      .insert([insertData])
      .select()
      .single();

    if (insertError) {
      console.error('Détails erreur insertion:', insertError);
      throw new Error(`Erreur insertion: ${insertError.message}`);
    }

    console.log('🎉 SUCCÈS! Tâche créée dans TABLE TASK:', result);
    toast({
      title: "Test réussi!",
      description: `Tâche créée avec l'ID: ${result.id}`,
    });
    
  } catch (error) {
    console.error('❌ ERREUR TEST:', error);
    toast({
      title: "Erreur de test",
      description: error.message,
      variant: "destructive",
    });
  }
};

// 2. REMPLACER la fonction handleCreateCard (ligne ~150) 
const handleCreateCard = async () => {
  try {
    console.log('🎯 CRÉATION TÂCHE RÉELLE - TABLE TASK');
    
    // Validation basique
    if (!formData.title.trim()) {
      toast({
        title: "Erreur",
        description: "Le titre est requis",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.category) {
      toast({
        title: "Erreur", 
        description: "La catégorie est requise",
        variant: "destructive",
      });
      return;
    }

    // Récupérer utilisateur actuel
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Utilisateur non connecté');
    }

    // Trouver le membre assigné
    const assignedMember = hotelMembers?.find(member => 
      member.full_name === formData.assignedMember || 
      `${member.first_name} ${member.last_name}` === formData.assignedMember
    );

    // Préparer les données pour table task
    const taskData = {
      title: formData.title.trim(),
      description: formData.description || null,
      category: formData.category,
      origin_type: formData.originType || null,
      service: formData.service || null,
      assigned_to: assignedMember ? [assignedMember.id] : null,
      created_by: user.id,
      location: formData.location || null,
      priority: formData.priority,
      status: 'pending',
      checklist_items: checklists.length > 0 ? checklists : null,
      collaborators: assignedMember ? 
        { members: [assignedMember.id] } : null,
      reminder_date: formData.dueDate || null,
      validation_status: 'pending'
    };

    console.log('📊 Création tâche avec données:', taskData);

    // Insertion dans table task
    const { data: result, error: insertError } = await supabase
      .from('task')
      .insert([taskData])
      .select()
      .single();

    if (insertError) {
      console.error('Erreur insertion:', insertError);
      throw new Error(`Erreur lors de la création: ${insertError.message}`);
    }

    console.log('✅ Tâche créée avec succès:', result);
    
    toast({
      title: "Tâche créée!",
      description: `"${formData.title}" a été créée avec succès`,
    });
    
    onClose();
    resetForm();
    
  } catch (error) {
    console.error('Erreur création tâche:', error);
    toast({
      title: "Erreur",
      description: error.message,
      variant: "destructive",
    });
  }
};

// 3. OPTIONNEL: Fonction utilitaire pour transformation complète
const transformFormDataToTask = (formData, checklists, reminders, attachments, user, assignedMember) => {
  return {
    title: formData.title.trim(),
    description: formData.description || null,
    category: formData.category,
    origin_type: formData.originType || null,
    service: formData.service || null,
    assigned_to: assignedMember ? [assignedMember.id] : null,
    created_by: user.id,
    location: formData.location || null,
    location_id: null, // À mapper plus tard si nécessaire
    priority: formData.priority,
    status: 'pending',
    checklist_items: checklists.length > 0 ? checklists : null,
    collaborators: assignedMember ? { members: [assignedMember.id] } : null,
    reminder_date: formData.dueDate || null,
    validation_status: 'pending',
    // Ajouter d'autres champs si nécessaire
    requires_validation: formData.category === 'incident',
    attachment_url: attachments.length > 0 ? attachments[0].url : null
  };
};
