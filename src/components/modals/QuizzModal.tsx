import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, ChevronLeft, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface QuizzModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  questions?: QuizQuestion[];
}

const defaultQuestions: QuizQuestion[] = [
  {
    id: "1",
    question: "Que faut-il impérativement mettre dans le chafing-dish pour les oeufs brouillés ?",
    options: [
      "Du sel",
      "Du lait", 
      "De l'eau",
      "Du fromage"
    ],
    correctAnswer: 2, // De l'eau
    explanation: "Il faut toujours mettre de l'eau dans le chafing-dish pour maintenir une température douce et éviter que les œufs ne collent ou brûlent."
  },
  {
    id: "2", 
    question: "Quelle est la température idéale pour servir le café au petit-déjeuner ?",
    options: [
      "60-65°C",
      "70-75°C",
      "80-85°C", 
      "90-95°C"
    ],
    correctAnswer: 2, // 80-85°C
    explanation: "La température optimale pour servir le café est entre 80-85°C, permettant une dégustation agréable sans brûler les papilles."
  },
  {
    id: "3",
    question: "Combien de temps maximum peut-on laisser des produits laitiers à température ambiante ?",
    options: [
      "30 minutes",
      "1 heure", 
      "2 heures",
      "4 heures"
    ],
    correctAnswer: 2, // 2 heures
    explanation: "Les produits laitiers ne doivent pas rester plus de 2 heures à température ambiante pour éviter la prolifération bactérienne."
  }
];

const QuizzModal = ({ 
  isOpen, 
  onClose, 
  title = "Training Assessment",
  questions = defaultQuestions 
}: QuizzModalProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: number }>({});
  const [showResult, setShowResult] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progressPercentage = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  const handleAnswerSelect = (answerIndex: number) => {
    if (!showResult) {
      setSelectedAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: answerIndex
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
  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
  const hasSelectedAnswer = selectedAnswer !== undefined;

  const calculateScore = () => {
    let correct = 0;
    questions.forEach(question => {
      if (selectedAnswers[question.id] === question.correctAnswer) {
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
    const score = calculateScore();
    const passed = score >= 70;

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
                    {passed 
                      ? "Vous avez réussi l'évaluation ! Votre formation est validée."
                      : "Un score minimum de 70% est requis. Révisez le contenu et essayez à nouveau."
                    }
                  </p>

                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={resetQuiz}
                      className="flex-1"
                    >
                      Recommencer
                    </Button>
                    <Button 
                      onClick={onClose}
                      className="flex-1"
                      variant={passed ? "default" : "secondary"}
                    >
                      {passed ? "Terminer" : "Réviser"}
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
          {/* Header avec progression */}
          <div className="bg-white border-b px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-palace-navy">{title}</h2>
                <span className="text-sm text-muted-foreground">
                  Question {currentQuestionIndex + 1} sur {totalQuestions}
                </span>
              </div>
              
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
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
          <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
            <div className="bg-white rounded-lg shadow-sm border max-w-3xl w-full p-8">
              <div className="space-y-8">
                {/* Question */}
                <div className="text-center">
                  <h3 className="text-2xl font-medium text-palace-navy mb-4">
                    {currentQuestion.question}
                  </h3>
                </div>

                {/* Options de réponse */}
                <div className="space-y-4">
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = selectedAnswer === index;
                    const isCorrectAnswer = index === currentQuestion.correctAnswer;
                    
                    let buttonClass = "w-full p-6 text-left border-2 rounded-lg transition-all duration-200 hover:bg-gray-50";
                    
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
                    "p-4 rounded-lg border",
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

          {/* Footer navigation */}
          <div className="bg-white border-t px-6 py-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>

              <span className="text-sm text-muted-foreground">
                {currentQuestionIndex + 1} / {totalQuestions}
              </span>

              {!showResult ? (
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={!hasSelectedAnswer}
                  className="bg-champagne-gold hover:bg-champagne-gold/80 text-palace-navy"
                >
                  Valider
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuizzModal;