import { Button } from '@/components/ui/button';

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
  // Group rooms by floor
  const roomsByFloor = locations
    .filter(location => location.type === 'room')
    .reduce((acc, location) => {
      const floor = location.floor || 0;
      if (!acc[floor]) acc[floor] = [];
      acc[floor].push(location);
      return acc;
    }, {} as Record<number, typeof locations>);

  // Group common areas by floor
  const commonAreasByFloor = locations
    .filter(location => location.type === 'common_area')
    .reduce((acc, location) => {
      const floor = location.floor;
      const key = floor === null ? 'other' : floor.toString();
      if (!acc[key]) acc[key] = [];
      acc[key].push(location);
      return acc;
    }, {} as Record<string, typeof locations>);

  // Staff areas (basement)
  const staffAreas = locations
    .filter(location => location.type === 'staff_area')
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleLocationSelect = (location: typeof locations[0]) => {
    setFormData(prev => ({ ...prev, location: location.name }));
  };

  const getFloorLabel = (floor: number) => {
    if (floor === -1) return 'Basement';
    if (floor === 0) return 'Ground Floor';
    return `Floor ${floor}`;
  };

  // Don't show staff areas for client requests
  const showStaffAreas = formData.category !== 'client_request';

  return (
    <div className="space-y-6">
      <label className="text-sm font-medium">Location</label>
      
      {/* 🛏️ Rooms */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold flex items-center gap-2">
          🛏️ Rooms
        </h3>
        {Object.keys(roomsByFloor)
          .map(Number)
          .sort((a, b) => a - b)
          .map(floor => (
            <div key={floor} className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                {getFloorLabel(floor)}
              </h4>
              <div className="grid grid-cols-6 gap-2">
                {roomsByFloor[floor]
                  .sort((a, b) => {
                    const numA = parseInt(a.name.match(/\d+/)?.[0] || '0');
                    const numB = parseInt(b.name.match(/\d+/)?.[0] || '0');
                    return numA - numB;
                  })
                  .map((room) => (
                    <Button
                      key={room.id}
                      variant={formData.location === room.name ? "default" : "outline"}
                      className="h-8 text-xs"
                      onClick={() => handleLocationSelect(room)}
                      data-name={room.name}
                      data-type={room.type}
                      data-floor={room.floor}
                    >
                      {room.name}
                    </Button>
                  ))}
              </div>
            </div>
          ))}
      </div>

      {/* 🧭 Common Areas */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold flex items-center gap-2">
          🧭 Common Areas
        </h3>
        {/* Sort floors: basement (-1), then 0-6 */}
        {[-1, 0, 1, 2, 3, 4, 5, 6]
          .filter(floor => commonAreasByFloor[floor.toString()])
          .map(floor => (
            <div key={floor} className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                {getFloorLabel(floor)}
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {commonAreasByFloor[floor.toString()]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((area) => (
                    <Button
                      key={area.id}
                      variant={formData.location === area.name ? "default" : "outline"}
                      className="text-xs h-8 text-left justify-start"
                      onClick={() => handleLocationSelect(area)}
                      data-name={area.name}
                      data-type={area.type}
                      data-floor={area.floor}
                    >
                      {area.name}
                    </Button>
                  ))}
              </div>
            </div>
          ))}
        
        {/* Other Common Areas (no floor) */}
        {commonAreasByFloor['other'] && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Other Common Areas
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {commonAreasByFloor['other']
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((area) => (
                  <Button
                    key={area.id}
                    variant={formData.location === area.name ? "default" : "outline"}
                    className="text-xs h-8 text-left justify-start"
                    onClick={() => handleLocationSelect(area)}
                    data-name={area.name}
                    data-type={area.type}
                    data-floor={area.floor}
                  >
                    {area.name}
                  </Button>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* 🧰 Staff Areas */}
      {showStaffAreas && staffAreas.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold flex items-center gap-2">
            🧰 Staff Areas
          </h3>
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Basement
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {staffAreas.map((area) => (
                <Button
                  key={area.id}
                  variant={formData.location === area.name ? "default" : "outline"}
                  className="text-xs h-8 text-left justify-start"
                  onClick={() => handleLocationSelect(area)}
                  data-name={area.name}
                  data-type={area.type}
                  data-floor={area.floor || -1}
                >
                  {area.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}