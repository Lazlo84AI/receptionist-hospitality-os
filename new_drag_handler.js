// Nouvelle approche pour handleDragEnd basée sur les index plutôt que les timestamps

const handleDragEnd = async (event) => {
  const { active, over } = event;
  setDraggedTask(null);
  setDraggedFromColumn(null);
  
  if (!over) return;

  const activeId = active.id;
  const overId = over.id;
  
  const activeTask = tasks.find(t => t.id === activeId);
  if (!activeTask) return;

  let newStatus;
  let targetPosition = -1;

  // Determine the target status and position
  if (overId.startsWith('column-')) {
    // Dropped on column header/empty area - put at end
    newStatus = overId.replace('column-', '');
    const columnTasks = tasks.filter(t => t.status === newStatus);
    targetPosition = columnTasks.length;
  } else {
    // Dropped on/near another task
    const overTask = tasks.find(t => t.id === overId);
    if (overTask) {
      newStatus = overTask.status;
      const columnTasks = tasks
        .filter(t => t.status === newStatus)
        .sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
      targetPosition = columnTasks.findIndex(t => t.id === overId);
    } else {
      return;
    }
  }

  // If no status change and same position, do nothing
  if (activeTask.status === newStatus) {
    const activeColumnTasks = tasks.filter(t => t.status === activeTask.status);
    const currentPosition = activeColumnTasks.findIndex(t => t.id === activeId);
    if (targetPosition === currentPosition) {
      return;
    }
  }

  try {
    // Get all tasks in the target column (excluding the dragged task if same column)
    const columnTasks = tasks
      .filter(t => t.status === newStatus && t.id !== activeId)
      .sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
    
    // Create array with the dragged task inserted at target position
    const newTaskArray = [...columnTasks];
    newTaskArray.splice(targetPosition, 0, activeTask);
    
    // Calculate new timestamps based on positions (espacés d'1 seconde)
    const baseTime = Date.now();
    const updates = newTaskArray.map((task, index) => ({
      id: task.id,
      newTimestamp: new Date(baseTime + (index * 1000)).toISOString()
    }));
    
    // If status changed, update the dragged task's status first
    if (activeTask.status !== newStatus) {
      const statusUpdate = await supabase
        .from('internal_tasks')
        .update({ status: newStatus })
        .eq('id', activeId);
      
      if (statusUpdate.error) throw statusUpdate.error;
    }
    
    // Update positions for all tasks in the column
    for (const update of updates) {
      const positionUpdate = await supabase
        .from('internal_tasks')
        .update({ updated_at: update.newTimestamp })
        .eq('id', update.id);
      
      if (positionUpdate.error) throw positionUpdate.error;
    }

    // Refresh data
    await refetch();

    // Send webhook in background
    sendTaskMovedEvent(activeId, activeTask.status, newStatus, activeTask).then(result => {
      if (!result.success) {
        console.warn('Webhook failed but task was updated successfully:', result.error);
      }
    }).catch(error => {
      console.warn('Webhook error (task was still updated):', error);
    });
    
    toast({
      title: "Success",
      description: `Task moved to ${newStatus.replace('_', ' ')} at position ${targetPosition + 1}`,
      variant: "default",
    });
    
  } catch (error) {
    console.error('Error updating task:', error);
    refetch();
    toast({
      title: "Error",
      description: "Failed to move task. Please try again.",
      variant: "destructive",
    });
  }
};

// EXPLICATION DE LA NOUVELLE APPROCHE :

// 1. Calcul de position plus simple
//    - Si drop sur colonne vide : position = fin de liste
//    - Si drop sur carte : position = index de cette carte

// 2. Reconstruction de l'ordre complet
//    - Récupère toutes les cartes de la colonne cible (sauf celle déplacée)
//    - Insère la carte déplacée à la position voulue avec splice()
//    - Résultat : tableau dans le bon ordre

// 3. Timestamps basés sur l'index
//    - baseTime = maintenant
//    - Carte 0 : baseTime + 0ms
//    - Carte 1 : baseTime + 1000ms  
//    - Carte 2 : baseTime + 2000ms
//    - etc.

// 4. Mise à jour en batch
//    - D'abord le statut si changement de colonne
//    - Puis les positions de toutes les cartes affectées

// Cette approche évite les calculs complexes de timestamps "entre" les cartes
// et garantit un ordre cohérent basé sur les positions d'index.