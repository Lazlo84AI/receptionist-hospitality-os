import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Circle, BookOpen, ArrowRight, User, Star, Clock, Play, Award, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

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

const Connaissances = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [currentActivity, setCurrentActivity] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Variables d'état pour la recherche et les filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [objectiveFilter, setObjectiveFilter] = useState('all');

  // Données de test
  const modules: Module[] = [
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

  // Fonctions utilitaires pour les badges et labels
  const getTypeLabel = (type: string | undefined) => {
    switch (type) {
      case 'assimilation': return 'Découvrir';
      case 'activation': return 'Réfléchir';
      case 'retention': return 'S\'entraîner';
      case 'application': return 'Mettre en pratique';
      default: return 'Formation';
    }
  };

  const getTypeBadgeVariant = (type: string | undefined) => {
    switch (type) {
      case 'assimilation': return 'secondary' as const;
      case 'activation': return 'outline' as const;
      case 'retention': return 'default' as const;
      case 'application': return 'destructive' as const;
      default: return 'secondary' as const;
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
      
      <div className="container mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="text-left mb-8 bg-white rounded-lg p-6 shadow-sm border border-champagne-gold/20">
          <h1 className="text-3xl font-playfair font-semibold text-palace-navy mb-2">
            Manage Your Training
          </h1>
          <p className="text-gray-600 text-lg">
            Improve every day on the job
          </p>
        </div>
        
        <div className="flex gap-6">
        {!selectedModule ? (
          // Vue dashboard principale
          <>
            {/* Barre latérale gauche - Profil & Suivi */}
            <div className="w-1/4 space-y-6">
              {/* Profil apprenant */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-champagne-gold/20 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-champagne-gold" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">Marie Dubois</CardTitle>
                      <p className="text-xs text-muted-foreground">Receptionist</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm mb-3">Progress by Module:</h4>
                    {modules.map((module) => (
                      <div key={module.id} className="space-y-2 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">{module.title}</span>
                          <span className="text-xs font-medium">{module.progress}%</span>
                        </div>
                        <Progress value={module.progress} className="h-2" />
                      </div>
                    ))}
                  </div>
                  <Button className="w-full" size="sm">
                    <Award className="h-4 w-4 mr-2" />
                    View My Progress
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Zone centrale */}
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
                            <SelectItem value="in_learning">In Learning</SelectItem>
                            <SelectItem value="qcm_to_do">QCM to do</SelectItem>
                            <SelectItem value="to_rework">To rework</SelectItem>
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
                    {filteredTrainings.map((training) => (
                      <Card 
                        key={training.id} 
                        className="hover:shadow-md transition-all cursor-pointer border-l-4 border-l-transparent hover:border-l-palace-navy"
                        onClick={() => handleModuleSelect(training)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            
                            {/* Informations principales - Gauche */}
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-2">{training.title}</h3>
                              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                
                                {/* Thématique */}
                                <span className="flex items-center gap-1">
                                  <BookOpen className="h-4 w-4" />
                                  {getCategoryLabel(training.category)}
                                </span>
                                
                                {/* Temps de lecture */}
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {training.duration || 7} min
                                </span>
                                
                                {/* Progression */}
                                <span className="flex items-center gap-2">
                                  <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-palace-navy transition-all duration-300"
                                      style={{ width: `${training.progress}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-medium">{training.progress}%</span>
                                </span>
                              </div>
                            </div>

                            {/* Type de formation - Centre */}
                            <div className="mr-6">
                              <Badge variant={getTypeBadgeVariant(training.type)} className="text-sm px-3 py-1">
                                {getTypeLabel(training.type)}
                              </Badge>
                            </div>

                            {/* Statut et Action - Droite */}
                            <div className="flex items-center gap-3">
                              {/* Badge de statut */}
                              <Badge 
                                variant={training.status === 'completed' ? 'default' : 'outline'}
                                className={cn(
                                  "text-xs",
                                  training.status === 'in_learning' && "bg-blue-100 text-blue-700",
                                  training.status === 'qcm_to_do' && "bg-orange-100 text-orange-700",
                                  training.status === 'to_rework' && "bg-red-100 text-red-700",
                                  training.status === 'completed' && "bg-green-100 text-green-700"
                                )}
                              >
                                {training.status === 'in_learning' && 'In Learning'}
                                {training.status === 'qcm_to_do' && 'QCM to do'}
                                {training.status === 'to_rework' && 'To rework'}
                                {training.status === 'completed' && 'Completed'}
                              </Badge>
                              
                              {/* Bouton d'action */}
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
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
    </div>
  );
};

export default Connaissances;