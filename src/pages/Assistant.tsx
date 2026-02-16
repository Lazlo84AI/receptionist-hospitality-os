import { useState } from 'react';
import { Send, FileText, X, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { AssistantFloatingRAGUpload } from '@/components/AssistantFloatingRAGUpload';

const Assistant = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [confidence, setConfidence] = useState<'high' | 'medium' | 'bad' | null>(null);
  const [sources, setSources] = useState<string[]>([]);
  const [actionSteps, setActionSteps] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSubmit = async () => {
    if (!question.trim()) return;
    
    setIsLoading(true);
    setResponse('');
    setConfidence(null);
    setSources([]);
    setActionSteps([]);
    
    try {
      // Appel au webhook N8N
      const webhookResponse = await fetch('https://sokle.app.n8n.cloud/webhook/intelligent_assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.trim(),
          user_id: user?.id || 'anonymous',
          timestamp: new Date().toISOString(),
        }),
      });

      if (!webhookResponse.ok) {
        throw new Error(`HTTP error! status: ${webhookResponse.status}`);
      }

      const data = await webhookResponse.json();
      
      // Si c'est un array, prendre le premier élément
      let processedData = data;
      if (Array.isArray(data)) {
        processedData = data[0];
      }
      
      // Stocke toutes les données reçues
      setResponse(processedData.answer || processedData.response || 'Réponse reçue mais format inattendu');
      setConfidence(processedData.confidence || null);
      setSources(processedData.sources || []);
      setActionSteps(processedData.action_steps || []);
      
      // Succès notification
      toast({
        title: "Réponse reçue",
        description: "L'assistant a traité votre question.",
      });
      
    } catch (error) {
      console.error('Erreur lors de l\'appel au webhook:', error);
      
      setResponse('Désolé, une erreur est survenue lors du traitement de votre question. Veuillez réessayer.');
      
      toast({
        title: "Erreur",
        description: "Impossible de contacter l'assistant intelligent.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper pour afficher le point de confidence
  const getConfidenceIndicator = () => {
    if (!confidence) return null;
    
    const configs = {
      high: { label: 'High', color: 'bg-green-500' },
      medium: { label: 'Medium', color: 'bg-orange-500' },
      bad: { label: 'Bad', color: 'bg-red-500' }
    };
    
    // Normalise et vérifie
    const normalizedConfidence = confidence?.toString().trim().toLowerCase();
    const config = configs[normalizedConfidence];
    
    // Protection : si config invalide, ne rien afficher
    if (!config) {
      console.warn('⚠️ Invalid confidence value:', confidence);
      return null;
    }
    
    return (
      <span className="flex items-center gap-2 text-xs text-gray-600">
        <span>Confidence about the answer:</span>
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${config.color}`}></span>
          <span className="font-medium text-palace-navy">{config.label}</span>
        </span>
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Section */}
        <div className="text-left mb-8 bg-white rounded-lg p-6 shadow-sm border border-champagne-gold/20">
          <h1 className="text-3xl font-playfair font-semibold text-palace-navy mb-2">
            Intelligent Assistant
          </h1>
          <p className="text-gray-600 text-lg">
            Ask your questions and get instant answers
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Side - Input */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-warm-cream">
                Question Input
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Text Input */}
              <div className="space-y-3">
                <Textarea
                  placeholder="Type your question here…"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="min-h-32 resize-none border-champagne-gold/20 focus:border-champagne-gold"
                />
                
                <Button 
                  onClick={handleSubmit}
                  className="w-full bg-champagne-gold text-palace-navy hover:bg-champagne-gold/90"
                  disabled={!question.trim() || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send your question
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Right Side - Response */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-warm-cream">Assistant Response</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-12 bg-champagne-gold/10 rounded-lg border-2 border-champagne-gold/30">
                  <Loader2 className="h-12 w-12 mx-auto mb-4 text-champagne-gold animate-spin" />
                  <p className="text-lg font-medium text-palace-navy mb-2">Processing your question...</p>
                  <p className="text-sm text-gray-700">The AI assistant is analyzing your request</p>
                </div>
              ) : response ? (
                <div className="space-y-4">
                  <div className="bg-[#BBA57A]/30 rounded-lg p-6 shadow-sm border border-[#BBA57A]">
                    <div className="flex items-start gap-3">
                      <div className="bg-[#BBA57A] text-white p-2 rounded-full">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-palace-navy">Assistant Response</h3>
                          {getConfidenceIndicator()}
                        </div>
                        <p className="text-gray-800 leading-relaxed">
                          {response}
                        </p>
                        
                        {/* Action Steps */}
                        {actionSteps && actionSteps.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-semibold text-palace-navy text-sm mb-2">Actions à suivre :</h4>
                            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                              {actionSteps.map((step, index) => (
                                <li key={index}>{step}</li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* View Sources Button - Always show */}
                  <div className="flex justify-center">
                    <Button
                      onClick={() => setShowSources(true)}
                      variant="outline"
                      className="border-champagne-gold/30 hover:border-champagne-gold text-champagne-gold hover:bg-champagne-gold/10"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Sources ({sources.length})
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <div className="text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Waiting for your question</p>
                    <p className="text-sm">Ask a question to receive a personalized response</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sources Modal */}
      <Dialog open={showSources} onOpenChange={setShowSources}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Sources Documents</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSources(false)}
                className="hover:bg-palace-navy/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {sources && sources.length > 0 ? (
              sources.map((source, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-champagne-gold/10 rounded-lg border border-champagne-gold/30">
                  <FileText className="h-5 w-5 text-champagne-gold flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-palace-navy">{source}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">Aucune source disponible</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Bouton flottant RAG Upload */}
      <AssistantFloatingRAGUpload />
    </div>
  );
};

export default Assistant;
