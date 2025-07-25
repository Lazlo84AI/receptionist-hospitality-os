import { useState } from 'react';
import { X, Trash2, Calendar, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskTitle?: string;
}

export function ReminderModal({ isOpen, onClose, taskTitle }: ReminderModalProps) {
  const [subject, setSubject] = useState('');
  const [scheduleType, setScheduleType] = useState<'datetime' | 'shifts'>('datetime');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  
  // Récurrence personnalisée
  const [repeatEvery, setRepeatEvery] = useState(1);
  const [repeatUnit, setRepeatUnit] = useState('semaine');
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<string[]>([]);
  const [endType, setEndType] = useState<'never' | 'date' | 'occurrences'>('never');
  const [endDateRecurrence, setEndDateRecurrence] = useState<Date>();
  const [occurrences, setOccurrences] = useState(13);

  const handleSave = () => {
    // Logique de sauvegarde du reminder
    console.log('Reminder saved:', { 
      subject: subject || taskTitle, 
      scheduleType,
      startDate, 
      endDate, 
      startTime,
      endTime,
      selectedShifts,
      repeatEvery,
      repeatUnit,
      selectedDaysOfWeek,
      endType,
      endDateRecurrence,
      occurrences
    });
    onClose();
  };

  const handleClear = () => {
    setSubject('');
    setScheduleType('datetime');
    setStartDate(undefined);
    setEndDate(undefined);
    setStartTime('');
    setEndTime('');
    setSelectedShifts([]);
    setRepeatEvery(1);
    setRepeatUnit('semaine');
    setSelectedDaysOfWeek([]);
    setEndType('never');
    setEndDateRecurrence(undefined);
    setOccurrences(13);
  };

  const handleShiftChange = (shift: string, checked: boolean) => {
    if (checked) {
      setSelectedShifts([...selectedShifts, shift]);
    } else {
      setSelectedShifts(selectedShifts.filter(s => s !== shift));
    }
  };

  const handleDayOfWeekChange = (day: string) => {
    if (selectedDaysOfWeek.includes(day)) {
      setSelectedDaysOfWeek(selectedDaysOfWeek.filter(d => d !== day));
    } else {
      setSelectedDaysOfWeek([...selectedDaysOfWeek, day]);
    }
  };

  const shifts = [
    { id: 'matin', label: 'Matin' },
    { id: 'apres-midi', label: 'Après-midi' },
    { id: 'nuit', label: 'Nuit' }
  ];

  const daysOfWeek = [
    { id: 'D', label: 'D', fullLabel: 'Dimanche' },
    { id: 'L', label: 'L', fullLabel: 'Lundi' },
    { id: 'M', label: 'M', fullLabel: 'Mardi' },
    { id: 'M2', label: 'M', fullLabel: 'Mercredi' },
    { id: 'J', label: 'J', fullLabel: 'Jeudi' },
    { id: 'V', label: 'V', fullLabel: 'Vendredi' },
    { id: 'S', label: 'S', fullLabel: 'Samedi' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="pb-4 border-b">
          <h2 className="text-lg font-bold text-foreground">
            Définir un reminder
          </h2>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div>
            <Label htmlFor="subject">Objet du reminder</Label>
            <Input
              id="subject"
              value={subject || taskTitle || ''}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={taskTitle || "Entrez l'objet du reminder"}
              className="mt-1"
            />
          </div>

          {/* Choix entre dates/heures et shifts */}
          <div>
            <Label>Type de planification</Label>
            <RadioGroup 
              value={scheduleType} 
              onValueChange={(value: 'datetime' | 'shifts') => setScheduleType(value)}
              className="flex gap-4 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="datetime" id="datetime" />
                <Label htmlFor="datetime">Dates et heures</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="shifts" id="shifts" />
                <Label htmlFor="shifts">Shifts</Label>
              </div>
            </RadioGroup>
          </div>

          {scheduleType === 'datetime' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date de début</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal mt-1",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "dd/MM/yyyy") : "Sélectionner"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Date de fin</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal mt-1",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "dd/MM/yyyy") : "Sélectionner"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Heure de début</Label>
                  <div className="relative mt-1">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-soft-pewter" />
                    <Input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="endTime">Heure de fin</Label>
                  <div className="relative mt-1">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-soft-pewter" />
                    <Input
                      id="endTime"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {scheduleType === 'shifts' && (
            <div>
              <Label>Shifts</Label>
              <div className="mt-2 space-y-2">
                {shifts.map((shift) => (
                  <div key={shift.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={shift.id}
                      checked={selectedShifts.includes(shift.id)}
                      onCheckedChange={(checked) => handleShiftChange(shift.id, checked as boolean)}
                    />
                    <Label htmlFor={shift.id} className="text-sm font-normal">
                      {shift.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Récurrence personnalisée */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-4">
            <h3 className="font-medium">Récurrence personnalisée</h3>
            
            {/* Répéter toutes les... */}
            <div className="flex items-center gap-2">
              <Label className="text-sm">Répéter tou(te)s les</Label>
              <Input
                type="number"
                value={repeatEvery}
                onChange={(e) => setRepeatEvery(parseInt(e.target.value) || 1)}
                className="w-16 h-8"
                min="1"
              />
              <Select value={repeatUnit} onValueChange={setRepeatUnit}>
                <SelectTrigger className="w-24 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jour">jour</SelectItem>
                  <SelectItem value="semaine">semaine</SelectItem>
                  <SelectItem value="mois">mois</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Répéter le */}
            <div>
              <Label className="text-sm mb-2 block">Répéter le</Label>
              <div className="flex gap-1">
                {daysOfWeek.map((day) => (
                  <Button
                    key={day.id}
                    variant={selectedDaysOfWeek.includes(day.id) ? "default" : "outline"}
                    size="sm"
                    className="w-8 h-8 p-0 rounded-full"
                    onClick={() => handleDayOfWeekChange(day.id)}
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Se termine */}
            <div>
              <Label className="text-sm mb-2 block">Se termine</Label>
              <RadioGroup value={endType} onValueChange={(value: 'never' | 'date' | 'occurrences') => setEndType(value)} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="never" id="never" />
                  <Label htmlFor="never" className="text-sm">Jamais</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="date" id="endDate" />
                  <Label htmlFor="endDate" className="text-sm">Le</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "text-xs",
                          !endDateRecurrence && endType === 'date' && "text-muted-foreground"
                        )}
                        disabled={endType !== 'date'}
                      >
                        {endDateRecurrence ? format(endDateRecurrence, "dd MMM yyyy") : "21 oct. 2025"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={endDateRecurrence}
                        onSelect={setEndDateRecurrence}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="occurrences" id="occurrences" />
                  <Label htmlFor="occurrences" className="text-sm">Après</Label>
                  <Input
                    type="number"
                    value={occurrences}
                    onChange={(e) => setOccurrences(parseInt(e.target.value) || 13)}
                    className="w-16 h-6 text-xs"
                    min="1"
                    disabled={endType !== 'occurrences'}
                  />
                  <span className="text-xs text-muted-foreground">occurrences</span>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onClose} className="text-primary">
              Annuler
            </Button>
            <Button onClick={handleSave} className="bg-primary text-primary-foreground">
              Terminé
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}