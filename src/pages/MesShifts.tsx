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
      date: "27 January 2025",
      horaires: "06:00 AM - 02:00 PM",
      noteVocale: {
        duree: "3 min 45s",
        contenu: "Quiet shift, 3 VIP arrivals scheduled at 3 PM. Air conditioning problem in room 205 resolved."
      },
      cartes: [
        { type: "Incident", titre: "Room 205 air conditioning", statut: "Resolved", priorite: "High" },
        { type: "Client request", titre: "Room service room 312", statut: "Completed", priorite: "Normal" },
        { type: "Maintenance", titre: "Elevator check", statut: "In progress", priorite: "Normal" }
      ],
      questionnaires: [
        { nom: "Customer service excellence", score: "18/20", date: "27/01 - 1:30 PM" },
        { nom: "Check-in procedures", score: "20/20", date: "27/01 - 8:15 AM" }
      ]
    },
    {
      id: 2,
      date: "25 January 2025",
      horaires: "02:00 PM - 10:00 PM",
      noteVocale: {
        duree: "2 min 12s",
        contenu: "Busy evening, group of 15 people arrived. Minor problem with card system."
      },
      cartes: [
        { type: "Incident", titre: "Card system failure", statut: "Resolved", priorite: "Critical" },
        { type: "Client request", titre: "Baby crib room 158", statut: "Completed", priorite: "Normal" },
        { type: "Reservation", titre: "Group 15 people - check-in", statut: "Completed", priorite: "High" }
      ],
      questionnaires: [
        { nom: "Group management", score: "17/20", date: "25/01 - 9:45 PM" }
      ]
    },
    {
      id: 3,
      date: "23 January 2025",
      horaires: "10:00 PM - 06:00 AM (next day)",
      noteVocale: {
        duree: "1 min 58s",
        contenu: "Quiet night shift. Two late arrivals. Security rounds completed."
      },
      cartes: [
        { type: "Security", titre: "Night round 1", statut: "Completed", priorite: "Normal" },
        { type: "Security", titre: "Night round 2", statut: "Completed", priorite: "Normal" },
        { type: "Client request", titre: "5:30 AM wake-up call room 89", statut: "Scheduled", priorite: "Normal" }
      ],
      questionnaires: [
        { nom: "Night security", score: "19/20", date: "23/01 - 5:30 AM" },
        { nom: "Emergency procedures", score: "20/20", date: "23/01 - 3:15 AM" }
      ]
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-500';
      case 'High': return 'bg-orange-500';
      case 'Normal': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved': case 'Completed': return 'bg-green-500';
      case 'In progress': return 'bg-yellow-500';
      case 'Scheduled': return 'bg-blue-500';
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
            My Shifts
          </h1>
          <p className="text-palace-navy/70 text-sm mt-1">
            History of your last three shifts
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
                          Shift on {shift.date}
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
                        Voice note
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
                        Cards and details
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
                                <span className="text-soft-pewter">Priority: {carte.priorite}</span>
                                <span className="text-soft-pewter">Status: {carte.statut}</span>
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
                        Completed questionnaires
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