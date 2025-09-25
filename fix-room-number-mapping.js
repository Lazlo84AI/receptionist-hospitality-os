// CORRECTION DU BUG room_number DANS TaskCreationModal.tsx
// À remplacer dans handleCreateCard vers la ligne ~190

// ❌ CODE ACTUEL PROBLÉMATIQUE:
/*
...(formData.category === 'client_request' && {
  guest_name: formData.guestName || null,
  room_number: formData.roomNumber || formData.location || null  // ❌ COLONNE INEXISTANTE
}),
...(formData.category === 'follow_up' && {
  recipient: formData.recipient || formData.assignedMember || null  // ❌ COLONNE INEXISTANTE
}),
*/

// ✅ CODE CORRIGÉ:
...(formData.category === 'client_request' && {
  guest_name: formData.guestName || null,
  // room_number supprimé car on utilise déjà location plus haut
}),

// Pour follow_up, 3 options selon votre choix:

// OPTION 1: Si recipient = collègue responsable (utiliser assigned_to)
// ...(formData.category === 'follow_up' && {
//   // recipient géré via assigned_to, rien à ajouter
// }),

// OPTION 2: Si recipient = personne externe à recontacter (NÉCESSITE COLONNE)
// ...(formData.category === 'follow_up' && {
//   recipient: formData.recipient || formData.assignedMember || null,
// }),

// OPTION 3: Si recipient pas nécessaire
// Supprimer complètement cette section

// ========================================
// VERSION FINALE SIMPLIFIÉE RECOMMANDÉE:
// ========================================

const taskData = {
  title: formData.title,
  description: formData.description || null,
  category: formData.category,
  priority: formData.priority || 'normal',
  service: formData.service || 'reception',
  origin_type: formData.originType || 'team',
  assigned_to: assignedMemberId ? [assignedMemberId] : null,
  location: formData.roomNumber || formData.location || null,  // ✅ ROOM NUMBER VA DANS LOCATION
  status: 'pending',
  created_by: user.id,
  updated_by: user.id,
  
  // ✅ CHAMPS SPÉCIFIQUES CORRIGÉS
  ...(formData.category === 'client_request' && {
    guest_name: formData.guestName || null,
    // Plus de room_number - c'est déjà dans location
  }),
  
  // Ajouter les checklists si présentes
  checklist_items: checklists.length > 0 ? checklists : null
};
