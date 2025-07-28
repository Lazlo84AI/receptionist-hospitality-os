import { useState } from 'react';
import { Mic, Send, FileText, X } from 'lucide-react';
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
      {/* Header */}
      <div className="border-b border-champagne-gold/20 bg-palace-navy/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-playfair font-semibold text-warm-cream">
            Assistant Intelligent
          </h1>
          <p className="text-soft-pewter text-sm mt-1">
            Posez vos questions et obtenez des réponses instantanées
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
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
                  variant={isRecording ? "destructive" : "outline"}
                  size="lg"
                  className={`rounded-full h-16 w-16 ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                      : 'border-champagne-gold/30 hover:border-champagne-gold text-warm-cream'
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
                  <div className="bg-palace-navy/10 border border-champagne-gold/20 rounded-lg p-4">
                    <p className="text-warm-cream leading-relaxed">
                      {response}
                    </p>
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
                <div className="text-center py-12">
                  <div className="text-soft-pewter">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Posez une question pour recevoir une réponse personnalisée</p>
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