import { useState, useEffect } from 'react';
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
import { sendTaskUpdatedEvent } from '@/lib/webhookService';
import { useProfiles, useLocations } from '@/hooks/useSupabaseData';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client'; // AJOUT: Import Supabase

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskTitle?: string;
  editingReminder?: any;
  onSave?: (reminderData: any) => void;
  task?: any;
  onUpdate?: () => void;
}

export function ReminderModal({ isOpen, onClose, taskTitle, editingReminder, onSave, task, onUpdate }: ReminderModalProps) {
  const [subject, setSubject] = useState('');
  const [scheduleType, setScheduleType] = useState<'datetime' | 'shifts'>('datetime');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  
  // Custom recurrence
  const [repeatEvery, setRepeatEvery] = useState(1);
  const [repeatUnit, setRepeatUnit] = useState('week');
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<string[]>([]);
  const [endType, setEndType] = useState<'never' | 'date' | 'occurrences'>('never');
  const [endDateRecurrence, setEndDateRecurrence] = useState<Date>();
  const [occurrences, setOccurrences] = useState(13);
  const [enableCustomRecurrence, setEnableCustomRecurrence] = useState(false);

  // Effect to populate form when editing
  useEffect(() => {
    if (editingReminder) {
      setSubject(editingReminder.subject || '');
      setScheduleType(editingReminder.scheduleType || 'datetime');
      setStartDate(editingReminder.date);
      setStartTime(editingReminder.time || '');
      setSelectedShifts(editingReminder.shifts || []);
      if (editingReminder.frequency) {
        const freqParts = editingReminder.frequency.match(/every (\d+) (\w+)/);
        if (freqParts) {
          setRepeatEvery(parseInt(freqParts[1]));
          setRepeatUnit(freqParts[2]);
        }
      }
      setEndDateRecurrence(editingReminder.endDate);
    } else {
      // Reset form for new reminder
      setSubject(taskTitle || ''); // CORRECTION: Utiliser taskTitle par défaut
      setScheduleType('datetime');
      setStartDate(undefined);
      setEndDate(undefined);
      setStartTime('');
      setEndTime('');
      setSelectedShifts([]);
      setRepeatEvery(1);
      setRepeatUnit('week');
      setSelectedDaysOfWeek([]);
      setEndType('never');
      setEndDateRecurrence(undefined);
      setOccurrences(13);
      setEnableCustomRecurrence(false);
    }
  }, [editingReminder, taskTitle]); // AJOUT: dépendance taskTitle

  const { profiles } = useProfiles();
  const { locations } = useLocations();
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      // Validation des champs obligatoires avec logs détaillés
      const effectiveSubject = subject || taskTitle;
      console.log('🔍 Validation subject:', { subject, taskTitle, effectiveSubject, length: effectiveSubject?.length });
      
      if (!effectiveSubject || !effectiveSubject.trim()) {
        console.error('❌ Subject vide:', { subject, taskTitle, effectiveSubject });
        toast({
          title: "Erreur",
          description: "Le sujet du reminder est obligatoire",
          variant: "destructive",
        });
        return;
      }

      if (scheduleType === 'datetime' && !startDate) {
        toast({
          title: "Erreur", 
          description: "La date de début est obligatoire",
          variant: "destructive",
        });
        return;
      }

      // 1. DEBUG - Voir le contenu de la tâche
      console.log('🔍 Debug task object:', task);
      console.log('🔍 task.id:', task?.id);
      console.log('🔍 task.assigned_to:', task?.assigned_to);
      console.log('🔍 task.created_by:', task?.created_by);
      
      // Vérification critique du task_id
      const isNewTask = !task?.id;
      
      if (isNewTask) {
        console.log('🆕 Détection: Nouvelle tâche (pas encore d’ID) - Stockage temporaire');
        
        // Calculer la frequency pour le stockage temporaire
        let tempFrequency = 'once';
        if (enableCustomRecurrence) {
          if (repeatEvery === 1) {
            if (repeatUnit === 'day') tempFrequency = 'daily';
            else if (repeatUnit === 'week') tempFrequency = 'weekly';
            else if (repeatUnit === 'month') tempFrequency = 'monthly';
          } else {
            tempFrequency = 'custom';
          }
          if (selectedDaysOfWeek.length > 0) {
            tempFrequency = 'custom';
          }
        }
        
        // Pour les nouvelles tâches, stocker le reminder temporairement
        const tempReminderData = {
          title: effectiveSubject,
          message: effectiveSubject,
          schedule_type: scheduleType,
          start_date: scheduleType === 'datetime' && startDate ? startDate.toISOString() : null,
          start_time: scheduleType === 'datetime' && startTime ? startTime : null,
          frequency: tempFrequency,
          recurrence_interval: enableCustomRecurrence ? repeatEvery : null,
          recurrence_unit: enableCustomRecurrence ? repeatUnit : null,
          recurrence_days: selectedDaysOfWeek.length > 0 ? selectedDaysOfWeek : null,
          recurrence_end_type: enableCustomRecurrence ? endType : 'never',
          recurrence_end_date: endType === 'date' && endDateRecurrence ? endDateRecurrence.toISOString() : null,
          recurrence_occurrences: endType === 'occurrences' ? occurrences : null,
          // Flag pour indiquer que c'est temporaire
          isTemporary: true
        };
        
        console.log('💾 Reminder temporaire créé:', tempReminderData);
        
        // Appeler onSave avec les données temporaires
        if (onSave) {
          onSave(tempReminderData);
        }
        
        toast({
          title: "Reminder configuré",
          description: "Le reminder sera créé lors de la sauvegarde de la tâche",
        });
        
        onClose();
        return; // SORTIR ICI - ne pas continuer avec la sauvegarde normale
      }
      
      // 2. SOLUTION DE FALLBACK - Utiliser l'utilisateur connecté via profiles
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Utilisateur non connecté');
      }
      
      // Chercher l'utilisateur dans profiles (pas staff_directory)
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)  // profiles.id = auth.user.id
        .single();
        
      const created_by = userProfile?.id || task?.assigned_to || task?.created_by;
      if (!created_by) {
        console.error('❌ Aucun utilisateur trouvé. Task:', task, 'User profile:', userProfile);
        throw new Error('Aucun utilisateur assigné trouvé pour cette tâche');
      }

      console.log('👤 Utilisateur pour le reminder:', created_by, 'depuis task assigned_to/created_by');

      // 3. Calculer remind_at depuis startDate + startTime
      let remindAt = null;
      if (scheduleType === 'datetime' && startDate) {
        if (startTime) {
          // Construction correcte en timezone locale (Lisbonne)
          const localDateTime = new Date(startDate);
          const [hours, minutes] = startTime.split(':');
          localDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          remindAt = localDateTime.toISOString();
        } else {
          // Si pas de time, prendre 09:00 par défaut en timezone locale
          const localDateTime = new Date(startDate);
          localDateTime.setHours(9, 0, 0, 0);
          remindAt = localDateTime.toISOString();
        }
      }

      // 4. Déterminer la frequency intelligente
      let frequency = 'once'; // Par défaut
      if (enableCustomRecurrence) {
        if (repeatEvery === 1) {
          // Récurrence simple : every 1 day/week/month
          if (repeatUnit === 'day') frequency = 'daily';
          else if (repeatUnit === 'week') frequency = 'weekly';
          else if (repeatUnit === 'month') frequency = 'monthly';
        } else {
          // Récurrence complexe : every 2+ ou jours spécifiques
          frequency = 'custom';
        }
        
        // Si des jours spécifiques sont sélectionnés, c'est custom
        if (selectedDaysOfWeek.length > 0) {
          frequency = 'custom';
        }
      }

      // 5. Préparer les données pour la base
      const reminderData = {
        task_id: task?.id,
        title: effectiveSubject,
        message: effectiveSubject,
        
        // Champ principal obligatoire
        reminder_time: remindAt || new Date().toISOString(),
        
        // Frequency avec logique intelligente
        frequency: frequency,
        
        // Planification détaillée
        schedule_type: scheduleType,
        start_date: scheduleType === 'datetime' && startDate ? startDate.toISOString() : null,
        end_date: scheduleType === 'datetime' && endDate ? endDate.toISOString() : null,
        start_time: scheduleType === 'datetime' && startTime ? `${startTime}:00+00` : null,
        end_time: scheduleType === 'datetime' && endTime ? `${endTime}:00+00` : null,
        
        // Récurrence complète
        recurrence_interval: enableCustomRecurrence ? repeatEvery : null,
        recurrence_unit: enableCustomRecurrence ? repeatUnit : null,
        recurrence_days: selectedDaysOfWeek.length > 0 ? selectedDaysOfWeek : null,
        recurrence_end_type: enableCustomRecurrence ? endType : 'never',
        recurrence_end_date: endType === 'date' && endDateRecurrence ? endDateRecurrence.toISOString() : null,
        recurrence_occurrences: endType === 'occurrences' ? occurrences : null,
        
        // Calculer remind_at (pour compatibilité)
        remind_at: remindAt,
        
        // Métadonnées avec bon created_by
        is_active: true,
        status: 'pending',
        created_by: created_by, // ID depuis task.assigned_to ou task.created_by
      };

      console.log('🔔 Sauvegarde reminder en base:', reminderData);
      console.log('📊 Frequency calculée:', frequency, 'depuis récurrence:', { enableCustomRecurrence, repeatEvery, repeatUnit, selectedDaysOfWeek });

      // 6. Transaction : créer reminder + update task
      const { data: result, error: insertError } = await supabase
        .from('reminders')
        .insert([reminderData])
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erreur insertion reminder:', insertError);
        throw new Error(`Erreur lors de la sauvegarde: ${insertError.message}`);
      }

      console.log('✅ Reminder sauvegardé avec ID:', result.id);

      // 7. Mettre à jour task.reminder_id avec l'ID du reminder créé
      if (task?.id) {
        const { error: taskUpdateError } = await supabase
          .from('task')
          .update({ reminder_id: result.id })
          .eq('id', task.id);

        if (taskUpdateError) {
          console.warn('⚠️ Erreur mise à jour task.reminder_id:', taskUpdateError);
          // Ne pas bloquer, le reminder est sauvé
        } else {
          console.log('✅ Task.reminder_id mis à jour:', result.id);
        }
      }

      toast({
        title: editingReminder ? "Reminder modifié" : "Reminder créé",
        description: `Le reminder "${subject}" a été sauvegardé (${frequency})`,
      });

      // Webhook optionnel (garder pour compatibilité)
      if (task) {
        try {
          await sendTaskUpdatedEvent(
            task.id,
            task,
            { ...task, reminder_id: result.id },
            profiles,
            locations,
            { reminders: [result] }
          );
        } catch (webhookError) {
          console.warn('⚠️ Webhook failed but reminder was saved:', webhookError);
        }
      }

      // Appeler les callbacks
      if (onSave) {
        onSave(result);
      }
      if (onUpdate) {
        onUpdate();
      }
      
      onClose();
      
    } catch (error) {
      console.error('❌ Erreur handleSave:', error);
      toast({
        title: "Erreur de sauvegarde",
        description: error.message || 'Erreur inconnue',
        variant: "destructive",
      });
    }
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
    setRepeatUnit('week');
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
    { id: 'morning', label: 'Morning' },
    { id: 'afternoon', label: 'Afternoon' },
    { id: 'night', label: 'Night' }
  ];

  const daysOfWeek = [
    { id: 'S', label: 'S', fullLabel: 'Sunday' },
    { id: 'M', label: 'M', fullLabel: 'Monday' },
    { id: 'T', label: 'T', fullLabel: 'Tuesday' },
    { id: 'W', label: 'W', fullLabel: 'Wednesday' },
    { id: 'T2', label: 'T', fullLabel: 'Thursday' },
    { id: 'F', label: 'F', fullLabel: 'Friday' },
    { id: 'S2', label: 'S', fullLabel: 'Saturday' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="pb-4 border-b">
          <h2 className="text-lg font-bold text-foreground">
            {editingReminder ? 'Edit Reminder' : 'Set a Reminder'}
          </h2>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div>
            <Label htmlFor="subject">Reminder Subject</Label>
            <Input
              id="subject"
              value={subject || taskTitle || ''}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={taskTitle || "Enter reminder subject"}
              className="mt-1"
            />
          </div>

          {/* Choice between dates/times and shifts */}
          <div>
            <Label>Schedule Type</Label>
            <RadioGroup 
              value={scheduleType} 
              onValueChange={(value: 'datetime' | 'shifts') => setScheduleType(value)}
              className="flex gap-4 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="datetime" id="datetime" />
                <Label htmlFor="datetime">Dates and Times</Label>
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
                  <Label>Start Date</Label>
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
                        {startDate ? format(startDate, "dd/MM/yyyy") : "Select"}
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
                  <Label>End Date</Label>
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
                        {endDate ? format(endDate, "dd/MM/yyyy") : "Select"}
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
                  <Label htmlFor="startTime">Start Time</Label>
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
                  <Label htmlFor="endTime">End Time</Label>
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

          {/* Custom recurrence */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="enableRecurrence"
                checked={enableCustomRecurrence}
                onCheckedChange={(checked) => setEnableCustomRecurrence(checked as boolean)}
              />
              <Label htmlFor="enableRecurrence" className="font-medium">
                Enable Custom Recurrence
              </Label>
            </div>

            {enableCustomRecurrence && (
              <div className="bg-muted/50 p-4 rounded-lg space-y-4">
            
            {/* Repeat every... */}
            <div className="flex items-center gap-2">
              <Label className="text-sm">Repeat every</Label>
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
                  <SelectItem value="day">day</SelectItem>
                  <SelectItem value="week">week</SelectItem>
                  <SelectItem value="month">month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Repeat on */}
            <div>
              <Label className="text-sm mb-2 block">Repeat on</Label>
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

            {/* Ends */}
            <div>
              <Label className="text-sm mb-2 block">Ends</Label>
              <RadioGroup value={endType} onValueChange={(value: 'never' | 'date' | 'occurrences') => setEndType(value)} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="never" id="never" />
                  <Label htmlFor="never" className="text-sm">Never</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="date" id="endDate" />
                  <Label htmlFor="endDate" className="text-sm">On</Label>
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
                        {endDateRecurrence ? format(endDateRecurrence, "dd MMM yyyy") : "21 Oct 2025"}
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
                  <Label htmlFor="occurrences" className="text-sm">After</Label>
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
            )}
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onClose} className="text-primary">
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-primary text-primary-foreground">
              {editingReminder ? 'Update' : 'Done'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}