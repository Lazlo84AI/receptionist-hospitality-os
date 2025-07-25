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
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReminderModal({ isOpen, onClose }: ReminderModalProps) {
  const [subject, setSubject] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [time, setTime] = useState('');
  const [reminderTime, setReminderTime] = useState('10');
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const handleSave = () => {
    // Logique de sauvegarde du reminder
    console.log('Reminder saved:', { 
      subject, 
      startDate, 
      endDate, 
      time, 
      reminderTime,
      selectedShifts,
      selectedDays
    });
    onClose();
  };

  const handleClear = () => {
    setSubject('');
    setStartDate(undefined);
    setEndDate(undefined);
    setTime('');
    setReminderTime('10');
    setSelectedShifts([]);
    setSelectedDays([]);
  };

  const handleShiftChange = (shift: string, checked: boolean) => {
    if (checked) {
      setSelectedShifts([...selectedShifts, shift]);
    } else {
      setSelectedShifts(selectedShifts.filter(s => s !== shift));
    }
  };

  const handleDayChange = (day: string, checked: boolean) => {
    if (checked) {
      setSelectedDays([...selectedDays, day]);
    } else {
      setSelectedDays(selectedDays.filter(d => d !== day));
    }
  };

  const shifts = [
    { id: 'matin', label: 'Matin' },
    { id: 'apres-midi', label: 'Après-midi' },
    { id: 'nuit', label: 'Nuit' }
  ];

  const weekDays = [
    { id: 'lundi', label: 'Lundi' },
    { id: 'mardi', label: 'Mardi' },
    { id: 'mercredi', label: 'Mercredi' },
    { id: 'jeudi', label: 'Jeudi' },
    { id: 'vendredi', label: 'Vendredi' }
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
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Entrez l'objet du reminder"
              className="mt-1"
            />
          </div>

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

          <div>
            <Label htmlFor="time">Heure</Label>
            <div className="relative mt-1">
              <Clock className="absolute left-3 top-3 h-4 w-4 text-soft-pewter" />
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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

            <div>
              <Label>Jours de la semaine</Label>
              <div className="mt-2 space-y-2">
                {weekDays.map((day) => (
                  <div key={day.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={day.id}
                      checked={selectedDays.includes(day.id)}
                      onCheckedChange={(checked) => handleDayChange(day.id, checked as boolean)}
                    />
                    <Label htmlFor={day.id} className="text-sm font-normal">
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <Label>Rappel avant échéance</Label>
            <Select value={reminderTime} onValueChange={setReminderTime}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 minutes avant</SelectItem>
                <SelectItem value="30">30 minutes avant</SelectItem>
                <SelectItem value="60">1 heure avant</SelectItem>
                <SelectItem value="1440">1 jour avant</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleClear}>
              <Trash2 className="h-4 w-4 mr-2" />
              Effacer
            </Button>
            <Button onClick={handleSave}>
              Enregistrer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}