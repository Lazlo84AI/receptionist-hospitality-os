import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, ChevronLeft, ChevronRight, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

import { useQuizQuestions, type TrainingQuestionCompatible } from '@/hooks/useQuizQuestions';

interface QuizzModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  selectedTask?: any; // Task avec related_item_ids
  onQuizCompleted?: (score: number) => void;
}

const QuizzModal = ({ 
  isOpen, 
  onClose, 
  title = "Training Assessment",
  selectedTask = null,
  onQuizCompleted
}: QuizzModalProps) => {
  // Hook pour récupérer les questions depuis Supabase via related_item_ids
  const questionIds = selectedTask?.related_item_ids || null;
  
  // 🔍 DEBUG - Voir ce qui est passé
  console.log('🔍 QuizzModal DEBUG:');
  console.log('- selectedTask:', selectedTask);
  console.log('- questionIds:', questionIds);
  console.log('- questionIds length:', questionIds?.length);
  
  const { data: dbQuestions, isLoading: isLoadingQuestions, error: questionsError } = useQuizQuestions(
    questionIds,
    !!questionIds // enabled si on a des IDs
  );
  
  // Questions depuis Supabase uniquement
  const finalQuestions = dbQuestions || [];
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: string }>({});
  const [showResult, setShowResult] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // 🏆 SI LE QCM EST DÉJÀ COMPLETED, AFFICHER DIRECTEMENT LE SCORE
  useEffect(() => {
    if (selectedTask?.kanban_status === 'completed' && selectedTask?.last_score) {
      console.log('🎯 QCM already completed! Showing score:', selectedTask.last_score);
      setQuizCompleted(true);
    } else {
      setQuizCompleted(false);
    }
  }, [selectedTask]);

  // Affichage de chargement si on attend les questions de la DB
  if (questionIds && isLoadingQuestions) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-none w-screen h-screen m-0 p-0 bg-white border-0">
          <div className="flex flex-col h-full items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-champagne-gold" />
              <h3 className="text-xl font-semibold mb-2">Chargement du quiz</h3>
              <p className="text-muted-foreground">Récupération des questions du QCM...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Affichage d'erreur si problème de chargement
  if (questionIds && questionsError) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-none w-screen h-screen m-0 p-0 bg-white border-0">
          <div className="flex flex-col h-full items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
              <XCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
              <h3 className="text-xl font-semibold mb-2">Erreur de chargement</h3>
              <p className="text-muted-foreground mb-4">Impossible de charger les questions du QCM</p>
              <Button onClick={onClose}>Fermer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // 🚨 PROTECTION : Si pas de questions, afficher un message
  if (!finalQuestions || finalQuestions.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-none w-screen h-screen m-0 p-0 bg-white border-0">
          <div className="flex flex-col h-full items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
              <XCircle className="h-12 w-12 mx-auto mb-4 text-orange-600" />
              <h3 className="text-xl font-semibold mb-2">Aucune question disponible</h3>
              <p className="text-muted-foreground mb-4">
                Ce QCM n'a pas encore de questions associées.
              </p>
              <Button onClick={onClose}>Fermer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentQuestion = finalQuestions[currentQuestionIndex];
  const totalQuestions = finalQuestions.length;
  const progressPercentage = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  const handleAnswerSelect = (answerIndex: number) => {
    if (!showResult) {
      const answerLetter = String.fromCharCode(65 + answerIndex); // Convert 0,1,2,3 to A,B,C,D
      setSelectedAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: answerLetter
      }));
    }
  };

  const handleSubmitAnswer = () => {
    setShowResult(true);
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowResult(false);
    } else {
      // Quiz terminé
      setQuizCompleted(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setShowResult(false);
    }
  };

  const selectedAnswer = selectedAnswers[currentQuestion.id];
  const isCorrect = selectedAnswer === currentQuestion.correct_answer;
  const hasSelectedAnswer = selectedAnswer !== undefined;

  const calculateScore = () => {
    let correct = 0;
    finalQuestions.forEach(question => {
      if (selectedAnswers[question.id] === question.correct_answer) {
        correct++;
      }
    });
    return Math.round((correct / totalQuestions) * 100);
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResult(false);
    setQuizCompleted(false);
  };

  if (quizCompleted) {
    // 🎯 UTILISER LE SCORE SAUVEGARDÉ OU LE SCORE CALCULÉ
    const score = selectedTask?.last_score || calculateScore();
    const passed = score >= 70;
    const isAlreadyCompleted = selectedTask?.kanban_status === 'completed' && selectedTask?.last_score;

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-none w-screen h-screen m-0 p-0 bg-gradient-to-br from-blue-50 to-purple-50 border-0">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-palace-navy">Quiz Results</h2>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Résultats */}
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                <div className={cn(
                  "w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center",
                  passed ? "bg-green-100" : "bg-red-100"
                )}>
                  {passed ? (
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  ) : (
                    <XCircle className="h-10 w-10 text-red-600" />
                  )}
                </div>

                <h3 className="text-2xl font-bold mb-2">
                  {passed ? "Félicitations !" : "Continuez vos efforts"}
                </h3>
                
                <p className="text-muted-foreground mb-6">
                  Votre score: <span className="font-semibold text-2xl">{score}%</span>
                </p>

                <div className="space-y-4">
                  <p className="text-sm">
                    {isAlreadyCompleted
                      ? `Vous avez réussi ce QCM avec un score de ${score}%.`
                      : passed 
                        ? "Vous avez réussi l'évaluation ! Votre formation est validée."
                        : "Un score minimum de 70% est requis. Révisez le contenu et essayez à nouveau."
                    }
                  </p>

                  <div className="flex gap-3">
                    {!isAlreadyCompleted && (
                      <Button 
                        variant="outline" 
                        onClick={resetQuiz}
                        className="flex-1"
                      >
                        Recommencer
                      </Button>
                    )}
                    <Button 
                      onClick={() => {
                        // 🏆 APPELER LE CALLBACK SI QUIZ RÉUSSI (ET PAS DÉJÀ COMPLETED)
                        if (passed && onQuizCompleted && !isAlreadyCompleted) {
                          onQuizCompleted(score);
                        }
                        onClose();
                      }}
                      className={isAlreadyCompleted ? "w-full" : "flex-1"}
                      variant={passed ? "default" : "secondary"}
                    >
                      {isAlreadyCompleted ? "Fermer" : passed ? "Terminer" : "Réviser"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-none w-screen h-screen m-0 p-0 bg-white border-0">
        <div className="flex flex-col h-full">
          {/* Header avec progression et navigation */}
          <div className={cn(
            "bg-white border-b px-6",
            "py-4 md:py-4" // Réduire le padding vertical sur mobile
          )}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h2 className={cn(
                  "font-semibold text-palace-navy",
                  "text-lg md:text-xl" // Plus petit sur mobile
                )}>{title}</h2>
                {/* Masquer "Question X sur Y" sur mobile */}
                <span className="hidden md:block text-sm text-muted-foreground">
                  Question {currentQuestionIndex + 1} sur {totalQuestions}
                </span>
              </div>
              
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Navigation en haut */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>

              <span className="text-sm text-muted-foreground font-medium">
                {currentQuestionIndex + 1} / {totalQuestions}
              </span>

              {!showResult ? (
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={!hasSelectedAnswer}
                  className={cn(
                    "transition-all duration-300 px-6 py-3 rounded-full font-medium flex items-center gap-2",
                    hasSelectedAnswer 
                      ? "bg-[#1E1A37] hover:bg-[#1E1A37]/90 text-white shadow-lg" 
                      : "bg-gray-300 text-gray-500 cursor-not-allowed opacity-50"
                  )}
                >
                  {hasSelectedAnswer ? "Valider" : "Sélectionnez une réponse"}
                  {hasSelectedAnswer && <ChevronRight className="h-4 w-4" />}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className="flex items-center gap-2"
                >
                  {currentQuestionIndex < totalQuestions - 1 ? "Suivant" : "Terminer"}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {/* Barre de progression */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progression</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </div>

          {/* Question */}
          <div className={cn(
            "flex-1 overflow-y-auto",
            "p-4 md:p-8 bg-gray-50" // Moins de padding sur mobile
          )}>
            <div className={cn(
              "bg-white rounded-lg shadow-sm border max-w-3xl w-full mx-auto",
              "p-4 md:p-8" // Moins de padding interne sur mobile
            )}>
              <div className="space-y-8">
                {/* Question */}
                <div className="text-center">
                  <h3 className={cn(
                    "font-medium text-palace-navy mb-4",
                    "text-xl md:text-2xl" // Plus petit sur mobile
                  )}>
                    {currentQuestion.question}
                  </h3>
                </div>

                {/* Options de réponse */}
                <div className={cn(
                  "space-y-3 md:space-y-4" // Moins d'espace entre les options sur mobile
                )}>
                  {currentQuestion.answers.map((option, index) => {
                    const answerLetter = String.fromCharCode(65 + index); // A, B, C, D
                    const isSelected = selectedAnswer === answerLetter;
                    const isCorrectAnswer = answerLetter === currentQuestion.correct_answer;
                    
                    let buttonClass = cn(
                      "w-full text-left border-2 rounded-lg transition-all duration-200 hover:bg-gray-50",
                      "p-4 md:p-6" // Moins de padding sur mobile
                    );
                    
                    if (showResult) {
                      if (isCorrectAnswer) {
                        buttonClass += " border-green-500 bg-green-50 text-green-800";
                      } else if (isSelected && !isCorrectAnswer) {
                        buttonClass += " border-red-500 bg-red-50 text-red-800";
                      } else {
                        buttonClass += " border-gray-200 text-gray-600";
                      }
                    } else {
                      if (isSelected) {
                        buttonClass += " border-champagne-gold bg-champagne-gold/10 text-palace-navy";
                      } else {
                        buttonClass += " border-gray-200 hover:border-champagne-gold/50";
                      }
                    }

                    return (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(index)}
                        disabled={showResult}
                        className={buttonClass}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-8 h-8 rounded-full border-2 flex items-center justify-center font-semibold",
                            showResult && isCorrectAnswer && "border-green-500 bg-green-500 text-white",
                            showResult && isSelected && !isCorrectAnswer && "border-red-500 bg-red-500 text-white",
                            !showResult && isSelected && "border-champagne-gold bg-champagne-gold text-palace-navy",
                            !showResult && !isSelected && "border-gray-300"
                          )}>
                            {String.fromCharCode(65 + index)} {/* A, B, C, D */}
                          </div>
                          <span className="flex-1">{option}</span>
                          {showResult && isCorrectAnswer && (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          )}
                          {showResult && isSelected && !isCorrectAnswer && (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Explication après réponse */}
                {showResult && currentQuestion.explanation && (
                  <div className={cn(
                    "rounded-lg border",
                    "p-3 md:p-4", // Moins de padding sur mobile
                    isCorrect 
                      ? "border-green-200 bg-green-50" 
                      : "border-orange-200 bg-orange-50"
                  )}>
                    <div className="flex items-start gap-3">
                      {isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-medium mb-1">
                          {isCorrect ? "Bonne réponse !" : "Réponse incorrecte"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {currentQuestion.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuizzModal;