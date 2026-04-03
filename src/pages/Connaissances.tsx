import { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { UploadTraining } from '@/components/UploadTraining';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Circle, BookOpen, ArrowRight, User, Star, Clock, Play, Award, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useMyAssignedFormations } from '@/hooks/useMyAssignedFormations';
import { KnowledgeFormation } from '@/hooks/useKnowledgeFormations';
import { DocumentViewerModal } from '@/components/modals/DocumentViewerModal';
import QuizzModal from '@/components/modals/QuizzModal';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from '@/integrations/supabase/client';

interface Activity {
  id: string;
  title: string;
  completed: boolean;
}

interface Module {
  id: string;
  title: string;
  progress: number;
  totalActivities: number;
  completedActivities: number;
  activities: Activity[];
  illustration?: string;
  category?: 'guest_reception' | 'housekeeping' | 'safety' | 'equipment';
  objective?: 'better_clients' | 'better_shift';
  duration?: number; // minutes
  type?: 'assimilation' | 'activation' | 'retention' | 'application';
  status?: 'in_learning' | 'qcm_to_do' | 'to_rework' | 'completed';
}

interface Question {
  id: string;
  title: string;
  question: string;
  instruction: string;
  type: 'qcu' | 'qcm';
  options: string[];
  correctAnswers: number[];
  explanation?: string;
}

// 📚 CATÉGORIES DE FORMATION EN ANGLAIS
const FORMATION_CATEGORIES = [
  {
    id: 1,
    name: 'Housekeeping',
    definition: 'Quality of room cleaning, bed setup, bathroom upkeep, and overall maintenance of guest areas.'
  },
  {
    id: 2,
    name: 'Hygiene',
    definition: 'Strict respect of sanitary standards in rooms and food areas, proper handling of linens, products, and cleaning materials.'
  },
  {
    id: 3,
    name: 'Customer Service',
    definition: 'Ability to clearly answer requests, give accurate information, guide guests, and resolve situations professionally.'
  },
  {
    id: 4,
    name: 'Service Attitude',
    definition: 'Overall behavior and manner: politeness, empathy, calm, professionalism with guests and internal team members.'
  },
  {
    id: 5,
    name: 'Operations Management',
    definition: 'Correct application of procedures such as minibar control, inventories, equipment use, and cost awareness.'
  },
  {
    id: 6,
    name: 'Safety',
    definition: 'Application of safety protocols: fire procedures, chemical handling, risk prevention, and emergency reporting.'
  },
  {
    id: 7,
    name: 'Organization',
    definition: 'Time and task management: respecting schedules, priorities, assigned areas, and operational procedures.'
  }
];

// 📊 DONNÉES DE STATS (Codées en dur pour l'instant)
const STANDOUT_STATS = [
  { category: 'Housekeeping', score: 85, fullMark: 100, definition: 'Quality of room cleaning, bed setup, bathroom upkeep, and overall maintenance of guest areas.' },
  { category: 'Hygiene', score: 92, fullMark: 100, definition: 'Strict respect of sanitary standards in rooms and food areas, proper handling of linens, products, and cleaning materials.' },
  { category: 'Customer Service', score: 88, fullMark: 100, definition: 'Ability to clearly answer requests, give accurate information, guide guests, and resolve situations professionally.' },
  { category: 'Service Attitude', score: 95, fullMark: 100, definition: 'Overall behavior and manner: politeness, empathy, calm, professionalism with guests and internal team members.' },
  { category: 'Operations Management', score: 78, fullMark: 100, definition: 'Correct application of procedures such as minibar control, inventories, equipment use, and cost awareness.' },
  { category: 'Safety', score: 90, fullMark: 100, definition: 'Application of safety protocols: fire procedures, chemical handling, risk prevention, and emergency reporting.' },
  { category: 'Organization', score: 87, fullMark: 100, definition: 'Time and task management: respecting schedules, priorities, assigned areas, and operational procedures.' }
];

// ─── Données vides (fallback si aucun score de compétence pour cet utilisateur) ──
const EMPTY_RADAR_DATA = FORMATION_CATEGORIES.map(c => ({
  category: c.name,
  score: 0,
  fullMark: 100,
  definition: c.definition,
}));

// Convertit "maitrise_caisse" → "Maitrise Caisse"
const formatCompetencyKey = (key: string): string =>
  key.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

