// VERSION AMÉLIORÉE DE handleShiftStarted avec logs détaillés pour debugging
// À remplacer dans ShiftManagement.tsx

const handleShiftStarted = async () => {
  try {
    console.log('🚀 Starting shift...');
    
    // ÉTAPE 1: Vérification utilisateur et service
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ User not authenticated');
      throw new Error('User not authenticated');
    }
    console.log(`👤 User authenticated: ${user.id}`);
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('service, first_name, last_name')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Error fetching profile:', profileError);
      throw new Error(`Profile error: ${profileError.message}`);
    }
    
    if (!profile) {
      console.error('❌ Profile not found');
      throw new Error('Profile not found');
    }
    
    if (!profile.service) {
      console.error('❌ User service not defined in profile');
      throw new Error('User service not found - please contact admin to set your service');
    }
    
    const userService = profile.service;
    console.log(`👤 User service: ${userService} (${profile.first_name} ${profile.last_name})`);
    
    // ÉTAPE 2: Création du shift en base
    console.log('📝 Creating shift in database...');
    const shiftResult = await startShift();
    
    if (!shiftResult.success || !shiftResult.shift_id) {
      console.error('❌ Failed to create shift:', shiftResult);
      throw new Error(`Failed to create shift: ${shiftResult.error || 'Unknown error'}`);
    }
    
    const newShiftId = shiftResult.shift_id;
    console.log(`✅ Shift created: ${newShiftId}`);
    
    // ÉTAPE 3: Récupération des cartes à transférer
    console.log(`🔍 Getting handover for service: ${userService}...`);
    const handoverResult = await getShiftHandover(userService);
    
    if (!handoverResult) {
      console.warn('⚠️ No handover result returned');
      throw new Error('Failed to get shift handover');
    }
    
    const { tasks: transferredTasks, stats, voiceNote, notes } = handoverResult;
    console.log(`📦 Handover stats:`, stats);
    console.log(`📦 ${transferredTasks.length} tasks to transfer:`, transferredTasks.map(t => ({ id: t.id, title: t.title, status: t.status })));
    
    if (voiceNote?.url) {
      console.log(`🎵 Voice note available: ${voiceNote.url}`);
    }
    if (notes) {
      console.log(`📝 Notes available: ${notes.substring(0, 100)}...`);
    }
    
    // ÉTAPE 4: Liaison des cartes au nouveau shift
    if (transferredTasks.length > 0) {
      console.log(`🔗 Linking ${transferredTasks.length} tasks to shift ${newShiftId}...`);
      const taskIds = transferredTasks.map(t => t.id);
      console.log(`📋 Task IDs to link:`, taskIds);
      
      await linkTasksToShift(taskIds, newShiftId);
      console.log(`✅ ${taskIds.length} tasks linked to shift ${newShiftId}`);
    } else {
      console.log(`ℹ️ No tasks to link to shift ${newShiftId}`);
    }
    
    // ÉTAPE 5: Webhook (optionnel - ne pas faire échouer le shift si ça rate)
    try {
      console.log('📡 Sending webhook event...');
      const { sendShiftStartedEvent } = await import('@/lib/webhookService');
      const webhookResult = await sendShiftStartedEvent({
        shift_id: newShiftId,
        timestamp: new Date().toISOString(),
        status: 'active',
        tasks_count: transferredTasks.length,
      });
      
      if (!webhookResult.success) {
        console.warn('⚠️ Webhook failed but shift was created:', webhookResult.error);
      } else {
        console.log('✅ Webhook sent successfully');
      }
    } catch (webhookError) {
      console.warn('⚠️ Webhook error (shift still created):', webhookError);
    }
    
    // ÉTAPE 6: Mise à jour de l'interface
    console.log('🔄 Updating UI state...');
    setShiftStatus('active');
    setIsShiftStartOpen(false);
    
    // ÉTAPE 7: Rechargement des données
    console.log('🔄 Reloading tasks...');
    await refetch();
    
    // ÉTAPE 8: Message de succès
    const successMessage = transferredTasks.length > 0 
      ? `${transferredTasks.length} tasks transferred from previous shift`
      : 'No tasks to transfer - starting fresh shift';
      
    toast({
      title: "Shift Started Successfully",
      description: successMessage,
      variant: "default",
    });
    
    console.log('✅ Shift start complete!');
    console.log(`📊 Final summary: Shift ${newShiftId} created, ${transferredTasks.length} tasks transferred`);
    
  } catch (error) {
    console.error('❌ Error starting shift:', error);
    
    // Message d'erreur détaillé pour l'utilisateur
    let errorMessage = "Failed to start shift. Please try again.";
    if (error instanceof Error) {
      if (error.message.includes('service not found')) {
        errorMessage = "Your user profile is missing a service assignment. Please contact support.";
      } else if (error.message.includes('not authenticated')) {
        errorMessage = "Please log in again and try starting your shift.";
      } else {
        errorMessage = error.message;
      }
    }
    
    toast({
      title: "Error Starting Shift",
      description: errorMessage,
      variant: "destructive",
    });
  }
};