import { useState } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, BookOpen, ArrowRight } from 'lucide-react';
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

  // Données de test
  const modules: Module[] = [
    {
      id: '1',
      title: 'Adapter son comportement à la situation client',
      progress: 33,
      totalActivities: 3,
      completedActivities: 1,
      activities: [
        { id: '1', title: 'Comprendre les priorités clients', completed: true },
        { id: '2', title: 'Adapter son langage au client', completed: false },
        { id: '3', title: 'Réagir face à une plainte', completed: false }
      ]
    }
  ];

  const questions: Question[] = [
    {
      id: '1',
      title: 'Activité 1 sur 4',
      question: 'Un client se plaint bruyamment à la réception car sa chambre n\'a pas été faite. Quelle est la meilleure réponse à lui apporter ?',
      instruction: 'Sélectionnez la meilleure réponse.',
      type: 'qcu',
      options: [
        'Je vous invite à repasser plus tard, nous sommes débordés.',
        'Je comprends votre frustration, je m\'en occupe immédiatement.',
        'C\'est sûrement une erreur de votre part.',
        'C\'est normal, nous avons eu un manque de personnel.'
      ],
      correctAnswers: [1],
      explanation: 'La réponse correcte montre de l\'empathie et propose une solution immédiate.'
    },
    {
      id: '2',
      title: 'Activité 2 sur 4',
      question: 'Quelles sont les bonnes pratiques avant de faire une chambre client ?',
      instruction: 'Sélectionnez toutes les réponses correctes.',
      type: 'qcm',
      options: [
        'Se désinfecter les mains',
        'Vérifier si le client est présent',
        'Ouvrir la fenêtre et aérer',
        'Commencer par vider la poubelle',
        'Entrer sans frapper'
      ],
      correctAnswers: [0, 1, 2],
      explanation: 'Les bonnes pratiques incluent l\'hygiène, le respect de la vie privée et l\'aération.'
    },
    {
      id: '3',
      title: 'Activité 3 sur 4',
      question: 'Lorsqu\'un client demande un plat non disponible sur la carte du room service, que faites-vous ?',
      instruction: 'Sélectionnez la meilleure réponse.',
      type: 'qcu',
      options: [
        'Je propose une alternative équivalente immédiatement.',
        'Je dis que ce n\'est pas possible et je raccroche.',
        'Je demande au client d\'appeler plus tard.',
        'Je transfère l\'appel sans explication.'
      ],
      correctAnswers: [0],
      explanation: 'Toujours proposer une alternative pour satisfaire le client.'
    }
  ];

  const handleModuleSelect = (module: Module) => {
    setSelectedModule(module);
    setCurrentActivity(0);
    setSelectedAnswers([]);
    setShowResult(false);
  };

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
        {!selectedModule ? (
          // Vue liste des modules
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-playfair font-bold text-palace-navy mb-2">
                Connaissances
              </h1>
              <p className="text-muted-foreground">
                Développez vos compétences hôtelières avec nos modules de formation interactifs
              </p>
            </div>

            <div className="grid gap-6">
              {modules.map((module) => (
                <Card 
                  key={module.id} 
                  className="cursor-pointer hover:shadow-lg transition-all duration-200"
                  onClick={() => handleModuleSelect(module)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{module.title}</CardTitle>
                        <div className="flex items-center gap-4 mb-4">
                          <Badge variant="secondary">
                            {module.completedActivities} sur {module.totalActivities} complétées
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {module.progress}% terminé
                          </span>
                        </div>
                        <Progress value={module.progress} className="mb-4" />
                      </div>
                      <BookOpen className="h-8 w-8 text-palace-navy ml-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Activités :</h4>
                      {module.activities.map((activity) => (
                        <div key={activity.id} className="flex items-center gap-2">
                          {activity.completed ? (
                            <CheckCircle className="h-4 w-4 text-success-green" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className={cn(
                            "text-sm",
                            activity.completed ? "text-success-green" : "text-muted-foreground"
                          )}>
                            {activity.title}
                          </span>
                        </div>
                      ))}
                    </div>
                    <Button className="mt-4 w-full" variant="outline">
                      Voir les activités
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          // Vue activité avec question
          <div className="flex gap-6 max-w-7xl mx-auto">
            {/* Barre latérale gauche */}
            <div className="w-1/4 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{selectedModule.title}</CardTitle>
                  <div className="text-sm text-muted-foreground">
                    Notion complétée {selectedModule.completedActivities} sur {selectedModule.totalActivities}
                  </div>
                  <Progress value={selectedModule.progress} className="mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm mb-2">Étapes/activités :</h4>
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
                    Voir les activités
                  </Button>
                </CardContent>
              </Card>

              {/* Image d'illustration */}
              <div className="bg-muted rounded-lg p-6 text-center">
                <div className="text-4xl mb-2">🏨</div>
                <p className="text-sm text-muted-foreground">
                  Illustration du module
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
                      ← Retour
                    </Button>
                  </div>
                  <Badge variant="outline" className="w-fit">
                    {currentQuestion.type === 'qcu' ? 'Question à Choix Unique' : 'Question à Choix Multiple'}
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
                          {isCorrect ? "Bonne réponse !" : "Réponse incorrecte"}
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
                        Valider
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleNext}
                        className="px-8"
                        disabled={currentActivity >= questions.length - 1}
                      >
                        Continuer
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
  );
};

export default Connaissances;