const Connaissances = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [currentActivity, setCurrentActivity] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Récupération des vraies données depuis Supabase
  const { data: knowledgeFormations, isLoading, error } = useMyAssignedFormations();

  // Variables d'état pour la recherche et les filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [objectiveFilter, setObjectiveFilter] = useState('all');

  // États pour la gestion mobile
  const isMobile = useIsMobile();
  const [isStatsCollapsed, setIsStatsCollapsed] = useState(true); // Par défaut fermé sur mobile
  const [isDesktopStatsCollapsed, setIsDesktopStatsCollapsed] = useState(false); // Par défaut ouvert sur desktop
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // États pour le modal de visualisation des documents
  const [selectedDocument, setSelectedDocument] = useState<KnowledgeFormation | null>(null);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isQuizzOpen, setIsQuizzOpen] = useState(false);

  // 👤 États pour les données utilisateur
  const [userFirstName, setUserFirstName] = useState<string>('User');
  const [userLastName, setUserLastName] = useState<string>('');

  // 📊 Données radar (scores de compétences depuis Supabase)
  const [radarData, setRadarData] = useState<any[]>(STANDOUT_STATS);
  const [isCompetencyEmpty, setIsCompetencyEmpty] = useState(false);
  // 🎯 Formation sélectionnée — impact sur le radar
  const [selectedFormationTitle, setSelectedFormationTitle] = useState<string | null>(null);
  const [formationImpactMap, setFormationImpactMap] = useState<Record<string, number>>({});
  const [selectedImpactId, setSelectedImpactId] = useState<string | null>(null);

  // 🚀 Récupération du nom de l'utilisateur connecté
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Récupérer l'utilisateur connecté
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Récupérer les infos depuis staff_directory
          const { data: staffData, error } = await supabase
            .from('staff_directory')
            .select('first_name, last_name, service')
            .eq('id', user.id)
            .single();
          
          if (staffData && !error) {
            setUserFirstName(staffData.first_name || 'User');
            setUserLastName(staffData.last_name || '');
          }

          // 1. Récupérer tous les axes du service de l'employé
          const userService = staffData?.service || null;
          if (userService) {
            const { data: profileAxes, error: axesError } = await (supabase as any)
              .from('service_competency_profiles')
              .select('competency_key, label')
              .eq('service', userService);

            // 2. Récupérer les scores réels de l'employé
            const { data: compScores, error: compError } = await (supabase as any)
              .from('competency_scores')
              .select('competency_key, current_score')
              .eq('employee_id', user.id);

            if (!axesError && profileAxes && profileAxes.length > 0) {
              // Construire un dictionnaire des scores réels
              const scoreMap: Record<string, number> = {};
              (compScores || []).forEach((row: any) => {
                scoreMap[row.competency_key] = Number(row.current_score) || 0;
              });

              // Tous les axes du service, score réel ou 0 si pas encore de QCM
              const mapped = profileAxes.map((axis: any) => ({
                category: axis.label,
                competency_key: axis.competency_key,
                score: scoreMap[axis.competency_key] ?? 0,
                fullMark: 100,
                definition: '',
              }));

              setRadarData(mapped);
              // Vide = tous les scores sont à 0
              setIsCompetencyEmpty(mapped.every((a: any) => a.score === 0));
            } else {
              setRadarData(EMPTY_RADAR_DATA);
              setIsCompetencyEmpty(true);
            }
          } else {
            setRadarData(EMPTY_RADAR_DATA);
            setIsCompetencyEmpty(true);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    
    fetchUserData();
  }, []);

  // Transformation des données knowledge_queries en format Module
  const transformKnowledgeToModule = (formation: KnowledgeFormation): Module => {
    // Détermination de l'étape de formation
    const getFormationStep = (formation: KnowledgeFormation) => {
      const step = formation.formation_steps.toLowerCase();
      
      // Si c'est un QCM, retourner 3 pour avoir le type 'retention'
      if (step.includes('qcm')) {
        return 3; // QCM d'évaluation
      } else if (step.includes('session d\'entraînement générée par ia') || step.includes('session d\'entrainement generee par ia')) {
        return 2; // Session d'entraînement
      } else if (step.includes('mise en pratique générée par ia') || step.includes('mise en pratique generee par ia')) {
        return 4; // Mise en pratique
      } else if (step.includes('document original')) {
        return 1; // Formation (document original)
      } else {
        return 1; // Par défaut = document original
      }
    };
    
    const step = getFormationStep(formation);
    
    // Génération d'activités basées sur l'étape
    const getActivitiesForStep = (step: number, kanbanStatus: string): Activity[] => {
      switch(step) {
        case 1: // Formation
          return [
            { id: '1', title: 'Read document', completed: kanbanStatus !== 'to_process' },
            { id: '2', title: 'Review key concepts', completed: kanbanStatus === 'completed' },
            { id: '3', title: 'Take notes', completed: kanbanStatus === 'completed' }
          ];
        case 2: // Session d'entraînement
          return [
            { id: '1', title: 'Training exercises', completed: kanbanStatus !== 'to_process' },
            { id: '2', title: 'Practice scenarios', completed: kanbanStatus === 'completed' }
          ];
        case 3: // QCM d'évaluation
          return [
            { id: '1', title: 'Take assessment', completed: kanbanStatus !== 'to_process' },
            { id: '2', title: 'Review results', completed: kanbanStatus === 'completed' }
          ];
        case 4: // Mise en pratique
          return [
            { id: '1', title: 'Practical application', completed: kanbanStatus !== 'to_process' },
            { id: '2', title: 'Real-world practice', completed: kanbanStatus === 'completed' }
          ];
        default:
          return [{ id: '1', title: 'Complete', completed: kanbanStatus === 'completed' }];
      }
    };
    
    const activities = getActivitiesForStep(step, formation.kanban_status);
    const completedCount = activities.filter(a => a.completed).length;
    const progress = Math.round((completedCount / activities.length) * 100);
    
    // Mapping des étapes vers les types d'affichage
    const getTypeFromStep = (step: number) => {
      switch(step) {
        case 1: return 'assimilation'; // Formation
        case 2: return 'activation';   // Session d'entraînement
        case 3: return 'retention';    // QCM d'évaluation
        case 4: return 'application';  // Mise en pratique
        default: return 'assimilation';
      }
    };
    
    return {
      id: formation.id,
      title: formation.document_title,
      progress: progress,
      totalActivities: activities.length,
      completedActivities: completedCount,
      activities: activities,
      category: 'guest_reception', // Par défaut
      objective: 'better_clients',
      duration: 10, // Durée par défaut
      type: getTypeFromStep(step),
      status: formation.kanban_status === 'completed' ? 'completed' :
               formation.kanban_status === 'in_progress' ? 'in_learning' : 'in_learning'
    };
  };

  // Conversion des formations en modules
  const modules: Module[] = knowledgeFormations ? knowledgeFormations.map(transformKnowledgeToModule) : [
    // Données de fallback si pas de données réelles
    {
      id: '1',
      title: 'Adapting Your Behavior to Guest Situations',
      progress: 75,
      totalActivities: 4,
      completedActivities: 3,
      category: 'guest_reception',
      objective: 'better_clients',
      duration: 7,
      type: 'assimilation',
      status: 'in_learning',
      activities: [
        { id: '1', title: 'Understanding client priorities', completed: true },
        { id: '2', title: 'Adapting language to the client', completed: true },
        { id: '3', title: 'Reacting to a complaint', completed: true },
        { id: '4', title: 'Managing emergency situations', completed: false }
      ]
    },
    {
      id: '2',
      title: 'Room Hygiene Procedures',
      progress: 60,
      totalActivities: 5,
      completedActivities: 3,
      category: 'housekeeping',
      objective: 'better_shift',
      duration: 12,
      type: 'activation',
      status: 'qcm_to_do',
      activities: [
        { id: '1', title: 'Pre-cleaning preparation', completed: true },
        { id: '2', title: 'Disinfection protocols', completed: true },
        { id: '3', title: 'Post-cleaning verification', completed: true },
        { id: '4', title: 'Chemical product management', completed: false },
        { id: '5', title: 'Quality standards', completed: false }
      ]
    },
    {
      id: '3',
      title: 'In-room Dining Service',
      progress: 40,
      totalActivities: 5,
      completedActivities: 2,
      category: 'guest_reception',
      objective: 'better_clients',
      duration: 15,
      type: 'retention',
      status: 'to_rework',
      activities: [
        { id: '1', title: 'Guest reception and seating', completed: true },
        { id: '2', title: 'Room service order taking', completed: true },
        { id: '3', title: 'Table service', completed: false },
        { id: '4', title: 'Complaint management', completed: false },
        { id: '5', title: 'Payment and billing', completed: false }
      ]
    },
    {
      id: '4',
      title: 'Night Shift Safety Rules',
      progress: 20,
      totalActivities: 6,
      completedActivities: 1,
      category: 'safety',
      objective: 'better_shift',
      duration: 20,
      type: 'application',
      status: 'in_learning',
      activities: [
        { id: '1', title: 'Security rounds', completed: true },
        { id: '2', title: 'Access management', completed: false },
        { id: '3', title: 'Emergency procedures', completed: false },
        { id: '4', title: 'Video surveillance', completed: false },
        { id: '5', title: 'Communication with authorities', completed: false },
        { id: '6', title: 'Incident reporting', completed: false }
      ]
    },
    {
      id: '5',
      title: 'Equipment Maintenance Basics',
      progress: 90,
      totalActivities: 3,
      completedActivities: 3,
      category: 'equipment',
      objective: 'better_shift',
      duration: 8,
      type: 'assimilation',
      status: 'completed',
      activities: [
        { id: '1', title: 'Coffee machine cleaning', completed: true },
        { id: '2', title: 'Basic troubleshooting', completed: true },
        { id: '3', title: 'Reporting issues', completed: true }
      ]
    }
  ];

  const questions: Question[] = [
    {
      id: '1',
      title: 'Activity 1 of 4',
      question: 'A guest complains loudly at reception because their room has not been serviced. What is the best response to give them?',
      instruction: 'Select the best answer.',
      type: 'qcu',
      options: [
        'I invite you to come back later, we are overwhelmed.',
        'I understand your frustration, I will take care of it immediately.',
        'It\'s surely an error on your part.',
        'It\'s normal, we had a staff shortage.'
      ],
      correctAnswers: [1],
      explanation: 'The correct answer shows empathy and offers an immediate solution.'
    },
    {
      id: '2',
      title: 'Activity 2 of 4',
      question: 'What are the best practices before cleaning a guest room?',
      instruction: 'Select all correct answers.',
      type: 'qcm',
      options: [
        'Disinfect hands',
        'Check if the guest is present',
        'Open the window and air out',
        'Start by emptying the trash',
        'Enter without knocking'
      ],
      correctAnswers: [0, 1, 2],
      explanation: 'Best practices include hygiene, respect for privacy, and airing out the room.'
    },
    {
      id: '3',
      title: 'Activity 3 of 4',
      question: 'When a guest requests a dish not available on the room service menu, what do you do?',
      instruction: 'Select the best answer.',
      type: 'qcu',
      options: [
        'I immediately suggest an equivalent alternative.',
        'I say it\'s not possible and hang up.',
        'I ask the guest to call back later.',
        'I transfer the call without explanation.'
      ],
      correctAnswers: [0],
      explanation: 'Always suggest an alternative to satisfy the guest.'
    }
  ];

  const handleModuleSelect = (module: Module) => {
    setSelectedModule(module);
    setCurrentActivity(0);
    setSelectedAnswers([]);
    setShowResult(false);
  };

  // Fonctions pour gérer les modaux
  const handleDocumentView = (document: KnowledgeFormation) => {
    setSelectedDocument(document);
    if (document.formation_steps === 'qcm') {
      setIsQuizzOpen(true);
    } else {
      setIsDocumentModalOpen(true);
    }
  };

  // Sélection pour l'impact radar (indépendant du modal)
  const handleSelectForRadar = (e: React.MouseEvent, document: KnowledgeFormation) => {
    e.stopPropagation();
    if (selectedImpactId === document.id) {
      // Désélectionner
      setSelectedImpactId(null);
      setSelectedFormationTitle(null);
      setFormationImpactMap({});
    } else {
      setSelectedImpactId(document.id);
      fetchFormationImpact(document.document_name, document.document_title);
    }
  };

  const handleCloseDocumentModal = () => {
    setIsDocumentModalOpen(false);
    setSelectedDocument(null);
  };

  const handleCloseQuizzModal = () => {
    setIsQuizzOpen(false);
    setSelectedDocument(null);
  };

  // 📊 Fetch impact d'une formation sur le radar
  const fetchFormationImpact = async (documentName: string, title: string) => {
    setSelectedFormationTitle(title);
    setIsDesktopStatsCollapsed(false); // auto-déplier le panneau
    try {
      const { data: mappings } = await (supabase as any)
        .from('formation_criteria_mapping')
        .select('competency_key, weight')
        .eq('document_name', documentName);
      if (mappings && mappings.length > 0) {
        const newMap: Record<string, number> = {};
        mappings.forEach((m: any) => { newMap[m.competency_key] = Number(m.weight) || 0; });
        setFormationImpactMap(newMap);
      } else {
        setFormationImpactMap({});
      }
    } catch (err) {
      console.error('fetchFormationImpact error:', err);
      setFormationImpactMap({});
    }
  };

  // Fonctions utilitaires pour les badges et labels
  const getTypeLabel = (type: string | undefined) => {
    switch (type) {
      case 'assimilation': return 'Formation';
      case 'activation': return 'Entraînement';
      case 'retention': return 'QCM Évaluation';
      case 'application': return 'Mise en pratique';
      default: return 'Formation';
    }
  };

  const getTypeBadgeClass = (type: string | undefined) => {
    switch (type) {
      case 'assimilation': return "bg-[#E0D3B4] text-[#BBA57A] border-[#BBA57A]"; // Formation
      case 'activation': return "bg-[#BBA57A] text-white border-[#BBA57A]";        // Training  
      case 'retention': return "bg-[#BBA57A] text-white border-[#BBA57A]";         // QCM Évaluation - GOLD
      case 'application': return "bg-[#BBA57A] text-white border-[#BBA57A]";       // Mise en pratique
      default: return "bg-[#E0D3B4] text-[#BBA57A] border-[#BBA57A]";
    }
  };

  // Fonction pour la couleur de fond de toute la carte
  const getCardBackgroundClass = (type: string | undefined) => {
    switch (type) {
      case 'retention': return "bg-[#BBA57A]"; // QCM - Fond Gold complet
      default: return "bg-white"; // Autres - Fond blanc
    }
  };

  const getCategoryLabel = (category: string | undefined) => {
    switch (category) {
      case 'guest_reception': return 'Guest Reception';
      case 'housekeeping': return 'Housekeeping service';
      case 'safety': return 'Safety standard';
      case 'equipment': return 'Connaissance sur les appareils de l\'hôtel';
      default: return 'Formation';
    }
  };

  // Logique de filtrage avec useMemo pour les performances
  const filteredTrainings = useMemo(() => {
    return modules.filter(module => {
      // Recherche textuelle
      const matchesSearch = searchQuery === '' || 
        module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getCategoryLabel(module.category).toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filtre par statut
      const matchesStatus = statusFilter === 'all' || module.status === statusFilter;
      
      // Filtre par catégorie
      const matchesCategory = categoryFilter === 'all' || module.category === categoryFilter;
      
      // Filtre par objectif
      const matchesObjective = objectiveFilter === 'all' || module.objective === objectiveFilter;
      
      return matchesSearch && matchesStatus && matchesCategory && matchesObjective;
    });
  }, [searchQuery, statusFilter, categoryFilter, objectiveFilter, modules]);

  const handleAnswerSelect = (optionIndex: number) => {
    const currentQuestion = questions[currentActivity];
    
    if (currentQuestion.type === 'qcu') {
      setSelectedAnswers([optionIndex]);
    } else {
      setSelectedAnswers(prev => 
        prev.includes(optionIndex) 
          ? prev.filter(i => i !== optionIndex)
          : [...prev, optionIndex]
      );
    }
  };

  const handleValidate = () => {
    const currentQuestion = questions[currentActivity];
    const correct = currentQuestion.correctAnswers.length === selectedAnswers.length &&
                   currentQuestion.correctAnswers.every(answer => selectedAnswers.includes(answer));
    
    setIsCorrect(correct);
    setShowResult(true);
  };

  const handleNext = () => {
    if (currentActivity < questions.length - 1) {
      setCurrentActivity(prev => prev + 1);
      setSelectedAnswers([]);
      setShowResult(false);
    }
  };

  const currentQuestion = questions[currentActivity];

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-cream via-soft-pewter/20 to-champagne-gold/10">
      <Header onMenuToggle={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className={cn("mx-auto py-8", isMobile ? "px-4 max-w-full" : "container px-6")}>
        {/* Header Section */}
        <div className={cn("text-left mb-8 bg-white rounded-lg shadow-sm border border-champagne-gold/20", isMobile ? "p-4" : "p-6")}>
          <h1 className="text-3xl font-playfair font-semibold text-palace-navy mb-2">
            Knowledge base
          </h1>
          <p className="text-gray-600 text-lg">
            The know-how to be more productive
          </p>
        </div>
        
        <div className={isMobile ? "w-full" : "flex gap-6"}>
        {!selectedModule ? (
          // Vue dashboard principale
          <>
            {isMobile ? (
              // Layout mobile avec bloc supérieur repliable
              <div className="space-y-4 w-full max-w-full">
                {/* Bloc stats repliable en haut (mobile) */}
                <Collapsible open={!isStatsCollapsed} onOpenChange={(open) => setIsStatsCollapsed(!open)}>
                  <Card className="border-2 bg-[#1E1A37] border-[#1E1A37]">
                    <CollapsibleTrigger className="w-full hover:bg-[#2A2448] transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-xl font-semibold text-white">{userFirstName} {userLastName}</h3>
                            <p className="text-sm text-[#BBA57A] font-medium">STANDOUT STATS</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {isStatsCollapsed ? (
                              <ChevronDown className="h-5 w-5 text-white" />
                            ) : (
                              <ChevronUp className="h-5 w-5 text-white" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 bg-[#1E1A37] pb-6">
                        {/* Graphique Radar */}
                        <div className="mb-6 bg-[#2A2448] rounded-lg p-4">
                          {isCompetencyEmpty && (
                            <p className="text-center text-[#DEAE35] text-xs font-bold uppercase tracking-widest mb-3">
                              ⚡ Dépêchez-vous de vous former !
                            </p>
                          )}
                          <ResponsiveContainer width="100%" height={320}>
                            <RadarChart data={radarData} outerRadius={110}>
                              <PolarGrid gridType="circle" stroke="#BBA57A" opacity={0.4} />
                              <PolarAngleAxis 
                                dataKey="category" 
                                tick={{ fill: '#BBA57A', fontSize: 9 }}
                              />
                              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                              <Radar 
                                name="Score" 
                                dataKey="score" 
                                stroke="#DEAE35" 
                                strokeWidth={2}
                                fill="#BBA57A" 
                                fillOpacity={0.5} 
                              />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Barres de stats */}
                        <div className="space-y-4">
                          {radarData.map((stat) => (
                            <div key={stat.category} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-white font-medium text-sm">{stat.category.toUpperCase()}</span>
                                <span className="text-[#BBA57A] font-bold text-2xl">{stat.score}</span>
                              </div>
                              <div className="h-3 bg-[#2A2448] rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-[#BBA57A] to-[#DEAE35] transition-all duration-500"
                                  style={{ width: `${stat.score}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Zone centrale mobile */}
                <div className="space-y-4 w-full">
                  {/* Barre de recherche mobile */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input 
                      placeholder="Rechercher formations..."
                      className="h-12 text-base pl-10 pr-4 rounded-lg border-2 border-gray-200 focus:border-palace-navy transition-all duration-200"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Liste des formations en bandeaux mobiles */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold">
                        Formations
                        <span className="text-sm font-normal text-muted-foreground ml-2">
                          ({filteredTrainings.length})
                        </span>
                      </h2>
                      
                      {/* Bouton filtres avec Sheet */}
                      <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
                        <SheetTrigger asChild>
                          <Button 
                            className="h-9 px-3 bg-[#BBA57A] hover:bg-[#A89569] text-white border-[#BBA57A] hover:border-[#A89569]"
                          >
                            <Filter className="h-4 w-4 mr-2" />
                            Filters
                          </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-80">
                          <SheetHeader>
                            <SheetTitle>Filters</SheetTitle>
                          </SheetHeader>
                          
                          <div className="space-y-6 mt-6">
                            {/* Filtre par statut */}
                            <div>
                              <label className="block text-sm font-medium mb-3 text-gray-700">Status</label>
                              <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="All statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All statuses</SelectItem>
                                  <SelectItem value="in_learning">In Progress</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Filtre par catégorie */}
                            <div>
                              <label className="block text-sm font-medium mb-3 text-gray-700">Category</label>
                              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="All categories" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All categories</SelectItem>
                                  <SelectItem value="guest_reception">Guest Reception</SelectItem>
                                  <SelectItem value="housekeeping">Housekeeping service</SelectItem>
                                  <SelectItem value="safety">Safety standard</SelectItem>
                                  <SelectItem value="equipment">Hotel equipment knowledge</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Filtre par objectif */}
                            <div>
                              <label className="block text-sm font-medium mb-3 text-gray-700">Objective</label>
                              <Select value={objectiveFilter} onValueChange={setObjectiveFilter}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="All objectives" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All objectives</SelectItem>
                                  <SelectItem value="better_clients">Better with clients</SelectItem>
                                  <SelectItem value="better_shift">Better shift management</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Résultats et boutons d'action */}
                            <div className="pt-4 border-t">
                              <div className="text-sm text-gray-600 mb-4">
                                {filteredTrainings.length} formation{filteredTrainings.length > 1 ? 's' : ''} found
                              </div>
                              
                              <div className="space-y-3">
                                {(statusFilter !== 'all' || categoryFilter !== 'all' || objectiveFilter !== 'all' || searchQuery !== '') && (
                                  <Button 
                                    variant="outline" 
                                    className="w-full"
                                    onClick={() => {
                                      setStatusFilter('all');
                                      setCategoryFilter('all');
                                      setObjectiveFilter('all');
                                      setSearchQuery('');
                                    }}
                                  >
                                    Reset all filters
                                  </Button>
                                )}
                                
                                <Button 
                                  className="w-full"
                                  onClick={() => setIsFilterSheetOpen(false)}
                                >
                                  Apply filters
                                </Button>
                              </div>
                            </div>
                          </div>
                        </SheetContent>
                      </Sheet>
                    </div>
                    
                    {filteredTrainings.length > 0 ? (
                      <div className="space-y-3 w-full">
                        {filteredTrainings.map((training) => {
                          // Trouver la formation originale correspondante
                          const originalDocument = knowledgeFormations?.find(f => f.id === training.id);
                          
                          // Fonction pour déterminer la couleur de la carte selon le type
                          const getCardColorClass = (training: any) => {
                            // Si c'est un QCM (type retention), utiliser le fond Gold
                            if (training.type === 'retention') {
                              return "bg-[#BBA57A] text-white border-[#BBA57A]"; // Gold pour QCM
                            }
                            return "bg-white border border-gray-200"; // Couleur normale
                          };
                          
                          return (
                            <Card 
                              key={training.id} 
                              className={cn(
                                "w-full hover:shadow-md transition-all cursor-pointer border-l-4 rounded-lg",
                                training.type === 'retention' 
                                  ? "border-l-[#BBA57A] hover:border-l-[#A89569] bg-[#BBA57A] text-white" 
                                  : "border-l-[#BBA57A] hover:border-l-palace-navy bg-white"
                              )}
                              onClick={() => originalDocument ? handleDocumentView(originalDocument) : handleModuleSelect(training)}
                            >
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                {/* Titre et progression */}
                                <div>
                                  <h3 className="font-semibold text-base mb-2">{training.title}</h3>
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className={cn(
                                      "flex-1 h-2 rounded-full overflow-hidden",
                                      training.type === 'retention' ? "bg-white/30" : "bg-gray-200"
                                    )}>
                                      <div 
                                        className={cn(
                                          "h-full transition-all duration-300",
                                          training.type === 'retention' ? "bg-white" : "bg-palace-navy"
                                        )}
                                        style={{ width: `${training.progress}%` }}
                                      />
                                    </div>
                                    <span className="text-xs font-medium">{training.progress}%</span>
                                  </div>
                                </div>
                                
                                {/* Métadonnées en ligne */}
                                <div className="flex items-center justify-between">
                                  <div className={cn(
                                    "flex items-center gap-4 text-sm",
                                    training.type === 'retention' ? "text-white/80" : "text-muted-foreground"
                                  )}>
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {training.duration || 7}min
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <BookOpen className="h-3 w-3" />
                                      {getCategoryLabel(training.category)?.split(' ')[0]}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <Badge className={cn("text-xs px-2 py-1", getTypeBadgeClass(training.type))}>
                                      {getTypeLabel(training.type)}
                                    </Badge>
                                    <ArrowRight className="h-4 w-4 text-[#1E1A37]" />
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <Card className="border-dashed border-2 border-gray-300">
                        <CardContent className="p-6 text-center">
                          <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-600 mb-2">Aucune formation trouvée</p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSearchQuery('');
                              setStatusFilter('all');
                              setCategoryFilter('all');
                              setObjectiveFilter('all');
                            }}
                          >
                            Réinitialiser
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // Layout desktop existant
              <>
                {/* Barre latérale gauche - Standout Stats */}
                <div
                  className="relative flex-shrink-0 transition-all duration-300 ease-in-out"
                  style={{ width: isDesktopStatsCollapsed ? '40px' : '520px' }}
                >
                  {/* Barre verticale toujours visible + bouton toggle */}
                  <div className="absolute right-0 top-0 h-full w-10 bg-[#1E1A37] flex flex-col items-center justify-start pt-4 z-10 rounded-r-lg">
                    <button
                      onClick={() => setIsDesktopStatsCollapsed(prev => !prev)}
                      className="text-[#BBA57A] hover:text-[#DEAE35] transition-colors"
                    >
                      {isDesktopStatsCollapsed ? (
                        <ChevronDown className="h-5 w-5 rotate-[-90deg]" />
                      ) : (
                        <ChevronUp className="h-5 w-5 rotate-[-90deg]" />
                      )}
                    </button>
                  </div>

                  {/* Contenu du panneau (masqué quand replié) */}
                  <div
                    className="overflow-hidden transition-all duration-300 ease-in-out h-full"
                    style={{ width: isDesktopStatsCollapsed ? '0px' : '480px' }}
                  >
                    <Card className="border-2 bg-[#1E1A37] border-[#1E1A37] h-full">
                      <CardHeader className="bg-[#1E1A37] pb-4 border-b border-[#BBA57A]/20">
                        <h3 className="text-xl font-bold text-white">{userFirstName} {userLastName}</h3>
                        <p className="text-sm text-[#BBA57A] font-semibold tracking-wide">STANDOUT STATS</p>
                      </CardHeader>
                      <CardContent className="pt-6 bg-[#1E1A37] pb-6 overflow-y-auto">
                        {/* Titre formation sélectionnée */}
                        {selectedFormationTitle && (
                          <div className="mb-4 px-3 py-2 rounded-lg bg-[#2A2448] border border-[#3B82F6]/40">
                            <p className="text-[#3B82F6] text-xs font-bold uppercase tracking-widest mb-0.5">Formation sélectionnée</p>
                            <p className="text-white text-sm font-semibold truncate">{selectedFormationTitle}</p>
                          </div>
                        )}

                        {/* Graphique Radar */}
                        <div className="mb-4 bg-[#2A2448] rounded-lg p-4">
                          {isCompetencyEmpty && Object.keys(formationImpactMap).length === 0 && (
                            <p className="text-center text-[#DEAE35] text-xs font-bold uppercase tracking-widest mb-3">
                              ⚡ Dépêchez-vous de vous former !
                            </p>
                          )}
                          <ResponsiveContainer width="100%" height={380}>
                            <RadarChart
                              data={radarData.map((d: any) => ({
                                ...d,
                                impact: formationImpactMap[d.competency_key] ?? 0,
                              }))}
                              outerRadius={130}
                            >
                              <PolarGrid gridType="circle" stroke="#BBA57A" opacity={0.4} />
                              <PolarAngleAxis
                                dataKey="category"
                                tick={{ fill: '#BBA57A', fontSize: 10 }}
                              />
                              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                              {/* Couche bleue — impact de la formation */}
                              <Radar
                                name="Impact formation"
                                dataKey="impact"
                                stroke="#3B82F6"
                                strokeWidth={2}
                                fill="#3B82F6"
                                fillOpacity={0.3}
                              />
                              {/* Couche gold — scores actuels */}
                              <Radar
                                name="Score actuel"
                                dataKey="score"
                                stroke="#DEAE35"
                                strokeWidth={2}
                                fill="#BBA57A"
                                fillOpacity={0.5}
                              />
                              {selectedFormationTitle && (
                                <Legend
                                  formatter={(value) => (
                                    <span style={{ color: '#E0D3B4', fontSize: '11px' }}>{value}</span>
                                  )}
                                />
                              )}
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Barres de stats */}
                        <div className="space-y-3">
                          {radarData.map((stat: any) => {
                            const impact = formationImpactMap[stat.competency_key] ?? 0;
                            return (
                              <div key={stat.category} className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-white font-medium text-xs uppercase tracking-wide">{stat.category}</span>
                                  <div className="flex items-center gap-2">
                                    {impact > 0 && (
                                      <span className="text-[#3B82F6] font-bold text-sm">+{impact}</span>
                                    )}
                                    <span className="text-[#BBA57A] font-bold text-xl">{stat.score}</span>
                                  </div>
                                </div>
                                <div className="h-2.5 bg-[#2A2448] rounded-full overflow-hidden relative">
                                  {/* Barre gold — score actuel */}
                                  <div
                                    className="absolute h-full bg-gradient-to-r from-[#BBA57A] to-[#DEAE35] rounded-full transition-all duration-500"
                                    style={{ width: `${stat.score}%` }}
                                  />
                                  {/* Barre bleue — impact formation */}
                                  {impact > 0 && (
                                    <div
                                      className="absolute h-full bg-[#3B82F6] rounded-full opacity-70 transition-all duration-500"
                                      style={{ left: `${stat.score}%`, width: `${Math.min(impact, 100 - stat.score)}%` }}
                                    />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Zone centrale desktop */}
                <div className="flex-1 space-y-6">
                  {/* Barre de recherche */}
                  <div className="mb-6">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
                      <Input 
                        placeholder="Rechercher dans les formations et QCM..."
                        className="h-16 text-lg pl-14 pr-6 rounded-xl border-2 border-gray-200 focus:border-palace-navy transition-all duration-200"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Section des filtres */}
                  <div className="mb-6">
                    <Card className="border-2 bg-white">
                      <CardContent className="p-6">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          
                          {/* Par statut */}
                          <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">Statut</label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                              <SelectTrigger className={cn("w-full transition-all duration-200 bg-white border-2", statusFilter !== 'all' && "ring-1 ring-yellow-400 border-yellow-400")}>
                                <SelectValue placeholder="Tous les statuts" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Tous les statuts</SelectItem>
                                <SelectItem value="in_learning">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Par catégorie */}
                          <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">Catégorie</label>
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                              <SelectTrigger className={cn("w-full transition-all duration-200 bg-white border-2", categoryFilter !== 'all' && "ring-1 ring-yellow-400 border-yellow-400")}>
                                <SelectValue placeholder="Toutes les catégories" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Toutes les catégories</SelectItem>
                                <SelectItem value="guest_reception">Guest Reception</SelectItem>
                                <SelectItem value="housekeeping">Housekeeping service</SelectItem>
                                <SelectItem value="safety">Safety standard</SelectItem>
                                <SelectItem value="equipment">Connaissance sur les appareils de l'hôtel</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Par objectif */}
                          <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">Objectif</label>
                            <Select value={objectiveFilter} onValueChange={setObjectiveFilter}>
                              <SelectTrigger className={cn("w-full transition-all duration-200 bg-white border-2", objectiveFilter !== 'all' && "ring-1 ring-yellow-400 border-yellow-400")}>
                                <SelectValue placeholder="Tous les objectifs" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Tous les objectifs</SelectItem>
                                <SelectItem value="better_clients">Better with clients</SelectItem>
                                <SelectItem value="better_shift">Un shift mieux réussi</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Résultats et reset */}
                          <div className="flex flex-col justify-end">
                            <div className="mb-2">
                              <span className="text-sm text-gray-600">
                                {filteredTrainings.length} formation{filteredTrainings.length > 1 ? 's' : ''} trouvée{filteredTrainings.length > 1 ? 's' : ''}
                              </span>
                            </div>
                            {(statusFilter !== 'all' || categoryFilter !== 'all' || objectiveFilter !== 'all' || searchQuery !== '') && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                  setStatusFilter('all');
                                  setCategoryFilter('all');
                                  setObjectiveFilter('all');
                                  setSearchQuery('');
                                }}
                                className="text-gray-700 hover:text-gray-800 hover:bg-gray-100"
                              >
                                Réinitialiser
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Liste des formations en bandeaux ligne */}
                  <div>
                    <h2 className="text-xl font-semibold mb-4">
                      Formations et QCM
                      <span className="text-base font-normal text-muted-foreground ml-2">
                        ({filteredTrainings.length} formation{filteredTrainings.length > 1 ? 's' : ''})
                      </span>
                    </h2>
                    
                    {filteredTrainings.length > 0 ? (
                      <div className="space-y-3">
                        {filteredTrainings.map((training) => {
                          // Trouver la formation originale correspondante
                          const originalDocument = knowledgeFormations?.find(f => f.id === training.id);
                          
                          return (
                            <Card 
                              key={training.id} 
                              className={cn(
                                "hover:shadow-md transition-all rounded-lg border-l-4",
                                selectedImpactId === training.id
                                  ? "border-l-[#3B82F6] ring-1 ring-[#3B82F6]/30"
                                  : training.type === 'retention'
                                    ? "border-l-[#BBA57A] bg-[#BBA57A] text-white"
                                    : "border-l-[#BBA57A] bg-white"
                              )}
                            >
                            <CardContent className="p-0">
                              <div className="flex items-stretch">

                                {/* Sélecteur radio — gauche */}
                                <button
                                  onClick={(e) => originalDocument ? handleSelectForRadar(e, originalDocument) : undefined}
                                  className={cn(
                                    "flex-shrink-0 w-12 flex items-center justify-center border-r transition-colors",
                                    selectedImpactId === training.id
                                      ? "bg-[#3B82F6]/10 border-[#3B82F6]/30"
                                      : training.type === 'retention'
                                        ? "bg-white/10 border-white/20 hover:bg-white/20"
                                        : "bg-gray-50 border-gray-100 hover:bg-blue-50"
                                  )}
                                  title="Voir l'impact sur le radar"
                                >
                                  <div className={cn(
                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                    selectedImpactId === training.id
                                      ? "border-[#3B82F6] bg-[#3B82F6]"
                                      : training.type === 'retention'
                                        ? "border-white/60"
                                        : "border-gray-300"
                                  )}>
                                    {selectedImpactId === training.id && (
                                      <div className="w-2 h-2 rounded-full bg-white" />
                                    )}
                                  </div>
                                </button>

                                {/* Contenu de la carte — clic ouvre le modal */}
                                <div
                                  className="flex-1 p-4 cursor-pointer"
                                  onClick={() => originalDocument ? handleDocumentView(originalDocument) : handleModuleSelect(training)}
                                >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-lg mb-2">{training.title}</h3>
                                    <div className={cn(
                                      "flex items-center gap-6 text-sm",
                                      training.type === 'retention' ? "text-white/80" : "text-muted-foreground"
                                    )}>
                                      <span className="flex items-center gap-1">
                                        <BookOpen className="h-4 w-4" />
                                        {getCategoryLabel(training.category)}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        {training.duration || 7} min
                                      </span>
                                      <span className="flex items-center gap-2">
                                        <div className={cn(
                                          "w-16 h-2 rounded-full overflow-hidden",
                                          training.type === 'retention' ? "bg-white/30" : "bg-gray-200"
                                        )}>
                                          <div
                                            className={cn(
                                              "h-full transition-all duration-300",
                                              training.type === 'retention' ? "bg-white" : "bg-palace-navy"
                                            )}
                                            style={{ width: `${training.progress}%` }}
                                          />
                                        </div>
                                        <span className="text-xs font-medium">{training.progress}%</span>
                                      </span>
                                    </div>
                                  </div>
                                  <div className="mr-6">
                                    <Badge className={cn("text-sm px-3 py-1 border-2", getTypeBadgeClass(training.type))}>
                                      {getTypeLabel(training.type)}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <Badge className={cn(
                                      "text-xs border-2 font-medium px-2 py-1",
                                      training.status === 'completed'
                                        ? "bg-[#BBA57A] text-white border-[#BBA57A]"
                                        : "bg-[#E0D3B4] text-[#BBA57A] border-[#BBA57A]"
                                    )}>
                                      {training.status === 'in_learning' && 'In Progress'}
                                      {training.status === 'completed' && 'Completed'}
                                    </Badge>
                                    <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                      <ArrowRight className="h-4 w-4 text-[#1E1A37]" />
                                    </Button>
                                  </div>
                                </div>
                                </div>

                              </div>
                            </CardContent>
                          </Card>
                          );
                        })}
                      </div>
                    ) : (
                      // Message quand aucune formation ne correspond aux filtres
                      <Card className="border-dashed border-2 border-gray-300">
                        <CardContent className="p-8 text-center">
                          <div className="text-gray-400 mb-4">
                            <BookOpen className="h-12 w-12 mx-auto mb-2" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-600 mb-2">
                            Aucune formation trouvée
                          </h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Essayez d'ajuster vos filtres ou votre recherche
                          </p>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setSearchQuery('');
                              setStatusFilter('all');
                              setCategoryFilter('all');
                              setObjectiveFilter('all');
                            }}
                            className="text-sm"
                          >
                            Réinitialiser les filtres
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          // Vue activité avec question
          <div className="flex gap-6 max-w-7xl mx-auto">
            {/* Barre latérale gauche */}
            <div className="w-1/4 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{selectedModule.title}</CardTitle>
                  <div className="text-sm text-muted-foreground">
                    Completed {selectedModule.completedActivities} of {selectedModule.totalActivities} activities
                  </div>
                  <Progress value={selectedModule.progress} className="mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm mb-2">Steps/Activities:</h4>
                    {selectedModule.activities.map((activity, index) => (
                      <div key={activity.id} className="flex items-center gap-2">
                        {activity.completed ? (
                          <CheckCircle className="h-4 w-4 text-success-green" />
                        ) : index === currentActivity ? (
                          <Circle className="h-4 w-4 text-champagne-gold" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className={cn(
                          "text-sm",
                          activity.completed ? "text-success-green" : 
                          index === currentActivity ? "text-champagne-gold font-medium" : 
                          "text-muted-foreground"
                        )}>
                          {activity.title}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={() => setSelectedModule(null)}
                  >
                    View Activities
                  </Button>
                </CardContent>
              </Card>

              {/* Image d'illustration */}
              <div className="bg-muted rounded-lg p-6 text-center">
                <div className="text-4xl mb-2">🏨</div>
                <p className="text-sm text-muted-foreground">
                  Module illustration
                </p>
              </div>
            </div>

            {/* Zone centrale */}
            <div className="flex-1">
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{currentQuestion.title}</CardTitle>
                    <Button 
                      variant="ghost" 
                      onClick={() => setSelectedModule(null)}
                      className="text-muted-foreground"
                    >
                      ← Back
                    </Button>
                  </div>
                  <Badge variant="outline" className="w-fit">
                    {currentQuestion.type === 'qcu' ? 'Single Choice Question' : 'Multiple Choice Question'}
                  </Badge>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">{currentQuestion.question}</h3>
                    <p className="text-sm text-muted-foreground">{currentQuestion.instruction}</p>
                  </div>

                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => {
                      const isSelected = selectedAnswers.includes(index);
                      const isCorrect = currentQuestion.correctAnswers.includes(index);
                      
                      return (
                        <div
                          key={index}
                          onClick={() => !showResult && handleAnswerSelect(index)}
                          className={cn(
                            "p-4 border rounded-lg cursor-pointer transition-all duration-200",
                            !showResult && "hover:bg-muted/50",
                            isSelected && !showResult && "border-champagne-gold bg-champagne-gold/10",
                            showResult && isCorrect && "border-success-green bg-success-green/10",
                            showResult && isSelected && !isCorrect && "border-urgence-red bg-urgence-red/10",
                            showResult && "cursor-default"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                              currentQuestion.type === 'qcu' ? "rounded-full" : "rounded",
                              isSelected && !showResult && "border-champagne-gold bg-champagne-gold",
                              showResult && isCorrect && "border-success-green bg-success-green",
                              showResult && isSelected && !isCorrect && "border-urgence-red bg-urgence-red"
                            )}>
                              {isSelected && (
                                <div className={cn(
                                  "w-2 h-2 rounded-full bg-white",
                                  currentQuestion.type === 'qcm' && "rounded-sm"
                                )} />
                              )}
                              {showResult && isCorrect && (
                                <CheckCircle className="h-3 w-3 text-white" />
                              )}
                            </div>
                            <span className="text-sm">{option}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {showResult && currentQuestion.explanation && (
                    <div className={cn(
                      "p-4 rounded-lg border",
                      isCorrect 
                        ? "border-success-green bg-success-green/10 text-success-green" 
                        : "border-urgence-red bg-urgence-red/10 text-urgence-red"
                    )}>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">
                          {isCorrect ? "Correct answer!" : "Incorrect answer"}
                        </span>
                      </div>
                      <p className="text-sm">{currentQuestion.explanation}</p>
                    </div>
                  )}

                  <div className="flex justify-center gap-4 pt-4">
                    {!showResult ? (
                      <Button 
                        onClick={handleValidate}
                        disabled={selectedAnswers.length === 0}
                        className="px-8"
                      >
                        Validate
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleNext}
                        className="px-8"
                        disabled={currentActivity >= questions.length - 1}
                      >
                        Continue
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        </div>
      </div>
      
      {/* Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={isDocumentModalOpen}
        onClose={handleCloseDocumentModal}
        document={selectedDocument}
      />

      {/* Quiz Assessment Modal */}
      <QuizzModal
        isOpen={isQuizzOpen}
        onClose={handleCloseQuizzModal}
        title={selectedDocument?.document_title ?? 'Knowledge Assessment'}
        selectedTask={selectedDocument}
      />
    </div>
  );
};

export default Connaissances;