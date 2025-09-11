/**
 * Configuration centralisée pour les styles de hover unifiés
 * Couleur principale: Yellow RAL Pantone 6004C HTML #DEAE35
 */

export const HOTEL_YELLOW = '#DEAE35';
export const HOTEL_NAVY = '#1E1A37';

export const UNIFIED_HOVER_STYLES = {
  // Couleurs principales
  colors: {
    yellow: HOTEL_YELLOW,
    navy: HOTEL_NAVY,
    yellowRgba: 'rgba(222, 174, 53, 0.1)',
    yellowRgbaLight: 'rgba(222, 174, 53, 0.05)',
    yellowRgbaShadow: 'rgba(222, 174, 53, 0.2)',
  },

  // Classes CSS pour les différents types d'éléments
  classes: {
    // Hover pour les cartes et conteneurs
    cardHover: 'hotel-hover',
    
    // Hover pour les boutons
    buttonHover: 'hotel-button-hover',
    
    // Hover pour le texte
    textHover: 'hotel-text-hover',
    
    // Hover pour les éléments avec accent (bordure + fond léger)
    accentHover: 'hotel-accent-hover',
    
    // Boutons de catégorie de cartes
    categoryButton: 'card-category-button',
    
    // Boutons de priorité
    priorityButton: 'priority-button',
  },

  // Styles inline pour les cas où les classes ne suffisent pas
  inline: {
    borderHover: {
      transition: 'all 0.3s ease',
      borderColor: HOTEL_YELLOW,
      boxShadow: `0 0 0 1px ${HOTEL_YELLOW}, 0 4px 12px rgba(222, 174, 53, 0.2)`,
    },
    
    backgroundHover: {
      transition: 'all 0.3s ease',
      backgroundColor: HOTEL_YELLOW,
      borderColor: HOTEL_YELLOW,
      color: HOTEL_NAVY,
    },
    
    accentHover: {
      transition: 'all 0.3s ease',
      backgroundColor: 'rgba(222, 174, 53, 0.1)',
      borderColor: HOTEL_YELLOW,
    },
  },

  // Variants pour différents composants
  variants: {
    // Pour les TabsTrigger
    tabsTrigger: {
      hover: 'hover:bg-hotel-yellow hover:text-hotel-navy',
      active: 'data-[state=active]:bg-hotel-yellow data-[state=active]:text-hotel-navy',
    },
    
    // Pour les Button variants
    button: {
      defaultHover: 'hover:bg-hotel-yellow/90',
      outlineHover: 'hover:bg-hotel-yellow hover:text-hotel-navy hover:border-hotel-yellow',
      ghostHover: 'hover:bg-hotel-yellow/10 hover:text-hotel-yellow',
      secondaryHover: 'hover:bg-hotel-yellow/80',
    },
    
    // Pour les éléments de formulaire
    form: {
      inputHover: 'hover:border-hotel-yellow focus:border-hotel-yellow focus:ring-hotel-yellow',
      selectHover: 'hover:border-hotel-yellow',
      textareaHover: 'hover:border-hotel-yellow focus:border-hotel-yellow focus:ring-hotel-yellow',
    },
  },
};

/**
 * Fonction utilitaire pour appliquer le hover unifié
 */
export const getUnifiedHover = (type: keyof typeof UNIFIED_HOVER_STYLES.classes) => {
  return UNIFIED_HOVER_STYLES.classes[type];
};

/**
 * Fonction pour générer des styles inline de hover
 */
export const getInlineHoverStyle = (type: keyof typeof UNIFIED_HOVER_STYLES.inline) => {
  return UNIFIED_HOVER_STYLES.inline[type];
};
