import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationSectionProps {
  formData: {
    location: string;
    category: string;
  };
  setFormData: (updater: (prev: any) => any) => void;
  locations: Array<{
    id: string;
    name: string;
    type: string;
    floor?: number | null;
  }>;
}

export function LocationSection({ formData, setFormData, locations }: LocationSectionProps) {
  const [openSections, setOpenSections] = useState<{
    rooms: boolean;
    commonAreas: boolean;
    staffAreas: boolean;
    [key: string]: boolean;
  }>({
    rooms: false,
    commonAreas: false,
    staffAreas: false,
  });

  const handleLocationSelect = (location: string) => {
    setFormData(prev => ({ ...prev, location }));
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
  
  const staffAreasByFloor = groupLocationsByFloor(
    locations.filter(location => location.type === 'staff_area')
  );

  // Don't show staff areas for client requests
  const showStaffAreas = formData.category !== 'client_request';

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
                      variant={formData.location === location.name ? "default" : "outline"}
                      className="h-8 text-xs px-2"
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

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium">Location</label>
      
      <div className="space-y-3">
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

        {/* Staff Areas Section */}
        {showStaffAreas && (
          <FloorSection
            title="🧰 Staff Areas"
            locationsByFloor={staffAreasByFloor}
            sectionKey="staffAreas"
          />
        )}
      </div>
    </div>
  );
}