import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TeamShiftData {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  status: string;
  service: string;
  voice_note_url: string | null;
  voice_note_transcription: string | null;
  handover_notes: string | null;
  full_name: string;
  department: string;
  handover_data: {
    all_tasks?: any[];
    tasks_by_type?: Record<string, any[]>;
    tasks_by_status?: Record<string, any[]>;
    total_tasks_count?: number;
    voice_note_url?: string | null;
    voice_transcription?: string | null;
    timestamp?: string;
  } | null;
  additional_notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Hook pour récupérer les shifts du service reception des 3 derniers jours
 */
export const useTeamShifts = () => {
  const [shifts, setShifts] = useState<TeamShiftData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userService, setUserService] = useState<string>('reception');

  const fetchTeamShifts = async () => {
    try {
      setLoading(true);
      
      // Récupérer l'utilisateur connecté
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
        throw staffError;
      }

      const service = staffData?.service || 'reception';
      setUserService(service);
      console.log(`🔍 Fetching team shifts for ${service} service (last 3 days)...`);
      
      // Calculer la date d'il y a 3 jours
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const { data, error: queryError } = await supabase
        .from('shifts')
        .select(`
          *,
          staff_directory!inner(
            first_name,
            last_name,
            department,
            service
          ),
          shift_handovers!shift_handovers_from_shift_id_fkey(
            handover_data,
            additional_notes
          )
        `)
        .eq('status', 'completed')
        .eq('service', service)
        .gte('end_time', threeDaysAgo.toISOString())
        .order('end_time', { ascending: false });

      if (queryError) {
        console.error('❌ Supabase error:', queryError);
        throw queryError;
      }

      console.log('📊 Raw query result:', data);

      // Transformer les données pour avoir le format attendu
      const transformedData: TeamShiftData[] = (data || []).map((shift: any) => {
        const staffInfo = shift.staff_directory || {};
        const handoverInfo = shift.shift_handovers?.[0] || {};
        
        return {
          ...shift,
          full_name: `${staffInfo.first_name || ''} ${staffInfo.last_name || ''}`.trim(),
          department: staffInfo.department || '',
          service: staffInfo.service || shift.service,
          handover_data: handoverInfo.handover_data || null,
          additional_notes: handoverInfo.additional_notes || null,
          staff_directory: undefined, // Retirer l'objet staff_directory original
          shift_handovers: undefined // Retirer l'array shift_handovers original
        };
      });

      console.log('✅ Transformed shifts data:', transformedData);
      setShifts(transformedData);
      setError(null);
    } catch (err) {
      console.error('💥 Error fetching team shifts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch team shifts');
      setShifts([]);
    } finally {
      setLoading(false);
      console.log('🏁 Fetch completed');
    }
  };

  useEffect(() => {
    fetchTeamShifts();
  }, []);

  return { shifts, loading, error, userService, refetch: fetchTeamShifts };
};
