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
  }>;
}

export function LocationSection({ formData, setFormData, locations }: LocationSectionProps) {
  const [isStaffAreasOpen, setIsStaffAreasOpen] = useState(false);

  // Filter locations by type
  const rooms = locations
    .filter(location => location.type === 'room')
    .map(location => location.name)
    .sort((a, b) => {
      // Try to sort by number if both have numbers, otherwise alphabetically
      const numA = parseInt(a.match(/\d+/)?.[0] || '0');
      const numB = parseInt(b.match(/\d+/)?.[0] || '0');
      if (numA && numB) return numA - numB;
      return a.localeCompare(b);
    });
    
  const commonAreas = locations
    .filter(location => location.type === 'common_area')
    .map(location => location.name)
    .sort();
    
  const staffAreas = locations
    .filter(location => location.type === 'staff_area')
    .map(location => location.name)
    .sort();

  const handleLocationSelect = (location: string) => {
    setFormData(prev => ({ ...prev, location }));
  };

  // Don't show staff areas for client requests
  const showStaffAreas = formData.category !== 'client_request';

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Location</label>
      <div className="grid grid-cols-2 gap-4">
        {/* Rooms */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Rooms</h4>
          <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border border-border rounded-md">
            {rooms.map((room) => (
              <Button
                key={room}
                variant={formData.location === room ? "default" : "outline"}
                className="h-8 text-xs px-1"
                onClick={() => handleLocationSelect(room)}
              >
                {room}
              </Button>
            ))}
          </div>
        </div>

        {/* Common Areas */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Common Areas</h4>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-border rounded-md">
            {commonAreas.map((area) => (
              <Button
                key={area}
                variant={formData.location === area ? "default" : "outline"}
                className="text-xs h-8"
                onClick={() => handleLocationSelect(area)}
              >
                {area}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Staff Areas - Collapsible (not shown for client requests) */}
      {showStaffAreas && (
        <Collapsible open={isStaffAreasOpen} onOpenChange={setIsStaffAreasOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className="w-full flex items-center justify-between"
            >
              <span className="text-sm font-medium">Staff Areas</span>
              {isStaffAreasOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border border-border rounded-md">
              {staffAreas.map((area) => (
                <Button
                  key={area}
                  variant={formData.location === area ? "default" : "outline"}
                  className="text-xs h-8"
                  onClick={() => handleLocationSelect(area)}
                >
                  {area}
                </Button>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}