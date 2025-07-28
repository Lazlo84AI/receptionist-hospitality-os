import { useState } from 'react';
import { FileText, Mic, ClipboardCheck, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';

const MesShifts = () => {
  const [expandedShift, setExpandedShift] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const shiftsData = [
    {
      id: 1,
      date: "27 Janvier 2025",
      horaires: "06h00 - 14h00",
      noteVocale: {
        duree: "3 min 45s",
        contenu: "Shift calme, 3 arrivées VIP prévues à 15h. Problème climatisation chambre 205 résolu."
      },
      cartes: [
        { type: "Incident", titre: "Climatisation chambre 205", statut: "Résolu", priorite: "Haute" },
        { type: "Demande client", titre: "Room service chambre 312", statut: "Terminé", priorite: "Normale" },
        { type: "Maintenance", titre: "Vérification ascenseur", statut: "En cours", priorite: "Normale" }
      ],
      questionnaires: [
        { nom: "Service client excellence", score: "18/20", date: "27/01 - 13h30" },
        { nom: "Procédures check-in", score: "20/20", date: "27/01 - 08h15" }
      ]
    },
    {
      id: 2,
      date: "25 Janvier 2025",
      horaires: "14h00 - 22h00",
      noteVocale: {
        duree: "2 min 12s",
        contenu: "Soirée chargée, groupe de 15 personnes arrivé. Problème mineur avec le système de cartes."
      },
      cartes: [
        { type: "Incident", titre: "Système cartes défaillant", statut: "Résolu", priorite: "Critique" },
        { type: "Demande client", titre: "Lit bébé chambre 158", statut: "Terminé", priorite: "Normale" },
        { type: "Réservation", titre: "Groupe 15 pers - check-in", statut: "Terminé", priorite: "Haute" }
      ],
      questionnaires: [
        { nom: "Gestion des groupes", score: "17/20", date: "25/01 - 21h45" }
      ]
    },
    {
      id: 3,
      date: "23 Janvier 2025",
      horaires: "22h00 - 06h00",
      noteVocale: {
        duree: "1 min 58s",
        contenu: "Shift de nuit tranquille. Deux arrivées tardives. Rondes de sécurité effectuées."
      },
      cartes: [
        { type: "Sécurité", titre: "Ronde de nuit 1", statut: "Terminé", priorite: "Normale" },
        { type: "Sécurité", titre: "Ronde de nuit 2", statut: "Terminé", priorite: "Normale" },
        { type: "Demande client", titre: "Réveil 5h30 chambre 89", statut: "Programmé", priorite: "Normale" }
      ],
      questionnaires: [
        { nom: "Sécurité de nuit", score: "19/20", date: "23/01 - 05h30" },
        { nom: "Procédures d'urgence", score: "20/20", date: "23/01 - 03h15" }
      ]
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critique': return 'bg-red-500';
      case 'Haute': return 'bg-orange-500';
      case 'Normale': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Résolu': case 'Terminé': return 'bg-green-500';
      case 'En cours': return 'bg-yellow-500';
      case 'Programmé': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Title Section with white background */}
      <div className="bg-white border-b border-champagne-gold/20">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-playfair font-semibold text-palace-navy">
            Mes Shifts
          </h1>
          <p className="text-palace-navy/70 text-sm mt-1">
            Historique de vos trois derniers shifts
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="space-y-6">
          {shiftsData.map((shift) => (
            <Card key={shift.id} className="bg-palace-navy/95 border border-champagne-gold/20">
              <Collapsible 
                open={expandedShift === shift.id}
                onOpenChange={() => setExpandedShift(expandedShift === shift.id ? null : shift.id)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-palace-navy/80 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-warm-cream flex items-center gap-3">
                          <FileText className="h-5 w-5 text-champagne-gold" />
                          Shift du {shift.date}
                        </CardTitle>
                        <p className="text-soft-pewter text-sm mt-1">
                          {shift.horaires}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-champagne-gold hover:text-warm-cream">
                        {expandedShift === shift.id ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="space-y-6 bg-palace-navy">
                    {/* Note vocale */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-warm-cream flex items-center gap-2">
                        <Mic className="h-4 w-4 text-champagne-gold" />
                        Note vocale
                      </h3>
                      <div className="bg-palace-navy/50 border border-champagne-gold/20 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="border-champagne-gold/30 text-champagne-gold">
                            {shift.noteVocale.duree}
                          </Badge>
                        </div>
                        <p className="text-warm-cream">{shift.noteVocale.contenu}</p>
                      </div>
                    </div>

                    {/* Cartes et détails */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-warm-cream flex items-center gap-2">
                        <FileText className="h-4 w-4 text-champagne-gold" />
                        Cartes et détails
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {shift.cartes.map((carte, index) => (
                          <div key={index} className="bg-palace-navy/50 border border-champagne-gold/20 rounded-lg p-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className="border-champagne-gold/30 text-champagne-gold text-xs">
                                  {carte.type}
                                </Badge>
                                <div className="flex gap-1">
                                  <div className={`w-2 h-2 rounded-full ${getPriorityColor(carte.priorite)}`} />
                                  <div className={`w-2 h-2 rounded-full ${getStatusColor(carte.statut)}`} />
                                </div>
                              </div>
                              <h4 className="font-medium text-warm-cream text-sm">{carte.titre}</h4>
                              <div className="flex justify-between text-xs">
                                <span className="text-soft-pewter">Priorité: {carte.priorite}</span>
                                <span className="text-soft-pewter">Statut: {carte.statut}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Questionnaires */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-warm-cream flex items-center gap-2">
                        <ClipboardCheck className="h-4 w-4 text-champagne-gold" />
                        Questionnaires répondus
                      </h3>
                      <div className="space-y-3">
                        {shift.questionnaires.map((questionnaire, index) => (
                          <div key={index} className="bg-palace-navy/50 border border-champagne-gold/20 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-warm-cream">{questionnaire.nom}</h4>
                                <p className="text-soft-pewter text-sm">{questionnaire.date}</p>
                              </div>
                              <Badge 
                                variant="outline" 
                                className="border-green-500/30 text-green-400 bg-green-500/10"
                              >
                                {questionnaire.score}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MesShifts;