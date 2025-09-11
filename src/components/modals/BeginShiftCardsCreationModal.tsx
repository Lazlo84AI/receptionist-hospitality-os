import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { X, PlayCircle, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocations } from '@/hooks/useSupabaseData';

interface BeginShiftCardsCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCards: (selectedLocations: Array<{ name: string; type: string }>) => void;
}

const BeginShiftCardsCreationModal: React.FC<BeginShiftCardsCreationModalProps> = ({
  isOpen,
  onClose,
  onCreateCards
}) => {
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
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

  const { locations, loading, error } = useLocations();

  console.log('🏗️ Modal 2 - Cards Creation rendering, isOpen:', isOpen);

  const handleLocationSelect = (location: string) => {
    setSelectedLocations(prev => 
      prev.includes(location) 
        ? prev.filter(loc => loc !== location)
        : [...prev, location]
    );
  };

  const handleCreateCards = () => {
    console.log('🏗️ Creating cards for:', selectedLocations);
    
    // Créer un mapping des locations avec leurs types
    const selectedLocationsWithTypes = selectedLocations.map(locationName => {
      const location = locations.find(loc => loc.name === locationName);
      return {
        name: locationName,
        type: location?.type || 'unknown'
      };
    });
    
    onCreateCards(selectedLocationsWithTypes);
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
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
    sectionKey 
  }: { 
    title: string; 
    locationsByFloor: { [floor: string]: typeof locations }; 
    sectionKey: string;
  }) => (
    <Collapsible 
      open={openSections[sectionKey]} 
      onOpenChange={() => toggleSection(sectionKey)}
    >
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          className="w-full flex items-center justify-between mb-2"
        >
          <span className="text-sm font-medium">{title}</span>
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
                className="w-full flex items-center justify-between text-sm"
              >
                <span>{floor}</span>
                {openSections[`${sectionKey}-${floor}`] ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="grid grid-cols-4 gap-2 p-2 border border-border rounded-md">
                {locationsByFloor[floor]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((location) => (
                    <Button
                      key={location.id}
                      variant={selectedLocations.includes(location.name) ? "default" : "outline"}
                      className={cn(
                        "h-8 text-xs px-2",
                        selectedLocations.includes(location.name)
                          ? "bg-gray-800 hover:bg-gray-900 text-white border-gray-800"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      )}
                      onClick={() => handleLocationSelect(location.name)}
                    >
                      {location.name}
                    </Button>
                  ))
                }
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );

  const selectedCount = selectedLocations.length;

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading locations...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-red-600 mb-4">Error loading locations: {error}</p>
              <Button onClick={onClose} variant="outline">Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <PlayCircle className="h-4 w-4 text-gray-700" />
            </div>
            <DialogTitle className="text-xl font-semibold">
              Begin shift - How many cards to create
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Content scrollable */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-shrink-0 py-4">
            <p className="text-gray-600 mb-6">
              Select locations to create one daily task card for each selected area
            </p>

            {/* Affichage des locations sélectionnées - STICKY - EN JAUNE */}
            {selectedCount > 0 && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">Selected Locations ({selectedCount}):</h4>
                <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                  {selectedLocations.map(locationName => (
                    <span 
                      key={locationName}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-sm"
                    >
                      {locationName}
                      <button
                        onClick={() => handleLocationSelect(locationName)}
                        className="ml-1 hover:bg-yellow-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Locations hiérarchiques - SCROLLABLE */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-4">
              {/* Rooms Section */}
              <FloorSection
                title="🛏️ Rooms"
                locationsByFloor={roomsByFloor}
                sectionKey="rooms"
              />

              {/* Common Areas Section */}
              <FloorSection
                title="🧭 Common Areas"
                locationsByFloor={commonAreasByFloor}
                sectionKey="commonAreas"
              />

              {/* Public Areas Section */}
              <FloorSection
                title="🏢 Public Areas"
                locationsByFloor={publicAreasByFloor}
                sectionKey="publicAreas"
              />

              {/* Staff Areas Section */}
              <FloorSection
                title="🧰 Staff Areas"
                locationsByFloor={staffAreasByFloor}
                sectionKey="staffAreas"
              />
            </div>
          </div>
        </div>

        {/* Footer FIXE */}
        <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedCount} carte{selectedCount !== 1 ? 's' : ''} à créer • {locations.length} location{locations.length !== 1 ? 's' : ''} disponible{locations.length !== 1 ? 's' : ''}
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={onClose}>
                Annuler
              </Button>
              <Button 
                onClick={handleCreateCards}
                disabled={selectedCount === 0}
                className={cn(
                  "px-6",
                  selectedCount > 0 
                    ? "bg-gray-800 hover:bg-gray-900 text-white" 
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                )}
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer {selectedCount} carte{selectedCount !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BeginShiftCardsCreationModal;