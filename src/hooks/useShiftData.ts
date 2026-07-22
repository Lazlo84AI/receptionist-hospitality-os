import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Shift } from '@/types/database';

export interface ShiftHandoverData {
  voice_note_url: string | null;
  voice_note_transcription: string | null;
  handover_notes: string | null;
  previous_shift_user?: string;
  previous_shift_end_time?: string;
}

// Hook pour récupérer les données de passation du shift précédent
export const useLatestShiftHandover = () => {
  const [shiftData, setShiftData] = useState<ShiftHandoverData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLatestShiftHandover = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching latest shift handover...');
      
      // Récupérer le dernier shift terminé avec des données de passation
      const { data, error } = await supabase
        .from('shifts')
        .select(`
          id,
          voice_note_url,
          voice_note_transcription,
          handover_notes,
          user_id,
          end_time
        `)
        .eq('status', 'completed')
        .not('end_time', 'is', null)
        .order('end_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log('----------------------------------');
      console.log('📡 SUPABASE QUERY:');
      console.log('  TABLE: shifts');
      console.log('  FILTER: status=completed AND end_time IS NOT NULL');
      console.log('  ORDER: end_time DESC');
      console.log('  LIMIT: 1');
      console.log('----------------------------------');

      console.log('📊 Query result:', { data, error });

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('❌ Supabase error:', error);
        throw error;
      }

      if (data) {
        console.log('✅ Shift handover data found:', data);
        
        // Récupérer le nom de l'utilisateur séparément
        let previousShiftUser = 'Unknown User';
        if (data.user_id) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', data.user_id)
            .single();
            
          if (profileData && !profileError) {
            previousShiftUser = `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim();
          }
        }

        const shiftHandoverData = {
          voice_note_url: data.voice_note_url,
          voice_note_transcription: data.voice_note_transcription,
          handover_notes: data.handover_notes,
          previous_shift_user: previousShiftUser,
          previous_shift_end_time: data.end_time
        };
        
        console.log('📝 Setting shift data:', shiftHandoverData);
        setShiftData(shiftHandoverData);
      } else {
        console.log('❌ No shift handover data found');
        setShiftData(null);
      }
      
      setError(null);
    } catch (err) {
      console.error('💥 Error fetching latest shift handover:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch shift handover');
      setShiftData(null);
    } finally {
      setLoading(false);
      console.log('🏁 Fetch completed');
    }
  };

  useEffect(() => {
    fetchLatestShiftHandover();
  }, []);

  return { shiftData, loading, error, refetch: fetchLatestShiftHandover };
};

// Hook pour démarrer un nouveau shift
export const useStartShift = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startShift = async (): Promise<{ success: boolean; shift_id?: string }> => {
    try {
      setLoading(true);
      setError(null);

      // Obtenir l'utilisateur connecté
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Récupérer le service de l'utilisateur depuis staff_directory
      const { data: staffData, error: staffError } = await supabase
        .from('staff_directory')
        .select('service')
        .eq('id', user.id)
        .single();

      if (staffError) {
        console.error('Error fetching user service:', staffError);
        throw new Error('Failed to fetch user service');
      }

      const userService = staffData?.service || 'reception'; // Fallback to 'reception'

      // Terminer tout shift actif existant pour cet utilisateur
      const { error: updateError } = await supabase
        .from('shifts')
        .update({ 
          status: 'completed',
          end_time: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (updateError) {
        console.warn('Warning updating existing shifts:', updateError);
      }

      // Créer un nouveau shift avec le service
      const { data: newShift, error: insertError } = await supabase
        .from('shifts')
        .insert({
          user_id: user.id,
          start_time: new Date().toISOString(),
          status: 'active',
          service: userService // ✅ AJOUTÉ: service
        })
        .select()
        .single();

      if (insertError) {
        // 🛡️ Double-déclenchement : le verrou base (un seul poste actif par
        // personne) rejette le 2e insert (code 23505). On récupère le poste
        // actif déjà créé et on renvoie succès, sans erreur visible pour l'employé.
        if (insertError.code === '23505') {
          const { data: existingShift } = await supabase
            .from('shifts')
            .select('id')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (existingShift) {
            return { success: true, shift_id: existingShift.id };
          }
        }
        throw insertError;
      }

      return { success: true, shift_id: newShift.id };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start shift';
      setError(errorMessage);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return { startShift, loading, error };
};

// Hook pour terminer un shift
export const useEndShift = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endShift = async (
    handoverNotes?: string, 
    voiceNoteUrl?: string, 
    voiceNoteTranscription?: string
  ): Promise<{ success: boolean }> => {
    try {
      setLoading(true);
      setError(null);

      // Obtenir l'utilisateur connecté
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Terminer le shift actif de l'utilisateur
      const { error: updateError } = await supabase
        .from('shifts')
        .update({ 
          status: 'completed',
          end_time: new Date().toISOString(),
          handover_notes: handoverNotes || null,
          voice_note_url: voiceNoteUrl || null,
          voice_note_transcription: voiceNoteTranscription || null
        })
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (updateError) {
        throw updateError;
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to end shift';
      setError(errorMessage);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return { endShift, loading, error };
};

// Hook pour obtenir le shift actif de l'utilisateur
export const useCurrentShift = () => {
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentShift = async () => {
    try {
      setLoading(true);
      
      // Obtenir l'utilisateur connecté
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCurrentShift(null);
        setLoading(false);
        return;
      }

      // Récupérer le shift actif de l'utilisateur
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('start_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      setCurrentShift(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching current shift:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch current shift');
      setCurrentShift(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentShift();

    // Écouter les changements en temps réel
    const subscription = supabase
      .channel('current-shift-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'shifts' }, 
        fetchCurrentShift
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return { currentShift, loading, error, refetch: fetchCurrentShift };
};