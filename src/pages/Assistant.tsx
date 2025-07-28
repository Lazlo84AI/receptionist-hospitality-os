import { useState } from 'react';
import { Mic, Send, FileText, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const Assistant = () => {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showPdf, setShowPdf] = useState(false);

  const handleVoiceInput = () => {
    setIsRecording(!isRecording);
    // Ici on intégrerait la logique de reconnaissance vocale
  };

  const handleSubmit = () => {
    if (!question.trim()) return;
    
    // Simulation d'une réponse
    setResponse(`Voici la réponse à votre question : "${question}". Cette réponse est générée automatiquement par l'assistant IA pour vous aider dans vos tâches quotidiennes.`);
  };

  return (
    <div className="min-h-screen bg-background">

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Section */}
        <div className="text-center mb-8 bg-white rounded-lg p-6 shadow-sm border border-champagne-gold/20">
          <h1 className="text-3xl font-playfair font-semibold text-palace-navy mb-2">
            Assistant Intelligent
          </h1>
          <p className="text-gray-600 text-lg">
            Posez vos questions et obtenez des réponses instantanées
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Side - Input */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-warm-cream flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Votre Question
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Voice Input Button */}
              <div className="flex justify-center">
                <Button
                  onClick={handleVoiceInput}
                  variant={isRecording ? "destructive" : "default"}
                  size="lg"
                  className={`rounded-full h-16 w-16 ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                      : 'bg-champagne-gold hover:bg-champagne-gold/90 text-palace-navy border-none'
                  }`}
                >
                  <Mic className="h-6 w-6" />
                </Button>
              </div>
              
              {isRecording && (
                <p className="text-center text-sm text-soft-pewter">
                  🎤 Enregistrement en cours...
                </p>
              )}

              <div className="text-center text-soft-pewter">
                <span className="text-xs">ou</span>
              </div>

              {/* Text Input */}
              <div className="space-y-3">
                <Textarea
                  placeholder="Tapez votre question ici..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="min-h-32 resize-none border-champagne-gold/20 focus:border-champagne-gold"
                />
                
                <Button 
                  onClick={handleSubmit}
                  className="w-full bg-champagne-gold text-palace-navy hover:bg-champagne-gold/90"
                  disabled={!question.trim()}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer la question
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Right Side - Response */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-warm-cream">Réponse de l'Assistant</CardTitle>
            </CardHeader>
            <CardContent>
              {response ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-500 text-white p-2 rounded-full">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-blue-900 mb-2">Réponse de l'Assistant</h3>
                        <p className="text-gray-800 leading-relaxed">
                          {response}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* PDF Link */}
                  <div className="flex justify-center">
                    <Button
                      onClick={() => setShowPdf(true)}
                      variant="outline"
                      className="border-champagne-gold/30 hover:border-champagne-gold text-champagne-gold hover:bg-champagne-gold/10"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Voir le document PDF
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <div className="text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">En attente de votre question</p>
                    <p className="text-sm">Posez une question pour recevoir une réponse personnalisée</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* PDF Modal */}
      <Dialog open={showPdf} onOpenChange={setShowPdf}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Document de référence</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPdf(false)}
                className="hover:bg-palace-navy/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="bg-gray-100 h-96 rounded-lg flex items-center justify-center">
            <div className="text-center space-y-2">
              <FileText className="h-16 w-16 mx-auto text-gray-400" />
              <p className="text-gray-600">Aperçu du document PDF</p>
              <p className="text-sm text-gray-500">
                Le contenu du PDF s'afficherait ici en mode réel
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Assistant;