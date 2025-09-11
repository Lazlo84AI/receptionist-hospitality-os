import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  PlayCircle, 
  Plus,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocations } from '@/hooks/useSupabaseData';

interface ServiceShiftCardCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCards: (selectedLocations: string[]) => void;
}

const ServiceShiftCardCreationModal = ({
  isOpen,
  onClose,
  onCreateCards
}: ServiceShiftCardCreationModalProps) => {
  const { locations = [] } = useLocations();
  
  const [openSections, setOpenSections] = useState<{
    rooms: boolean;
    commonAreas: boolean;
    publicAreas: boolean;
    staffAreas: boolean;
    [key: string]: boolean;
  }>({
    rooms: false,
    commonAreas: false,
    publicAreas: false,
    staffAreas: false,
  });

  // État pour stocker les locations sélectionnées (1 carte max par lieu)
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleLocationSelection = (locationId: string) => {
    setSelectedLocations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(locationId)) {
        newSet.delete(locationId);
      } else {
        newSet.add(locationId);
      }
      return newSet;
    });
  };

  // Group locations by type and floor
  const groupLocationsByFloor = (locationsOfType: typeof locations) => {
    const grouped: { [floor: string]: typeof locations } = {};
    
    locationsOfType.forEach(location => {
      let floorKey: string;
      
      if (location.floor === -1) {
        floorKey = 'Basement';
      } else if (location.floor === 0) {
        floorKey = 'Ground Floor';
      } else {
        floorKey = `Floor ${location.floor}`;
      }
      
      if (!grouped[floorKey]) {
        grouped[floorKey] = [];
      }
      grouped[floorKey].push(location);
    });
    
    return grouped;
  };

  // Filter and group locations
  const roomsByFloor = groupLocationsByFloor(
    locations.filter(location => location.type === 'room')
  );
  
  const commonAreasByFloor = groupLocationsByFloor(
    locations.filter(location => location.type === 'common_area')
  );
  
  const publicAreasByFloor = groupLocationsByFloor(
    locations.filter(location => location.type === 'public_areas')
  );
  
  const staffAreasByFloor = groupLocationsByFloor(
    locations.filter(location => location.type === 'staff_area')
  );

  // Sort floor keys for display
  const sortFloors = (floors: string[]) => {
    return floors.sort((a, b) => {
      if (a === 'Basement') return -1;
      if (b === 'Basement') return 1;
      if (a === 'Ground Floor') return -1;
      if (b === 'Ground Floor') return 1;
      
      const numA = parseInt(a.replace('Floor ', ''));
      const numB = parseInt(b.replace('Floor ', ''));
      return numA - numB;
    });
  };

  const FloorSection = ({ 
    title, 
    locationsByFloor, 
    sectionKey,
    icon
  }: { 
    title: string; 
    locationsByFloor: { [floor: string]: typeof locations }; 
    sectionKey: string;
    icon: string;
  }) => (
    <Collapsible 
      open={openSections[sectionKey]} 
      onOpenChange={() => toggleSection(sectionKey)}
    >
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          className="w-full flex items-center justify-between mb-2 h-12"
        >
          <span className="text-sm font-medium flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            {title}
          </span>
          {openSections[sectionKey] ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3">
        {sortFloors(Object.keys(locationsByFloor)).map((floor) => (
          <Collapsible 
            key={floor}
            open={openSections[`${sectionKey}-${floor}`]} 
            onOpenChange={() => toggleSection(`${sectionKey}-${floor}`)}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full flex items-center justify-between text-sm h-10"
              >
                <span className="font-medium">{floor}</span>
                {openSections[`${sectionKey}-${floor}`] ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="space-y-2 p-3 border border-border rounded-md bg-muted/20">
                {locationsByFloor[floor]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((location) => {
                    const isSelected = selectedLocations.has(location.id);
                    return (
                      <div 
                        key={location.id}
                        className="flex items-center justify-between p-2 bg-white rounded border hover:bg-gray-50 cursor-pointer"
                        onClick={() => toggleLocationSelection(location.id)}
                      >
                        <span className="text-sm font-medium">{location.name}</span>
                        <Checkbox 
                          checked={isSelected}
                          onCheckedChange={() => {}} // Pas de handler ici pour éviter le double clic
                        />
                      </div>
                    );
                  })
                }
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );

  // Calculate total cards
  const totalCards = selectedLocations.size;
  const selectedLocationsList = Array.from(selectedLocations);

  const handleCreateCards = async () => {
    setIsCreating(true);
    try {
      // Import dynamique pour éviter les erreurs de build
      const { supabase } = await import('@/integrations/supabase/client');
      
      const createdCards = [];
      
      // Créer une carte pour chaque location sélectionnée
      for (const locationId of selectedLocationsList) {
        const location = locations.find(loc => loc.id === locationId);
        if (!location) continue;
        
        // Créer une tâche personnelle pour cette location
        const taskData = {
          title: `Service - ${location.name}`,
          description: `Daily service task for ${location.name}`,
          location: location.name,
          room_number: location.type === 'room' ? location.name : null,
          priority: 'medium' as const,
          status: 'pending' as const,
          type: 'daily_service' as const,
          due_date: new Date().toISOString().split('T')[0], // Aujourd'hui
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
          .from('internal_tasks')
          .insert([taskData])
          .select()
          .single();
          
        if (error) {
          console.error('Error creating task for location:', location.name, error);
        } else {
          createdCards.push(data);
        }
      }
      
      console.log(`Created ${createdCards.length} daily task cards`);
      onCreateCards(selectedLocationsList);
    } catch (error) {
      console.error('Error creating daily task cards:', error);
      // Fallback - continuer quand même
      onCreateCards(selectedLocationsList);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-3">
            <PlayCircle className="w-6 h-6 text-blue-600" />
            Begin shift - How many cards to create
          </DialogTitle>
        </DialogHeader>

        <div className="px-6">
          <p className="text-muted-foreground mb-6">
            Select locations to create one daily task card for each selected area
          </p>
        </div>

        {/* Content scrollable */}
        <ScrollArea className="flex-1 px-6 max-h-[60vh]">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <label className="text-sm font-medium block mb-4">
                  Location
                </label>
                
                <div className="space-y-3">
                  {/* Rooms Section */}
                  <FloorSection
                    title="Rooms"
                    icon="🛏️"
                    locationsByFloor={roomsByFloor}
                    sectionKey="rooms"
                  />

                  {/* Common Areas Section */}
                  <FloorSection
                    title="Common Areas"
                    icon="🧭"
                    locationsByFloor={commonAreasByFloor}
                    sectionKey="commonAreas"
                  />

                  {/* Public Areas Section */}
                  <FloorSection
                    title="Public Areas"
                    icon="🏢"
                    locationsByFloor={publicAreasByFloor}
                    sectionKey="publicAreas"
                  />

                  {/* Staff Areas Section */}
                  <FloorSection
                    title="Staff Areas"
                    icon="🧰"
                    locationsByFloor={staffAreasByFloor}
                    sectionKey="staffAreas"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t p-6 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>{totalCards} carte(s) à créer</span>
              <span>•</span>
              <span>{selectedLocationsList.length} location(s) sélectionnée(s)</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button 
              onClick={handleCreateCards}
              disabled={totalCards === 0 || isCreating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isCreating ? 'Création...' : `Créer ${totalCards} carte(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceShiftCardCreationModal;