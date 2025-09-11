/**
 * Formate le temps écoulé depuis la création d'une tâche
 * Règles d'affichage :
 * - < 24h : "15h 30min" ou "3h 45min"
 * - ≥ 24h : "2 jours 5h" ou "5 jours 12h"
 */
export const formatTimeElapsed = (createdAt: Date | string): string => {
  const now = new Date();
  const created = new Date(createdAt);
  
  // Calculer la différence en millisecondes
  const diffMs = now.getTime() - created.getTime();
  
  // Convertir en minutes, heures et jours
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  // Calculs pour l'affichage
  const remainingHours = diffHours % 24;
  const remainingMinutes = diffMinutes % 60;
  
  if (diffHours < 24) {
    // Moins de 24h : "Xh Ymin"
    if (diffHours === 0) {
      // Moins d'une heure : "30min"
      return `${remainingMinutes}min`;
    } else if (remainingMinutes === 0) {
      // Heures rondes : "15h"
      return `${diffHours}h`;
    } else {
      // Avec minutes : "15h 30min"
      return `${diffHours}h ${remainingMinutes}min`;
    }
  } else {
    // 24h ou plus : "Xj Yh"
    if (remainingHours === 0) {
      // Jours ronds : "2 jours"
      return diffDays === 1 ? `1 jour` : `${diffDays} jours`;
    } else {
      // Avec heures : "2 jours 5h"
      const jourText = diffDays === 1 ? '1 jour' : `${diffDays} jours`;
      return `${jourText} ${remainingHours}h`;
    }
  }
};

/**
 * Détermine la couleur d'affichage selon le temps écoulé
 * - Rouge : Plus d'un jour
 * - Orange : Plus de 12 heures
 * - Gris : Par défaut
 */
export const getTimeElapsedColor = (timeElapsed: string): string => {
  // Rouge si contient 'jour'
  if (timeElapsed.includes('jour')) {
    return 'text-red-600';
  }
  
  // Orange si plus de 12 heures (extraire le nombre d'heures)
  const hoursMatch = timeElapsed.match(/(\d+)h/);
  if (hoursMatch) {
    const hours = parseInt(hoursMatch[1]);
    if (hours >= 12) {
      return 'text-orange-600';
    }
  }
  
  // Gris par défaut
  return 'text-gray-600';
};