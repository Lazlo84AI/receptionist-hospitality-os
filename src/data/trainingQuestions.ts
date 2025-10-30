// Questions d'évaluation formation petit-déjeuner
// Format optimisé pour le frontend React

export interface TrainingQuestion {
  id: string;
  context: string;
  question: string;
  answers: string[];
  correct_answer: string; // A, B, C, ou D
  explanation: string;
  cognitive_principle?: string;
}

export const trainingQuestions: TrainingQuestion[] = [
  {
    id: "1",
    context: "Pour gestion économique du petit-déjeuner, quels sont les objectifs à suivre ?",
    question: "Quel est l'objectif de la gestion économique du petit-déjeuner ?",
    answers: [
      "A. Coût plateau cible 6€",
      "B. Offrir des produits de luxe", 
      "C. Aucun objectif défini",
      "D. Maximiser les coûts de production"
    ],
    correct_answer: "A",
    explanation: "L'objectif de la gestion économique du petit-déjeuner est d'avoir un coût plateau cible de 6€.",
    cognitive_principle: "active recall"
  },
  {
    id: "2",
    context: "Pour la gestion de l'environnement du petit-déjeuner, quel élément est primordial ?",
    question: "Quel élément est primordial pour l'environnement du petit-déjeuner ?",
    answers: [
      "A. Confort et élégance de l'intérieur",
      "B. Présence de lumières vives",
      "C. Utilisation de couleurs vives", 
      "D. Utilisation d'éléments rustiques"
    ],
    correct_answer: "A",
    explanation: "L'élément primordial pour l'environnement du petit-déjeuner est le confort et l'élégance de l'intérieur.",
    cognitive_principle: "contextual memory"
  },
  {
    id: "3", 
    context: "Que doit proposer le petit déjeuner pour répondre aux attentes de 90% des clients étrangers ?",
    question: "Pourquoi le petit déjeuner doit-il proposer une offre salée généreuse et variée ?",
    answers: [
      "A. Pour répondre aux attentes de 90% des clients étrangers",
      "B. Pour suivre les tendances gastronomiques actuelles",
      "C. Pour réduire les coûts de production",
      "D. Pour limiter les options disponibles aux clients"
    ],
    correct_answer: "A", 
    explanation: "Le petit déjeuner doit proposer une offre salée généreuse et variée pour répondre aux attentes de 90% des clients étrangers.",
    cognitive_principle: "active recall"
  },
  {
    id: "4",
    context: "Quel rôle les équipes doivent-elles jouer lors du petit-déjeuner ?",
    question: "Quel est le rôle des équipes lors du petit-déjeuner ?",
    answers: [
      "A. Être attentif au client et à l'attractivité du buffet",
      "B. Se focaliser uniquement sur la préparation des plats",
      "C. Interagir le moins possible avec les clients",
      "D. Ne pas se soucier de l'image globale de la prestation"
    ],
    correct_answer: "A",
    explanation: "Le rôle des équipes lors du petit-déjeuner est d'être attentives au client et à l'attractivité du buffet.",
    cognitive_principle: "contextual memory"
  },
  {
    id: "5",
    context: "Quel élément est visible sur la table du petit-déjeuner selon la description fournie ?",
    question: "Qu'est-ce qui est visible sur la table du petit-déjeuner dans la description fournie ?",
    answers: [
      "A. Une tasse de café ou de thé",
      "B. Un verre de vin",
      "C. Un bol de soupe", 
      "D. Un soda"
    ],
    correct_answer: "A",
    explanation: "Selon la description, une tasse de café ou de thé est visible sur la table du petit-déjeuner.",
    cognitive_principle: "active recall"
  },
  {
    id: "6",
    context: "Quel est le but de l'image présentée pour le petit déjeuner ?",
    question: "Quel est le but de l'image présentée pour le petit déjeuner ?",
    answers: [
      "A. Transmettre une atmosphère sophistiquée et relaxante",
      "B. Promouvoir des produits bon marché",
      "C. Mettre en avant des plats épicés",
      "D. Créer une ambiance festive"
    ],
    correct_answer: "A",
    explanation: "Le but de l'image présentée pour le petit déjeuner est de transmettre une atmosphère sophistiquée et relaxante.",
    cognitive_principle: "contextual memory"
  },
  {
    id: "7",
    context: "Que doit viser la gestion économique du petit-déjeuner en termes de coût plateau ?",
    question: "Quel objectif doit viser la gestion économique du petit-déjeuner en termes de coût plateau ?",
    answers: [
      "A. 6€",
      "B. 10€",
      "C. 4€",
      "D. 8€"
    ],
    correct_answer: "A",
    explanation: "La gestion économique du petit-déjeuner doit viser un coût plateau de 6€.",
    cognitive_principle: "active recall"
  },
  {
    id: "8",
    context: "Quelle est la principale caractéristique de l'ambiance du petit déjeuner selon la description donnée ?",
    question: "Quelle est la principale caractéristique de l'ambiance du petit déjeuner selon la description donnée ?",
    answers: [
      "A. Chaleureuse et accueillante",
      "B. Froide et hostile",
      "C. Sombre et mystérieuse",
      "D. Animée et bruyante"
    ],
    correct_answer: "A",
    explanation: "La principale caractéristique de l'ambiance du petit déjeuner est d'être chaleureuse et accueillante.",
    cognitive_principle: "contextual memory"
  },
  {
    id: "9",
    context: "Quel type de boissons doit-on proposer au petit-déjeuner ?",
    question: "Quels types de boissons doit-on proposer au petit-déjeuner ?",
    answers: [
      "A. Boisson chaude et boisson froide",
      "B. Uniquement de l'eau",
      "C. Boissons alcoolisées",
      "D. Limonade et café froid"
    ],
    correct_answer: "A",
    explanation: "Au petit-déjeuner, il convient de proposer une boisson chaude et une boisson froide par personne.",
    cognitive_principle: "active recall"
  },
  {
    id: "10",
    context: "Quelle recommandation est donnée pour organiser le buffet du petit déjeuner ?",
    question: "Quelle recommandation est donnée pour organiser le buffet du petit déjeuner ?",
    answers: [
      "A. Mettre les pains et viennoiseries en avant du parcours client",
      "B. Cacher les plats pour créer un effet de surprise",
      "C. Ne rien prévoir pour les végétariens",
      "D. Limiter le choix pour éviter le gaspillage"
    ],
    correct_answer: "A",
    explanation: "Il est recommandé de mettre les pains et viennoiseries en avant du parcours client lors de l'organisation du buffet du petit déjeuner.",
    cognitive_principle: "contextual memory"
  },
  {
    id: "11",
    context: "Quel est l'impact de la qualité de la prestation du petit-déjeuner selon l'extrait ?",
    question: "Quel est l'impact de la qualité de la prestation du petit-déjeuner selon l'extrait ?",
    answers: [
      "A. Impacte fortement l'image globale de la prestation",
      "B. N'a aucun impact sur la satisfaction des clients",
      "C. Est uniquement liée au prix des produits",
      "D. Ne doit pas être une priorité"
    ],
    correct_answer: "A",
    explanation: "Selon l'extrait, la qualité de la prestation du petit-déjeuner impacte fortement l'image globale de la prestation.",
    cognitive_principle: "contextual memory"
  },
  {
    id: "12",
    context: "Quelle est la proportion de clients étrangers attendus pour le petit-déjeuner ?",
    question: "Quelle est la proportion de clients étrangers attendus pour le petit-déjeuner ?",
    answers: [
      "A. 90%",
      "B. 50%",
      "C. 70%",
      "D. 30%"
    ],
    correct_answer: "A",
    explanation: "90% des clients sont étrangers, ce qui impacte les attentes en termes d'offre salée généreuse et variée au petit-déjeuner.",
    cognitive_principle: "active recall"
  },
  {
    id: "13",
    context: "Que doit représenter l'offre salée du petit déjeuner selon l'extrait ?",
    question: "Que doit représenter l'offre salée du petit déjeuner selon l'extrait ?",
    answers: [
      "A. Généreuse et variée",
      "B. Réduite et limitée",
      "C. Absente",
      "D. Standardisée"
    ],
    correct_answer: "A",
    explanation: "Selon l'extrait, l'offre salée du petit déjeuner doit être généreuse et variée pour répondre aux attentes des clients étrangers.",
    cognitive_principle: "contextual memory"
  },
  {
    id: "14",
    context: "Quel est le public majoritaire du service de petit-déjeuner ?",
    question: "Quel est le public majoritaire du service de petit-déjeuner ?",
    answers: [
      "A. 90% de clients étrangers",
      "B. 90% de clients locaux",
      "C. 50% de clients étrangers",
      "D. 50% de clients locaux"
    ],
    correct_answer: "A",
    explanation: "Le public majoritaire du service de petit-déjeuner est composé à 90% de clients étrangers.",
    cognitive_principle: "active recall"
  },
  {
    id: "15",
    context: "Quelle ambiance est suggérée par l'image du petit-déjeuner ?",
    question: "Quelle ambiance est suggérée par l'image du petit-déjeuner ?",
    answers: [
      "A. Confort et luxe",
      "B. Détente extrême",
      "C. Style industriel",
      "D. Ambiance de fête"
    ],
    correct_answer: "A",
    explanation: "L'image du petit-déjeuner suggère une ambiance de confort et de luxe, idéale pour une expérience raffinée.",
    cognitive_principle: "contextual memory"
  },
  {
    id: "16",
    context: "Quelle est l'importance de la communication entre les équipes pour la gestion des commandes ?",
    question: "Pourquoi la communication entre les équipes est-elle essentielle pour la gestion des commandes ?",
    answers: [
      "A. Pour organiser efficacement la gestion des commandes",
      "B. Pour rendre le processus plus compliqué",
      "C. Pour limiter les interactions entre collègues",
      "D. Pour rendre les clients mécontents"
    ],
    correct_answer: "A",
    explanation: "La communication entre les équipes est essentielle pour organiser efficacement la gestion des commandes lors du petit-déjeuner.",
    cognitive_principle: "contextual memory"
  },
  {
    id: "17",
    context: "Quel élément est primordial pour l'image globale de la prestation du petit-déjeuner ?",
    question: "Quel élément est primordial pour l'image globale de la prestation du petit-déjeuner ?",
    answers: [
      "A. Qualité de la prestation",
      "B. Quantité de nourriture servie",
      "C. Rapidité du service",
      "D. Éléments de décoration"
    ],
    correct_answer: "A",
    explanation: "La qualité de la prestation est primordiale pour l'image globale de la prestation du petit-déjeuner.",
    cognitive_principle: "active recall"
  },
  {
    id: "18",
    context: "Quel est le rôle des collaborateurs lors du petit-déjeuner selon l'extrait ?",
    question: "Quel est le rôle des collaborateurs lors du petit-déjeuner selon l'extrait ?",
    answers: [
      "A. Être attentifs au client et à l'attractivité du buffet",
      "B. Se concentrer uniquement sur la préparation des plats",
      "C. Ignorer les clients",
      "D. Ne pas se soucier de l'image globale de la prestation"
    ],
    correct_answer: "A",
    explanation: "Le rôle des collaborateurs lors du petit-déjeuner est d'être attentifs au client et à l'attractivité du buffet.",
    cognitive_principle: "contextual memory"
  },
  {
    id: "19",
    context: "Quelle est la recommandation principale pour anticiper les réapprovisionnements durant le service du petit-déjeuner ?",
    question: "Quelle est la recommandation principale pour anticiper les réapprovisionnements durant le service du petit-déjeuner ?",
    answers: [
      "A. Suivre les arrivées clients tout au long du service",
      "B. Ignorer les clients jusqu'à épuisement des stocks",
      "C. Réapprovisionner uniquement à la fin du service",
      "D. Ne pas se soucier des réapprovisionnements"
    ],
    correct_answer: "A",
    explanation: "La recommandation principale est de suivre les arrivées clients tout au long du service pour anticiper les réapprovisionnements durant le petit-déjeuner.",
    cognitive_principle: "contextual memory"
  },
  {
    id: "20",
    context: "Quel élément doit être visible pour une gestion économique efficace du petit déjeuner ?",
    question: "Pourquoi les arrivées clients doivent-elles être suivies tout au long du service du petit déjeuner ?",
    answers: [
      "A. Pour anticiper les réapprovisionnements",
      "B. Pour limiter le nombre de clients",
      "C. Pour réduire les choix disponibles",
      "D. Pour offrir une expérience stressante aux clients"
    ],
    correct_answer: "A",
    explanation: "Il est essentiel de suivre les arrivées clients tout au long du service pour anticiper les réapprovisionnements et assurer une gestion économique efficace du petit déjeuner.",
    cognitive_principle: "active recall"
  },
  {
    id: "21",
    context: "Quel est le type de boissons recommandé pour le petit-déjeuner selon le contenu donné ?",
    question: "Quel type de boissons est recommandé pour le petit-déjeuner selon le contenu donné ?",
    answers: [
      "A. Thé / Café / Chocolat chaud / Jus d'orange / Jus de pomme",
      "B. Sodas sucrés",
      "C. Boissons alcoolisées",
      "D. Eau uniquement"
    ],
    correct_answer: "A",
    explanation: "Les boissons recommandées pour le petit-déjeuner sont le thé, le café, le chocolat chaud, le jus d'orange et le jus de pomme.",
    cognitive_principle: "contextual memory"
  },
  {
    id: "22",
    context: "Quel élément doit être présent sur la table du petit-déjeuner selon la description fournie ?",
    question: "Quel élément doit être présent sur la table du petit-déjeuner selon la description fournie ?",
    answers: [
      "A. Deux verres d'eau",
      "B. Un verre de vin",
      "C. Une bouteille de champagne",
      "D. Une tasse de café ou de thé"
    ],
    correct_answer: "D",
    explanation: "Selon la description, une tasse de café ou de thé doit être présente sur la table du petit-déjeuner.",
    cognitive_principle: "active recall"
  },
  {
    id: "23",
    context: "Quel accent doit être mis lors de l'organisation du buffet du petit déjeuner ?",
    question: "Quel accent doit être mis lors de l'organisation du buffet du petit déjeuner ?",
    answers: [
      "A. Mettre les pains et viennoiseries en avant du parcours client",
      "B. Cacher les aliments",
      "C. Proposer une seule option",
      "D. Réduire les portions"
    ],
    correct_answer: "A",
    explanation: "L'accent doit être mis sur la mise en avant des pains et viennoiseries dans l'organisation du buffet du petit déjeuner.",
    cognitive_principle: "active recall"
  }
];

// Format d'API pour N8N (documentation pour future intégration)
export interface N8NQuizResponse {
  questions: TrainingQuestion[];
  metadata?: {
    topic: string;
    difficulty: 'easy' | 'medium' | 'hard';
    estimated_time_minutes: number;
    passing_score: number;
  };
}

// Exemple de format pour l'endpoint N8N futur
export const expectedN8NApiFormat = {
  endpoint: "https://n8n.yourserver.com/webhook/generate-quiz",
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: {
    topic: "petit-dejeuner-hotel",
    num_questions: 23,
    difficulty: "medium",
    language: "fr"
  },
  expected_response: {
    success: true,
    data: {
      questions: [], // Array of TrainingQuestion
      metadata: {
        topic: "petit-dejeuner-hotel",
        difficulty: "medium",
        estimated_time_minutes: 15,
        passing_score: 70
      }
    }
  }
};
