import { useState } from 'react';
import { X, Trash2, Calendar, Clock, Bell } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReminderModal({ isOpen, onClose }: ReminderModalProps) {
  const [subject, setSubject] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [time, setTime] = useState('');
  const [reminderTime, setReminderTime] = useState('10');

  const handleSave = () => {
    // Logique de sauvegarde du reminder
    console.log('Reminder saved:', { subject, startDate, time, reminderTime });
    onClose();
  };

  const handleClear = () => {
    setSubject('');
    setStartDate(undefined);
    setTime('');
    setReminderTime('10');
  };

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
            <Label htmlFor="subject" className="text-foreground">Objet du reminder</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Entrez l'objet du reminder"
              className="mt-1"
            />
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-foreground flex items-center mb-2">
                <Calendar className="mr-2 h-4 w-4" />
                Date de début
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    {startDate ? format(startDate, "dd/MM/yyyy") : "J/M/AAAA"}
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground mb-2 block">
                  {startDate ? format(startDate, "dd/MM/yyyy") : "24/07/2025"}
                </Label>
                <Input
                  value={startDate ? format(startDate, "dd/MM/yyyy") : "24/07/2025"}
                  readOnly
                  className="text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="time" className="text-foreground mb-2 block">Heure</Label>
                <Input
                  id="time"
                  type="time"
                  value={time || "23:30"}
                  onChange={(e) => setTime(e.target.value)}
                  className="text-foreground"
                />
              </div>
            </div>
          </div>

          <div>
            <Label className="text-foreground flex items-center mb-2">
              <Bell className="mr-2 h-4 w-4" />
              Rappel
            </Label>
            <Select value={reminderTime} onValueChange={setReminderTime}>
              <SelectTrigger>
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

          <div className="bg-muted/10 p-3 rounded-lg">
            <p className="text-sm text-foreground">
              Les rappels seront envoyés à tous les membres et les observateurs de cette carte.
            </p>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleClear}>
              Effacer
            </Button>
            <Button onClick={handleSave} className="bg-primary text-primary-foreground">
              Enregistrer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}